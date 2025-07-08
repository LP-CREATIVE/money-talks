import React from 'react';
import { Shield, Award, Star, DollarSign } from 'lucide-react';

const ExpertProfileCard = ({ profile }) => {
  const getLevelBadge = (level) => {
    const badges = {
      0: { name: 'Unverified', color: 'text-gray-400', bg: 'bg-gray-900/50' },
      1: { name: 'Basic', color: 'text-blue-400', bg: 'bg-blue-900/50' },
      2: { name: 'Professional', color: 'text-purple-400', bg: 'bg-purple-900/50' },
      3: { name: 'Expert', color: 'text-orange-400', bg: 'bg-orange-900/50' },
      4: { name: 'Master', color: 'text-yellow-400', bg: 'bg-yellow-900/50' }
    };
    return badges[level] || badges[0];
  };

  const badge = getLevelBadge(profile.verificationLevel);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Expert Profile</h3>
        <Shield className={badge.color} size={24} />
      </div>

      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
          {profile.fullName?.charAt(0) || 'E'}
        </div>
        <h4 className="text-white font-medium">{profile.fullName || 'Expert'}</h4>
        <p className="text-sm text-gray-400">{profile.currentRole || 'Investment Professional'}</p>
      </div>

      <div className={`${badge.bg} rounded-lg p-3 mb-4`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${badge.color}`}>
            {badge.name} Expert
          </span>
          <div className="flex items-center gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < profile.verificationLevel ? badge.color.replace('text-', 'bg-') : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Verification Score</span>
          <span className="text-sm font-semibold text-white">
            {profile.verificationScore || 0}/100
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Commission Rate</span>
          <span className="text-sm font-semibold text-green-400">
            {profile.verificationLevel === 4 ? '85%' :
             profile.verificationLevel === 3 ? '80%' :
             profile.verificationLevel === 2 ? '70%' :
             profile.verificationLevel === 1 ? '60%' : '0%'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Max Question Value</span>
          <span className="text-sm font-semibold text-white">
            ${profile.verificationLevel === 4 ? 'Unlimited' :
              profile.verificationLevel === 3 ? '10,000' :
              profile.verificationLevel === 2 ? '1,000' :
              profile.verificationLevel === 1 ? '100' : '0'}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Primary Expertise</span>
          <span className="text-white">{profile.primaryIndustry || 'Not Set'}</span>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfileCard;
