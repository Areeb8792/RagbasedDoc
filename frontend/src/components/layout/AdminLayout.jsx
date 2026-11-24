import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { UniversalSidebar } from './UniversalSidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

export const AdminLayout = () => {
  const { user } = useAuth();
  const userKey = user?.id ? `_${user.id}` : '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const uVal = localStorage.getItem(`morpheus_universal_sidebar_collapsed${userKey}`);
      if (uVal !== null) return uVal === 'true';
      return localStorage.getItem('morpheus_universal_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`morpheus_universal_sidebar_collapsed${userKey}`, String(next));
        localStorage.setItem('morpheus_universal_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#18100C] text-[#FBF8F5] flex flex-col relative overflow-x-hidden font-sans">
      {/* Ambient background lighting meshes for frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #EA7957 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -left-36 w-[650px] h-[650px] rounded-full blur-[150px] opacity-[0.09]"
          style={{ background: 'radial-gradient(circle, #C26344 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #8C472E 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(234, 121, 87, 0.18) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Persistent Left Universal Sidebar */}
      <UniversalSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`${
          isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        } flex flex-col flex-1 min-w-0 relative z-10 transition-[margin] duration-300 ease-in-out`}
      >
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-14 bg-[#201510]/85 backdrop-blur-xl border-b border-[#E7DAD1]/10 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-[#FBF8F5] hover:bg-[#33231B] cursor-pointer"
            aria-label="Open universal navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-[#FBF8F5] font-heading">
              MORPHEUS
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium bg-[#35251E] text-[#EA7957] border border-[#EA7957]/30">
              ADMIN
            </span>
          </div>
          <div className="w-6" />
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 min-h-screen relative">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
