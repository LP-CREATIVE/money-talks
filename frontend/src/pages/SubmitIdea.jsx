import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ideas } from '../services/api';
import { 
 DollarSign, ArrowLeft, FileText, TrendingUp, 
 Building, AlertCircle, Loader2, CheckCircle
} from 'lucide-react';

const SubmitIdea = () => {
 const navigate = useNavigate();
 const { user } = useAuth();
 
 const [formData, setFormData] = useState({
   title: '',
   summary: '',
   detailedPlan: '',
   sector: '',
   marketCap: '',
   targetCompanies: '',
   targetDepartments: [],
   targetSeniority: []
 });
 
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState(false);

 const sectors = [
   'Technology',
   'Healthcare',
   'Finance',
   'Energy',
   'Clean Technology',
   'Consumer Goods',
   'Real Estate',
   'Infrastructure',
   'Biotechnology',
   'Artificial Intelligence'
 ];

 const marketCaps = [
   'Micro-Cap (< $300M)',
   'Small-Cap ($300M - $2B)',
   'Mid-Cap ($2B - $10B)',
   'Large-Cap ($10B - $200B)',
   'Mega-Cap (> $200B)'
 ];

 const handleChange = (e) => {
   setFormData({
     ...formData,
     [e.target.name]: e.target.value
   });
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   setError('');
   setLoading(true);

   try {
     const submitData = {
       title: formData.title,
       summary: formData.summary,
       detailedPlan: formData.detailedPlan,
       sector: formData.sector,
       marketCap: formData.marketCap,
       expertSearchCriteria: {
         companies: formData.targetCompanies.split(',').map(c => c.trim()).filter(c => c),
         departments: formData.targetDepartments,
         seniority: formData.targetSeniority
       }
     };

     await ideas.create(submitData);
     setSuccess(true);
     
     // Redirect after 2 seconds
     setTimeout(() => {
       navigate('/institutional');
     }, 2000);
   } catch (err) {
     setError(err.response?.data?.error || 'Failed to submit idea');
     setLoading(false);
   }
 };

 if (success) {
   return (
     <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
       <div className="bg-gray-800 rounded-xl p-12 border border-green-700 text-center max-w-md">
         <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
         <h2 className="text-2xl font-bold text-white mb-2">Idea Submitted Successfully!</h2>
         <p className="text-gray-400 mb-4">
           Your idea has been added to the queue. Add escrow to promote it to the Top 100.
         </p>
         <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
       </div>
     </div>
   );
 }

 return (
   <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
     {/* Header */}
     <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
       <div className="max-w-4xl mx-auto flex items-center justify-between">
         <div className="flex items-center gap-4">
           <button
             onClick={() => navigate('/institutional')}
             className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
           >
             <ArrowLeft size={20} className="text-gray-400" />
           </button>
           <h1 className="text-xl font-bold text-white">Submit New Investment Idea</h1>
         </div>
         <div className="flex items-center gap-3">
           <Building className="text-gray-400" size={20} />
           <span className="text-gray-300">{user?.organizationName}</span>
         </div>
       </div>
     </div>

     {/* Form */}
     <div className="max-w-4xl mx-auto p-6">
       <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
         <form onSubmit={handleSubmit} className="space-y-6">
           {error && (
             <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center gap-3">
               <AlertCircle className="text-red-400" size={20} />
               <p className="text-red-400">{error}</p>
             </div>
           )}

           {/* Title */}
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Investment Title *
             </label>
             <input
               type="text"
               name="title"
               value={formData.title}
               onChange={handleChange}
               placeholder="e.g., Southeast Asian EV Battery Recycling Play"
               className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
               required
               maxLength={200}
             />
             <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
           </div>

           {/* Summary */}
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Executive Summary *
             </label>
             <textarea
               name="summary"
               value={formData.summary}
               onChange={handleChange}
               placeholder="Provide a concise overview of the investment opportunity, key value propositions, and expected returns..."
               className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
               rows={4}
               required
               minLength={50}
               maxLength={1000}
             />
             <p className="text-xs text-gray-500 mt-1">{formData.summary.length}/1000 characters (min 50)</p>
           </div>

           {/* Sector and Market Cap */}
           <div className="grid grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-2">
                 Sector
               </label>
               <select
                 name="sector"
                 value={formData.sector}
                 onChange={handleChange}
                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
               >
                 <option value="">Select a sector</option>
                 {sectors.map(sector => (
                   <option key={sector} value={sector}>{sector}</option>
                 ))}
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-300 mb-2">
                 Market Cap Range
               </label>
               <select
                 name="marketCap"
                 value={formData.marketCap}
                 onChange={handleChange}
                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
               >
                 <option value="">Select market cap</option>
                 {marketCaps.map(cap => (
                   <option key={cap} value={cap}>{cap}</option>
                 ))}
               </select>
             </div>
           </div>

           {/* Target Companies for Expert Search */}
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Target Companies (for expert search) *
             </label>
             <input
               type="text"
               name="targetCompanies"
               value={formData.targetCompanies}
               onChange={handleChange}
               placeholder="e.g., Nike, Adidas, Under Armour, Lululemon"
               className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
               required
             />
             <p className="text-xs text-gray-500 mt-1">Companies to search for experts when validating this idea (comma-separated)</p>
           </div>

           {/* Detailed Plan */}
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">
               Detailed Investment Plan
             </label>
             <textarea
               name="detailedPlan"
               value={formData.detailedPlan}
               onChange={handleChange}
               placeholder="Provide additional details about the investment strategy, risk factors, competitive advantages, exit strategies, etc."
               className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
               rows={6}
             />
           </div>

           {/* Info Box */}
           <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
             <div className="flex items-start gap-3">
               <TrendingUp className="text-blue-400 mt-1" size={20} />
               <div className="text-sm">
                 <p className="text-blue-400 font-semibold mb-1">Next Steps After Submission</p>
                 <ul className="text-gray-300 space-y-1">
                   <li>• Your idea will be added to the waitlist queue</li>
                   <li>• Contribute at least $5,000 in escrow to activate it</li>
                   <li>• Once total escrow reaches the Top 100 threshold, it will be promoted</li>
                   <li>• Other institutions can pool funds to help reach the threshold</li>
                 </ul>
               </div>
             </div>
           </div>

           {/* Submit Button */}
           <div className="flex gap-4">
             <button
               type="submit"
               disabled={loading}
               className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
             >
               {loading ? (
                 <>
                   <Loader2 className="animate-spin" size={20} />
                   Submitting...
                 </>
               ) : (
                 <>
                   <FileText size={20} />
                   Submit Investment Idea
                 </>
               )}
             </button>
             <button
               type="button"
               onClick={() => navigate('/institutional')}
               className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
             >
               Cancel
             </button>
           </div>
         </form>
       </div>

       {/* Guidelines */}
       <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
         <h3 className="text-lg font-semibold text-white mb-3">Submission Guidelines</h3>
         <ul className="space-y-2 text-sm text-gray-400">
           <li className="flex items-start gap-2">
             <span className="text-green-500">•</span>
             <span>Ensure your idea is well-researched and presents a clear investment opportunity</span>
           </li>
           <li className="flex items-start gap-2">
             <span className="text-green-500">•</span>
             <span>Include specific metrics, timelines, and expected returns where possible</span>
           </li>
           <li className="flex items-start gap-2">
             <span className="text-green-500">•</span>
             <span>Ideas with higher escrow contributions receive priority ranking</span>
           </li>
           <li className="flex items-start gap-2">
             <span className="text-green-500">•</span>
             <span>You can submit custom research questions after contributing escrow</span>
           </li>
         </ul>
       </div>
     </div>
   </div>
 );
};

export default SubmitIdea;
