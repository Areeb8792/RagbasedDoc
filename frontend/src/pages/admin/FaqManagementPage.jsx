import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  ListCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  Search,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FaqManagementPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'General Policies',
    visibility: 'published',
  });
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFaqs();
      setFaqs(data.results || data || []);
    } catch (err) {
      toast.error('Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setForm({ question: '', answer: '', category: 'General Policies', visibility: 'published' });
    setModalOpen(true);
  };

  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      visibility: faq.visibility,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFaq) {
        await adminService.updateFaq(editingFaq.id, form);
        toast.success('FAQ updated.');
      } else {
        await adminService.createFaq(form);
        toast.success('Official FAQ published.');
      }
      setModalOpen(false);
      fetchFaqs();
    } catch (err) {
      toast.error('Failed to save FAQ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId) => {
    if (!window.confirm('Delete this official FAQ?')) return;
    try {
      await adminService.deleteFaq(faqId);
      toast.success('FAQ removed.');
      fetchFaqs();
    } catch (err) {
      toast.error('Failed to delete FAQ.');
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EA7957]/15 backdrop-blur-md text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957] animate-pulse" />
            <span>Curated Knowledge</span>
            <span>//</span>
            <span>Verified FAQs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-2">
            Institutional FAQs
          </h1>
          <p className="text-xs text-[#D4C2B8] mt-1">
            Create and maintain administrative questions and official answers.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold flex items-center gap-2 shadow-lg shadow-[#EA7957]/25 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Publish New FAQ</span>
        </button>
      </div>

      <div className="bg-[#20140E]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/12 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2A1B14]/80 backdrop-blur-md border-b border-[#E7DAD1]/10 text-[#D4C2B8] font-mono uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Question</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DAD1]/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#D4C2B8]/70 font-mono">Loading FAQs...</td>
                </tr>
              ) : filteredFaqs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#D4C2B8]/70 font-mono">
                    <ListCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#D4C2B8]" />
                    <p className="font-semibold text-[#FBF8F5]">No Curated FAQs Published</p>
                  </td>
                </tr>
              ) : (
                filteredFaqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-[#2A1B14]/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-[#FBF8F5]">{faq.question}</p>
                      <p className="text-[11px] text-[#D4C2B8]/80 line-clamp-1 mt-0.5">{faq.answer}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]">{faq.category}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#76C893]/15 text-[#76C893] border border-[#76C893]/30">
                        {faq.visibility}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(faq)}
                        className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-[#FBF8F5] hover:bg-[#352219] transition-colors cursor-pointer"
                        title="Edit FAQ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-[#EA7957] hover:bg-[#EA7957]/15 transition-colors cursor-pointer"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full border border-[#E7DAD1]/16 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                {editingFaq ? 'Edit Institutional FAQ' : 'Publish Institutional FAQ'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[#D4C2B8]/70 hover:text-[#FBF8F5] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Question *
                </label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="e.g. Can late registration fees be waived on health grounds?"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Verified Official Answer *
                </label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Official answer with references..."
                  rows={4}
                  required
                  className="w-full p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-sans text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none resize-none shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
                  >
                    <option value="Attendance" className="bg-[#1E120D]">Attendance</option>
                    <option value="Examinations" className="bg-[#1E120D]">Examinations</option>
                    <option value="Scholarships" className="bg-[#1E120D]">Scholarships</option>
                    <option value="Hostel" className="bg-[#1E120D]">Hostel</option>
                    <option value="Academics" className="bg-[#1E120D]">Academics</option>
                    <option value="General Policies" className="bg-[#1E120D]">General Policies</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                    Visibility
                  </label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
                  >
                    <option value="published" className="bg-[#1E120D]">Published</option>
                    <option value="draft" className="bg-[#1E120D]">Internal Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 text-xs font-mono uppercase text-[#D4C2B8] hover:text-[#FBF8F5] hover:bg-[#352219] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingFaq ? 'Update FAQ' : 'Publish FAQ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
