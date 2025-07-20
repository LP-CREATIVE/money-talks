import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Shield, Ban, CheckCircle,
  Search, Filter, MoreVertical
} from 'lucide-react';
import { admin } from '../services/api';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    institutionalUsers: 0,
    expertUsers: 0,
    verifiedUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [filterType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implement admin.getUsers() in API
      // const response = await admin.getUsers({ type: filterType });
      // setUsers(response.data.users);
      // setStats(response.data.stats);
      
      // Mock data
      setUsers([
        {
          id: '1',
          email: 'inst@test.com',
          userType: 'INSTITUTIONAL',
          organizationName: 'Test Investment Corp',
          isVerified: true,
          walletBalance: 50000,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'expert@test.com',
          userType: 'RETAIL',
          organizationName: 'Expert Trader',
          isVerified: true,
          walletBalance: 1250,
          reputationScore: 85,
          createdAt: new Date().toISOString()
        }
      ]);
      
      setStats({
        totalUsers: 2,
        institutionalUsers: 1,
        expertUsers: 1,
        verifiedUsers: 2
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (userId, currentStatus) => {
    try {
      // TODO: Implement toggle verification
      console.log('Toggle verification for user:', userId);
    } catch (error) {
      console.error('Error toggling verification:', error);
    }
  };

  const handleBanUser = async (userId) => {
    if (window.confirm('Are you sure you want to ban this user?')) {
      try {
        // TODO: Implement ban user
        console.log('Ban user:', userId);
      } catch (error) {
        console.error('Error banning user:', error);
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.organizationName?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-xl font-bold text-white">User Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Total Users</p>
              <Users className="text-blue-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Institutional</p>
              <Shield className="text-purple-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.institutionalUsers}</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Experts</p>
              <Users className="text-green-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.expertUsers}</p>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Verified</p>
              <CheckCircle className="text-green-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.verifiedUsers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Users</option>
            <option value="institutional">Institutional Only</option>
            <option value="expert">Experts Only</option>
            <option value="verified">Verified Only</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Balance</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-gray-400 text-sm">{user.organizationName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.userType === 'INSTITUTIONAL' 
                          ? 'bg-purple-900/20 text-purple-400 border border-purple-700'
                          : 'bg-green-900/20 text-green-400 border border-green-700'
                      }`}>
                        {user.userType === 'RETAIL' ? 'Expert' : user.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      ${user.walletBalance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {user.isVerified ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle size={16} />
                          Verified
                        </span>
                      ) : (
                        <span className="text-gray-400">Unverified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVerification(user.id, user.isVerified)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title={user.isVerified ? 'Unverify' : 'Verify'}
                        >
                          <Shield size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Ban user"
                        >
                          <Ban size={16} className="text-red-400" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="More options"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                      </div>
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

export default AdminUsers;
