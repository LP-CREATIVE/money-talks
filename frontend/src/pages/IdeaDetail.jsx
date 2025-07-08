import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnswerCard from '../components/AnswerCard';
import { ideas, questions, escrow, answers } from '../services/api';
import { 
  DollarSign, ArrowLeft, MessageSquare, Trophy, 
  AlertCircle, Loader2, Plus, TrendingUp, Users,
  Gavel, Target, CheckCircle, Clock, Search
} from 'lucide-react';

const IdeaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [idea, setIdea] = useState(null);
  const [ideaQuestions, setIdeaQuestions] = useState({ top3Questions: [], otherQuestions: [] });
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [bidAmount, setBidAmount] = useState('5000');
  const [submitting, setSubmitting] = useState(false);
  const [minimumEscrow, setMinimumEscrow] = useState(5000);
  const [userContribution, setUserContribution] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch idea details
      const ideaResponse = await ideas.getById(id);
      setIdea(ideaResponse.data);

      // Fetch questions
      const questionsResponse = await questions.getByIdea(id);
      setIdeaQuestions(questionsResponse.data);

      // Fetch contributions
      const contribResponse = await escrow.getIdeaContributions(id);
      setContributions(contribResponse.data.contributions);

      // Check user's contribution
      const userContrib = contribResponse.data.contributions.find(c => c.user.id === user?.id);
      setUserContribution(userContrib?.amount || 0);

      // Get minimum escrow for additional questions
      const minEscrowResponse = await questions.getMinimumEscrow();
      setMinimumEscrow(minEscrowResponse.data.minimumEscrow);

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

  const handleAddQuestion = async () => {
    setSubmitting(true);
    try {
      await questions.add({
        ideaId: id,
        text: questionText,
        bidAmount: 0 // Initial questions don't require a bid
      });
      
      await fetchData();
      setShowQuestionModal(false);
      setQuestionText('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add question');
    }
    setSubmitting(false);
  };

  const handleBidOnSlot = async () => {
    setSubmitting(true);
    try {
      await questions.bid({
        questionId: selectedQuestion.id,
        slot: selectedSlot,
        bidAmount: parseFloat(bidAmount)
      });
      
      await fetchData();
      setShowBidModal(false);
      setSelectedQuestion(null);
      setBidAmount('5000');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to place bid');
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
        <Loader2 className="animate-spin text-green-500" size={48} />
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

  const canAddQuestions = userContribution >= 5000;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/institutional')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{idea.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Trophy className="text-green-500" size={16} />
                  Rank #{idea.escrowRank || 'Unranked'}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="text-green-500" size={16} />
                  {formatCurrency(idea.totalEscrow)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="text-blue-500" size={16} />
                  {contributions.length} Contributors
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Summary */}
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

            {/* Questions Section */}
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

              {/* Top 3 Questions */}
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
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-green-500">SLOT {slot}</span>
                                    <span className="text-xs text-gray-500">
                                      by {question.submittedBy.organizationName}
                                    </span>
                                  </div>
                                  <p className="text-white">{question.text}</p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-sm text-gray-400">Current Bid</p>
                                  <p className="text-lg font-semibold text-green-500">
                                    {formatCurrency(question.bidAmount)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-gray-500">
                                    {question._count.answers} answers
                                  </span>
                                  <button
                                    onClick={() => navigate(`/institutional/matching/${question.id}`)}
                                    className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                                  >
                                    <Search size={12} />
                                    Find Experts
                                  </button>
                                </div>
                                {canAddQuestions && question.submittedBy.id !== user?.id && (
                                  <button
                                    onClick={() => {
                                      setSelectedQuestion(question);
                                      setSelectedSlot(slot);
                                      setBidAmount(question.bidAmount + 1000);
                                      setShowBidModal(true);
                                    }}
                                    className="text-xs text-green-500 hover:text-green-400"
                                  >
                                    Outbid
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <Gavel className="mx-auto text-gray-600 mb-2" size={24} />
                              <p className="text-sm text-gray-500 mb-2">Slot {slot} Available</p>
                              {canAddQuestions && (
                                <button
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setBidAmount('5000');
                                    setShowBidModal(true);
                                  }}
                                  className="text-xs text-green-500 hover:text-green-400"
                                >
                                  Bid for this slot
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Show answers for this question */}
                        {question && questionAnswers[question.id] && questionAnswers[question.id].length > 0 && (
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
                    );
                  })}
                </div>
              </div>

              {/* Other Questions */}
              {ideaQuestions.otherQuestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Other Questions</h3>
                  <div className="space-y-6">
                    {ideaQuestions.otherQuestions.map((question) => (
                      <div key={question.id} className="space-y-3">
                        <div className="bg-gray-700/30 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-300">{question.text}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <p className="text-xs text-gray-500">
                                  by {question.submittedBy.organizationName} • {question._count.answers} answers
                                </p>
                                <button
                                  onClick={() => navigate(`/institutional/matching/${question.id}`)}
                                  className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                                >
                                  <Search size={12} />
                                  Find Experts
                                </button>
                              </div>
                            </div>
                            {canAddQuestions && (
                              <button
                                onClick={() => {
                                  setSelectedQuestion(question);
                                  setSelectedSlot(1);
                                  setBidAmount('5000');
                                  setShowBidModal(true);
                                }}
                                className="text-xs text-green-500 hover:text-green-400 ml-4"
                              >
                                Bid for top 3
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Show answers for this question */}
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
                </div>
              )}

              {!canAddQuestions && (
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <p className="text-sm text-yellow-400">
                    Contribute at least {formatCurrency(5000)} to submit questions for this idea.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Contribution */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Your Contribution</h3>
              {userContribution > 0 ? (
                <>
                  <p className="text-2xl font-bold text-green-500 mb-2">
                    {formatCurrency(userContribution)}
                  </p>
                  <p className="text-sm text-gray-400">
                    You can submit questions and bid on slots
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 mb-4">Not contributed yet</p>
                  <button
                    onClick={() => navigate('/institutional')}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Contribute Now
                  </button>
                </>
              )}
            </div>

            {/* Contributors */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Top Contributors</h3>
              <div className="space-y-3">
                {contributions.slice(0, 5).map((contrib, index) => (
                  <div key={contrib.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                      <span className="text-sm text-white">
                        {contrib.user.organizationName || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-500">
                      {formatCurrency(contrib.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Questions Cost */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-blue-400" size={16} />
                <p className="text-sm font-semibold text-blue-400">Additional Questions</p>
              </div>
              <p className="text-xs text-gray-300">
                Cost per additional question after the top 3: {formatCurrency(minimumEscrow)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Add Research Question</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Question
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="What specific information would help validate this investment opportunity?"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{questionText.length}/500 characters</p>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">
                After submitting, you can bid to place this question in one of the top 3 slots 
                for maximum visibility to researchers.
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

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">
              Bid for Question Slot {selectedSlot}
            </h3>
            
            {selectedQuestion && (
              <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-300">{selectedQuestion.text}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bid Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min="1"
                  step="1000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Higher bids get priority for the top 3 question slots
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleBidOnSlot}
                disabled={submitting || parseFloat(bidAmount) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Placing Bid...
                  </>
                ) : (
                  <>
                    <Gavel size={20} />
                    Place Bid
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowBidModal(false);
                  setSelectedQuestion(null);
                  setBidAmount('5000');
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
