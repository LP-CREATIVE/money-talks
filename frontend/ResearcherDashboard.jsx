import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ideas, questions } from '../services/api';
import { 
  DollarSign, LogOut, TrendingUp, MessageSquare, Trophy, Clock,
  Users, BarChart3, ArrowUpRight, AlertCircle, Loader2,
  Filter, Search, ChevronRight, Eye, Brain, Coins, Star
} from 'lucide-react';

const ResearcherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);
  const [ideasList, setIdeasList] = useState([]);
  const [myActivity, setMyActivity] = useState({ answers: [], earnings: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        // Fetch top 100 ideas for researchers to browse
        const response = await ideas.getAll({ status: 'TOP_100' });
        setIdeasList(response.data.ideas);
      } else if (activeTab === 'activity') {
        // TODO: Implement endpoint to fetch researcher's answers and earnings
        // For now, using mock data
        setMyActivity({
          answers: [],
          earnings: 0,
          reputation: 0
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredIdeas = ideasList.filter(idea => 
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg">
              <Brain size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">MONEY TALKS - Researcher</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-2">
              <Coins size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Total Earnings</p>
                <p className="font-semibold text-white">{formatCurrency(myActivity.earnings)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-2">
              <Star size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Reputation</p>
                <p className="font-semibold text-white">{myActivity.reputation || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-300">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 h-[calc(100vh-73px)] p-4 border-r border-gray-700">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('browse')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'browse' 
                  ? 'bg-purple-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Search size={20} />
              <span>Browse Ideas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('activity')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'activity' 
                  ? 'bg-purple-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <BarChart3 size={20} />
              <span>My Activity</span>
            </button>
            
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'leaderboard' 
                  ? 'bg-purple-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Trophy size={20} />
              <span>Leaderboard</span>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-400 mb-2">How to Earn</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Answer questions on ideas</li>
              <li>• Get upvoted by institutions</li>
              <li>• Maintain 80%+ quality score</li>
              <li>• Earn 50% of escrow rewards</li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-purple-500" size={48} />
            </div>
          ) : (
            <>
              {/* Browse Ideas */}
              {activeTab === 'browse' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Top Investment Ideas</h2>
                    
                    {/* Search Bar */}
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
                                <span className="text-lg font-bold text-purple-400">#{idea.escrowRank || '-'}</span>
                                <h3 className="text-lg font-semibold text-white">{idea.title}</h3>
                              </div>
                              <p className="text-gray-400 mb-4 line-clamp-2">{idea.summary}</p>
                              
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <DollarSign size={16} className="text-green-500" />
                                  <span className="text-gray-400">Total Escrow:</span>
                                  <span className="text-white font-semibold">{formatCurrency(idea.totalEscrow)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MessageSquare size={16} className="text-purple-500" />
                                  <span className="text-gray-400">Questions:</span>
                                  <span className="text-white font-semibold">{idea._count?.questions || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users size={16} className="text-blue-500" />
                                  <span className="text-gray-400">Answers:</span>
                                  <span className="text-white font-semibold">{idea._count?.answers || 0}</span>
                                </div>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => navigate(`/researcher/idea/${idea.id}`)}
                              className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Eye size={16} />
                              View & Answer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Activity */}
              {activeTab === 'activity' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">My Research Activity</h2>
                  
                  {/* Stats Cards */}
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
                  
                  {/* Activity List */}
                  {myActivity.answers?.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-12 text-center">
                      <MessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
                      <p className="text-gray-400 mb-4">No research activity yet.</p>
                      <button
                        onClick={() => setActiveTab('browse')}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Browse Ideas to Start
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400">Answer history will appear here...</div>
                  )}
                </div>
              )}

              {/* Leaderboard */}
              {activeTab === 'leaderboard' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Top Researchers</h2>
                  
                  <div className="bg-gray-800 rounded-xl p-12 text-center">
                    <Trophy className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-400">Leaderboard coming soon...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResearcherDashboard;
