import React, { useState } from 'react';
import { chatService } from '../../services/chatService';
import { ThumbsUp, ThumbsDown, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const FeedbackModal = ({ isOpen, onClose, messageId, initialRating = 'helpful' }) => {
  const [rating, setRating] = useState(initialRating);
  const [issueType, setIssueType] = useState('none');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await chatService.submitFeedback(messageId, rating, issueType, comment);
      toast.success('Thank you for helping maintain institutional ground-truth!');
      onClose();
    } catch (err) {
      toast.error('Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full border border-[#E7DAD1]/16 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E7DAD1]/10 flex items-center justify-between bg-[#251610]/80">
          <div>
            <h3 className="font-bold text-[#FBF8F5] text-base font-heading">
              Answer Feedback
            </h3>
            <p className="text-[10px] font-mono text-[#EA7957]">
              QUALITY ASSURANCE
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#D4C2B8]/70 hover:text-[#FBF8F5] hover:bg-[#352219] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A89284] block mb-2">
              Feedback Rating
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { setRating('helpful'); setIssueType('none'); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                  rating === 'helpful'
                    ? 'border-[#76C893] bg-[#76C893]/20 text-[#76C893] shadow-xs'
                    : 'border-[#E7DAD1]/10 bg-[#251710]/70 text-[#D4C2B8] hover:border-[#76C893]/40'
                }`}
              >
                <ThumbsUp className="w-4 h-4 text-[#76C893]" />
                <span>Helpful</span>
              </button>

              <button
                type="button"
                onClick={() => { setRating('not_helpful'); if (issueType === 'none') setIssueType('inaccurate'); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                  rating === 'not_helpful'
                    ? 'border-[#EA7957] bg-[#EA7957]/20 text-[#EA7957] shadow-xs'
                    : 'border-[#E7DAD1]/10 bg-[#251710]/70 text-[#D4C2B8] hover:border-[#EA7957]/40'
                }`}
              >
                <ThumbsDown className="w-4 h-4 text-[#EA7957]" />
                <span>Issue Found</span>
              </button>
            </div>
          </div>

          {rating === 'not_helpful' && (
            <div>
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A89284] block mb-1">
                Discrepancy Classification
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
              >
                <option value="inaccurate" className="bg-[#1E120D]">Outdated or Inaccurate Regulation</option>
                <option value="irrelevant" className="bg-[#1E120D]">Irrelevant Document Excerpt</option>
                <option value="incomplete" className="bg-[#1E120D]">Incomplete Rule Details</option>
                <option value="other" className="bg-[#1E120D]">Other Feedback</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A89284] block mb-1">
              Observation Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide specific clause or correction details..."
              rows={3}
              className="w-full p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-sans focus:border-[#EA7957]/70 focus:outline-none resize-none shadow-inner"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 text-[#FBF8F5] text-xs font-mono uppercase hover:bg-[#352219] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold transition-all shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
