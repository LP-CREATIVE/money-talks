import React, { useState } from 'react';
import { Eye, Truck, Users, Package, Building, Clock, TrendingUp, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { expertOnboarding } from '../../services/api';

const ObservablePatterns = ({ data, onComplete, onBack }) => {
  const [patterns, setPatterns] = useState(data.observablePatterns || []);
  const [currentPattern, setCurrentPattern] = useState({
    company: '',
    patternType: '',
    category: '',
    description: '',
    frequency: '',
    lastObserved: '',
    confidence: 50,
    evidenceUrls: []
  });
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const patternCategories = [
    { value: 'traffic', label: 'Traffic & Movement', icon: Truck },
    { value: 'facility', label: 'Facility Operations', icon: Building },
    { value: 'workforce', label: 'Workforce Dynamics', icon: Users },
    { value: 'supply_chain', label: 'Supply Chain', icon: Package },
    { value: 'financial', label: 'Financial Indicators', icon: TrendingUp },
    { value: 'technology', label: 'Technology & Systems', icon: Clock }
  ];

  const patternTypes = {
    traffic: [
      'Parking lot occupancy',
      'Delivery truck frequency',
      'Employee arrival patterns',
      'Visitor traffic',
      'Weekend activity',
      'Security presence'
    ],
    facility: [
      'Equipment installations',
      'Construction activity',
      'Warehouse utilization',
      'Loading dock activity',
      'Waste volume',
      'Energy usage'
    ],
    workforce: [
      'Hiring signs',
      'Contractor presence',
      'Training activities',
      'Badge/uniform changes',
      'Vehicle types',
      'Food service patterns'
    ],
    supply_chain: [
      'Shipping destinations',
      'Carrier changes',
      'Package volumes',
      'Material deliveries',
      'Product timing',
      'International shipping'
    ],
    financial: [
      'Vendor payment patterns',
      'Collection activity',
      'Equipment returns',
      'Maintenance patterns',
      'Supply deliveries',
      'Event frequency'
    ],
    technology: [
      'IT infrastructure',
      'Software rollouts',
      'System downtime',
      'Security changes',
      'Device deployments',
      'Cloud activity'
    ]
  };

  const frequencyOptions = [
    'Multiple times daily',
    'Daily',
    'Several times per week',
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'Quarterly',
    'Occasionally'
  ];

  const handleAddPattern = async () => {
    if (currentPattern.company && currentPattern.description && currentPattern.description.length >= 50) {
      setLoading(true);
      try {
        await expertOnboarding.addObservablePattern(currentPattern);
        setPatterns([...patterns, { ...currentPattern, id: Date.now() }]);
        setCurrentPattern({
          company: '',
          patternType: '',
          category: '',
          description: '',
          frequency: '',
          lastObserved: '',
          confidence: 50,
          evidenceUrls: []
        });
      } catch (error) {
        console.error('Error adding pattern:', error);
        alert('Failed to add pattern');
      }
      setLoading(false);
    }
  };

  const handleRemovePattern = (id) => {
    setPatterns(patterns.filter(p => p.id !== id));
  };

  const handleAddEvidence = () => {
    if (newEvidenceUrl.trim()) {
      setCurrentPattern({
        ...currentPattern,
        evidenceUrls: [...currentPattern.evidenceUrls, newEvidenceUrl]
      });
      setNewEvidenceUrl('');
    }
  };

  const handleContinue = () => {
    onComplete({ observablePatterns: patterns });
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <p className="text-sm text-yellow-400">
          <strong>Legal Notice:</strong> Only share publicly observable information. Never disclose confidential company data, trade secrets, or information obtained under NDA.
        </p>
      </div>

      <div className="space-y-4">
        {patterns.map((pattern) => (
          <div key={pattern.id} className="bg-gray-700/50 rounded-lg p-4 relative">
            <button
              onClick={() => handleRemovePattern(pattern.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex items-start gap-4">
              <Eye className="text-gray-400 mt-1" size={20} />
              <div className="flex-1">
                <h4 className="text-white font-medium">{pattern.company}</h4>
                <p className="text-sm text-gray-400">
                  {patternCategories.find(c => c.value === pattern.category)?.label} - {pattern.patternType}
                </p>
                <p className="text-gray-300 mt-2">{pattern.description}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span>Frequency: {pattern.frequency}</span>
                  <span>Confidence: {pattern.confidence}%</span>
                  <span>Last observed: {new Date(pattern.lastObserved).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus size={20} />
          Add Observable Pattern
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company *
            </label>
            <input
              type="text"
              value={currentPattern.company}
              onChange={(e) => setCurrentPattern({ ...currentPattern, company: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Company name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={currentPattern.category}
              onChange={(e) => setCurrentPattern({ 
                ...currentPattern, 
                category: e.target.value,
                patternType: '' 
              })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Select category</option>
              {patternCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {currentPattern.category && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pattern Type *
            </label>
            <select
              value={currentPattern.patternType}
              onChange={(e) => setCurrentPattern({ ...currentPattern, patternType: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Select pattern type</option>
              {patternTypes[currentPattern.category]?.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description * (min 50 characters)
          </label>
          <textarea
            value={currentPattern.description}
            onChange={(e) => setCurrentPattern({ ...currentPattern, description: e.target.value })}
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            placeholder="Describe what you observe in detail. Be specific but avoid confidential information."
          />
          <p className="text-xs text-gray-500 mt-1">
            {currentPattern.description.length}/50 characters
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observation Frequency *
            </label>
            <select
              value={currentPattern.frequency}
              onChange={(e) => setCurrentPattern({ ...currentPattern, frequency: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Select frequency</option>
              {frequencyOptions.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Observed *
            </label>
            <input
              type="date"
              value={currentPattern.lastObserved}
              onChange={(e) => setCurrentPattern({ ...currentPattern, lastObserved: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confidence Level: {currentPattern.confidence}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={currentPattern.confidence}
            onChange={(e) => setCurrentPattern({ ...currentPattern, confidence: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low confidence</span>
            <span>High confidence</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Evidence URLs (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={newEvidenceUrl}
              onChange={(e) => setNewEvidenceUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEvidence()}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Link to public information"
            />
            <button
              onClick={handleAddEvidence}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add
            </button>
          </div>
          {currentPattern.evidenceUrls.length > 0 && (
            <ul className="mt-2 space-y-1">
              {currentPattern.evidenceUrls.map((url, idx) => (
                <li key={idx} className="text-sm text-blue-400 truncate">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={handleAddPattern}
          disabled={
            !currentPattern.company || 
            !currentPattern.description || 
            currentPattern.description.length < 50 ||
            !currentPattern.category ||
            !currentPattern.patternType ||
            !currentPattern.frequency ||
            !currentPattern.lastObserved ||
            loading
          }
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {loading ? 'Adding...' : 'Add Pattern'}
        </button>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        
        <button
          onClick={handleContinue}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          Continue
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ObservablePatterns;
