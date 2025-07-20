import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Shield, TrendingUp, Award, ArrowRight, Users, DollarSign } from 'lucide-react';
import { demo } from '../services/api';

const ExpertQuestionPreview = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPreview();
  }, [token]);

  const fetchPreview = async () => {
    try {
      const response = await demo.getPreview(token);
      setData(response.data);
    } catch (err) {
      console.error('Preview fetch error:', err);
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const handleSignUpClick = () => {
    // Navigate to register page with expert type and pre-filled data
    const params = new URLSearchParams({
      type: 'expert',
      questionId: data.question.id,
      email: data.recipientEmail,
      fromPreview: 'true'
    });
    navigate(`/register?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Invalid or Expired Link</h2>
          <p className="text-gray-400 mb-4">This preview link may have expired.</p>
        </div>
      </div>
    );
  }

  const { question, recipientEmail } = data;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <DollarSign size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">MONEY TALKS</h1>
          </div>
          <div className="text-sm text-gray-400">
            Expert Opportunity for: {recipientEmail}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Alert Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700 rounded-full mb-6">
            <Clock size={16} className="text-green-400" />
            <span className="text-sm text-green-300">High-Value Research Opportunity</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            You've Been Matched to a <span className="text-green-400">${question.escrowAmount || 15000}</span> Research Question
          </h1>
          
          <p className="text-xl text-gray-300">
            Your expertise is needed for institutional investment research
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">RESEARCH QUESTION</h3>
            <h2 className="text-2xl font-bold text-white">{question.text}</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">${question.escrowAmount || 15000}</div>
              <div className="text-sm text-gray-400">Reward</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-400">{question.priority || 'HIGH'}</div>
              <div className="text-sm text-gray-400">Priority</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-400">48h</div>
              <div className="text-sm text-gray-400">Deadline</div>
            </div>
          </div>
          
          {question.idea && (
            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-sm font-medium text-gray-400 mb-3">PROJECT CONTEXT</h4>
              <h3 className="text-lg font-semibold text-white mb-2">{question.idea.title}</h3>
              <p className="text-gray-300">{question.idea.summary}</p>
              
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="text-gray-400">
                  Posted by: <span className="text-white font-medium">
                    {question.idea.createdBy?.organizationName || 'Institutional Investor'}
                  </span>
                </span>
                {question.idea.sector && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">
                      Sector: <span className="text-white font-medium">{question.idea.sector}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Why You Were Matched */}
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Award className="text-green-400" />
            Why You Were Matched
          </h3>
          <p className="text-gray-300">
            Your professional background and expertise make you uniquely qualified to provide valuable insights on this question.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-700">
              <Users className="text-green-400" size={24} />
            </div>
            <div className="text-sm text-gray-400">Quick Sign-Up</div>
            <div className="text-white font-medium">2 minutes</div>
          </div>
          
          <div className="text-center">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-700">
              <Shield className="text-blue-400" size={24} />
            </div>
            <div className="text-sm text-gray-400">Protected</div>
            <div className="text-white font-medium">Escrow payments</div>
          </div>
          
          <div className="text-center">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-700">
              <TrendingUp className="text-purple-400" size={24} />
            </div>
            <div className="text-sm text-gray-400">Earn More</div>
            <div className="text-white font-medium">Answer resales</div>
          </div>
          
          <div className="text-center">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-700">
              <Award className="text-yellow-400" size={24} />
            </div>
            <div className="text-sm text-gray-400">Build</div>
            <div className="text-white font-medium">Your reputation</div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={handleSignUpClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
          >
            Sign Up as Expert to Answer
            <ArrowRight size={20} />
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            No payment required to sign up • Get paid upon answer approval
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpertQuestionPreview;
