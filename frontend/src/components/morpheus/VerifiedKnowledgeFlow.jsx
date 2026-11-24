import React from 'react';
import { Check, ShieldCheck, Sparkles, FileText } from 'lucide-react';

export const VerifiedKnowledgeFlow = () => {
  return (
    <div className="relative w-full max-w-[380px] mx-auto h-[130px] flex flex-col items-center justify-center select-none pointer-events-none mb-3">
      {/* Subtle background connecting glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-20 bg-[#F8E6DF]/60 rounded-full blur-xl" />
      </div>

      {/* SVG Connecting Thread Lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 380 130" fill="none">
        <path
          d="M 85 65 C 130 65, 150 55, 190 55 C 230 55, 250 65, 295 65"
          stroke="#E7DAD1"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        {/* Animated flow pulse particle */}
        <circle r="2.5" fill="#EA7957" className="animate-flow-particle">
          <animateMotion
            path="M 85 65 C 130 65, 150 55, 190 55 C 230 55, 250 65, 295 65"
            dur="6s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* 3 Floating Document Sheets */}
      <div className="relative z-10 w-full flex items-center justify-between px-6">
        {/* Doc 1 (Left - Regulations) */}
        <div className="w-[82px] h-[72px] bg-[#FFFDFB] rounded-lg border border-[#E7DAD1] shadow-[0_4px_16px_rgba(65,43,32,0.05)] p-2 flex flex-col justify-between transform -rotate-3 transition-transform animate-float-slow">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EA7957]/60" />
            <div className="h-1.5 w-10 bg-[#E7DAD1] rounded-full" />
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full bg-[#F3EFE9] rounded" />
            <div className="h-1 w-4/5 bg-[#F3EFE9] rounded" />
            <div className="h-1 w-3/5 bg-[#F3EFE9] rounded" />
          </div>
          <span className="text-[8px] font-mono text-[#99877D] tracking-tighter uppercase">POL-2024</span>
        </div>

        {/* Center Target: Verification Point & Central Active Document */}
        <div className="relative flex flex-col items-center">
          <div className="w-[96px] h-[82px] bg-[#FFFDFB] rounded-xl border border-[#BDD9B0] shadow-[0_8px_24px_rgba(46,90,54,0.08)] p-2.5 flex flex-col justify-between z-20 animate-verify-card">
            {/* Header with Verified Sage Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#BFE2F1]" />
                <span className="text-[9px] font-semibold text-[#241D19]">Citation</span>
              </div>
              <div className="w-4 h-4 rounded-full bg-[#EAF1E5] border border-[#BDD9B0] flex items-center justify-center animate-pulse-sage">
                <Check className="w-2.5 h-2.5 text-[#2E5A36] stroke-[3]" />
              </div>
            </div>

            {/* Document Lines */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-[#EAF1E5] rounded" />
              <div className="h-1 w-5/6 bg-[#F3EFE9] rounded" />
              <div className="h-1 w-2/3 bg-[#F3EFE9] rounded" />
            </div>

            {/* Verification Footer Stamp */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E7DAD1]/60">
              <span className="text-[8px] font-mono text-[#2E5A36] font-semibold">100% GROUNDED</span>
              <Sparkles className="w-2.5 h-2.5 text-[#EA7957] animate-sparkle-coral" />
            </div>
          </div>
        </div>

        {/* Doc 3 (Right - Bylaws) */}
        <div className="w-[82px] h-[72px] bg-[#FFFDFB] rounded-lg border border-[#E7DAD1] shadow-[0_4px_16px_rgba(65,43,32,0.05)] p-2 flex flex-col justify-between transform rotate-3 transition-transform animate-float-reverse">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#BDD9B0]" />
            <div className="h-1.5 w-9 bg-[#E7DAD1] rounded-full" />
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full bg-[#F3EFE9] rounded" />
            <div className="h-1 w-3/4 bg-[#F3EFE9] rounded" />
            <div className="h-1 w-1/2 bg-[#F3EFE9] rounded" />
          </div>
          <span className="text-[8px] font-mono text-[#99877D] tracking-tighter uppercase">BYLAW-08</span>
        </div>
      </div>

      {/* Concept Process Label */}
      <div className="mt-2 flex items-center gap-2 text-[9px] font-mono tracking-wider text-[#6D5B50]/80 uppercase">
        <span>Documents</span>
        <span className="text-[#EA7957]">→</span>
        <span>Knowledge</span>
        <span className="text-[#2E5A36]">→</span>
        <span className="font-semibold text-[#2E5A36]">Verified Answer</span>
      </div>
    </div>
  );
};
