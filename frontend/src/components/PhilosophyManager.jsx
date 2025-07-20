import React, { useState, useEffect } from 'react';
import { philosophy } from '../services/api';
import { 
  Brain, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Save, X, ChevronDown, ChevronUp
} from 'lucide-react';

const PhilosophyManager = () => {
  const [philosophies, setPhilosophies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [newPhilosophy, setNewPhilosophy] = useState({
    name: '',
    category: 'GENERAL',
    content: '',
    weight: 1.0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = [
    { value: 'GENERAL', label: 'General Principles' },
    { value: 'SCORING', label: 'Scoring Criteria' },
    { value: 'QUESTIONS', label: 'Question Generation' },
    { value: 'IDEAS', label: 'Idea Generation' }
  ];

  useEffect(() => {
    fetchPhilosophies();
  }, []);

  const fetchPhilosophies = async () => {
    try {
      setLoading(true);
      const response = await philosophy.getAll();
      setPhilosophies(response.data);
    } catch (error) {
      console.error('Error fetching philosophies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await philosophy.create(newPhilosophy);
      setNewPhilosophy({ name: '', category: 'GENERAL', content: '', weight: 1.0 });
      setShowAddForm(false);
      fetchPhilosophies();
    } catch (error) {
      console.error('Error creating philosophy:', error);
      alert('Failed to create philosophy');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await philosophy.update(id, data);
      setEditingId(null);
      fetchPhilosophies();
    } catch (error) {
      console.error('Error updating philosophy:', error);
      alert('Failed to update philosophy');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this philosophy?')) return;
    
    try {
      await philosophy.delete(id);
      fetchPhilosophies();
    } catch (error) {
      console.error('Error deleting philosophy:', error);
      alert('Failed to delete philosophy');
    }
  };

  const handleToggle = async (id) => {
    try {
      await philosophy.toggle(id);
      fetchPhilosophies();
    } catch (error) {
      console.error('Error toggling philosophy:', error);
      alert('Failed to toggle philosophy');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading philosophies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Brain className="w-6 h-6 mr-2" />
          AI Philosophy Manager
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Philosophy
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-lg font-semibold">New Philosophy</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Philosophy Name"
              value={newPhilosophy.name}
              onChange={(e) => setNewPhilosophy({ ...newPhilosophy, name: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={newPhilosophy.category}
              onChange={(e) => setNewPhilosophy({ ...newPhilosophy, category: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <input
            type="number"
            placeholder="Weight (0-1)"
            value={newPhilosophy.weight}
            onChange={(e) => setNewPhilosophy({ ...newPhilosophy, weight: parseFloat(e.target.value) })}
            className="px-3 py-2 border rounded-lg w-full"
            min="0"
            max="1"
            step="0.1"
          />
          <textarea
            placeholder="Philosophy Content"
            value={newPhilosophy.content}
            onChange={(e) => setNewPhilosophy({ ...newPhilosophy, content: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={6}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Philosophy List */}
      <div className="space-y-4">
        {philosophies.map((phil) => (
          <div key={phil.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold">{phil.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    phil.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {phil.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {categories.find(c => c.value === phil.category)?.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    Weight: {phil.weight}
                  </span>
                </div>
                
                {editingId === phil.id ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      defaultValue={phil.content}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={8}
                      id={`edit-${phil.id}`}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const content = document.getElementById(`edit-${phil.id}`).value;
                          handleUpdate(phil.id, { ...phil, content });
                        }}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center px-3 py-1 border rounded hover:bg-gray-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex items-center">
                      <button
                        onClick={() => setExpandedId(expandedId === phil.id ? null : phil.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {expandedId === phil.id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Hide Content
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Show Content
                          </>
                        )}
                      </button>
                      <span className="ml-4 text-xs text-gray-500">
                        Version: {phil.version} | Updated: {new Date(phil.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {expandedId === phil.id && (
                      <pre className="mt-3 p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                        {phil.content}
                      </pre>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleToggle(phil.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title={phil.active ? 'Deactivate' : 'Activate'}
                >
                  {phil.active ? 
                    <ToggleRight className="w-5 h-5 text-green-600" /> : 
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  }
                </button>
                <button
                  onClick={() => setEditingId(phil.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(phil.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {philosophies.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No philosophies yet. Create your first one!</p>
        </div>
      )}
    </div>
  );
};

export default PhilosophyManager;
