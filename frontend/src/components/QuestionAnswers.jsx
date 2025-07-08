import React, { useState, useEffect } from 'react';
import { answers } from '../services/api';
import AnswerCard from './AnswerCard';
import { Loader2, X } from 'lucide-react';

const QuestionAnswers = ({ question, currentUserId, onClose }) => {
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnswers();
  }, [question.id]);

  const fetchAnswers = async () => {
    try {
      const response = await answers.getByQuestion(question.id);
      setQuestionAnswers(response.data.answers);
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto my-8">
          <div className="bg-gray-900 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Question Answers</h2>
                  <p className="text-gray-300">{question.text}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-400">
                    <span>Bid: ${question.bidAmount}</span>
                    <span>Min Score: {question.minAnswerScore}</span>
                    <span>{questionAnswers.length} answers</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="text-gray-400" size={20} />
                </button>
              </div>
            </div>

            {/* Answers */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
              ) : questionAnswers.length === 0 ? (
                <p className="text-center text-gray-400 py-12">
                  No answers yet. Be the first to answer!
                </p>
              ) : (
                <div className="space-y-4">
                  {questionAnswers.map((answer) => (
                    <AnswerCard
                      key={answer.id}
                      answer={answer}
                      currentUserId={currentUserId}
                      onUpdate={fetchAnswers}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAnswers;
