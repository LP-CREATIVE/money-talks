import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { answers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, DollarSign, Clock, CheckCircle, 
  XCircle, AlertCircle, Loader2, Trash2 
} from 'lucide-react';

const ExpertAnswers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myAnswers, setMyAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchMyAnswers();
  }, []);

  const fetchMyAnswers = async () => {
    try {
      setLoading(true);
      const response = await answers.getMyAnswers();
      console.log("API Response:", response);      setMyAnswers(response.data.answers || []);
      setTotalEarnings(response.data.totalEarnings || 0);
    } catch (err) {
      console.error('Error fetching answers:', err);
      setError('Failed to load your answers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!confirm("Are you sure you want to delete this answer?")) {
      return;
    }

    try {
      await answers.deleteAnswer(answerId);
      fetchMyAnswers();
    } catch (err) {
      console.error("Error deleting answer:", err);
      alert("Failed to delete answer");
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/expert/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Answers</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-xl font-bold text-green-600">
                  ${totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {myAnswers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">You haven't submitted any answers yet.</p>
            <button
              onClick={() => navigate('/expert/dashboard')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Questions
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myAnswers.map((answer) => (
              <div key={answer.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {answer.question?.idea?.title || 'Investment Idea'}
                    </h3>
                    <p className="text-gray-700 font-medium mb-2">
                      Q: {answer.question?.text || 'Question'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnswer(answer.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete answer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>                  <div className="flex items-center space-x-2">
                    {getStatusIcon(answer.ExpertAnswer?.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(answer.ExpertAnswer?.status)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{answer.content}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-500">
                      Submitted: {new Date(answer.createdAt).toLocaleDateString()}
                    </span>
                    {answer.ExpertAnswer?.status === 'APPROVED' && (
                      <span className="flex items-center text-green-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Earned: ${answer.ExpertAnswer?.questionValue?.toFixed(2) || '0.00'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">                    <span className="text-gray-500">Score:</span>
                    <span className="font-medium">
                      {answer.finalScore || answer.aiValidationScore || 'Pending'}
                    </span>
                  </div>
                </div>
                  </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertAnswers;
