import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ideas, questions, answers, escrow } from '../services/api';
import { 
  ArrowLeft, Building, Calendar, DollarSign, 
  Plus, MessageSquare, CheckCircle, XCircle,
  Loader2, TrendingUp, AlertCircle, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const IdeaDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();  const [idea, setIdea] = useState(null);
  const [ideaQuestions, setIdeaQuestions] = useState({ top3Questions: [], otherQuestions: [] });
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [contributions, setContributions] = useState([]);
  const [userContribution, setUserContribution] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canAddQuestions = userContribution >= 5000;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ideaResponse = await ideas.getById(id);
      setIdea(ideaResponse.data);

      const questionsResponse = await questions.getIdeaQuestions(id);
      setIdeaQuestions(questionsResponse.data);

      const contributionsResponse = await escrow.getIdeaContributions(id);
      setContributions(contributionsResponse.data.contributions);
      
      const userContrib = contributionsResponse.data.contributions
        .find(c => c.user.id === user?.id);
      setUserContribution(userContrib?.amount || 0);

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

  const handleAddQuestion = async () => {
    setSubmitting(true);
    try {
      await questions.add({
        ideaId: id,
        text: questionText
      });
      
      await fetchData();
      setShowQuestionModal(false);
      setQuestionText('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add question');
    }
    setSubmitting(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading idea details...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Idea not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Link to="/institutional" className="inline-flex items-center text-gray-400 hover:text-white p-4">
        <ArrowLeft size={20} className="mr-2" />
        Back to Dashboard
      </Link>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Executive Summary</h2>
              <p className="text-gray-300 leading-relaxed">{idea.summary}</p>
              
              {idea.detailedPlan && (
                <>
                  <h3 className="text-lg font-semibold text-white mt-6 mb-3">Detailed Plan</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{idea.detailedPlan}</p>
                </>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Research Questions & Answers</h2>
                {canAddQuestions && (
                  <button
                    onClick={() => setShowQuestionModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} />
                    Add Question
                  </button>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Top 3 Questions</h3>
                <div className="space-y-6">
                  {[1, 2, 3].map((slot) => {
                    const question = ideaQuestions.top3Questions.find(q => q.questionSlot === slot);
                    
                    return (
                      <div key={slot} className="space-y-3">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          {question ? (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                                      Slot {slot}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatCurrency(question.escrowAmount)} escrow
                                    </span>
                                  </div>
                                  <p className="text-white">{question.text}</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    by {question.submittedBy.organizationName}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MessageSquare size={14} />
                                  {question._count?.answers || 0} answers
                                </span>
                              </div>
                                {user?.userType === 'INSTITUTIONAL' && (
                                  <button
                                    onClick={() => navigate(`/institutional/matching/${question.id}`)}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                  >
                                    Find Experts
                                  </button>
                                )}
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <MessageSquare className="mx-auto text-gray-600 mb-2" size={24} />
                              <p className="text-sm text-gray-500 mb-2">Slot {slot} Available</p>
                              {canAddQuestions && ideaQuestions.availableSlots > 0 && (
                                <p className="text-xs text-gray-400">
                                  Add a question to automatically fill this slot
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {question && questionAnswers[question.id] && questionAnswers[question.id].length > 0 && (
                          <div className="ml-6 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-400">Answers:</h4>
                            {questionAnswers[question.id].map((answer) => (
                              <div key={answer.id} className="bg-gray-700/30 rounded-lg p-4">
                                <p className="text-gray-300 text-sm">{answer.content}</p>
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="text-xs text-gray-500">
                                    by {answer.user.organizationName}
                                  </p>
                                  {answer.finalScore && (
                                    <span className="text-xs text-green-400">
                                      Score: {answer.finalScore}/100
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {ideaQuestions.otherQuestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Additional Questions</h3>
                  <div className="space-y-4">
                    {ideaQuestions.otherQuestions.map((question) => (
                      <div key={question.id} className="space-y-3">
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <p className="text-white">{question.text}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              by {question.submittedBy.organizationName}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{formatCurrency(question.escrowAmount)} escrow</span>
                              <span className="flex items-center gap-1">
                                <MessageSquare size={14} />
                                {question._count?.answers || 0} answers
                              </span>
                            </div>
                                {user?.userType === 'INSTITUTIONAL' && (
                                  <button
                                    onClick={() => navigate(`/institutional/matching/${question.id}`)}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                                  >
                                    Find Experts
                                  </button>
                                )}
                          </div>
                        </div>

                        {questionAnswers[question.id] && questionAnswers[question.id].length > 0 && (
                          <div className="ml-6 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-400">Answers:</h4>
                            {questionAnswers[question.id].map((answer) => (
                              <div key={answer.id} className="bg-gray-700/30 rounded-lg p-4">
                                <p className="text-gray-300 text-sm">{answer.content}</p>
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="text-xs text-gray-500">
                                    by {answer.user.organizationName}
                                  </p>
                                  {answer.finalScore && (
                                    <span className="text-xs text-green-400">
                                      Score: {answer.finalScore}/100
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Idea Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Title</p>
                  <p className="text-white font-medium">{idea.title}</p>
                </div>
                {idea.sector && (
                  <div>
                    <p className="text-xs text-gray-400">Sector</p>
                    <p className="text-white">{idea.sector}</p>
                  </div>
                )}
                {idea.marketCap && (
                  <div>
                    <p className="text-xs text-gray-400">Market Cap</p>
                    <p className="text-white">{idea.marketCap}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Total Escrow</p>
                  <p className="text-white font-medium">{formatCurrency(idea.totalEscrow)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    idea.status === 'TOP_100' ? 'bg-green-600 text-white' :
                    idea.status === 'ACTIVE' ? 'bg-blue-600 text-white' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {idea.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Contributors</h2>
              <div className="space-y-3">
                {contributions.map((contribution) => (
                  <div key={contribution.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{contribution.user.organizationName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(contribution.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-green-500 font-medium">{formatCurrency(contribution.amount)}</p>
                  </div>
                ))}
              </div>
              {userContribution > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">Your contribution</p>
                  <p className="text-lg font-semibold text-green-500">{formatCurrency(userContribution)}</p>
                </div>
              )}
              {userContribution < 5000 && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    Contribute at least $5,000 to submit questions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Add a Question</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Question
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                placeholder="What specific information would you like to know?"
              />
              <p className="text-xs text-gray-500 mt-2">
                Minimum 10 characters. {ideaQuestions.availableSlots > 0 && 
                  `This question will automatically be assigned to slot ${4 - ideaQuestions.availableSlots}.`
                }
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAddQuestion}
                disabled={submitting || questionText.length < 10}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Add Question
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setQuestionText('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaDetail;
