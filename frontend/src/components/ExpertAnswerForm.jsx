import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { answers } from '../services/api';
import { 
  Send, AlertCircle, Loader2, FileText, 
  Link, CheckCircle
} from 'lucide-react';

const ExpertAnswerForm = ({ question, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    sources: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleContentChange = (e) => {
    setFormData({ ...formData, content: e.target.value });
  };

  const handleSourceChange = (index, value) => {
    const newSources = [...formData.sources];
    newSources[index] = value;
    setFormData({ ...formData, sources: newSources });
  };

  const addSource = () => {
    setFormData({ ...formData, sources: [...formData.sources, ''] });
  };

  const removeSource = (index) => {
    const newSources = formData.sources.filter((_, i) => i !== index);
    setFormData({ ...formData, sources: newSources });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        questionId: question.id,
        content: formData.content,
        sources: formData.sources.filter(s => s.trim() !== '')
      };

      await answers.submitExpert(submitData);
      setSuccess(true);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/expert/dashboard');
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 border border-green-700 text-center">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
        <h3 className="text-xl font-bold text-white mb-2">Answer Submitted Successfully!</h3>
        <p className="text-gray-400">
          Your answer has been submitted for review. You'll be notified when payment is released.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Submit Your Expert Answer</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Answer Content */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Answer *
          </label>
          <textarea
            value={formData.content}
            onChange={handleContentChange}
            placeholder="Provide a detailed, professional answer based on your expertise..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors resize-none"
            rows={8}
            required
            minLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 100 characters • {formData.content.length} characters
          </p>
        </div>

        {/* Sources */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sources & References
          </label>
          <div className="space-y-2">
            {formData.sources.map((source, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={source}
                  onChange={(e) => handleSourceChange(index, e.target.value)}
                  placeholder="https://example.com/source"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
                />
                {formData.sources.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSource(index)}
                    className="px-3 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSource}
            className="mt-2 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            + Add another source
          </button>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Answer Guidelines</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Be specific and provide concrete examples from your experience</li>
            <li>• Cite credible sources when making claims</li>
            <li>• Avoid speculation - clearly distinguish facts from opinions</li>
            <li>• Do not share confidential or proprietary information</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || formData.content.length < 100}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Submitting...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Answer
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ExpertAnswerForm;
