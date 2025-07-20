import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, MessageSquare, ChevronDown, ChevronUp, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { answers } from '../services/api';
import { resale } from '../services/api';

const AnswerCard = ({ answer, currentUserId, onUpdate }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInteraction, setUserInteraction] = useState(null);
  const [showResaleModal, setShowResaleModal] = useState(false);
  const [resalePrice, setResalePrice] = useState("");

  const handleListForResale = async () => {
    const suggestedPrice = Math.round((answer.question?.escrowAmount || 1000) * 0.3);
    const price = prompt(`Set resale price (suggested: $${suggestedPrice}):`, suggestedPrice);
    
    if (price && !isNaN(price) && parseFloat(price) > 0) {
      try {
        await resale.listAnswer({
          answerId: answer.id,
          resalePrice: parseFloat(price)
        });
        alert("Answer listed for resale successfully!");
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Error listing for resale:", error);
        alert("Failed to list answer for resale");
      }
    }
  };

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
      console.error('Error adding reply:', error);
    }
    setLoading(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">
              {answer.user?.organizationName || answer.user?.email || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">
              Expert: {answer.user?.expertProfile?.fullName || 'Expert'}
            </span>
            {answer.finalScore >= 80 && (
              <CheckCircle className="text-green-500" size={16} />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {new Date(answer.createdAt).toLocaleDateString()} • 
            Score: {answer.finalScore ? answer.finalScore.toFixed(1) : 'Pending'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {answer.isPaid && (
            <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
              Paid ${answer.payoutEarned}
            </span>
          )}
          {answer.isPaid && answer.userId === currentUserId && !answer.isListedForResale && (
            <button
              onClick={() => handleListForResale()}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
            >
              <TrendingUp size={14} />
              List for Resale
            </button>
          )}
          {answer.isListedForResale && (
            <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs rounded-full flex items-center gap-1">
              <DollarSign size={12} />
              Listed: ${answer.resalePrice}
            </span>
          )}
        </div>
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

      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleInteraction('LIKE')}
            className={`flex items-center gap-1 text-sm ${
              userInteraction === 'LIKE' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
            }`}
          >
            <ThumbsUp size={16} />
            <span>{answer.likes || 0}</span>
          </button>
          
          <button
            onClick={() => handleInteraction('DISLIKE')}
            className={`flex items-center gap-1 text-sm ${
              userInteraction === 'DISLIKE' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <ThumbsDown size={16} />
            <span>{answer.dislikes || 0}</span>
          </button>

          <button
            onClick={() => handleInteraction('FLAG')}
            className={`flex items-center gap-1 text-sm ${
              userInteraction === 'FLAG' ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
            }`}
          >
            <Flag size={16} />
            <span>{answer.flags || 0}</span>
          </button>

          <button
            onClick={loadReplies}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            <MessageSquare size={16} />
            <span>{answer._count?.replies || 0}</span>
            {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {showReplies && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          {currentUserId && (
            <div className="mb-4">
              {showReplyForm ? (
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReply}
                      disabled={loading || !replyText.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm"
                    >
                      {loading ? 'Posting...' : 'Post Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyText('');
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  Write a reply
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            {replies.length === 0 ? (
              <p className="text-gray-400 text-sm">No replies yet</p>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {reply.user?.organizationName || reply.user?.email}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{reply.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerCard;
