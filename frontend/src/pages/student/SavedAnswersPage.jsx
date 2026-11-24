import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../../services/chatService';
import { Bookmark, Search, Trash2, ArrowRight, FileCheck2, Calendar, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const SavedAnswersPage = () => {
  const [savedAnswers, setSavedAnswers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const data = await chatService.getSavedAnswers();
        setSavedAnswers(data.results || data || []);
      } catch (err) {
        toast.error('Failed to load saved answers.');
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleRemove = async (messageId) => {
    try {
      await chatService.removeSavedAnswer(messageId);
      setSavedAnswers((prev) => prev.filter((s) => s.message?.id !== messageId));
      toast.success('Bookmark removed.');
    } catch (err) {
      toast.error('Failed to remove bookmark.');
    }
  };

  const filteredAnswers = savedAnswers.filter((item) => {
    const content = item.message?.content?.toLowerCase() || '';
    return content.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#EA7957]/15 text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957]" />
            <span>Personal Archive</span>
            <span>//</span>
            <span>Saved Policies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-1.5">
            Bookmarked Answers
          </h1>
          <p className="text-xs text-[#D4C2B8] mt-0.5">
            Access your saved verified responses, rules, and policy citations anytime.
          </p>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7669]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved answers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1A100B]/75 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957] focus:outline-none shadow-inner placeholder:text-[#6D594C]"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-[#231711]/50 backdrop-blur-md animate-pulse border border-[#E7DAD1]/10" />
          ))}
        </div>
      ) : filteredAnswers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-dashed border-[#E7DAD1]/15 space-y-3">
          <Bookmark className="w-10 h-10 text-[#8C7669] mx-auto opacity-50" />
          <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
            No Bookmarked Answers
          </h3>
          <p className="text-xs text-[#D4C2B8] max-w-sm mx-auto">
            Bookmark responses in the AI Assistant chat by clicking the bookmark icon on any answer.
          </p>
          <div className="pt-2">
            <Link
              to="/student/chat"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-bold shadow-lg shadow-[#EA7957]/25 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnswers.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 shadow-lg space-y-4 hover:border-[#EA7957]/35 transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
                <div className="flex items-center gap-2 text-xs font-mono text-[#EA7957]">
                  <FileCheck2 className="w-4 h-4 text-[#EA7957]" />
                  <span className="font-semibold">{item.question || 'Academic Policy Query'}</span>
                </div>
                <button
                  onClick={() => handleRemove(item.message?.id)}
                  className="p-1.5 rounded-lg text-[#8C7669] hover:text-red-400 hover:bg-[#3F1A1A]/70 transition-colors cursor-pointer"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="prose prose-sm prose-invert max-w-none text-xs sm:text-sm text-[#FBF8F5] leading-relaxed">
                <ReactMarkdown>{item.message?.content || item.answer}</ReactMarkdown>
              </div>

              {item.citations && item.citations.length > 0 && (
                <div className="pt-3 border-t border-[#E7DAD1]/10 flex flex-wrap gap-2">
                  {item.citations.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#1E3324]/80 backdrop-blur-xs text-[#76C893] border border-[#76C893]/30"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>{c.document_title || 'Document'} (P. {c.page_number || '1'})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
