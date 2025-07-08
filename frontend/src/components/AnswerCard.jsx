import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, MessageSquare, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { answers } from '../services/api';

const AnswerCard = ({ answer, currentUserId, onUpdate }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInteraction, setUserInteraction] = useState(null);

  const handleInteraction = async (type) => {
    try {
      const response = await answers.interact(answer.id, { type });
      if (response.data.removed) {
        setUserInteraction(null);
      } else {
        setUserInteraction(type);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Interaction error:', error);
    }
  };

  const loadReplies = async () => {
    if (!showReplies) {
      try {
        const response = await answers.getReplies(answer.id);
        setReplies(response.data.replies);
      } catch (error) {
        console.error('Error loading replies:', error);
      }
    }
    setShowReplies(!showReplies);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    setLoading(true);
    try {
      const response = await answers.addReply(answer.id, {
        content: replyText.trim()
      });
      setReplies([response.data.reply, ...replies]);
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Reply error:', error);
    }
    setLoading(false);
  };

  if (answer.isHidden && currentUserId !== answer.userId) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-500 italic">This answer has been hidden due to community flags.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {answer.user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">{answer.user.email}</p>
              {answer.user.userType === 'INSTITUTIONAL' && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-900/50 border border-green-700/50 rounded-full">
                  <CheckCircle size={12} className="text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Institution</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {new Date(answer.createdAt).toLocaleDateString()} • 
              Score: {answer.finalScore ? answer.finalScore.toFixed(1) : 'Pending'}
            </p>
          </div>
        </div>
        {answer.isPaid && (
          <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
            Paid ${answer.payoutEarned}
          </span>
        )}
      </div>

      <div className="text-gray-300 mb-4 whitespace-pre-wrap">{answer.content}</div>

      {answer.sources && answer.sources.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Sources:</p>
          <div className="space-y-1">
            {answer.sources.map((source, idx) => (
              <a
                key={idx}
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 block truncate"
              >
                {source}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => handleInteraction('LIKE')}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
            userInteraction === 'LIKE'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          <ThumbsUp size={16} />
          <span className="text-sm">{answer.likes || 0}</span>
        </button>

        <button
          onClick={() => handleInteraction('DISLIKE')}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
            userInteraction === 'DISLIKE'
              ? 'bg-red-900/50 text-red-400'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          <ThumbsDown size={16} />
          <span className="text-sm">{answer.dislikes || 0}</span>
        </button>

        <button
          onClick={loadReplies}
          className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <MessageSquare size={16} />
          <span className="text-sm">{replies.length} replies</span>
          {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Reply
        </button>

        <button
          onClick={() => handleInteraction('FLAG')}
          className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
            userInteraction === 'FLAG'
              ? 'bg-orange-900/50 text-orange-400'
              : 'text-gray-500 hover:text-gray-400'
          }`}
        >
          <Flag size={16} />
        </button>
      </div>

      {showReplyForm && (
        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-sm"
            placeholder="Write a reply..."
            rows="3"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowReplyForm(false)}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleReply}
              disabled={loading || !replyText.trim()}
              className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </div>
      )}

      {showReplies && replies.length > 0 && (
        <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-700">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-gray-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
                  {reply.user.email[0].toUpperCase()}
                </div>
                <span className="text-sm text-white">{reply.user.email}</span>
                {reply.user.userType === 'INSTITUTIONAL' && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-900/50 border border-green-700/50 rounded-full">
                    <CheckCircle size={10} className="text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Institution</span>
                  </div>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnswerCard;
