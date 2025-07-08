import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ArrowRight, TrendingUp, Brain, Shield, Users, Sparkles, CheckCircle, BarChart3, Search } from 'lucide-react';

const HomePage = () => {
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
          <Link to="/login" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 border border-emerald-700/50 rounded-full mb-6">
          <Sparkles size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-300">AI-Powered Investment Research Platform</span>
        </div>
        
        <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
          Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">AI Insights</span> Meet{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Crowd Intelligence
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          MONEY TALKS connects institutional investors with crowdsourced research through 
          an innovative escrow system. AI generates ideas, institutions fund research, and the 
          community validates opportunities.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link to="/login" className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg">
            Start Investing
            <ArrowRight size={20} />
          </Link>
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
            <p className="text-3xl font-bold text-white mb-2">10,000+</p>
            <p className="text-gray-400">Research Reports</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">89%</p>
            <p className="text-gray-400">Validation Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">150+</p>
            <p className="text-gray-400">Institutional Clients</p>
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
          <Link to="/register" className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg">
            For Institutions
          </Link>
          <Link to="/register" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold border border-gray-700 transition-all">
            For Researchers
          </Link>
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
