import React, { useState } from 'react';
import { 
  TrendingUp, Brain, Users, DollarSign, Shield, Zap,
  ArrowRight, CheckCircle, BarChart3, Target, Award, Sparkles
} from 'lucide-react';

const HomePage = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
            <DollarSign size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">MONEY TALKS</h1>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            How it Works
          </button>
          <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            For Institutions
          </button>
          <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 border border-emerald-700/50 rounded-full mb-6">
          <Sparkles size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-300">AI-Powered Investment Research Platform</span>
        </div>
        
        <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
          Where AI Meets<br />
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Institutional Intelligence
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          MONEY TALKS connects institutional investors with crowdsourced research through 
          an innovative escrow system. AI generates ideas, institutions fund research, and the 
          community validates opportunities.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg">
            Start Investing
            <ArrowRight size={20} />
          </button>
          <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold border border-gray-700 transition-all">
            View Demo
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-12 border-y border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">$2.5M+</p>
            <p className="text-gray-400">Total Escrow Funded</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">100</p>
            <p className="text-gray-400">Active Ideas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">89%</p>
            <p className="text-gray-400">Validation Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">1,250+</p>
            <p className="text-gray-400">Research Contributors</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h3 className="text-3xl font-bold text-white text-center mb-12">How It Works</h3>
        
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="text-green-400" size={32} />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">AI Generates Ideas</h4>
            <p className="text-gray-400 text-sm">
              Advanced AI analyzes markets and generates high-potential investment opportunities daily
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-emerald-400" size={32} />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Institutions Fund Research</h4>
            <p className="text-gray-400 text-sm">
              Institutional investors contribute minimum $5,000 escrow to fund community research
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="text-teal-400" size={32} />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Community Validates</h4>
            <p className="text-gray-400 text-sm">
              Researchers answer questions and validate ideas, earning 50% of escrow rewards
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-12">Platform Features</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div 
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all cursor-pointer"
              onMouseEnter={() => setHoveredFeature('escrow')}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <Shield className={`mb-4 transition-colors ${hoveredFeature === 'escrow' ? 'text-green-400' : 'text-gray-400'}`} size={32} />
              <h4 className="text-lg font-semibold text-white mb-2">Smart Escrow System</h4>
              <p className="text-gray-400 text-sm mb-3">
                Automated escrow management with refund triggers if research quality falls below 80%
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  Minimum $5,000 per idea
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  50/50 platform-researcher split
                </li>
              </ul>
            </div>
            
            <div 
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-emerald-500 transition-all cursor-pointer"
              onMouseEnter={() => setHoveredFeature('bidding')}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <Zap className={`mb-4 transition-colors ${hoveredFeature === 'bidding' ? 'text-emerald-400' : 'text-gray-400'}`} size={32} />
              <h4 className="text-lg font-semibold text-white mb-2">Question Bidding</h4>
              <p className="text-gray-400 text-sm mb-3">
                Multiple institutions can bid on question slots to get their specific research needs addressed
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  Top 3 questions displayed
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  Additional questions available
                </li>
              </ul>
            </div>
            
            <div 
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-teal-500 transition-all cursor-pointer"
              onMouseEnter={() => setHoveredFeature('ranking')}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <BarChart3 className={`mb-4 transition-colors ${hoveredFeature === 'ranking' ? 'text-teal-400' : 'text-gray-400'}`} size={32} />
              <h4 className="text-lg font-semibold text-white mb-2">Dynamic Rankings</h4>
              <p className="text-gray-400 text-sm mb-3">
                Real-time Top 100 leaderboard based on escrow amounts with waitlist pooling system
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  Live position updates
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  Community pooling for waitlist
                </li>
              </ul>
            </div>
            
            <div 
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500 transition-all cursor-pointer"
              onMouseEnter={() => setHoveredFeature('rewards')}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <Award className={`mb-4 transition-colors ${hoveredFeature === 'rewards' ? 'text-yellow-400' : 'text-gray-400'}`} size={32} />
              <h4 className="text-lg font-semibold text-white mb-2">Researcher Rewards</h4>
              <p className="text-gray-400 text-sm mb-3">
                Contributors earn real money for quality research with reputation-based multipliers
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  Performance-based payouts
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <CheckCircle size={16} className="text-green-500" />
                  Reputation scoring system
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Investment Research?</h3>
        <p className="text-xl text-gray-300 mb-8">
          Join institutions already leveraging AI and community intelligence for better investment decisions
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg">
            For Institutions
          </button>
          <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold border border-gray-700 transition-all">
            For Researchers
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
              <DollarSign size={20} className="text-white" />
            </div>
            <span className="text-gray-400">© 2024 MONEY TALKS</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <button className="hover:text-white transition-colors">Terms</button>
            <button className="hover:text-white transition-colors">Privacy</button>
            <button className="hover:text-white transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;