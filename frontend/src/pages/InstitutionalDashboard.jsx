import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ideas, escrow } from '../services/api';
import { 
  DollarSign, LogOut, TrendingUp, Plus, Trophy, Clock,
  Users, BarChart3, ArrowUpRight, AlertCircle, Loader2,
  Filter, Search, ChevronRight, Eye, Wallet, RefreshCw, MessageSquare
} from 'lucide-react';

const InstitutionalDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('top100');
  const [loading, setLoading] = useState(true);
  const [ideasList, setIdeasList] = useState([]);
  const [myContributions, setMyContributions] = useState({ contributions: [], summary: {} });
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('5000');
  const [submitting, setSubmitting] = useState(false);
  const [updatingRankings, setUpdatingRankings] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'top100') {
        const response = await ideas.getAll({ status: 'TOP_100' });
        setIdeasList(response.data.ideas);
      } else if (activeTab === 'queued') {
        const response = await ideas.getAll({ status: 'QUEUED' });
        setIdeasList(response.data.ideas);
      } else if (activeTab === 'contributions') {
        const response = await escrow.getMyContributions();
        setMyContributions(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleUpdateRankings = async () => {
    setUpdatingRankings(true);
    try {
      await ideas.updateRankings();
      await fetchData(); // Refresh the data
      alert('Rankings updated successfully!');
    } catch (error) {
      console.error('Error updating rankings:', error);
      alert('Failed to update rankings');
    }
    setUpdatingRankings(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleContribute = async () => {
    setSubmitting(true);
    try {
      await escrow.contribute({
        ideaId: selectedIdea.id,
        amount: parseFloat(contributionAmount)
      });
      
      // Refresh data
      await fetchData();
      
      // Close modal
      setShowContributeModal(false);
      setSelectedIdea(null);
      setContributionAmount('5000');
    } catch (error) {
      console.error('Error contributing:', error);
      alert(error.response?.data?.error || 'Failed to contribute');
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
              <DollarSign size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">MONEY TALKS</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={handleUpdateRankings}
              disabled={updatingRankings}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {updatingRankings ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <RefreshCw size={18} />
              )}
              Update Rankings
            </button>
            
            <div className="flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-2">
              <Wallet size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Wallet Balance</p>
                <p className="font-semibold text-white">{formatCurrency(user?.walletBalance)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-300">{user?.organizationName}</span>
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
          <button
            onClick={() => navigate('/institutional/submit-idea')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all mb-6"
          >
            <Plus size={20} />
            Submit New Idea
          </button>
          
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('top100')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'top100' 
                  ? 'bg-green-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Trophy size={20} />
              <span>Top 100 Board</span>
            </button>
            
            <button
              onClick={() => setActiveTab('queued')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'queued' 
                  ? 'bg-green-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Clock size={20} />
              <span>Waitlist Ideas</span>
            </button>
            
            <button
              onClick={() => setActiveTab('contributions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'contributions' 
                  ? 'bg-green-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <BarChart3 size={20} />
              <span>My Contributions</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
          ) : (
            <>
              {/* Top 100 Ideas */}
              {activeTab === 'top100' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Top 100 Investment Ideas</h2>
                  
                  {ideasList.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-12 text-center">
                      <Trophy className="mx-auto text-gray-600 mb-4" size={48} />
                      <p className="text-gray-400 mb-4">No ideas in the Top 100 yet.</p>
                      <p className="text-sm text-gray-500">Click "Update Rankings" to promote ideas with enough escrow.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ideasList.map((idea) => (
                        <div key={idea.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl font-bold text-green-400">#{idea.escrowRank || '-'}</span>
                                <h3 className="text-lg font-semibold text-white">{idea.title}</h3>
                              </div>
                              <p className="text-gray-400 mb-4">{idea.summary}</p>
                              
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <DollarSign size={16} className="text-green-500" />
                                  <span className="text-gray-400">Total Escrow:</span>
                                  <span className="text-white font-semibold">{formatCurrency(idea.totalEscrow)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users size={16} className="text-blue-500" />
                                  <span className="text-gray-400">Contributors:</span>
                                  <span className="text-white font-semibold">{idea._count?.contributions || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MessageSquare size={16} className="text-purple-500" />
                                  <span className="text-gray-400">Questions:</span>
                                  <span className="text-white font-semibold">{idea._count?.questions || 0}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setSelectedIdea(idea);
                                  setShowContributeModal(true);
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Plus size={16} />
                                Contribute
                              </button>
                              <button 
                                onClick={() => navigate(`/idea/${idea.id}`)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Eye size={16} />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Queued Ideas */}
              {activeTab === 'queued' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Waitlist Ideas</h2>
                  
                  {ideasList.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-12 text-center">
                      <Clock className="mx-auto text-gray-600 mb-4" size={48} />
                      <p className="text-gray-400">No ideas in the waitlist.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ideasList.map((idea) => (
                        <div key={idea.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">{idea.title}</h3>
                              <p className="text-gray-400 mb-4">{idea.summary}</p>
                              
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <DollarSign size={16} className="text-yellow-500" />
                                  <span className="text-gray-400">Current Escrow:</span>
                                  <span className="text-white font-semibold">{formatCurrency(idea.totalEscrow)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={16} className="text-red-500" />
                                  <span className="text-gray-400">Needs:</span>
                                  <span className="text-white font-semibold">{formatCurrency(5100 - idea.totalEscrow)} more</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MessageSquare size={16} className="text-purple-500" />
                                  <span className="text-gray-400">Questions:</span>
                                  <span className="text-white font-semibold">{idea._count?.questions || 0}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setSelectedIdea(idea);
                                  setShowContributeModal(true);
                                }}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Plus size={16} />
                                Pool Funds
                              </button>
                              <button 
                                onClick={() => navigate(`/idea/${idea.id}`)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Eye size={16} />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Contributions */}
              {activeTab === 'contributions' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">My Contributions</h2>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <p className="text-gray-400 text-sm mb-2">Total Contributed</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(myContributions.summary?.totalContributed || 0)}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <p className="text-gray-400 text-sm mb-2">Active Contributions</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {myContributions.summary?.activeContributions || 0}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <p className="text-gray-400 text-sm mb-2">Total Refunded</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {formatCurrency(myContributions.summary?.refundedAmount || 0)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Contributions List */}
                  {myContributions.contributions?.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-12 text-center">
                      <DollarSign className="mx-auto text-gray-600 mb-4" size={48} />
                      <p className="text-gray-400">No contributions yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myContributions.contributions?.map((contribution) => (
                        <div 
                          key={contribution.id} 
                          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                          onClick={() => navigate(`/idea/${contribution.idea.id}`)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-white mb-1">{contribution.idea.title}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Amount: <span className="text-white">{formatCurrency(contribution.amount)}</span></span>
                                <span>Status: <span className={contribution.wasRefunded ? 'text-red-500' : 'text-green-500'}>
                                  {contribution.wasRefunded ? 'Refunded' : 'Active'}
                                </span></span>
                                <span>Date: {new Date(contribution.createdAt).toLocaleDateString()}</span>
                                <span>Rank: <span className="text-white">#{contribution.idea.escrowRank || 'Unranked'}</span></span>
                              </div>
                            </div>
                            <ChevronRight className="text-gray-500" size={20} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Contribute Modal */}
      {showContributeModal && selectedIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Contribute to Idea</h3>
            <p className="text-gray-400 mb-6">{selectedIdea.title}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contribution Amount (min $5,000)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  min="5000"
                  step="1000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleContribute}
                disabled={submitting || parseFloat(contributionAmount) < 5000}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Contributing...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Contribute
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowContributeModal(false);
                  setSelectedIdea(null);
                  setContributionAmount('5000');
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

export default InstitutionalDashboard;
