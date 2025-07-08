import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, Mail, Lock, Building, User, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'INSTITUTIONAL',
    organizationName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Only require organizationName for institutional users
    if (formData.userType === 'INSTITUTIONAL' && !formData.organizationName) {
      setError('Organization name is required for institutional accounts');
      return;
    }

    setLoading(true);

    const result = await register({
      email: formData.email,
      password: formData.password,
      userType: formData.userType,
      organizationName: formData.userType === 'INSTITUTIONAL' ? formData.organizationName : undefined
    });
    
    if (result.success) {
      // Navigate based on user type
      if (formData.userType === 'INSTITUTIONAL') {
        navigate('/institutional');
      } else {
        navigate('/researcher'); // or wherever retail users should go
      }
    } else {
      setError(result.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-lg">
              <DollarSign size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">MONEY TALKS</h1>
          </div>
          <h2 className="text-xl text-gray-300">Create your account</h2>
        </div>

        {/* Register Form */}
        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'INSTITUTIONAL' })}
                  className={`p-3 rounded-lg border transition-all ${
                    formData.userType === 'INSTITUTIONAL'
                      ? 'bg-green-900/50 border-green-600 text-green-400'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Building className="mx-auto mb-1" size={24} />
                  <span className="text-sm font-medium">Institutional</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: 'RETAIL' })}
                  className={`p-3 rounded-lg border transition-all ${
                    formData.userType === 'RETAIL'
                      ? 'bg-green-900/50 border-green-600 text-green-400'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <User className="mx-auto mb-1" size={24} />
                  <span className="text-sm font-medium">Researcher</span>
                </button>
              </div>
            </div>

            {formData.userType === 'INSTITUTIONAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="Your Company LLC"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-green-500 hover:text-green-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;