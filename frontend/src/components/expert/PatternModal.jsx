import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { observablePatterns } from '../../services/api';

const PatternModal = ({ pattern, categories, onClose, onSave }) => {
 const [formData, setFormData] = useState({
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
 const [errors, setErrors] = useState({});

 useEffect(() => {
   if (pattern) {
     setFormData({
       ...pattern,
       lastObserved: pattern.lastObserved ? new Date(pattern.lastObserved).toISOString().split('T')[0] : ''
     });
   }
 }, [pattern]);

 const validateForm = () => {
   const newErrors = {};
   if (!formData.company) newErrors.company = 'Company is required';
   if (!formData.patternType) newErrors.patternType = 'Pattern type is required';
   if (!formData.category) newErrors.category = 'Category is required';
   if (!formData.description || formData.description.length < 50) {
     newErrors.description = 'Description must be at least 50 characters';
   }
   if (!formData.frequency) newErrors.frequency = 'Frequency is required';
   if (!formData.lastObserved) newErrors.lastObserved = 'Last observed date is required';
   
   setErrors(newErrors);
   return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   
   if (!validateForm()) return;
   
   setLoading(true);
   try {
     if (pattern) {
       await observablePatterns.updatePattern(pattern.id, formData);
     } else {
       await observablePatterns.createPattern(formData);
     }
     onSave();
   } catch (error) {
     console.error('Error saving pattern:', error);
     alert('Failed to save pattern');
   }
   setLoading(false);
 };

 const handleAddEvidence = () => {
   if (newEvidenceUrl.trim()) {
     setFormData({
       ...formData,
       evidenceUrls: [...formData.evidenceUrls, newEvidenceUrl]
     });
     setNewEvidenceUrl('');
   }
 };

 const handleRemoveEvidence = (index) => {
   setFormData({
     ...formData,
     evidenceUrls: formData.evidenceUrls.filter((_, i) => i !== index)
   });
 };

 const frequencyOptions = [
   'DAILY',
   'WEEKLY', 
   'MONTHLY',
   'QUARTERLY',
   'SPORADIC'
 ];

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
     <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
       <div className="p-6 border-b border-gray-700">
         <div className="flex justify-between items-center">
           <h2 className="text-xl font-bold text-white">
             {pattern ? 'Edit Pattern' : 'Add New Pattern'}
           </h2>
           <button
             onClick={onClose}
             className="text-gray-400 hover:text-white"
           >
             <X size={24} />
           </button>
         </div>
       </div>

       <form onSubmit={handleSubmit} className="p-6 space-y-6">
         {/* Legal Notice */}
         <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
           <div className="flex gap-3">
             <AlertCircle className="text-yellow-400 flex-shrink-0" size={20} />
             <p className="text-sm text-yellow-400">
               <strong>Legal Notice:</strong> Only share publicly observable information. Never disclose confidential company data, trade secrets, or information obtained under NDA.
             </p>
           </div>
         </div>

         {/* Company & Pattern Type */}
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Company *
             </label>
             <input
               type="text"
               value={formData.company}
               onChange={(e) => setFormData({ ...formData, company: e.target.value })}
               className={`w-full bg-gray-700 border ${errors.company ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white`}
               placeholder="e.g., Tesla, Apple, etc."
             />
             {errors.company && <p className="text-red-400 text-sm mt-1">{errors.company}</p>}
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Pattern Type *
             </label>
             <select
               value={formData.patternType}
               onChange={(e) => setFormData({ 
                 ...formData, 
                 patternType: e.target.value,
                 category: '' 
               })}
               className={`w-full bg-gray-700 border ${errors.patternType ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white`}
             >
               <option value="">Select pattern type</option>
               {Object.entries(categories).map(([key, category]) => (
                 <option key={key} value={key}>{category.name}</option>
               ))}
             </select>
             {errors.patternType && <p className="text-red-400 text-sm mt-1">{errors.patternType}</p>}
           </div>
         </div>

         {/* Category */}
         {formData.patternType && (
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Category *
             </label>
             <select
               value={formData.category}
               onChange={(e) => setFormData({ ...formData, category: e.target.value })}
               className={`w-full bg-gray-700 border ${errors.category ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white`}
             >
               <option value="">Select category</option>
               {categories[formData.patternType]?.subcategories?.map(sub => (
                 <option key={sub.id} value={sub.id}>{sub.name}</option>
               ))}
             </select>
             {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
             
             {formData.category && categories[formData.patternType]?.subcategories?.find(s => s.id === formData.category) && (
               <div className="mt-2 p-3 bg-gray-700/50 rounded-lg">
                 <p className="text-sm text-gray-300">
                   {categories[formData.patternType].subcategories.find(s => s.id === formData.category).description}
                 </p>
               </div>
             )}
           </div>
         )}

         {/* Description */}
         <div>
           <label className="block text-sm font-medium text-gray-300 mb-2">
             Description * (min 50 characters)
           </label>
           <textarea
             value={formData.description}
             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
             rows={4}
             className={`w-full bg-gray-700 border ${errors.description ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white`}
             placeholder="Describe what you observe in detail. Be specific but avoid confidential information."
           />
           <div className="flex justify-between mt-1">
             <p className="text-xs text-gray-500">{formData.description.length} characters</p>
             {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
           </div>
         </div>

         {/* Frequency & Last Observed */}
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Observation Frequency *
             </label>
             <select
               value={formData.frequency}
               onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
               className={`w-full bg-gray-700 border ${errors.frequency ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white`}
             >
               <option value="">Select frequency</option>
               {frequencyOptions.map(freq => (
                 <option key={freq} value={freq}>{freq}</option>
               ))}
             </select>
             {errors.frequency && <p className="text-red-400 text-sm mt-1">{errors.frequency}</p>}
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Last Observed *
             </label>
             <input
               type="date"
               value={formData.lastObserved}
               onChange={(e) => setFormData({ ...formData, lastObserved: e.target.value })}
               max={new Date().toISOString().split('T')[0]}
               className={`w-full bg-gray-700 border ${errors.lastObserved ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white`}
             />
             {errors.lastObserved && <p className="text-red-400 text-sm mt-1">{errors.lastObserved}</p>}
           </div>
         </div>

         {/* Confidence Level */}
         <div>
           <label className="block text-sm font-medium text-gray-300 mb-2">
             Confidence Level: {formData.confidence}%
           </label>
           <input
             type="range"
             min="0"
             max="100"
             step="5"
             value={formData.confidence}
             onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) })}
             className="w-full"
           />
           <div className="flex justify-between text-xs text-gray-500 mt-1">
             <span>Low confidence</span>
             <span>Medium confidence</span>
             <span>High confidence</span>
           </div>
         </div>

         {/* Evidence URLs */}
         <div>
           <label className="block text-sm font-medium text-gray-300 mb-2">
             Evidence URLs (optional)
           </label>
           <div className="flex gap-2 mb-2">
             <input
               type="url"
               value={newEvidenceUrl}
               onChange={(e) => setNewEvidenceUrl(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEvidence())}
               className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
               placeholder="Link to public information"
             />
             <button
               type="button"
               onClick={handleAddEvidence}
               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
             >
               <Plus size={16} />
               Add
             </button>
           </div>
           
           {formData.evidenceUrls.length > 0 && (
             <div className="space-y-2">
               {formData.evidenceUrls.map((url, idx) => (
                 <div key={idx} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                   <a 
                     href={url} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="flex-1 text-sm text-blue-400 hover:underline truncate"
                   >
                     {url}
                   </a>
                   <button
                     type="button"
                     onClick={() => handleRemoveEvidence(idx)}
                     className="text-red-400 hover:text-red-300"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
             </div>
           )}
         </div>

         {/* Suggested Questions */}
         {formData.category && categories[formData.patternType]?.subcategories?.find(s => s.id === formData.category)?.questions && (
           <div className="bg-gray-700/30 rounded-lg p-4">
             <h4 className="text-sm font-medium text-gray-300 mb-2">Questions to consider:</h4>
             <ul className="space-y-1">
               {categories[formData.patternType].subcategories.find(s => s.id === formData.category).questions.map((q, idx) => (
                 <li key={idx} className="text-sm text-gray-400 flex items-start">
                   <span className="mr-2">•</span>
                   <span>{q}</span>
                 </li>
               ))}
             </ul>
           </div>
         )}

         {/* Action Buttons */}
         <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
           <button
             type="button"
             onClick={onClose}
             className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
           >
             Cancel
           </button>
           <button
             type="submit"
             disabled={loading}
             className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg"
           >
             {loading ? 'Saving...' : (pattern ? 'Update Pattern' : 'Add Pattern')}
           </button>
         </div>
       </form>
     </div>
   </div>
 );
};

export default PatternModal;
