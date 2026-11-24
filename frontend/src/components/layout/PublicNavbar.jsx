import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { ArrowRight } from 'lucide-react';

export const PublicNavbar = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#20140E]/85 border-b border-[#E7DAD1]/12 text-[#FBF8F5] transition-colors shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex flex-col group">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-xl tracking-tight text-[#FBF8F5] font-heading">
              MORPHEUS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#35251E] text-[#EA7957] border border-[#EA7957]/30">
              v2.4
            </span>
          </div>
          <div className="w-8 h-[3px] bg-[#EA7957] rounded-full mt-1 group-hover:w-12 transition-all duration-300" />
        </Link>

        {/* Navigation links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-mono font-semibold uppercase tracking-widest text-[#D4C2B8]">
          <a href="/#features" className="hover:text-[#FBF8F5] transition-colors">Features</a>
          <a href="/#technology" className="hover:text-[#FBF8F5] transition-colors">Technology</a>
          <Link to="/student/documents" className="hover:text-[#FBF8F5] transition-colors">Documents</Link>
        </div>

        {/* Actions & Theme */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={isAdmin ? '/admin' : '/student'}
                className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-[#EA7957]/25 transition-all"
              >
                <span>{isAdmin ? 'Admin Console' : 'Student Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl border border-[#E7DAD1]/15 hover:border-[#EA7957]/50 bg-[#2A1B14]/70 backdrop-blur-md text-[#FBF8F5] text-xs font-medium transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-medium shadow-lg shadow-[#EA7957]/25 transition-all flex items-center gap-1.5"
              >
                <span>Join Now</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
