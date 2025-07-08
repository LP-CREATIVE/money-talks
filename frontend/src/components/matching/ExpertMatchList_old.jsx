import { useState } from 'react';
import { useExpertMatches, useNotifyExperts } from '../../hooks/useMatching';
import { DollarSign, User, Briefcase, MapPin, Star, Clock, Send } from 'lucide-react';

export default function ExpertMatchList({ questionId }) {
  const [selectedExperts, setSelectedExperts] = useState([]);
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

  const { question, entities, internalMatches, escrowAvailable } = matchData;

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

          {entities.geography && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Geography</h4>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-sm">
                <MapPin className="h-3 w-3 inline mr-1" />
                {entities.geography}
              </span>
            </div>
          )}

          {entities.seniorityRequired && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Seniority Required</h4>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm">
                {entities.seniorityRequired}
              </span>
            </div>
          )}

          {entities.functionalExpertise && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Functional Expertise</h4>
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-md text-sm">
                {entities.functionalExpertise}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Expert Matches ({internalMatches.length})</h2>
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

        <div className="space-y-4">
          {internalMatches.map((expert) => (
            <div 
              key={expert.expertId}
              className={`border rounded-lg p-4 transition-all ${
                selectedExperts.includes(expert.expertId) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-lg">{expert.name}</h3>
                    <div className="flex items-center gap-1">
                      {[...Array(expert.verificationLevel)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{expert.currentRole} at {expert.currentEmployer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Avg response: {expert.averageResponseTime}h</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-medium text-gray-700 mb-2">Match Score Breakdown</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                      {Object.entries(expert.scoreBreakdown).map(([key, value]) => (
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
                      Response Rate: {(expert.responseRate * 100).toFixed(0)}%
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
                      checked={selectedExperts.includes(expert.expertId)}
                      onChange={() => toggleExpertSelection(expert.expertId)}
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
          ))}
        </div>
      </div>
    </div>
  );
}
