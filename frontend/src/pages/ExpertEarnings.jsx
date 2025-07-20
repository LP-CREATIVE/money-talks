import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, DollarSign, TrendingUp, Calendar,
  Download, Filter, ChevronDown
} from 'lucide-react';
import { expert } from '../services/api';

const ExpertEarnings = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    thisMonthEarnings: 0,
    totalAnswers: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEarnings();
  }, [filter]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      // TODO: Add API endpoint for fetching earnings
      // const response = await expert.getEarnings(filter);
      // setEarnings(response.data.earnings);
      // setStats(response.data.stats);
      
      // Mock data for now
      setEarnings([
        {
          id: 1,
          questionTitle: "SaaS metrics analysis for Series B",
          amount: 500,
          status: 'paid',
          paidAt: new Date().toISOString(),
          answeredAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 2,
          questionTitle: "Cloud infrastructure cost optimization",
          amount: 750,
          status: 'pending',
          answeredAt: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
      
      setStats({
        totalEarnings: 1250,
        pendingEarnings: 750,
        thisMonthEarnings: 1250,
        totalAnswers: 2
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-900/20 border-green-700';
      case 'pending':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'rejected':
        return 'text-red-400 bg-red-900/20 border-red-700';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/expert/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-white">Earnings & Payouts</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Total Earnings</p>
              <DollarSign className="text-green-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">
              ${stats.totalEarnings.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Pending</p>
              <Calendar className="text-yellow-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">
              ${stats.pendingEarnings.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">This Month</p>
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">
              ${stats.thisMonthEarnings.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Total Answers</p>
              <Filter className="text-purple-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalAnswers}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Earnings</option>
            <option value="paid">Paid Only</option>
            <option value="pending">Pending Only</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>

        {/* Earnings Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Question</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Answered</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    Loading earnings...
                  </td>
                </tr>
              ) : earnings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No earnings found
                  </td>
                </tr>
              ) : (
                earnings.map((earning) => (
                  <tr key={earning.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{earning.questionTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold">${earning.amount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(earning.status)}`}>
                        {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(earning.answeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {earning.paidAt ? new Date(earning.paidAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpertEarnings;
