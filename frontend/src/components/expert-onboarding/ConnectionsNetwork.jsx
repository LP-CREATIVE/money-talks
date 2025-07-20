import React, { useState } from 'react';
import { Users, Plus, Trash2, ChevronRight, ChevronLeft, Mail, Building, Briefcase } from 'lucide-react';

const ConnectionsNetwork = ({ data, onComplete, onBack }) => {
  const [connections, setConnections] = useState(data.connections || []);
  const [currentConnection, setCurrentConnection] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    relationship: '',
    trustLevel: 50
  });
  const [loading, setLoading] = useState(false);

  const relationshipTypes = [
    'Current Colleague',
    'Former Colleague',
    'Business Partner',
    'Client',
    'Vendor',
    'Industry Contact',
    'Personal Reference'
  ];

  const handleAddConnection = () => {
    if (currentConnection.name && currentConnection.company && currentConnection.relationship) {
      setConnections([...connections, { ...currentConnection, id: Date.now() }]);
      setCurrentConnection({
        name: '',
        email: '',
        company: '',
        title: '',
        relationship: '',
        trustLevel: 50
      });
    }
  };

  const handleRemoveConnection = (id) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  const handleContinue = () => {
    onComplete({ connections });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>Build Your Network:</strong> Adding professional connections helps validate your expertise and increases your visibility for relevant questions. Your connections may also join as experts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((connection) => (
          <div key={connection.id} className="bg-gray-700/50 rounded-lg p-4 relative">
            <button
              onClick={() => handleRemoveConnection(connection.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="space-y-2">
              <div>
                <h4 className="text-white font-medium">{connection.name}</h4>
                <p className="text-sm text-gray-400">{connection.title}</p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Building className="text-gray-500" size={14} />
                <span className="text-gray-300">{connection.company}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Users className="text-gray-500" size={14} />
                <span className="text-gray-300">{connection.relationship}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Trust Level:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${connection.trustLevel}%` }}
                  />
                </div>
                <span className="text-gray-400">{connection.trustLevel}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus size={20} />
          Add Professional Connection
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={currentConnection.name}
              onChange={(e) => setCurrentConnection({ ...currentConnection, name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              value={currentConnection.email}
              onChange={(e) => setCurrentConnection({ ...currentConnection, email: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company *
            </label>
            <input
              type="text"
              value={currentConnection.company}
              onChange={(e) => setCurrentConnection({ ...currentConnection, company: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Company name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={currentConnection.title}
              onChange={(e) => setCurrentConnection({ ...currentConnection, title: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Their position"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Relationship *
          </label>
          <select
            value={currentConnection.relationship}
            onChange={(e) => setCurrentConnection({ ...currentConnection, relationship: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="">Select relationship type</option>
            {relationshipTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trust Level: {currentConnection.trustLevel}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={currentConnection.trustLevel}
            onChange={(e) => setCurrentConnection({ ...currentConnection, trustLevel: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Acquaintance</span>
            <span>Trusted Contact</span>
            <span>Close Colleague</span>
          </div>
        </div>

        <button
          onClick={handleAddConnection}
          disabled={!currentConnection.name || !currentConnection.company || !currentConnection.relationship}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Add Connection
        </button>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <p className="text-sm text-yellow-400">
          <strong>Referral Opportunity:</strong> Your connections will receive an invitation to join as experts. You'll earn referral bonuses for each connection that joins and completes their first answer.
        </p>
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

export default ConnectionsNetwork;
