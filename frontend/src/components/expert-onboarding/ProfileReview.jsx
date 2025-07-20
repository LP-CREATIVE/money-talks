import React, { useState } from 'react';
import { 
  CheckCircle, AlertCircle, Building, Eye, Brain, Users, 
  Link, FileText, ChevronLeft, Send, Shield 
} from 'lucide-react';
import { expertOnboarding } from '../../services/api';

const ProfileReview = ({ data, onComplete, onBack }) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const calculateCompletionScore = () => {
    let score = 0;
    if (data.employment?.length > 0) score += 20;
    if (data.observablePatterns?.length > 0) score += 25;
    if (data.expertise?.length > 0) score += 20;
    if (data.companyRelationships?.length > 0) score += 20;
    if (data.connections?.length > 0) score += 15;
    return score;
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);
    try {
      await expertOnboarding.submitProfile(data);
      onComplete({ profileSubmitted: true });
    } catch (error) {
      console.error('Error submitting profile:', error);
      alert('Failed to submit profile. Please try again.');
    }
    setSubmitting(false);
  };

  const completionScore = calculateCompletionScore();
  const isComplete = completionScore === 100;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Review Your Expert Profile</h2>
        <p className="text-gray-400">Ensure all information is accurate before submitting</p>
      </div>

      {/* Completion Status */}
      <div className={`rounded-lg p-6 border ${
        isComplete ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'
      }`}>
        <div className="flex items-start gap-4">
          {isComplete ? (
            <CheckCircle className="text-green-400 mt-1" size={24} />
          ) : (
            <AlertCircle className="text-yellow-400 mt-1" size={24} />
          )}
          <div>
            <h3 className={`font-semibold mb-1 ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
              Profile {completionScore}% Complete
            </h3>
            <p className={`text-sm ${isComplete ? 'text-green-400/80' : 'text-yellow-400/80'}`}>
              {isComplete 
                ? 'Great! Your profile is complete and ready for submission.'
                : 'Consider completing all sections for better visibility and higher match rates.'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="space-y-4">
        {/* Employment History */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building className="text-blue-400" size={20} />
              Employment History
            </h3>
            {data.employment?.length > 0 ? (
              <CheckCircle className="text-green-400" size={20} />
            ) : (
              <AlertCircle className="text-orange-400" size={20} />
            )}
          </div>
          <p className="text-gray-300">
            {data.employment?.length || 0} positions added
          </p>
          {data.employment?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {data.employment.slice(0, 3).map((job, idx) => (
                <li key={idx} className="text-sm text-gray-400">
                  • {job.title} at {job.company}
                </li>
              ))}
              {data.employment.length > 3 && (
                <li className="text-sm text-gray-500">
                  • and {data.employment.length - 3} more...
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Observable Patterns */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="text-green-400" size={20} />
              Observable Patterns
            </h3>
            {data.observablePatterns?.length > 0 ? (
              <CheckCircle className="text-green-400" size={20} />
            ) : (
              <AlertCircle className="text-orange-400" size={20} />
            )}
          </div>
          <p className="text-gray-300">
            {data.observablePatterns?.length || 0} patterns across {
              [...new Set(data.observablePatterns?.map(p => p.company) || [])].length
            } companies
          </p>
        </div>

        {/* Expertise Areas */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="text-purple-400" size={20} />
              Expertise Areas
            </h3>
            {data.expertise?.length > 0 ? (
              <CheckCircle className="text-green-400" size={20} />
            ) : (
              <AlertCircle className="text-orange-400" size={20} />
            )}
          </div>
          <p className="text-gray-300">
            {data.expertise?.length || 0} areas of expertise defined
          </p>
          {data.expertise?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.expertise.slice(0, 5).map((exp, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 rounded-full text-purple-300">
                  {exp.value}
                </span>
              ))}
              {data.expertise.length > 5 && (
                <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-400">
                  +{data.expertise.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Company Relationships */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Link className="text-yellow-400" size={20} />
              Company Relationships
            </h3>
            {data.companyRelationships?.length > 0 ? (
              <CheckCircle className="text-green-400" size={20} />
            ) : (
              <AlertCircle className="text-orange-400" size={20} />
            )}
          </div>
          <p className="text-gray-300">
            {data.companyRelationships?.length || 0} business relationships
          </p>
        </div>

        {/* Professional Network */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="text-indigo-400" size={20} />
              Professional Network
            </h3>
            {data.connections?.length > 0 ? (
              <CheckCircle className="text-green-400" size={20} />
            ) : (
              <AlertCircle className="text-orange-400" size={20} />
            )}
          </div>
          <p className="text-gray-300">
            {data.connections?.length || 0} professional connections
          </p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 rounded"
          />
          <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
            I confirm that all information provided is accurate and truthful. I agree to the 
            <a href="#" className="text-blue-400 hover:underline mx-1">Terms of Service</a>
            and understand that providing false information may result in account termination.
            I acknowledge that I will only share publicly observable information and will not 
            disclose any confidential or proprietary information.
          </label>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <Shield size={20} />
          What Happens Next?
        </h3>
        <ol className="space-y-2 text-sm text-blue-300">
          <li>1. Your profile will be reviewed by our team within 24-48 hours</li>
          <li>2. You'll receive an email notification once approved</li>
          <li>3. Start receiving matched questions based on your expertise</li>
          <li>4. Earn money for each high-quality answer you provide</li>
          <li>5. Build your reputation and unlock higher-value opportunities</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!agreedToTerms || submitting}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${
            agreedToTerms && !submitting
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Profile for Review
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileReview;
