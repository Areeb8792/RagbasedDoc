import React, { useState } from 'react';
import { chatService } from '../../services/chatService';
import { Sparkles, X, Check, Copy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SimplifyModal = ({ isOpen, onClose, messageId }) => {
  const [selectedStyle, setSelectedStyle] = useState('simple');
  const [simplifiedContent, setSimplifiedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const styles = [
    { key: 'simple', label: 'Simple Language', desc: 'Clear, plain, jargon-free explanation' },
    { key: 'steps', label: 'Step-by-Step', desc: 'Numbered action items in chronological order' },
    { key: 'bullets', label: 'Bullet Points', desc: 'Concise summary highlighting essential rules' },
    { key: 'key_points', label: 'Key Highlights', desc: 'Must-know criteria and important deadlines' },
    { key: 'detailed', label: 'Detailed Breakdown', desc: 'Comprehensive academic procedural depth' },
    { key: 'formal', label: 'Formal Academic', desc: 'Official administrative phrasing' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setSimplifiedContent('');
    try {
      const data = await chatService.simplifyMessage(messageId, selectedStyle);
      setSimplifiedContent(data.simplified_content);
    } catch (err) {
      toast.error('Failed to generate alternate explanation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (simplifiedContent) {
      navigator.clipboard.writeText(simplifiedContent);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-xl w-full border border-[#E7DAD1]/16 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E7DAD1]/10 flex items-center justify-between bg-[#251610]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EA7957]/15 border border-[#EA7957]/30 text-[#EA7957] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#FBF8F5] text-base font-heading">
                Simplify &amp; Restyle Answer
              </h3>
              <p className="text-[10px] font-mono text-[#EA7957]">
                PRESERVES VERIFIED GROUNDING
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#D4C2B8]/70 hover:text-[#FBF8F5] hover:bg-[#352219] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Style Selector Grid */}
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A89284] block mb-2">
              Select Output Formatting Style
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {styles.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSelectedStyle(s.key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStyle === s.key
                      ? 'border-[#EA7957] bg-[#EA7957]/20 text-[#FBF8F5] shadow-xs'
                      : 'border-[#E7DAD1]/10 hover:border-[#EA7957]/40 bg-[#251710]/70 backdrop-blur-md text-[#D4C2B8]'
                  }`}
                >
                  <span className="font-bold text-xs block mb-0.5 text-[#FBF8F5]">{s.label}</span>
                  <span className="text-[10px] text-[#A89284] block leading-tight">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold transition-all shadow-lg shadow-[#EA7957]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Restyling Answer...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Generate Restyled Explanation</span>
              </>
            )}
          </button>

          {/* Result Area */}
          {simplifiedContent && (
            <div className="space-y-2 pt-2 border-t border-[#E7DAD1]/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#EA7957] uppercase">
                  Adapted Explanation
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#D4C2B8] hover:text-white cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-[#76C893]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs leading-relaxed text-[#FBF8F5] whitespace-pre-wrap font-sans shadow-inner">
                {simplifiedContent}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E7DAD1]/10 flex justify-end bg-[#251610]/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 text-[#FBF8F5] text-xs font-mono uppercase font-semibold hover:bg-[#352219] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
