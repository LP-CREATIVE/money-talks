import React, { useState, useEffect } from 'react';
import { Plus, Building, TrendingUp, Calendar, Search, Filter, Trash2, Edit, Eye, AlertCircle } from 'lucide-react';
import { observablePatterns } from '../../services/api';
import PatternModal from './PatternModal';

const ObservablePatternsManager = () => {
  const [patterns, setPatterns] = useState([]);
  const [categories, setCategories] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ company: '', patternType: '' });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPatterns();
    fetchStats();
  }, []);

  const fetchPatterns = async () => {
    try {
      const response = await observablePatterns.getPatterns();
      setPatterns(response.data.patterns || []);
      setCategories(response.data.categories || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patterns:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await observablePatterns.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeletePattern = async (id) => {
    if (window.confirm('Are you sure you want to delete this pattern?')) {
      try {
        await observablePatterns.deletePattern(id);
        fetchPatterns();
        fetchStats();
      } catch (error) {
        alert('Failed to delete pattern');
      }
    }
  };

  const filteredPatterns = patterns.filter(pattern => {
    if (filter.company && !pattern.company.toLowerCase().includes(filter.company.toLowerCase())) {
      return false;
    }
    if (filter.patternType && pattern.patternType !== filter.patternType) {
      return false;
    }
    return true;
  });

  const getPatternTypeColor = (type) => {
    const colors = {
      TRAFFIC: 'bg-blue-500',
      FACILITY: 'bg-green-500',
      SUPPLY_CHAIN: 'bg-purple-500',
      WORKFORCE: 'bg-yellow-500',
      FINANCIAL: 'bg-red-500',
      TECHNOLOGY: 'bg-indigo-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Observable Patterns</h2>
          <p className="text-gray-400 mt-1">Track and manage your company observations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Add Pattern
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Patterns</p>
                <p className="text-2xl font-bold text-white">{stats.totalPatterns}</p>
              </div>
              <Eye className="text-blue-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Companies Tracked</p>
                <p className="text-2xl font-bold text-white">{stats.companiesObserved}</p>
              </div>
              <Building className="text-green-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recent Updates</p>
                <p className="text-2xl font-bold text-white">{stats.recentPatterns?.length || 0}</p>
              </div>
              <Calendar className="text-purple-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Confidence</p>
                <p className="text-2xl font-bold text-white">
                  {patterns.length > 0 
                    ? Math.round(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="text-yellow-400" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by company..."
                value={filter.company}
                onChange={(e) => setFilter({ ...filter, company: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="min-w-[200px]">
            <select
              value={filter.patternType}
              onChange={(e) => setFilter({ ...filter, patternType: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Pattern Types</option>
              {Object.entries(categories).map(([key, category]) => (
                <option key={key} value={key}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setFilter({ company: '', patternType: '' })}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
          >
            <Filter size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* Patterns List */}
      <div className="space-y-4">
        {filteredPatterns.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">No patterns found. Start by adding your first observation!</p>
          </div>
        ) : (
          filteredPatterns.map((pattern) => {
            const categoryInfo = categories[pattern.patternType];
            const subcategory = categoryInfo?.subcategories?.find(sub => sub.id === pattern.category);
            
            return (
              <div key={pattern.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPatternTypeColor(pattern.patternType)}`}>
                        {categoryInfo?.name || pattern.patternType}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {subcategory?.name || pattern.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">{pattern.company}</h3>
                    <p className="text-gray-300 mb-3">{pattern.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-400">Last observed:</span>
                        <span className="text-white">{getDaysAgo(pattern.lastObserved)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Frequency:</span>
                        <span className="text-white">{pattern.frequency}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Confidence:</span>
                        <span className={`font-medium ${getConfidenceColor(pattern.confidence)}`}>
                          {pattern.confidence}%
                        </span>
                      </div>
                      
                      {pattern.evidenceUrls?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Evidence:</span>
                          <span className="text-blue-400">{pattern.evidenceUrls.length} links</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedPattern(pattern);
                        setShowAddModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePattern(pattern.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <PatternModal
          pattern={selectedPattern}
          categories={categories}
          onClose={() => {
            setShowAddModal(false);
            setSelectedPattern(null);
          }}
          onSave={() => {
            fetchPatterns();
            fetchStats();
            setShowAddModal(false);
            setSelectedPattern(null);
          }}
        />
      )}
    </div>
  );
};

export default ObservablePatternsManager;
