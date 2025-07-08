import { useState } from 'react';
import { useExpertMatches, useNotifyExperts } from '../../hooks/useMatching';
import { DollarSign, User, Briefcase, MapPin, Star, Clock, Send, Linkedin, ExternalLink, Mail, Shield, Brain } from 'lucide-react';

export default function ExpertMatchList({ questionId }) {
  const [selectedExperts, setSelectedExperts] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, internal, external
  const { data, isLoading, error } = useExpertMatches(questionId);
  const notifyMutation = useNotifyExperts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading expert matches: {error.message}</p>
      </div>
    );
  }

  const matchData = data?.data?.data;
  if (!matchData) return null;

  const { question, entities, internalMatches = [], externalExperts = [], linkedInProfiles = [], escrowAvailable, hunterApiUsed } = matchData;

  // Combine all experts with type flags
  const allExperts = [
    ...internalMatches.map(e => ({ ...e, type: 'internal' })),
    ...externalExperts.map(e => ({ ...e, type: 'external' }))
  ];

  // Filter based on active tab
  const filteredExperts = activeTab === 'all' ? allExperts :
    activeTab === 'internal' ? allExperts.filter(e => e.type === 'internal') :
    allExperts.filter(e => e.type === 'external');

  const toggleExpertSelection = (expertId) => {
    setSelectedExperts(prev => 
      prev.includes(expertId) 
        ? prev.filter(id => id !== expertId)
        : [...prev, expertId]
    );
  };

  const handleNotifyExperts = async () => {
    try {
      await notifyMutation.mutateAsync({
        questionId,
        expertIds: selectedExperts,
      });
      alert('Experts notified successfully!');
      setSelectedExperts([]);
    } catch (error) {
      alert('Error notifying experts: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Analysis Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Question Analysis</h2>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <p className="text-gray-800 font-medium mb-2">{question.text}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${question.bidAmount} Budget
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${escrowAvailable} Escrow Available
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Companies</h4>
            <div className="flex flex-wrap gap-2">
              {entities.companies?.map((company, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                  {company}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Industries</h4>
            <div className="flex flex-wrap gap-2">
              {entities.industries?.map((industry, i) => (
                <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                  {industry}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Topics</h4>
            <div className="flex flex-wrap gap-2">
              {entities.topics?.map((topic, i) => (
                <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expert Results Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Expert Matches ({allExperts.length})</h2>
          {selectedExperts.length > 0 && (
            <button
              onClick={handleNotifyExperts}
              disabled={notifyMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Notify {selectedExperts.length} Expert{selectedExperts.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-900">{allExperts.length}</p>
            <p className="text-sm text-gray-600">Total Experts</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{internalMatches.length}</p>
            <p className="text-sm text-gray-600">Verified Experts</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{externalExperts.length}</p>
            <p className="text-sm text-gray-600">Hunter.io Experts</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              activeTab === 'all' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({allExperts.length})
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              activeTab === 'internal' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verified ({internalMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              activeTab === 'external' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hunter.io ({externalExperts.length})
          </button>
        </div>

        {/* Expert List */}
        <div className="space-y-4">
          {filteredExperts.map((expert) => {
            const expertId = expert.expertId || expert.expertLeadId;
            const isExternal = expert.type === 'external';

            return (
              <div 
                key={expertId}
                className={`border rounded-lg p-4 transition-all ${
                  selectedExperts.includes(expertId) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-lg">{expert.name}</h3>
                      {isExternal ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Hunter.io
                          </span>
                          {expert.emailConfidence && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {expert.emailConfidence}% confidence
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {[...Array(expert.verificationLevel || 0)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{expert.currentRole || 'Not specified'} at {expert.currentEmployer || 'Unknown'}</span>
                        </div>
                        {isExternal && expert.email && (
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4" />
                            <span className="text-xs">{expert.email}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        {isExternal ? (
                          <>
                            {expert.department && (
                              <div className="text-xs">
                                <span className="text-gray-500">Dept:</span> <span className="capitalize">{expert.department}</span>
                              </div>
                            )}
                            {expert.seniority && (
                              <div className="text-xs">
                                <span className="text-gray-500">Level:</span> <span className="capitalize">{expert.seniority}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Avg response: {expert.averageResponseTime}h</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-gray-700 mb-2">Match Score Breakdown</h4>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                        {Object.entries(expert.scoreBreakdown || {}).map(([key, value]) => (
                          value > 0 && (
                            <div key={key} className="bg-gray-100 rounded px-2 py-1">
                              <span className="font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span> {value}
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {isExternal ? (
                          <span className="flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            AI Matched Expert
                          </span>
                        ) : (
                          `Response Rate: ${(expert.responseRate * 100).toFixed(0)}%`
                        )}
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        ${expert.estimatedCost}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedExperts.includes(expertId)}
                        onChange={() => toggleExpertSelection(expertId)}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Select</span>
                    </label>
                    <div className="mt-2 text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {expert.totalScore}
                      </div>
                      <div className="text-xs text-gray-500">Total Score</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredExperts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No experts found in this category
            </div>
          )}
        </div>
      </div>

      {/* LinkedIn Profiles Section */}
      {linkedInProfiles && linkedInProfiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Linkedin className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">LinkedIn Profiles Found ({linkedInProfiles.length})</h2>
          </div>
          
          <div className="space-y-4">
            {linkedInProfiles.map((profile, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg">{profile.name}</h3>
                <p className="text-gray-600">{profile.title}</p>
                <p className="text-sm text-gray-500">{profile.location}</p>
                <a 
                  href={profile.profileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Profile
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
