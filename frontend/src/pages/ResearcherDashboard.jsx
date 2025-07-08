import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ideas, questions } from '../services/api';
import { 
  DollarSign, LogOut, TrendingUp, MessageSquare, Trophy, Clock, Shield,
  Users, BarChart3, ArrowUpRight, AlertCircle, Loader2,
  Filter, Search, ChevronRight, Eye, Brain, Coins, Star
} from 'lucide-react';

const ResearcherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [ideasList, setIdeasList] = useState([]);
  const [myActivity, setMyActivity] = useState({ answers: [], earnings: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        const response = await ideas.getAll();
        setIdeasList(response.data.ideas || []);
      } else {
        // Fetch activity data
        // TODO: Implement activity endpoint
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'TOP_100': return 'text-green-400 bg-green-900/50';
      case 'QUEUED': return 'text-yellow-400 bg-yellow-900/50';
      default: return 'text-gray-400 bg-gray-900/50';
    }
  };

  const filteredIdeas = ideasList.filter(idea => 
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Researcher Dashboard</h1>
              <p className="text-sm text-gray-400">Earn by answering investment questions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-lg">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-300">Reputation:</span>
              <span className="text-sm font-semibold text-white">{user?.reputationScore || 0}</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-lg">
              <Coins className="text-green-500" size={16} />
              <span className="text-sm text-gray-300">Balance:</span>
              <span className="text-sm font-semibold text-white">{formatCurrency(user?.walletBalance || 0)}</span>
            </div>
            
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/30 border-b border-gray-700 px-6 py-0">
        <div className="max-w-7xl mx-auto flex gap-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-4 px-2 border-b-2 transition-colors ${
              activeTab === 'browse' 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye size={20} />
              Browse Ideas
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 px-2 border-b-2 transition-colors ${
              activeTab === 'activity' 
                ? 'border-purple-500 text-purple-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={20} />
              My Activity
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-green-500" size={20} />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{ideasList.length}</p>
            <p className="text-sm text-gray-400">Active Ideas</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="text-blue-500" size={20} />
              <span className="text-xs text-gray-500">Open</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-sm text-gray-400">Questions</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-purple-500" size={20} />
              <span className="text-xs text-gray-500">Potential</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(0)}</p>
            <p className="text-sm text-gray-400">Earnings</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-500" size={20} />
              <span className="text-xs text-gray-500">Avg</span>
            </div>
            <p className="text-2xl font-bold text-white">24h</p>
            <p className="text-sm text-gray-400">Response Time</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'browse' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Top Investment Ideas</h2>
                
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search ideas..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Expert Verification Banner */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700/50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <Shield size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Become a Verified Expert
                      </h3>
                      <p className="text-sm text-gray-300">
                        Get verified to unlock higher commissions and exclusive high-value questions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/expert')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    Start Verification
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              
              {filteredIdeas.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-12 text-center">
                  <Search className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">No ideas found matching your search.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredIdeas.map((idea) => (
                    <div key={idea.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-white">{idea.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(idea.status)}`}>
                              {idea.status}
                            </span>
                          </div>
                          
                          <p className="text-gray-400 mb-4 line-clamp-2">{idea.summary}</p>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign size={16} className="text-green-500" />
                              <span className="text-gray-300">Total Escrow:</span>
                              <span className="font-semibold text-white">{formatCurrency(idea.totalEscrow)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Trophy size={16} className="text-yellow-500" />
                              <span className="text-gray-300">Rank:</span>
                              <span className="font-semibold text-white">#{idea.escrowRank || 'Unranked'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-blue-500" />
                              <span className="text-gray-300">Questions:</span>
                              <span className="font-semibold text-white">{idea._count?.questions || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => navigate(`/researcher/idea/${idea.id}`)}
                          className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          View Details
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">My Research Activity</h2>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Total Answers</p>
                  <p className="text-2xl font-bold text-white">
                    {myActivity.answers?.length || 0}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Total Earned</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(myActivity.earnings)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Quality Score</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {myActivity.qualityScore || 0}%
                  </p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Reputation</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {myActivity.reputation || 0}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
                <AlertCircle className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">No recent activity to display</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Browse Ideas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearcherDashboard;
