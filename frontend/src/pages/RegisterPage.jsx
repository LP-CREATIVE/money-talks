import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/api';
import { DollarSign, Loader2, Building, User, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Parse query parameters
  const searchParams = new URLSearchParams(location.search);
  const prefilledEmail = searchParams.get('email') || '';
  const questionId = searchParams.get('questionId');
  const fromPreview = searchParams.get('fromPreview') === 'true';
  const isExpertSignup = searchParams.get('type') === 'expert';
  
  const [formData, setFormData] = useState({
    email: prefilledEmail,
    password: '',
    confirmPassword: '',
    userType: isExpertSignup ? 'RETAIL' : '', // RETAIL = Expert user
    organizationName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.userType) {
      setError('Please select an account type');
      return;
    }

    setLoading(true);
    try {
      const response = await auth.register({
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        organizationName: formData.userType === 'INSTITUTIONAL' ? formData.organizationName : undefined
      });

      if (response.data.token) {
        login(response.data.token, response.data.user);
        
        // Store the question ID they're interested in answering
        if (questionId) {
          localStorage.setItem('pendingQuestionId', questionId);
        }
        
        // Route based on user type
        if (formData.userType === 'INSTITUTIONAL') {
          navigate('/institutional');
        } else {
          // Expert users go to expert dashboard
          navigate('/expert/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-lg">
              <DollarSign size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">
            {isExpertSignup ? 'Sign Up as Expert' : 'Create Your Account'}
          </h2>
          <p className="mt-2 text-gray-400">
            {isExpertSignup 
              ? 'Join Money Talks to share your expertise and earn'
              : 'Join the marketplace for institutional insights'
            }
          </p>
        </div>

        {fromPreview && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              You're signing up to answer a high-value research question
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Account Type Selection - Hidden for expert signup */}
          {!isExpertSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'INSTITUTIONAL' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.userType === 'INSTITUTIONAL'
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Building className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-white font-medium">Institutional</div>
                  <div className="text-xs text-gray-400">Post questions & ideas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'RETAIL' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.userType === 'RETAIL'
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <User className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-medium">Expert</div>
                  <div className="text-xs text-gray-400">Answer questions & earn</div>
                </button>
              </div>
            </div>
          )}

          {/* Organization Name (for institutional only) */}
          {formData.userType === 'INSTITUTIONAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                placeholder="e.g., Goldman Sachs"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (isExpertSignup ? false : !formData.userType)}
            className="w-full flex justify-center items-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="text-center">
            <span className="text-gray-400">Already have an account? </span>
            <Link to="/login" className="text-green-400 hover:text-green-300">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
