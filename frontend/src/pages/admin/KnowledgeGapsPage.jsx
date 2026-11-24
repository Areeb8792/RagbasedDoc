import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  X,
  Loader2,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export const KnowledgeGapsPage = () => {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGap, setSelectedGap] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('under_review');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick FAQ modal
  const [faqModalGap, setFaqModalGap] = useState(null);
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCreating, setFaqCreating] = useState(false);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await adminService.getKnowledgeGaps();
      setGaps(data.results || data || []);
    } catch (err) {
      toast.error('Failed to load knowledge gaps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  const handleOpenEdit = (gap) => {
    setSelectedGap(gap);
    setUpdateStatus(gap.status);
    setResolutionNotes(gap.resolution_notes || '');
  };

  const handleSaveGap = async (e) => {
    e.preventDefault();
    if (!selectedGap) return;
    setSaving(true);
    try {
      await adminService.updateKnowledgeGap(selectedGap.id, {
        status: updateStatus,
        resolution_notes: resolutionNotes,
      });
      toast.success('Knowledge gap updated.');
      setSelectedGap(null);
      fetchGaps();
    } catch (err) {
      toast.error('Failed to update gap.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFaqFromGap = async (e) => {
    e.preventDefault();
    if (!faqModalGap || !faqAnswer.trim()) return;
    setFaqCreating(true);
    try {
      await adminService.createFaq({
        question: faqModalGap.query_text,
        answer: faqAnswer.trim(),
        category: faqModalGap.category || 'General Policies',
        visibility: 'published',
      });
      await adminService.updateKnowledgeGap(faqModalGap.id, {
        status: 'resolved',
        resolution_notes: 'Resolved by creating an official verified FAQ.',
      });
      toast.success('Official FAQ published and knowledge gap resolved!');
      setFaqModalGap(null);
      setFaqAnswer('');
      fetchGaps();
    } catch (err) {
      toast.error('Failed to create FAQ.');
    } finally {
      setFaqCreating(false);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EA7957]/15 backdrop-blur-md text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957] animate-pulse" />
            <span>Gap Monitor</span>
            <span>//</span>
            <span>Unanswered Inquiries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-2">
            Knowledge Gap Monitor
          </h1>
          <p className="text-xs text-[#D4C2B8] mt-1">
            Automatically logged queries where official evidence was missing. Identifies policies requiring administrative upload.
          </p>
        </div>
      </div>

      {/* Gaps Table */}
      <div className="bg-[#20140E]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/12 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2A1B14]/80 backdrop-blur-md border-b border-[#E7DAD1]/10 text-[#D4C2B8] font-mono uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Unanswered Student Query</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Frequency</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Logged</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DAD1]/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#D4C2B8]/70 font-mono">Loading knowledge gaps...</td>
                </tr>
              ) : gaps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#D4C2B8]/70 font-mono">
                    <CheckCircle2 className="w-8 h-8 text-[#76C893] mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-[#FBF8F5]">No Unanswered Questions Detected</p>
                    <p className="text-xs text-[#D4C2B8]/60 mt-0.5">All student inquiries currently have grounded document coverage.</p>
                  </td>
                </tr>
              ) : (
                gaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-[#2A1B14]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#FBF8F5] max-w-sm truncate">
                      {gap.query_text}
                      {gap.resolution_notes && (
                        <span className="block text-[10px] text-[#A89284] font-mono font-normal mt-0.5 truncate">
                          NOTE: {gap.resolution_notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]">{gap.category}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EA7957]/15 text-[#EA7957] border border-[#EA7957]/30">
                        {gap.frequency}X
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {gap.status === 'new' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EA7957]/20 text-[#EA7957] border border-[#EA7957]/35">
                          NEW
                        </span>
                      )}
                      {gap.status === 'under_review' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#2E1E17]/80 text-[#D4C2B8] border border-[#E7DAD1]/14">
                          UNDER REVIEW
                        </span>
                      )}
                      {gap.status === 'resolved' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#76C893]/15 text-[#76C893] border border-[#76C893]/30">
                          RESOLVED
                        </span>
                      )}
                      {gap.status === 'dismissed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/30 text-[#A89284]">
                          DISMISSED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]/70 font-mono">
                      {new Date(gap.updated_at).toLocaleDateString().toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => { setFaqModalGap(gap); setFaqAnswer(''); }}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#76C893]/15 border border-[#76C893]/30 text-[#76C893] hover:bg-[#76C893]/25 transition-colors cursor-pointer"
                        title="Create Approved FAQ"
                      >
                        Create FAQ
                      </button>
                      <button
                        onClick={() => handleOpenEdit(gap)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#2E1E17]/80 border border-[#E7DAD1]/14 hover:border-[#EA7957]/50 text-[#D4C2B8] hover:text-[#FBF8F5] transition-colors cursor-pointer"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Knowledge Gap Modal */}
      {selectedGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full border border-[#E7DAD1]/16 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                Update Knowledge Gap Status
              </h3>
              <button onClick={() => setSelectedGap(null)} className="text-[#D4C2B8]/70 hover:text-[#FBF8F5] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGap} className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-[#A89284] block mb-1">STUDENT QUERY</span>
                <p className="p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs font-sans text-[#FBF8F5] shadow-inner">
                  "{selectedGap.query_text}"
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
                  <option value="new" className="bg-[#1E120D]">New Unanswered</option>
                  <option value="under_review" className="bg-[#1E120D]">Under Review</option>
                  <option value="resolved" className="bg-[#1E120D]">Resolved</option>
                  <option value="dismissed" className="bg-[#1E120D]">Dismissed (Out of Scope)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Resolution Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Uploaded Handbook 2024 Chapter 4 to address this policy."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-sans text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none resize-none shadow-inner"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGap(null)}
                  className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 text-xs font-mono uppercase text-[#D4C2B8] hover:text-[#FBF8F5] hover:bg-[#352219] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create FAQ Modal */}
      {faqModalGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full border border-[#E7DAD1]/16 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                Publish FAQ from Knowledge Gap
              </h3>
              <button onClick={() => setFaqModalGap(null)} className="text-[#D4C2B8]/70 hover:text-[#FBF8F5] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFaqFromGap} className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-[#A89284] block mb-1">PROPOSED QUESTION</span>
                <p className="p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs font-sans font-medium text-[#FBF8F5] shadow-inner">
                  {faqModalGap.query_text}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Verified Institutional Answer *
                </label>
                <textarea
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Draft the official answer with specific clause citations..."
                  rows={4}
                  required
                  className="w-full p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-sans text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none resize-none shadow-inner"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFaqModalGap(null)}
                  className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 text-xs font-mono uppercase text-[#D4C2B8] hover:text-[#FBF8F5] hover:bg-[#352219] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={faqCreating}
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50"
                >
                  {faqCreating ? 'Publishing...' : 'Publish FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
