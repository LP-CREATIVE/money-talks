import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Building, Briefcase, ChevronRight } from 'lucide-react';
import { expertOnboarding } from '../../services/api';

const EmploymentHistory = ({ data, onComplete, onBack }) => {
  const [employment, setEmployment] = useState(data.employment || []);
  const [currentJob, setCurrentJob] = useState({
    company: '',
    title: '',
    department: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    responsibilities: [],
    achievements: []
  });
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddEmployment = () => {
    if (currentJob.company && currentJob.title && currentJob.startDate) {
      setEmployment([...employment, { ...currentJob, id: Date.now() }]);
      setCurrentJob({
        company: '',
        title: '',
        department: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        responsibilities: [],
        achievements: []
      });
    }
  };

  const handleRemoveEmployment = (id) => {
    setEmployment(employment.filter(emp => emp.id !== id));
  };

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      setCurrentJob({
        ...currentJob,
        responsibilities: [...currentJob.responsibilities, newResponsibility]
      });
      setNewResponsibility('');
    }
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setCurrentJob({
        ...currentJob,
        achievements: [...currentJob.achievements, newAchievement]
      });
      setNewAchievement('');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await expertOnboarding.updateEmployment(employment);
      onComplete({ employment });
    } catch (error) {
      console.error('Error saving employment:', error);
      alert('Failed to save employment history');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {employment.map((emp) => (
          <div key={emp.id} className="bg-gray-700/50 rounded-lg p-4 relative">
            <button
              onClick={() => handleRemoveEmployment(emp.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex items-start gap-4">
              <Building className="text-gray-400 mt-1" size={20} />
              <div className="flex-1">
                <h4 className="text-white font-medium">{emp.title}</h4>
                <p className="text-gray-300">{emp.company}</p>
                {emp.department && (
                  <p className="text-sm text-gray-400">{emp.department}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(emp.startDate).toLocaleDateString()} - 
                  {emp.isCurrent ? ' Present' : ` ${new Date(emp.endDate).toLocaleDateString()}`}
                </p>
                
                {emp.responsibilities.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-300 mb-1">Key Responsibilities:</p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                      {emp.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {emp.achievements.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-300 mb-1">Notable Achievements:</p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                      {emp.achievements.map((ach, idx) => (
                        <li key={idx}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Plus size={20} />
          Add Employment
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company *
            </label>
            <input
              type="text"
              value={currentJob.company}
              onChange={(e) => setCurrentJob({ ...currentJob, company: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Microsoft, Amazon, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={currentJob.title}
              onChange={(e) => setCurrentJob({ ...currentJob, title: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Senior Software Engineer"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Department
          </label>
          <input
            type="text"
            value={currentJob.department}
            onChange={(e) => setCurrentJob({ ...currentJob, department: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            placeholder="Engineering, Operations, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={currentJob.startDate}
              onChange={(e) => setCurrentJob({ ...currentJob, startDate: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={currentJob.endDate}
              onChange={(e) => setCurrentJob({ ...currentJob, endDate: e.target.value })}
              disabled={currentJob.isCurrent}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={currentJob.isCurrent}
              onChange={(e) => setCurrentJob({ 
                ...currentJob, 
                isCurrent: e.target.checked,
                endDate: e.target.checked ? '' : currentJob.endDate
              })}
              className="rounded border-gray-600"
            />
            I currently work here
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Key Responsibilities
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddResponsibility()}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Add a responsibility"
            />
            <button
              onClick={handleAddResponsibility}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add
            </button>
          </div>
          {currentJob.responsibilities.length > 0 && (
            <ul className="mt-2 space-y-1">
              {currentJob.responsibilities.map((resp, idx) => (
                <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                  <span>•</span> {resp}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notable Achievements
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="Add an achievement"
            />
            <button
              onClick={handleAddAchievement}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Add
            </button>
          </div>
          {currentJob.achievements.length > 0 && (
            <ul className="mt-2 space-y-1">
              {currentJob.achievements.map((ach, idx) => (
                <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                  <span>•</span> {ach}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={handleAddEmployment}
          disabled={!currentJob.company || !currentJob.title || !currentJob.startDate}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Add Employment Record
        </button>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          disabled
        >
          Back
        </button>
        
        <button
          onClick={handleSave}
          disabled={employment.length === 0 || loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
        >
          {loading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default EmploymentHistory;
