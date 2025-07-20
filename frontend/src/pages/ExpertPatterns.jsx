import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ObservablePatternsManager from '../components/expert/ObservablePatternsManager';

const ExpertPatterns = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/expert/dashboard')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="text-gray-400" size={20} />
          </button>
          <h1 className="text-xl font-semibold text-white">Observable Patterns</h1>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6">
        <ObservablePatternsManager />
      </div>
    </div>
  );
};

export default ExpertPatterns;
