import React, { useState } from 'react';
import axios from 'axios';

const ExpertAnswerForm = ({ questionId, ideaId, onAnswerSubmitted }) => {
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate answer length
    if (answerText.length < 100) {
      setError('Answer must be at least 100 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/answers/expert',
        {
          questionId,
          ideaId,
          content: answerText,
          sources: []
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Clear form
      setAnswerText('');
      setCharCount(0);
      
      // Notify parent component
      if (onAnswerSubmitted) {
        onAnswerSubmitted(response.data);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleTextChange = (e) => {
    const text = e.target.value;
    setAnswerText(text);
    setCharCount(text.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Submit Your Answer</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="answerText" className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer
          </label>
          <textarea
            id="answerText"
            value={answerText}
            onChange={handleTextChange}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Provide a detailed answer based on your expertise..."
            required
          />
          <div className="mt-1 text-sm text-gray-500 flex justify-between">
            <span>Minimum 100 characters required</span>
            <span className={charCount < 100 ? 'text-red-500' : 'text-green-500'}>
              {charCount} / 100
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || charCount < 100}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || charCount < 100
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </form>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your answer will be reviewed by our AI system and internal team. 
          Approved answers will earn you a share of the escrow amount for this question.
        </p>
      </div>
    </div>
  );
};

export default ExpertAnswerForm;
