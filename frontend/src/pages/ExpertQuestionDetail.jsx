import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questions, answers } from '../services/api';
import ExpertAnswerForm from '../components/ExpertAnswerForm';
import { 
  ArrowLeft, DollarSign, Building, Clock, 
  AlertCircle, CheckCircle, Loader2
} from 'lucide-react';

const ExpertQuestionDetail = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [existingAnswer, setExistingAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestionDetails();
  }, [questionId]);

  const fetchQuestionDetails = async () => {
    try {
      setLoading(true);
      
      // Get question details
      const questionRes = await questions.getById(questionId);
      setQuestion(questionRes.data);
      console.log("Question data:", questionRes.data);      
      // Check if expert already answered
      const answersRes = await answers.getByQuestion(questionId);
      
      // Check if answers exist in the response
      const answersData = answersRes.data.answers || answersRes.data;
      const userAnswer = Array.isArray(answersData) ? answersData.find(a => a.userId === localStorage.getItem("userId")) : null;
      if (userAnswer) {
        setExistingAnswer(userAnswer);
      }
    } catch (err) {
      setError('Failed to load question details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => navigate('/expert/dashboard')}
              className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/expert/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-white">Answer Question</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Question Details */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {question?.idea?.title}
              </h2>
              <p className="text-gray-400 text-sm">
                {question?.idea?.sector} • {question?.idea?.marketCap}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-700 rounded-lg">
              <DollarSign className="text-green-400" size={20} />
              <span className="text-green-400 font-semibold">
                ${question?.idea?.contributions?.reduce((sum, c) => !c.wasRefunded ? sum + c.amount : sum, 0) || question?.bidAmount || 0}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Question</h3>
            <p className="text-gray-300 leading-relaxed">{question?.text}</p>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Building size={16} />
              <span>{question?.idea?.createdBy?.organizationName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Posted {new Date(question?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Answer Section */}
        {existingAnswer ? (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-500" size={24} />
              <h3 className="text-lg font-semibold text-white">Your Answer Submitted</h3>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <p className="text-gray-300">{existingAnswer.content}</p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Submitted: {new Date(existingAnswer.createdAt).toLocaleString()}
              </span>
              {existingAnswer.finalScore && (
                <span className="text-green-400">
                  Score: {existingAnswer.finalScore}/100
                </span>
              )}
            </div>

            {existingAnswer.isPaid ? (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-green-400 text-sm">✓ Payment released</p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <p className="text-yellow-400 text-sm">⏳ Awaiting review and payment</p>
              </div>
            )}
          </div>
        ) : (
          <ExpertAnswerForm 
            question={question} 
            onSuccess={() => fetchQuestionDetails()} 
          />
        )}
      </div>
    </div>
  );
};

export default ExpertQuestionDetail;
