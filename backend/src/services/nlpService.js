const { OpenAI } = require('openai');

class NLPService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractQuestionEntities(questionText) {
    try {
      const prompt = `
        Extract key entities and tags from this investment research question:
        "${questionText}"
        
        Return a JSON object with:
        - companies: array of company names mentioned
        - industries: array of relevant industries
        - topics: array of key topics (e.g., "supply chain", "pricing", "market share")
        - geography: primary geographic focus
        - seniorityRequired: minimum seniority level needed (e.g., "Manager", "Director", "VP")
        - functionalExpertise: primary functional area needed
        - keywords: array of important keywords
        
        Be specific and accurate. If not mentioned, use null.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI extraction error:', error.message);
      return this.fallbackExtraction(questionText);
    }
  }

  fallbackExtraction(questionText) {
    const text = questionText.toLowerCase();
    return {
      companies: this.extractCompanies(text),
      industries: this.extractIndustries(text),
      topics: this.extractTopics(text),
      geography: this.extractGeography(text),
      seniorityRequired: 'Manager',
      functionalExpertise: null,
      keywords: text.split(' ').filter(word => word.length > 4)
    };
  }

  extractCompanies(text) {
    const companies = ['tesla', 'apple', 'google', 'amazon', 'microsoft', 'meta', 'nvidia', 'ford', 'gm'];
    return companies
      .filter(company => text.includes(company))
      .map(company => company.charAt(0).toUpperCase() + company.slice(1));
  }

  extractIndustries(text) {
    const industryMap = {
      'automotive': ['car', 'auto', 'vehicle', 'ev', 'electric vehicle'],
      'technology': ['software', 'tech', 'ai', 'cloud', 'saas', 'iphone'],
      'finance': ['bank', 'financial', 'investment', 'trading'],
      'healthcare': ['health', 'medical', 'pharma', 'biotech'],
      'retail': ['store', 'shop', 'ecommerce', 'consumer'],
      'energy': ['oil', 'gas', 'renewable', 'solar', 'battery'],
      'manufacturing': ['production', 'factory', 'manufacturing', 'assembly']
    };

    const found = [];
    for (const [industry, keywords] of Object.entries(industryMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        found.push(industry);
      }
    }
    return found;
  }

  extractTopics(text) {
    const topicKeywords = {
      'supply chain': ['supply', 'supplier', 'vendor', 'sourcing', 'chain'],
      'pricing': ['price', 'cost', 'margin', 'pricing'],
      'market share': ['market share', 'competition', 'competitor'],
      'technology': ['technology', 'tech', 'innovation'],
      'operations': ['operations', 'efficiency', 'process'],
      'strategy': ['strategy', 'strategic', 'plan'],
      'financial': ['revenue', 'profit', 'earnings', 'financial'],
      'production': ['production', 'manufacturing', 'factory'],
      'adoption': ['adoption', 'usage', 'implementation']
    };

    const found = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        found.push(topic);
      }
    }
    return found;
  }

  extractGeography(text) {
    const geoTerms = {
      'US': ['united states', 'america', 'us ', 'usa'],
      'Europe': ['europe', 'eu ', 'european'],
      'Asia': ['asia', 'asian'],
      'China': ['china', 'chinese'],
      'India': ['india', 'indian'],
      'Global': ['global', 'worldwide', 'international']
    };

    for (const [geo, terms] of Object.entries(geoTerms)) {
      if (terms.some(term => text.includes(term))) {
        return geo;
      }
    }
    return null;
  }
}

module.exports = new NLPService();
