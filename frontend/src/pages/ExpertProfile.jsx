import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Shield, Star, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Edit,
  Building, Eye, Brain, Users, Link
} from 'lucide-react';
import { expert } from '../services/api';
import ExpertOnboardingStepper from '../components/expert-onboarding/ExpertOnboardingStepper';

const ExpertProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileStats, setProfileStats] = useState({
    completionScore: 0,
    verificationLevel: 0,
    trustScore: 0,
    ranking: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await expert.getProfile();
      setProfile(response.data);
      calculateProfileStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const calculateProfileStats = (profileData) => {
    let completionScore = 0;
    const sections = [
      { check: profileData.fullName, weight: 10 },
      { check: profileData.currentEmployer, weight: 15 },
      { check: profileData.yearsInIndustry > 0, weight: 10 },
      { check: profileData.employmentHistory?.length > 0, weight: 20 },
      { check: profileData.observablePatterns?.length > 0, weight: 20 },
      { check: profileData.expertiseAreas?.length > 0, weight: 15 },
      { check: profileData.connections?.length > 0, weight: 10 }
    ];

    sections.forEach(section => {
      if (section.check) completionScore += section.weight;
    });

    const trustScore = Math.round(
      (profileData.accuracyScore || 0) * 0.3 +
      (profileData.responseRate || 0) * 0.3 +
      (profileData.verificationLevel || 0) * 25 +
      (completionScore * 0.15)
    );

    setProfileStats({
      completionScore,
      verificationLevel: profileData.verificationLevel || 0,
      trustScore,
      ranking: profileData.ranking || 'Not Ranked'
    });
  };

  const getVerificationBadge = (level) => {
    const badges = {
      0: { color: 'gray', label: 'Unverified' },
      1: { color: 'blue', label: 'Basic' },
      2: { color: 'green', label: 'Verified' },
      3: { color: 'purple', label: 'Expert' },
      4: { color: 'yellow', label: 'Master' }
    };
    return badges[level] || badges[0];
  };

  const getCompletionColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return <ExpertOnboardingStepper onComplete={() => {
      setShowOnboarding(false);
      fetchProfile();
    }} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/expert/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-400" size={20} />
            </button>
            <h1 className="text-xl font-semibold text-white">Expert Profile</h1>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Edit size={16} />
            {profileStats.completionScore < 100 ? 'Complete Profile' : 'Update Profile'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="text-gray-400" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {profile?.fullName || 'Complete Your Profile'}
                    </h2>
                    <p className="text-gray-400">{profile?.currentRole || 'No role specified'}</p>
                    <p className="text-gray-500">{profile?.currentEmployer || 'No employer specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield 
                    className={`text-${getVerificationBadge(profileStats.verificationLevel).color}-400`} 
                    size={24} 
                  />
                  <span className={`text-${getVerificationBadge(profileStats.verificationLevel).color}-400 font-medium`}>
                    {getVerificationBadge(profileStats.verificationLevel).label}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{profile?.yearsInIndustry || 0}</p>
                  <p className="text-sm text-gray-400">Years Experience</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{profile?.ExpertAnswer?.length || 0}</p>
                  <p className="text-sm text-gray-400">Answers Provided</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">${profile?.totalEarnings?.toFixed(0) || 0}</p>
                  <p className="text-sm text-gray-400">Total Earnings</p>
                </div>
              </div>
            </div>

            {/* Employment History */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building className="text-blue-400" size={20} />
                  Employment History
                </h3>
                {profile?.employmentHistory?.length === 0 && (
                  <span className="text-sm text-orange-400">Not completed</span>
                )}
              </div>
              {profile?.employmentHistory?.length > 0 ? (
                <div className="space-y-3">
                  {profile.employmentHistory.map((job, idx) => (
                    <div key={idx} className="border-l-2 border-gray-700 pl-4">
                      <p className="text-white font-medium">{job.title}</p>
                      <p className="text-gray-400">{job.company}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(job.startDate).getFullYear()} - 
                        {job.isCurrent ? 'Present' : new Date(job.endDate).getFullYear()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Add your employment history to increase credibility</p>
              )}
            </div>

            {/* Observable Patterns */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="text-green-400" size={20} />
                  Observable Patterns
                </h3>
                <span className="text-sm text-gray-400">
                  {profile?.observablePatterns?.length || 0} patterns
                </span>
              </div>
              {profile?.observablePatterns?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...new Set(profile.observablePatterns.map(p => p.company))].slice(0, 6).map((company, idx) => (
                    <div key={idx} className="bg-gray-700 rounded-lg p-3">
                      <p className="text-white font-medium">{company}</p>
                      <p className="text-sm text-gray-400">
                        {profile.observablePatterns.filter(p => p.company === company).length} observations
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Add observable patterns to demonstrate your market insights</p>
              )}
            </div>

            {/* Expertise Areas */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Brain className="text-purple-400" size={20} />
                  Expertise Areas
                </h3>
              </div>
              {profile?.expertiseAreas?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.expertiseAreas.map((area, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm text-purple-300"
                    >
                      {area.value}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Add your areas of expertise to match with relevant questions</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Stats */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Profile Status</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Profile Completion</span>
                    <span className={`text-sm font-medium ${getCompletionColor(profileStats.completionScore)}`}>
                      {profileStats.completionScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        profileStats.completionScore >= 80 ? 'bg-green-500' :
                        profileStats.completionScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${profileStats.completionScore}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Trust Score</span>
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400" size={16} />
                      <span className="text-white font-medium">{profileStats.trustScore}/100</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Expert Ranking</span>
                    <span className="text-white font-medium">#{profileStats.ranking}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Response Rate</span>
                    <span className="text-white font-medium">{profile?.responseRate || 0}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Accuracy Score</span>
                    <span className="text-white font-medium">{profile?.accuracyScore || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Incomplete Sections */}
            {profileStats.completionScore < 100 && (
              <div className="bg-orange-900/20 border border-orange-700 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-orange-400 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-orange-400 font-medium mb-2">Complete Your Profile</h4>
                    <p className="text-sm text-orange-400/80 mb-3">
                      A complete profile increases your chances of being matched with high-value questions.
                    </p>
                    <button
                      onClick={() => setShowOnboarding(true)}
                      className="text-sm text-orange-300 hover:text-orange-200 font-medium"
                    >
                      Complete Profile →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/expert/patterns')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Eye className="text-gray-400" size={16} />
                  <span className="text-gray-300">Manage Patterns</span>
                </button>
                <button
                  onClick={() => navigate('/expert/connections')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Users className="text-gray-400" size={16} />
                  <span className="text-gray-300">My Network</span>
                </button>
                <button
                  onClick={() => navigate('/expert/earnings')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <TrendingUp className="text-gray-400" size={16} />
                  <span className="text-gray-300">View Earnings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfile;
