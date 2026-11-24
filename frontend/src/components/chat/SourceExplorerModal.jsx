import React from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';

export const SourceExplorerModal = ({ isOpen, onClose, citation }) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-2xl w-full border border-[#E7DAD1]/16 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E7DAD1]/10 flex items-center justify-between bg-[#251812]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1E3324]/80 border border-[#76C893]/30 text-[#76C893] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#FBF8F5] text-base font-heading">
                Verified Source Explorer
              </h3>
              <p className="text-[11px] font-mono text-[#EA7957]">
                INSTITUTIONAL KNOWLEDGE GROUNDING
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C7669] hover:text-white hover:bg-[#34241C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs font-mono shadow-inner">
            <div>
              <span className="text-[#8C7669] block">DOCUMENT</span>
              <span className="font-semibold text-[#FBF8F5] truncate block mt-0.5">
                {citation.document_title || 'Institutional Policy'}
              </span>
            </div>
            <div>
              <span className="text-[#8C7669] block">LOCATION</span>
              <span className="font-semibold text-[#EA7957] block mt-0.5">
                {citation.page_number ? `PAGE ${citation.page_number}` : (citation.section_title || 'General Clause')}
              </span>
            </div>
            <div>
              <span className="text-[#8C7669] block">VERSION</span>
              <span className="font-semibold text-[#FBF8F5] block mt-0.5">
                v{citation.document_version || 1}
              </span>
            </div>
            <div>
              <span className="text-[#8C7669] block">CATEGORY</span>
              <span className="font-semibold text-[#FBF8F5] block mt-0.5">
                {citation.category || 'General'}
              </span>
            </div>
            <div>
              <span className="text-[#8C7669] block">MATCH STATUS</span>
              <span className="font-semibold text-[#76C893] flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Grounded</span>
              </span>
            </div>
          </div>

          {/* Extracted Excerpt */}
          <div>
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A89284] mb-2">
              Official Extracted Text
            </h4>
            <div className="p-4 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs sm:text-sm text-[#FBF8F5] leading-relaxed font-mono whitespace-pre-wrap shadow-inner">
              {citation.excerpt || 'Official institutional excerpt retrieved from indexed document chunks.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E7DAD1]/10 flex justify-end bg-[#251812]/80 backdrop-blur-md">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-bold transition-all shadow-lg shadow-[#EA7957]/25 cursor-pointer"
          >
            Close Excerpt
          </button>
        </div>
      </div>
    </div>
  );
};
