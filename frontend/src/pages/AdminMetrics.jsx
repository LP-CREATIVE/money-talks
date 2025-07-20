import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, TrendingUp, DollarSign, Users, 
  Activity, BarChart2, Calendar
} from 'lucide-react';
import { admin } from '../services/api';

const AdminMetrics = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalIdeas: 0,
    totalQuestions: 0,
    totalAnswers: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // TODO: Implement admin.getMetrics() in API
      // const response = await admin.getMetrics({ range: timeRange });
      // setMetrics(response.data);
      
      // Mock data
      setMetrics({
        totalRevenue: 125000,
        monthlyRevenue: 25000,
        totalUsers: 150,
        activeUsers: 45,
        totalIdeas: 89,
        totalQuestions: 267,
        totalAnswers: 198,
        avgResponseTime: 4.5
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color, prefix = '', suffix = '' }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400">{title}</p>
        <Icon className={color} size={20} />
      </div>
      <p className="text-2xl font-bold text-white">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-white">Platform Metrics</h1>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Revenue Metrics */}
            <h2 className="text-lg font-semibold text-white mb-4">Revenue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MetricCard
                title="Total Revenue"
                value={metrics.totalRevenue}
                icon={DollarSign}
                color="text-green-400"
                prefix="$"
              />
              <MetricCard
                title="Monthly Revenue"
                value={metrics.monthlyRevenue}
                icon={TrendingUp}
                color="text-blue-400"
                prefix="$"
              />
            </div>

            {/* User Metrics */}
            <h2 className="text-lg font-semibold text-white mb-4">Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MetricCard
                title="Total Users"
                value={metrics.totalUsers}
                icon={Users}
                color="text-purple-400"
              />
              <MetricCard
                title="Active Users"
                value={metrics.activeUsers}
                icon={Activity}
                color="text-green-400"
              />
            </div>

            {/* Platform Activity */}
            <h2 className="text-lg font-semibold text-white mb-4">Platform Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Ideas"
                value={metrics.totalIdeas}
                icon={BarChart2}
                color="text-yellow-400"
              />
              <MetricCard
                title="Total Questions"
                value={metrics.totalQuestions}
                icon={Calendar}
                color="text-blue-400"
              />
              <MetricCard
                title="Total Answers"
                value={metrics.totalAnswers}
                icon={Activity}
                color="text-green-400"
              />
              <MetricCard
                title="Avg Response Time"
                value={metrics.avgResponseTime}
                icon={Activity}
                color="text-orange-400"
                suffix=" hours"
              />
            </div>

            {/* Charts placeholder */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                Chart visualization would go here
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMetrics;
