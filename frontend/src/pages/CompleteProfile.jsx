import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building, User, AlertCircle } from 'lucide-react';
import api from '../services/api';

const CompleteProfile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [userType, setUserType] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');
  const provider = searchParams.get('provider');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userType) {
      setError('Please select an account type');
      return;
    }

    if (userType === 'INSTITUTIONAL' && !organizationName) {
      setError('Organization name is required for institutional accounts');
      return;
    }

    setLoading(true);
    
    try {
      localStorage.setItem('token', token);
      
      const response = await api.put('/auth/complete-profile', {
        userType,
        organizationName: userType === 'INSTITUTIONAL' ? organizationName : null
      });

      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (updatedUser.userType === 'INSTITUTIONAL') {
        navigate('/institutional');
      } else {
        navigate('/expert/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-400">
            Welcome! Please select your account type to continue.
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('INSTITUTIONAL')}
                  className={`p-4 rounded-lg border transition-all ${
                    userType === 'INSTITUTIONAL'
                      ? 'bg-green-900/50 border-green-600 text-green-400'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Building className="mx-auto mb-2" size={32} />
                  <span className="text-sm font-medium">Institutional Investor</span>
                  <p className="text-xs mt-1 opacity-70">Post questions & get expert insights</p>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('RETAIL')}
                  className={`p-4 rounded-lg border transition-all ${
                    userType === 'RETAIL'
                      ? 'bg-green-900/50 border-green-600 text-green-400'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <User className="mx-auto mb-2" size={32} />
                  <span className="text-sm font-medium">Expert/Researcher</span>
                  <p className="text-xs mt-1 opacity-70">Answer questions & earn money</p>
                </button>
              </div>
            </div>

            {userType === 'INSTITUTIONAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Your Company LLC"
                  required={userType === 'INSTITUTIONAL'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !userType}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Completing...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
