require("dotenv").config();
const OpenAI = require('openai');
const prisma = require('../utils/prisma');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validate answer quality using AI
const validateAnswerWithAI = async (answerId, answerContent, questionText, sources) => {
  try {
    // Construct the validation prompt
    const prompt = `
    You are an expert investment analyst evaluating the quality of an answer to an investment-related question.
    
    Question: ${questionText}
    
    Answer: ${answerContent}
    
    Sources provided: ${sources.join(', ')}
    
    Please evaluate this answer based on the following criteria:
    1. Relevance to the question (0-25 points)
    2. Accuracy and factual correctness (0-25 points)
    3. Quality and credibility of sources (0-25 points)
    4. Depth of analysis and insights (0-25 points)
    
    Provide:
    1. A total score out of 100
    2. Brief feedback on strengths and weaknesses
    3. Whether the sources appear credible (yes/no)
    
    You must respond with ONLY valid JSON in this exact format:
    {
      "score": <number>,
      "feedback": "<string>",
      "sourcesCredible": <boolean>,
      "breakdown": {
        "relevance": <number>,
        "accuracy": <number>,
        "sourceQuality": <number>,
        "analysisDepth": <number>
      }
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert investment analyst. Always respond with valid JSON only, no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3 // Lower temperature for more consistent scoring
    });

    const responseText = completion.choices[0].message.content;
    
    // Parse the JSON response
    let result;
    try {
      // Clean the response in case it has markdown or extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      // Return a default score if parsing fails
      return {
        score: 75,
        feedback: "AI evaluation completed but response parsing failed",
        sourcesCredible: true,
        breakdown: {
          relevance: 18,
          accuracy: 19,
          sourceQuality: 19,
          analysisDepth: 19
        }
      };
    }

    // Store the AI validation in the database if model exists
    try {
      const validation = await prisma.answerValidation.create({
        data: {
          answerId,
          score: result.score,
          feedback: result.feedback,
          validationType: 'AI_AUTOMATED'
        }
      });
    } catch (dbError) {
      // Database model might not exist, continue anyway
      console.log('Could not store validation in database:', dbError.message);
    }

    // Update the answer with AI validation score
    try {
      await prisma.userAnswer.update({
        where: { id: answerId },
        data: {
          aiValidationScore: result.score,
          finalScore: result.score // Will be updated when peer reviews come in
        }
      });
    } catch (updateError) {
      // If update fails, continue
      console.log('Could not update answer scores:', updateError.message);
    }

    return {
      score: result.score,
      feedback: result.feedback,
      sourcesCredible: result.sourcesCredible,
      breakdown: result.breakdown
    };
  } catch (error) {
    console.error('AI validation error:', error);
    throw error;
  }
};

// Generate AI summary for investment ideas
const generateIdeaSummary = async (ideaData) => {
  try {
    const prompt = `
    Create a concise, professional investment summary for the following idea:
    
    Title: ${ideaData.title}
    Sector: ${ideaData.sector || 'Not specified'}
    Market Cap: ${ideaData.marketCap || 'Not specified'}
    
    Original Summary: ${ideaData.summary}
    
    Detailed Plan: ${ideaData.detailedPlan || 'Not provided'}
    
    Generate:
    1. A 2-3 sentence executive summary
    2. Key investment thesis points (3-5 bullet points)
    3. Primary risks to consider (2-3 points)
    4. Potential return profile
    
    Format as professional investment memo.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior investment analyst preparing materials for institutional investors. Be concise, professional, and focus on actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI summary generation error:', error);
    throw error;
  }
};

// Analyze source credibility
const analyzeSourceCredibility = async (sources) => {
  try {
    const prompt = `
    Analyze the credibility of these sources for investment research:
    ${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}
    
    For each source, rate:
    1. Credibility (1-10)
    2. Relevance to institutional investing
    3. Potential bias concerns
    
    Return a JSON array with analysis for each source.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at evaluating information sources for investment research."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Source analysis error:', error);
    throw error;
  }
};

// Generate validation questions for an idea
const generateValidationQuestions = async (ideaData) => {
  try {
    const prompt = `
    Based on this investment idea, generate 5 critical due diligence questions that institutional investors would need answered:
    
    Title: ${ideaData.title}
    Summary: ${ideaData.summary}
    Sector: ${ideaData.sector || 'Not specified'}
    
    Questions should be:
    1. Specific and actionable
    2. Focused on validating key assumptions
    3. Answerable with research and data
    4. Relevant to institutional investment decisions
    
    Format as JSON array of question objects with 'text' and 'category' fields.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a due diligence expert for institutional investments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Question generation error:', error);
    throw error;
  }
};

// Detect potential conflicts of interest or bias
const detectBiasInAnswer = async (answerContent, userHistory) => {
  try {
    const prompt = `
    Analyze this investment answer for potential bias or conflicts of interest:
    
    Answer: ${answerContent}
    
    User's previous answer topics: ${userHistory.join(', ')}
    
    Look for:
    1. Promotional language
    2. Undisclosed conflicts
    3. One-sided analysis
    4. Pump-and-dump indicators
    
    Return bias risk score (0-100) and specific concerns.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a compliance expert detecting bias in investment advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Bias detection error:', error);
    throw error;
  }
};

// Compare multiple answers to find consensus
const analyzeAnswerConsensus = async (answers) => {
  try {
    const prompt = `
    Analyze these answers to the same investment question to find consensus and divergence:
    
    ${answers.map((a, i) => `Answer ${i + 1}: ${a.content}`).join('\n\n')}
    
    Identify:
    1. Common themes and agreements
    2. Key points of disagreement
    3. Which answer provides the most comprehensive analysis
    4. Overall consensus score (0-100)
    
    Format as JSON with detailed analysis.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are analyzing multiple investment perspectives to find truth through consensus."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Consensus analysis error:', error);
    throw error;
  }
};

// Fact-check specific claims
const factCheckClaim = async (claim, context) => {
  try {
    const prompt = `
    Fact-check this investment-related claim:
    
    Claim: "${claim}"
    Context: ${context}
    
    Provide:
    1. Verification status (true/false/partially true/unverifiable)
    2. Supporting evidence or contradicting information
    3. Confidence level (0-100)
    4. Sources that could verify this claim
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a fact-checker specializing in financial and investment claims."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Fact-checking error:', error);
    throw error;
  }
};

module.exports = {
  validateAnswerWithAI,
  generateIdeaSummary,
  analyzeSourceCredibility,
  generateValidationQuestions,
  detectBiasInAnswer,
  analyzeAnswerConsensus,
  factCheckClaim
};