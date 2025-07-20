import React, { useState } from 'react';
import { Building, Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

const CompanyRelationships = ({ data, onComplete, onBack }) => {
  const [relationships, setRelationships] = useState(data.companyRelationships || []);
  const [currentRelationship, setCurrentRelationship] = useState({
    company: '',
    relationshipType: '',
    description: '',
    startDate: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  const relationshipTypes = [
    { value: 'direct_vendor', label: 'Direct Vendor/Supplier' },
    { value: 'logistics_provider', label: 'Logistics Provider' },
    { value: 'service_provider', label: 'Service Provider' },
    { value: 'client', label: 'Client/Customer' },
    { value: 'partner', label: 'Business Partner' },
    { value: 'competitor', label: 'Competitor' },
    { value: 'industry_peer', label: 'Industry Peer' },
    { value: 'other', label: 'Other' }
  ];

  const handleAddRelationship = () => {
    if (currentRelationship.company && currentRelationship.relationshipType) {
      setRelationships([...relationships, { ...currentRelationship, id: Date.now() }]);
      setCurrentRelationship({
        company: '',
        relationshipType: '',
        description: '',
        startDate: '',
        isActive: true
      });
    }
  };

  const handleRemoveRelationship = (id) => {
    setRelationships(relationships.filter(r => r.id !== id));
  };

  const handleContinue = () => {
    onComplete({ companyRelationships: relationships });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>Why this matters:</strong> Company relationships help us understand your network and match you with relevant questions about companies you have visibility into.
        </p>
      </div>

      <div className="space-y-4">
        {relationships.map((relationship) => (
          <div key={relationship.id} className="bg-gray-700/50 rounded-lg p-4 relative">
            <button
              onClick={() => handleRemoveRelationship(relationship.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex items-start gap-4">
              <Building className="text-gray-400 mt-1" size={20} />
              <div className="flex-1">
                <h4 className="text-white font-medium">{relationship.company}</h4>
                <p className="text-sm text-gray-400">
                  {relationshipTypes.find(t => t.value === relationship.relationshipType)?.label}
                </p>
                {relationship.description && (
                  <p className="text-gray-300 mt-1 text-sm">{relationship.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Since {new Date(relationship.startDate).toLocaleDateString()}
                  {relationship.isActive && ' - Present'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus size={20} />
          Add Company Relationship
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={currentRelationship.company}
              onChange={(e) => setCurrentRelationship({ ...currentRelationship, company: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="e.g., Acme Corp"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relationship Type *
            </label>
            <select
              value={currentRelationship.relationshipType}
              onChange={(e) => setCurrentRelationship({ ...currentRelationship, relationshipType: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Select relationship</option>
              {relationshipTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={currentRelationship.description}
            onChange={(e) => setCurrentRelationship({ ...currentRelationship, description: e.target.value })}
            rows={2}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            placeholder="Briefly describe the nature of this relationship"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={currentRelationship.startDate}
              onChange={(e) => setCurrentRelationship({ ...currentRelationship, startDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentRelationship.isActive}
                onChange={(e) => setCurrentRelationship({ ...currentRelationship, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-gray-300">Currently active</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleAddRelationship}
          disabled={!currentRelationship.company || !currentRelationship.relationshipType || !currentRelationship.startDate}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Add Relationship
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

export default CompanyRelationships;
