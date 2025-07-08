import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnswerCard from '../components/AnswerCard';
import { ideas, questions, answers } from '../services/api';
import { 
  ArrowLeft, MessageSquare, DollarSign, Trophy, 
  Send, AlertCircle, Loader2, CheckCircle, Clock,
  ThumbsUp, ThumbsDown, Star, TrendingUp, Eye
} from 'lucide-react';

const ResearcherIdeaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [idea, setIdea] = useState(null);
  const [ideaQuestions, setIdeaQuestions] = useState({ top3Questions: [], otherQuestions: [] });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myAnswers, setMyAnswers] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ideaResponse = await ideas.getById(id);
      setIdea(ideaResponse.data);

      const questionsResponse = await questions.getByIdea(id);
      setIdeaQuestions(questionsResponse.data);
      
      // Fetch answers for all questions that have them
      const allQuestions = [...questionsResponse.data.top3Questions, ...questionsResponse.data.otherQuestions];
      for (const question of allQuestions) {
        if (question._count?.answers > 0) {
          fetchAnswersForQuestion(question.id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const fetchAnswersForQuestion = async (questionId) => {
    try {
      const response = await answers.getByQuestion(questionId);
      setQuestionAnswers(prev => ({
        ...prev,
        [questionId]: response.data.answers
      }));
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answerText.trim()) return;
      
    setSubmitting(true);
    try {
      await answers.submit({
        questionId: selectedQuestion.id,
        content: answerText.trim(),
        sources: ['https://example.com'] // Temporary - you should add a sources input field
      });
      
      alert('Answer submitted successfully!');
      setAnswerText('');
      setSelectedQuestion(null);
      await fetchData();
      fetchAnswersForQuestion(selectedQuestion.id);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit answer');
    }
    setSubmitting(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Idea not found</p>
      </div>
    );
  }

  const allQuestions = [...ideaQuestions.top3Questions, ...ideaQuestions.otherQuestions];
  const potentialEarnings = idea.totalEscrow * 0.5;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/researcher')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{idea.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Trophy className="text-purple-500" size={16} />
                  Rank #{idea.escrowRank || 'Unranked'}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="text-green-500" size={16} />
                  Total Escrow: {formatCurrency(idea.totalEscrow)}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="text-yellow-500" size={16} />
                  Researcher Pool: {formatCurrency(potentialEarnings)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Investment Summary</h2>
              <p className="text-gray-300 leading-relaxed">{idea.summary}</p>
              
              {idea.detailedPlan && (
                <>
                  <h3 className="text-lg font-semibold text-white mt-6 mb-3">Detailed Analysis</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{idea.detailedPlan}</p>
                </>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Research Questions & Answers</h2>
              
              {allQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">No questions posted yet for this idea.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allQuestions.map((question) => (
                    <div key={question.id} className="space-y-4">
                      {/* Question */}
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedQuestion?.id === question.id 
                            ? 'bg-purple-900/20 border-purple-600' 
                            : 'bg-gray-700/50 border-gray-600 hover:border-purple-500'
                        }`}
                        onClick={() => setSelectedQuestion(question)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {question.questionSlot && question.questionSlot <= 3 && (
                              <span className="inline-block px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded mb-2">
                                TOP 3 - SLOT {question.questionSlot}
                              </span>
                            )}
                            <p className="text-white font-medium">{question.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              by {question.submittedBy.organizationName}
                            </p>
                          </div>
                          {question.bidAmount > 0 && (
                            <div className="text-right ml-4">
                              <p className="text-xs text-gray-400">Bid Amount</p>
                              <p className="text-sm font-semibold text-green-500">
                                {formatCurrency(question.bidAmount)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-400">
                            {question._count?.answers || 0} answers
                          </span>
                          {selectedQuestion?.id === question.id && (
                            <span className="text-xs text-purple-400 font-medium">
                              Click to answer this question
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Answers - Always visible if they exist */}
                      {questionAnswers[question.id] && questionAnswers[question.id].length > 0 && (
                        <div className="ml-6 space-y-3">
                          <h4 className="text-sm font-semibold text-gray-400">Answers:</h4>
                          {questionAnswers[question.id].map((answer) => (
                            <AnswerCard
                              key={answer.id}
                              answer={answer}
                              currentUserId={user?.id}
                              onUpdate={() => fetchAnswersForQuestion(question.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedQuestion && (
              <div className="bg-gray-800 rounded-xl p-6 border border-purple-600">
                <h3 className="text-lg font-semibold text-white mb-4">Submit Your Answer</h3>
                
                <div className="mb-4 p-3 bg-purple-900/20 rounded-lg border border-purple-700/50">
                  <p className="text-sm text-purple-300 font-medium mb-1">Answering:</p>
                  <p className="text-white">{selectedQuestion.text}</p>
                </div>
                
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Provide a detailed, well-researched answer. Quality answers earn higher rewards..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  rows={6}
                />
                
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-400">
                    {answerText.length} characters
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedQuestion(null);
                        setAnswerText('');
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={submitting || answerText.length < 100}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit Answer
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Minimum 100 characters required. Quality answers maintain your reputation score.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Earnings Potential</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Total Researcher Pool</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(potentialEarnings)}
                  </p>
                  <p className="text-xs text-gray-500">50% of total escrow</p>
                </div>
                
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Distribution based on:</p>
                  <ul className="space-y-1 text-xs text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      Answer quality scores
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      Institutional upvotes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      Your reputation multiplier
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Your Activity</h3>
              
              {myAnswers.length === 0 ? (
                <p className="text-sm text-gray-400">
                  You haven't answered any questions for this idea yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {myAnswers.map((answer) => (
                    <div key={answer.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-white mb-1">{answer.question.text}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} />
                          {answer.upvotes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-purple-400" size={16} />
                <p className="text-sm font-semibold text-purple-400">Research Tips</p>
              </div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Provide detailed, data-backed answers</li>
                <li>• Cite credible sources when possible</li>
                <li>• Focus on Top 3 questions for visibility</li>
                <li>• Quality > Quantity for reputation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearcherIdeaView;
