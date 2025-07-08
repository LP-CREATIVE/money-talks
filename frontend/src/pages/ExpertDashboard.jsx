import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { expert, questions, ideas } from "../services/api";
import ExpertProfileCard from '../components/ExpertProfileCard';
import { 
  Shield, DollarSign, TrendingUp, Award, 
  FileText, Users, Clock, AlertCircle,
  CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    answersProvided: 0,
    accuracyScore: 0,
    responseRate: 0
  });
  const [availableIdeas, setAvailableIdeas] = useState([]);
  const [expandedIdeas, setExpandedIdeas] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchExpertProfile();
      fetchIdeasAndQuestions();
    } else {
      console.log("No token found, user not authenticated");
      setLoading(false);
    }
  }, []);
  const fetchExpertProfile = async () => {
    try {
      const response = await expert.getProfile();
      const profile = response.data;
      setProfile(profile);
      
      setStats({
        totalEarnings: profile.totalEarnings || 0,
        answersProvided: profile.ExpertAnswer?.length || 0,
        accuracyScore: profile.accuracyScore || 0,
        responseRate: profile.responseRate || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchIdeasAndQuestions = async () => {
    try {
      setLoading(true);
      // Get all ideas - they already include questions from the API
      const ideasResponse = await ideas.getAll({});
      const allIdeas = ideasResponse.data.ideas || [];
      
      setAvailableIdeas(allIdeas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setLoading(false);
    }
  };
  const toggleIdea = (ideaId) => {
    setExpandedIdeas(prev => ({
      ...prev,
      [ideaId]: !prev[ideaId]
    }));
  };

  const calculateTotalEscrow = (idea) => {
    return idea.contributions?.reduce((sum, c) => {
      // Only count contributions that have not been refunded
      if (c.wasRefunded === false) {
        return sum + c.amount;
      }
      return sum;
    }, 0) || 0;
  };
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="text-purple-500" size={24} />
            <h1 className="text-xl font-bold text-white">Expert Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Welcome, {user?.email}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Logout
            </button>            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Logout
            </button>          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="text-green-500" size={20} />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Earnings</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="text-blue-500" size={20} />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.answersProvided}
                </p>
                <p className="text-xs text-gray-400">Answers</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="text-purple-500" size={20} />
                  <span className="text-xs text-gray-400">Score</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.accuracyScore}%
                </p>
                <p className="text-xs text-gray-400">Accuracy</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="text-yellow-500" size={20} />
                  <span className="text-xs text-gray-400">Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.responseRate}%
                </p>
                <p className="text-xs text-gray-400">Response</p>
              </div>
            </div>

            {/* Available Ideas and Questions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                All Investment Ideas & Questions
              </h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-purple-500" size={32} />
                </div>
              ) : availableIdeas.length > 0 ? (
                <div className="space-y-4">
                  {availableIdeas.map((idea) => (
                    <div key={idea.id} className="bg-gray-700 rounded-lg border border-gray-600">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-650 transition-colors"
                        onClick={() => toggleIdea(idea.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{idea.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>Sector: {idea.sector}</span>
                              <span>Status: {idea.status}</span>
                              <span className="text-green-400">
                                Escrow: ${calculateTotalEscrow(idea).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">
                              {idea.questions?.length || 0} questions
                            </span>
                            {expandedIdeas[idea.id] ? 
                              <ChevronUp className="text-gray-400" size={20} /> : 
                              <ChevronDown className="text-gray-400" size={20} />
                            }
                          </div>
                        </div>
                      </div>
                      
                      {expandedIdeas[idea.id] && (
                        <div className="border-t border-gray-600 p-4 space-y-3">
                          {idea.questions?.length > 0 ? (
                            idea.questions.map((question) => (
                              <div
                                key={question.id}
                                className="bg-gray-800 rounded-lg p-3 hover:border-purple-500 border border-gray-700 transition-colors cursor-pointer"
                                onClick={() => navigate(`/expert/question/${question.id}`)}
                              >
                                <p className="text-white mb-2">{question.text}</p>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">
                                    Asked {new Date(question.createdAt).toLocaleDateString()}
                                  </span>
                                  <button 
                                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/expert/question/${question.id}`);
                                    }}
                                  >
                                    Answer Question →
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm italic">No questions yet for this idea</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">
                    No investment ideas available at the moment
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/expert/profile')}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-left"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/expert/answers')}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-left"
                >
                  View My Answers
                </button>
                <button
                  onClick={() => navigate('/expert/earnings')}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-left"
                >
                  Earnings History
                </button>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Profile Status
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Account Status</span>
                  <CheckCircle className="text-green-500" size={16} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Ideas</span>
                  <span className="text-sm text-white">{availableIdeas.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Open Questions</span>
                  <span className="text-sm text-white">
                    {availableIdeas.reduce((sum, idea) => sum + (idea.questions?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
