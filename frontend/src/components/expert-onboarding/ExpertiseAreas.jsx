import React, { useState } from 'react';
import { Brain, Building, Globe, Wrench, Package, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { expertOnboarding } from '../../services/api';

const ExpertiseAreas = ({ data, onComplete, onBack }) => {
  const [expertise, setExpertise] = useState(data.expertise || []);
  const [currentExpertise, setCurrentExpertise] = useState({
    type: '',
    value: '',
    yearsExperience: 0,
    proficiencyLevel: 50,
    lastUsed: ''
  });
  const [loading, setLoading] = useState(false);

  const expertiseTypes = [
    { value: 'industry', label: 'Industry', icon: Building, placeholder: 'e.g., Healthcare, Finance, Retail' },
    { value: 'function', label: 'Function', icon: Wrench, placeholder: 'e.g., Supply Chain, Marketing, Operations' },
    { value: 'system', label: 'System/Tool', icon: Package, placeholder: 'e.g., SAP, Salesforce, Oracle' },
    { value: 'geography', label: 'Geography', icon: Globe, placeholder: 'e.g., North America, APAC, Europe' },
    { value: 'company', label: 'Company', icon: Building, placeholder: 'e.g., Specific companies you know well' }
  ];

  const commonExpertise = {
    industry: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Energy', 'Telecommunications', 'Transportation'],
    function: ['Supply Chain', 'Operations', 'Marketing', 'Sales', 'Finance', 'HR', 'IT', 'R&D', 'Legal', 'Customer Service'],
    system: ['SAP', 'Oracle', 'Salesforce', 'Microsoft Dynamics', 'Workday', 'ServiceNow', 'Adobe', 'AWS', 'Azure', 'Google Cloud'],
    geography: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'Global'],
    company: []
  };

  const proficiencyLabels = {
    0: 'Beginner',
    25: 'Basic',
    50: 'Intermediate',
    75: 'Advanced',
    100: 'Expert'
  };

  const handleAddExpertise = () => {
    if (currentExpertise.type && currentExpertise.value) {
      setExpertise([...expertise, { ...currentExpertise, id: Date.now() }]);
      setCurrentExpertise({
        type: '',
        value: '',
        yearsExperience: 0,
        proficiencyLevel: 50,
        lastUsed: ''
      });
    }
  };

  const handleRemoveExpertise = (id) => {
    setExpertise(expertise.filter(exp => exp.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log("Sending expertise data:", expertise);      await expertOnboarding.updateExpertise(expertise);
      onComplete({ expertise });
    } catch (error) {
      console.error('Error saving expertise:', error);
      alert('Failed to save expertise areas');
    }
    setLoading(false);
  };

  const getIcon = (type) => {
    const IconComponent = expertiseTypes.find(t => t.value === type)?.icon || Brain;
    return <IconComponent size={20} />;
  };

  const getProficiencyColor = (level) => {
    if (level >= 75) return 'text-green-400 border-green-400';
    if (level >= 50) return 'text-yellow-400 border-yellow-400';
    if (level >= 25) return 'text-orange-400 border-orange-400';
    return 'text-red-400 border-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>Tip:</strong> Be specific about your expertise. Instead of "Technology", specify "Cloud Infrastructure" or "Mobile App Development". This helps us match you with the most relevant questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {expertise.map((exp) => (
          <div key={exp.id} className="bg-gray-700/50 rounded-lg p-4 relative">
            <button
              onClick={() => handleRemoveExpertise(exp.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="text-gray-400 mt-1">
                {getIcon(exp.type)}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">{exp.value}</h4>
                <p className="text-sm text-gray-400 capitalize">{exp.type}</p>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Experience:</span>
                    <span className="text-white">{exp.yearsExperience} years</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Proficiency:</span>
                    <span className={`px-2 py-1 rounded border ${getProficiencyColor(exp.proficiencyLevel)}`}>
                      {proficiencyLabels[Math.round(exp.proficiencyLevel / 25) * 25]}
                    </span>
                  </div>
                  
                  {exp.lastUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Last used:</span>
                      <span className="text-white">
                        {new Date(exp.lastUsed).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus size={20} />
          Add Expertise Area
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Expertise Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {expertiseTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setCurrentExpertise({ ...currentExpertise, type: type.value, value: '' })}
                className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                  currentExpertise.type === type.value
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-gray-600 hover:border-gray-500 text-gray-400'
                }`}
              >
                <type.icon size={24} />
                <span className="text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {currentExpertise.type && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {expertiseTypes.find(t => t.value === currentExpertise.type)?.label} *
              </label>
              <input
                type="text"
                value={currentExpertise.value}
                onChange={(e) => setCurrentExpertise({ ...currentExpertise, value: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder={expertiseTypes.find(t => t.value === currentExpertise.type)?.placeholder}
                list={`${currentExpertise.type}-suggestions`}
              />
              <datalist id={`${currentExpertise.type}-suggestions`}>
                {commonExpertise[currentExpertise.type]?.map(item => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={currentExpertise.yearsExperience}
                  onChange={(e) => setCurrentExpertise({ 
                    ...currentExpertise, 
                    yearsExperience: parseInt(e.target.value) || 0 
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Used (optional)
                </label>
                <input
                  type="date"
                  value={currentExpertise.lastUsed}
                  onChange={(e) => setCurrentExpertise({ ...currentExpertise, lastUsed: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proficiency Level: {proficiencyLabels[Math.round(currentExpertise.proficiencyLevel / 25) * 25]}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="25"
                value={currentExpertise.proficiencyLevel}
                onChange={(e) => setCurrentExpertise({ 
                  ...currentExpertise, 
                  proficiencyLevel: parseInt(e.target.value) 
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Beginner</span>
                <span>Basic</span>
                <span>Intermediate</span>
                <span>Advanced</span>
                <span>Expert</span>
              </div>
            </div>

            <button
              onClick={handleAddExpertise}
              disabled={!currentExpertise.type || !currentExpertise.value}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Add Expertise
            </button>
          </>
        )}
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
          onClick={handleSave}
          disabled={expertise.length === 0 || loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
        >
          {loading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ExpertiseAreas;
