import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Users, DollarSign, FileText, TrendingUp, BarChart3, Brain, CheckCircle, XCircle, Clock, AlertCircle, Loader2, Shield, Activity
} from "lucide-react";
import PhilosophyManager from "../components/PhilosophyManager";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAnswers, setPendingAnswers] = useState([]);

  useEffect(() => {
    if (user?.userType !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, answersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/answers/pending')
      ]);
      setStats(statsRes.data);
      setPendingAnswers(answersRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAnswer = async (answerId, score) => {
    try {
      await api.post(`/admin/answers/${answerId}/approve`, { score });
      alert('Answer approved!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving answer:', error);
      alert('Failed to approve answer');
    }
  };

  const handleRejectAnswer = async (answerId, reason) => {
    try {
      await api.post(`/admin/answers/${answerId}/reject`, { reason });
      alert('Answer rejected');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting answer:', error);
      alert('Failed to reject answer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="text-purple-500" size={24} />
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Admin: {user?.email}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-blue-500" size={24} />
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "philosophy"
                ? "bg-blue-600 text-white"

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Activity className="text-purple-500" size={24} />
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats?.counts.answers || 0}</p>
            <p className="text-sm text-gray-400">Answers</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-yellow-500" size={24} />
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <p className="text-3xl font-bold text-white">
              ${stats?.financials.totalEscrow?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-400">Escrow</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Pending Answers ({pendingAnswers.length})
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            Users</button>
          <button
            onClick={() => setActiveTab("philosophy")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "philosophy"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            AI Philosophy
</button>
          <button
            onClick={() => navigate('/admin/metrics')}
            className="px-4 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            Metrics
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {stats?.recentActivity?.map((answer) => (
                  <div key={answer.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{answer.user.email}</p>
                      <p className="text-sm text-gray-400">
                        Answered: {answer.question.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(answer.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {answer.manualReviewScore ? (
                        <span className="text-green-400">Reviewed</span>
                      ) : (
                        <span className="text-yellow-400">Pending Review</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "philosophy" && (
          <div className="space-y-6">
            <PhilosophyManager />
          </div>
        )}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Pending Answers */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Answers Awaiting Review</h2>
              <div className="space-y-4">
                {pendingAnswers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No pending answers</p>
                ) : (
                  pendingAnswers.map((answer) => (
                    <div key={answer.id} className="border border-gray-700 rounded-lg p-6">
                      <div className="mb-4">
                        <p className="text-sm text-gray-400">Question</p>
                        <p className="text-white">{answer.question.text}</p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-400">Answer by {answer.user.email}</p>
                        <p className="text-gray-300 mt-2">{answer.content}</p>
                      </div>

                      {answer.sources && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-400">Sources</p>
                          <p className="text-gray-300">{answer.sources}</p>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            const score = prompt('Enter score (0-100):');
                            if (score) handleApproveAnswer(answer.id, parseInt(score));
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) handleRejectAnswer(answer.id, reason);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "philosophy" && (
          <div className="space-y-6">
            <PhilosophyManager />
          </div>
        )}      </div>
    </div>
  );
};

export default AdminDashboard;
