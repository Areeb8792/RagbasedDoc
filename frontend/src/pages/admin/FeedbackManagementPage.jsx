import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  MessageSquareWarning,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FeedbackManagementPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState('resolved');
  const [saving, setSaving] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFeedbackList();
      setFeedbacks(data.results || data || []);
    } catch (err) {
      toast.error('Failed to load feedback entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleOpenReview = (fb) => {
    setSelectedFeedback(fb);
    setAdminNotes(fb.admin_notes || '');
    setUpdateStatus(fb.status || 'under_review');
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedFeedback) return;
    setSaving(true);
    try {
      await adminService.updateFeedback(selectedFeedback.id, {
        status: updateStatus,
        admin_notes: adminNotes,
      });
      toast.success('Feedback status updated.');
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (err) {
      toast.error('Failed to update feedback.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EA7957]/15 backdrop-blur-md text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957] animate-pulse" />
            <span>Quality Audit</span>
            <span>//</span>
            <span>Student Feedback</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-2">
            Answer Feedback &amp; Flags
          </h1>
          <p className="text-xs text-[#D4C2B8] mt-1">
            Review student ratings, report investigations, and policy discrepancy alerts.
          </p>
        </div>
      </div>

      <div className="bg-[#20140E]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/12 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2A1B14]/80 backdrop-blur-md border-b border-[#E7DAD1]/10 text-[#D4C2B8] font-mono uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Rating / Flag</th>
                <th className="py-3.5 px-4">Issue Type</th>
                <th className="py-3.5 px-4">Student Comment</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DAD1]/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#D4C2B8]/70 font-mono">Loading feedback ledger...</td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#D4C2B8]/70 font-mono">
                    <CheckCircle2 className="w-8 h-8 text-[#76C893] mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-[#FBF8F5]">No Discrepancies Reported</p>
                    <p className="text-xs text-[#D4C2B8]/60 mt-0.5">Student verification feedback has zero unresolved issues.</p>
                  </td>
                </tr>
              ) : (
                feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-[#2A1B14]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      {fb.rating === 'helpful' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#76C893]/15 text-[#76C893] border border-[#76C893]/30">
                          <ThumbsUp className="w-3 h-3" /> HELPFUL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EA7957]/15 text-[#EA7957] border border-[#EA7957]/30">
                          <ThumbsDown className="w-3 h-3" /> DISCREPANCY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#D4C2B8]">{fb.issue_type || 'None'}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#FBF8F5]">
                      {fb.comment || 'No comment provided'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#D4C2B8]/70">{fb.user_username || 'Student'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#2E1E17]/80 border border-[#E7DAD1]/14 text-[#D4C2B8]">
                        {fb.status || 'Resolved'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]/70 font-mono">
                      {new Date(fb.created_at).toLocaleDateString().toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(fb)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#2E1E17]/80 border border-[#E7DAD1]/14 hover:border-[#EA7957]/50 text-[#D4C2B8] hover:text-[#FBF8F5] transition-colors cursor-pointer"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full border border-[#E7DAD1]/16 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                Audit Feedback Item
              </h3>
              <button onClick={() => setSelectedFeedback(null)} className="text-[#D4C2B8]/70 hover:text-[#FBF8F5] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-[#A89284] block mb-1">STUDENT COMMENT</span>
                <p className="p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs font-sans text-[#FBF8F5] shadow-inner">
                  {selectedFeedback.comment || 'No specific comment provided.'}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Investigation Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-mono text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
                >
                  <option value="under_review" className="bg-[#1E120D]">Under Investigation</option>
                  <option value="resolved" className="bg-[#1E120D]">Resolved / Grounded Validated</option>
                  <option value="dismissed" className="bg-[#1E120D]">Dismissed (Student Error)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Audit Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record internal resolution details or document update status..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-sans text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none resize-none shadow-inner"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 text-xs font-mono uppercase text-[#D4C2B8] hover:text-[#FBF8F5] hover:bg-[#352219] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
