import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  User,
  Layers,
  Search,
  FileCheck2,
  Lock,
  ChevronRight,
  Database,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  Files
} from 'lucide-react';
import { VerifiedKnowledgeFlow } from '../../components/morpheus/VerifiedKnowledgeFlow';
import '../../styles/morpheus-tokens.css';

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#18100C] text-[#FBF8F5] selection:bg-[#EA7957]/30 selection:text-[#EA7957] overflow-x-hidden font-sans">
      {/* Ambient background lighting meshes for frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Top-right subtle coral ambient light */}
        <div
          className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full blur-[140px] opacity-[0.14]"
          style={{ background: 'radial-gradient(circle, #EA7957 0%, transparent 70%)' }}
        />
        {/* Center-left subtle warm ambient glow */}
        <div
          className="absolute top-1/3 -left-36 w-[700px] h-[700px] rounded-full blur-[150px] opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #C26344 0%, transparent 70%)' }}
        />
        {/* Bottom-right subtle deep amber glow */}
        <div
          className="absolute -bottom-40 right-1/4 w-[550px] h-[550px] rounded-full blur-[160px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #8C472E 0%, transparent 70%)' }}
        />
        {/* Delicate warm dotted grid texture */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              radial-gradient(circle, rgba(234, 121, 87, 0.18) 1px, transparent 1px),
              repeating-linear-gradient(to right, transparent, transparent 139px, rgba(234, 121, 87, 0.04) 140px)
            `,
            backgroundSize: '28px 28px, 140px 100%'
          }}
        />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
        {/* ========================================================= */}
        {/* NAVIGATION — GLASSMORPHIC STYLING                         */}
        {/* ========================================================= */}
        <header className="py-6 flex items-center justify-between border-b border-[#E7DAD1]/10">
          {/* Left Brand Wordmark with Coral Underline & Sage Version Pill */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-2xl sm:text-3xl font-extrabold tracking-[-0.035em] text-[#FBF8F5] font-heading">
                MORPHEUS
              </Link>
              {/* Sage Pill Badge: v2.4 */}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#35251E] text-[#EA7957] border border-[#EA7957]/30">
                v2.4
              </span>
            </div>
            {/* Coral Decorative Underline */}
            <div className="w-10 sm:w-12 h-[3.5px] bg-[#EA7957] rounded-full mt-1.5" />
          </div>

          {/* Desktop Right Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-semibold uppercase tracking-widest text-[#D4C2B8]">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#technology" className="hover:text-white transition-colors">
              Technology
            </a>
            <Link to="/student/documents" className="hover:text-white transition-colors">
              Documents
            </Link>

            <div className="flex items-center gap-3 ml-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 hover:border-[#EA7957]/50 bg-[#251710]/70 backdrop-blur-md text-[#FBF8F5] font-sans font-medium text-xs tracking-normal shadow-xs hover:shadow transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white font-sans font-medium text-xs tracking-normal shadow-lg shadow-[#EA7957]/25 transition-all"
              >
                Join Now
              </Link>
            </div>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-[#E7DAD1]/15 bg-[#251710]/80 backdrop-blur-md text-[#FBF8F5] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 px-6 bg-[#20140E]/90 backdrop-blur-2xl border border-[#E7DAD1]/14 rounded-2xl shadow-2xl mt-2 flex flex-col gap-3 font-mono text-xs uppercase tracking-wider text-[#D4C2B8] z-50">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#FBF8F5]"
            >
              Features
            </a>
            <a 
              href="#technology" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#FBF8F5]"
            >
              Technology
            </a>
            <Link 
              to="/student/documents" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#FBF8F5]"
            >
              Documents
            </Link>
            <div className="pt-2 flex flex-col gap-2 font-sans tracking-normal">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#251710]/80 text-[#FBF8F5] font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#EA7957] text-white font-medium shadow-md shadow-[#EA7957]/25"
              >
                Join Now
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* HERO SECTION — GLASSMORPHIC STYLING                       */}
        {/* ========================================================= */}
        <section className="pt-16 sm:pt-20 lg:pt-24 pb-20 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column (56% width: col-span-7) */}
            <div className="lg:col-span-7 space-y-7">
              {/* Evidence-First Knowledge Architecture Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EA7957]/15 backdrop-blur-md border border-[#EA7957]/30 text-[11px] font-mono uppercase tracking-wider text-[#EA7957]">
                <Layers className="w-3.5 h-3.5 text-[#EA7957]" />
                <span className="font-semibold">Evidence-First Knowledge Architecture</span>
              </div>

              {/* Huge 3-Level Heading */}
              <div className="space-y-1">
                <h1 className="text-[3.2rem] sm:text-[4.2rem] lg:text-[4.75rem] font-extrabold tracking-[-0.04em] leading-[0.96] font-heading">
                  <span className="text-[#EA7957] block">MORPHEUS</span>
                  <span className="text-[#FBF8F5] block">INTELLIGENT CAMPUS</span>
                  <span className="text-[#FBF8F5] block">ASSISTANT</span>
                </h1>
              </div>

              {/* Supporting Copy with Verified Citations Highlight */}
              <p className="text-base sm:text-lg lg:text-xl text-[#D4C2B8] font-normal leading-relaxed max-w-xl">
                Instant, context-aware answers to college policies, attendance regulations, and academic bylaws — backed by{' '}
                <span className="text-[#76C893] font-semibold underline decoration-[#76C893]/60 decoration-[2px] underline-offset-4">
                  verified institutional citations.
                </span>
              </p>
            </div>

            {/* Right Column (44% width: col-span-5) */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              {/* SPECIAL FEATURE: Verified Knowledge Flow Animation Above CTA */}
              <VerifiedKnowledgeFlow />

              {/* Action Buttons Box */}
              <div className="space-y-3.5 w-full max-w-[420px] mx-auto lg:mx-0">
                {/* Main Button: LAUNCH ASSISTANT */}
                <Link
                  to="/student/chat"
                  className="w-full px-6 py-4 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white flex items-center justify-between font-sans shadow-lg shadow-[#EA7957]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-white fill-white" />
                    <span className="text-sm font-semibold tracking-wider uppercase font-mono">
                      Launch Assistant
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Secondary Button Row: EXPLORE DOCUMENTS & PORTAL LOGIN */}
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/student/documents"
                    className="px-4 py-3.5 rounded-xl bg-[#251710]/75 backdrop-blur-md hover:bg-[#352118]/90 border border-[#E7DAD1]/14 hover:border-[#EA7957]/50 text-[#FBF8F5] font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Files className="w-3.5 h-3.5 text-[#EA7957]" />
                    <span>Explore Documents</span>
                  </Link>

                  <Link
                    to="/login"
                    className="px-4 py-3.5 rounded-xl bg-[#251710]/75 backdrop-blur-md hover:bg-[#352118]/90 border border-[#E7DAD1]/14 hover:border-[#EA7957]/50 text-[#FBF8F5] font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#EA7957]" />
                    <span>Portal Login</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FEATURES SECTION: 01 // CORE SYSTEMS                      */}
        {/* ========================================================= */}
        <section id="features" className="py-20 border-t border-[#E7DAD1]/10">
          <div className="space-y-4 mb-14">
            <div className="text-xs font-mono font-bold text-[#EA7957] tracking-widest uppercase">
              01 // Core Systems
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#FBF8F5] font-heading tracking-tight">
              Ground-Truth Academic Intelligence
            </h2>
            <p className="text-[#D4C2B8] max-w-2xl text-base">
              Built on hybrid vector retrieval and zero-hallucination protocols. Every answer cites official college regulations down to the specific page and paragraph.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-[#20140E]/70 backdrop-blur-xl border border-[#E7DAD1]/12 shadow-xl hover:border-[#EA7957]/45 hover:bg-[#2A1B14]/80 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#EA7957]/15 border border-[#EA7957]/30 flex items-center justify-center text-[#EA7957]">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#FBF8F5] font-heading">
                  Verified Institutional Citations
                </h3>
                <p className="text-sm text-[#D4C2B8] leading-relaxed">
                  Direct hyperlinks to official circulars, handbook clauses, and syndicate bylaws so students can cross-verify any response instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E7DAD1]/10 flex items-center justify-between text-xs font-mono text-[#EA7957]">
                <span>CONFIDENCE: 99.4%</span>
                <span className="w-2 h-2 rounded-full bg-[#76C893]" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-[#20140E]/70 backdrop-blur-xl border border-[#E7DAD1]/12 shadow-xl hover:border-[#EA7957]/45 hover:bg-[#2A1B14]/80 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#76C893]/15 border border-[#76C893]/30 flex items-center justify-center text-[#76C893]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#FBF8F5] font-heading">
                  Zero Hallucination Protocol
                </h3>
                <p className="text-sm text-[#D4C2B8] leading-relaxed">
                  Strict rejection threshold: if an answer is not backed by verifiable institutional documents, Morpheus acknowledges the gap and notifies academic admins.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E7DAD1]/10 flex items-center justify-between text-xs font-mono text-[#76C893]">
                <span>STRICT EVIDENCE</span>
                <span className="w-2 h-2 rounded-full bg-[#EA7957]" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-[#20140E]/70 backdrop-blur-xl border border-[#E7DAD1]/12 shadow-xl hover:border-[#EA7957]/45 hover:bg-[#2A1B14]/80 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#FBF8F5] font-heading">
                  Multilingual Academic Assistant
                </h3>
                <p className="text-sm text-[#D4C2B8] leading-relaxed">
                  Seamlessly queries in English, Hindi, and Punjabi with context-aware simplification for complex university regulatory phrasing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E7DAD1]/10 flex items-center justify-between text-xs font-mono text-[#60A5FA]">
                <span>3 LANGUAGES READY</span>
                <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* TECHNOLOGY / ARCHITECTURE: 02 // PIPELINE                 */}
        {/* ========================================================= */}
        <section id="technology" className="py-20 border-t border-[#E7DAD1]/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="text-xs font-mono font-bold text-[#EA7957] tracking-widest uppercase">
                02 // Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#FBF8F5] font-heading tracking-tight">
                Deterministic RAG Vector Pipeline
              </h2>
              <p className="text-[#D4C2B8] text-sm sm:text-base leading-relaxed">
                Documents undergo OCR parsing, recursive chunking with 120-token overlap, and embedding via high-density vector representations. Only top-ranked chunks above the confidence threshold are synthesized.
              </p>

              <div className="pt-2 space-y-2.5 text-xs font-mono text-[#D4C2B8]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#76C893]" />
                  <span>EMBEDDING MODEL: BAAI/bge-small-en-v1.5</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#76C893]" />
                  <span>SIMILARITY METRIC: Cosine Distance &gt; 0.72</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#76C893]" />
                  <span>SECURITY ENCLAVE: Departmental RBAC Isolated</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="p-8 rounded-2xl bg-[#20140E]/70 backdrop-blur-xl border border-[#E7DAD1]/12 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E7DAD1]/10">
                  <span className="text-xs font-mono font-bold uppercase text-[#FBF8F5]">
                    Execution Trace // Sample Query
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#76C893]/15 text-[#76C893] border border-[#76C893]/30 font-semibold">
                    GROUNDED
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 shadow-inner">
                    <span className="text-[#EA7957] font-bold">STUDENT QUERY:</span>
                    <p className="text-[#FBF8F5] mt-1 font-sans text-sm font-medium">
                      "What is the minimum attendance requirement to appear for the 6th-semester final exams?"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#18261C]/80 backdrop-blur-md border border-[#76C893]/30 shadow-inner">
                    <span className="text-[#76C893] font-bold">VERIFIED EXTRACT // ATTENDANCE_POLICY_2024.PDF (P. 14, SEC 3.2):</span>
                    <p className="text-[#FBF8F5] mt-1 font-sans text-sm">
                      "Students must maintain an aggregate attendance of at least 75% in all lectures and practicals. A relaxation of up to 10% may be granted by the Academic Dean exclusively upon medical grounds with official board certification."
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#D4C2B8]">
                  <span>Retrieval Latency: 22ms</span>
                  <Link
                    to="/student/chat"
                    className="inline-flex items-center gap-1 text-[#EA7957] font-semibold hover:underline"
                  >
                    <span>Test query live</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FOOTER                                                    */}
        {/* ========================================================= */}
        <footer className="py-12 border-t border-[#E7DAD1]/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#D4C2B8]">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-base text-[#FBF8F5] font-heading">MORPHEUS</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#EA7957]" />
            <span>Intelligent Campus Assistant</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider">
            <Link to="/student" className="hover:text-white transition-colors">Student Portal</Link>
            <Link to="/admin" className="hover:text-white transition-colors">Admin Console</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <div className="text-[11px] text-[#A89284]">
            © 2026 Morpheus Knowledge Systems. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};
