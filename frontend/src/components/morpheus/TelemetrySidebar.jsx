import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, ChevronDown, Activity, Cpu, Layers, ShieldCheck, Database, ArrowUpRight } from 'lucide-react';

export const TelemetrySidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[15vw] min-w-[210px] max-w-[260px] h-screen flex-col justify-between p-5 bg-black/90 backdrop-blur-md border-r border-[#645A4F]/20 text-[#FAFAF8] z-40 select-none overflow-y-auto"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.92)' }}
      aria-label="System Telemetry"
    >
      {/* Top Section: System Identity & Collapsible Profile Card */}
      <div className="space-y-4">
        {/* Header Monospace Spec */}
        <div className="flex items-center justify-between text-[10px] tesser-mono text-[#645A4F] uppercase tracking-widest border-b border-[#645A4F]/20 pb-2">
          <span>SYS.SPEC // 01</span>
          <span className="flex items-center gap-1.5 text-[#00FF88]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"></span>
            ACTIVE
          </span>
        </div>

        {/* Collapsible Profile Card */}
        <div className="rounded-lg border border-[#645A4F]/30 bg-white/[0.03] overflow-hidden transition-all duration-300">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-3 flex items-center justify-between hover:bg-white/[0.05] transition-colors text-left focus:outline-none focus:ring-1 focus:ring-[#00FF88]/40"
            aria-expanded={isExpanded}
            aria-controls="profile-card-details"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded bg-[#1A1A1A] border border-[#645A4F]/40 flex items-center justify-center text-[#00FF88]">
                <Bot className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00FF88]"></span>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-white">TESSER CORE</p>
                <p className="text-[10px] tesser-mono text-[#C6B19B]/80">ID: TSS-NODE-409</p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#C6B19B] transition-transform duration-300 ${
                isExpanded ? 'rotate-180 text-[#00FF88]' : ''
              }`}
            />
          </button>

          {/* Expanded Drawer */}
          <div
            id="profile-card-details"
            className={`transition-all duration-300 ease-in-out px-3 overflow-hidden ${
              isExpanded ? 'max-h-64 py-3 border-t border-[#645A4F]/20 opacity-100' : 'max-h-0 py-0 opacity-0'
            }`}
          >
            <div className="space-y-3 text-[11px] tesser-mono">
              <div>
                <div className="flex justify-between text-[#C6B19B] mb-1">
                  <span>RAG CAPACITY</span>
                  <span className="text-[#00FF88]">OPTIMAL</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#00FF88] h-full w-[84%]"></div>
                </div>
              </div>

              <div className="pt-2 space-y-1.5">
                <Link
                  to="/login"
                  className="w-full py-1.5 px-2 bg-[#EE5937] hover:bg-[#EE5937]/90 text-white font-medium text-xs rounded flex items-center justify-between transition-colors"
                >
                  <span>Launch Student Assistant</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/knowledge"
                  className="w-full py-1 px-2 border border-[#645A4F]/40 hover:border-[#C6B19B] text-[#C6B19B] hover:text-white rounded flex items-center justify-between text-[10px] transition-colors"
                >
                  <span>Document Explorer</span>
                  <Database className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Architecture Indicator */}
      <div className="my-auto py-6 flex flex-col items-center">
        <div className="text-[9px] tesser-mono text-[#645A4F] uppercase tracking-[0.25em] mb-4 writing-mode-vertical">
          ARCHITECTURE // HYBRID
        </div>

        {/* Vertical Line with Nodes */}
        <div className="relative w-px h-36 bg-gradient-to-b from-[#00FF88]/40 via-[#EE5937]/40 to-white/20 flex flex-col justify-between items-center py-2">
          {/* Top Node: Green */}
          <div className="w-2 h-2 rounded-full bg-[#00FF88] ring-2 ring-[#00FF88]/20 shadow-[0_0_8px_rgba(0,255,136,0.6)]"></div>
          {/* Mid Node: Terracotta */}
          <div className="w-2 h-2 rounded-full bg-[#EE5937] ring-2 ring-[#EE5937]/20 shadow-[0_0_8px_rgba(238,89,55,0.6)]"></div>
          {/* Bottom Node: Taupe/White */}
          <div className="w-2 h-2 rounded-full bg-white/70 ring-2 ring-white/10"></div>
        </div>

        <div className="text-[8px] tesser-mono text-[#C6B19B]/60 mt-3 tracking-widest">
          RAG V2.4
        </div>
      </div>

      {/* Bottom Section: Compact Stacked Telemetry Composition */}
      <div className="space-y-3 border-t border-[#645A4F]/20 pt-4 text-[10px] tesser-mono">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#645A4F]">VECTOR ENGINE</span>
            <span className="text-[#00FF88] font-bold">PGVECTOR</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#645A4F]">EMBEDDINGS</span>
            <span className="text-[#C6B19B]">MINILM-L6</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#645A4F]">CITATION GUARANTEE</span>
            <span className="text-[#EE5937]">STRICT-100%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#645A4F]">LATENCY EST.</span>
            <span className="text-white">~38MS</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-[#645A4F]">
          <span>TESSER // INST-ID</span>
          <span>CAMPUS-G38</span>
        </div>
      </div>
    </aside>
  );
};
