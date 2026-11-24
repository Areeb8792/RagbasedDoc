import React, { useState } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  MessageSquare,
  LayoutGrid,
  Files,
  Bookmark,
  Settings,
  Layers,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  HelpCircle,
  MessageSquareWarning,
  ListCheck,
  Users,
  ExternalLink,
} from 'lucide-react';

export const UniversalSidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminSection = location.pathname.startsWith('/admin');

  // Role-aware navigation definitions
  const studentNavItems = [
    { to: '/student/chat', label: 'AI Assistant', icon: MessageSquare },
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/student/documents', label: 'My Documents', icon: Files },
    { to: '/student/saved', label: 'Saved Answers', icon: Bookmark },
    { to: '/student/settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/documents', label: 'Documents & RAG', icon: Files },
    { to: '/admin/knowledge-gaps', label: 'Knowledge Gaps', icon: HelpCircle },
    { to: '/admin/feedback', label: 'Answer Feedback', icon: MessageSquareWarning },
    { to: '/admin/faqs', label: 'Institutional FAQs', icon: ListCheck },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/audit-logs', label: 'Security & Audit', icon: ShieldCheck },
  ];

  const currentNavItems = isAdminSection ? adminNavItems : studentNavItems;

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'Student User';
  const displayEmail = user?.email || (user?.username ? `${user.username}@g38.edu` : 'student@g38.edu');
  const userInitial = user?.first_name
    ? user.first_name[0]
    : user?.username
    ? user.username[0].toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Universal Navigation Sidebar */}
      <aside
        id="universal-application-sidebar"
        aria-label="Universal Application Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#1E140E]/80 backdrop-blur-2xl border-r border-[#E7DAD1]/10 text-[#F5ECE5] flex flex-col justify-between transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-[72px]' : 'w-64'} select-none shadow-2xl`}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
          {/* Header with Three-Line Hamburger Control */}
          <div
            className={`p-3.5 border-b border-[#E7DAD1]/10 flex items-center ${
              isCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between'
            }`}
          >
            {!isCollapsed ? (
              <>
                <Link
                  to={isAdminSection ? '/admin' : '/student/chat'}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/15 flex items-center justify-center shrink-0 shadow-xs">
                    <Layers className="w-5 h-5 text-[#EA7957]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[16px] tracking-tight text-[#F5ECE5] font-heading leading-tight">
                        Morpheus
                      </span>
                      {isAdminSection && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#EA7957]/20 text-[#EA7957] border border-[#EA7957]/30">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-[#A39084] leading-tight">
                      G38 AI College Assistant
                    </span>
                  </div>
                </Link>

                {/* Chevron Toggle Button (Expanded State) */}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="w-8 h-8 rounded-lg bg-[#2E1E17]/75 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center hover:bg-[#3D291F]/90 hover:border-[#EA7957]/30 text-[#D4C2B8] hover:text-white transition-all relative group/collapse cursor-pointer shrink-0 shadow-xs"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-[#1A120E]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/collapse:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    Collapse sidebar
                  </div>
                </button>
              </>
            ) : (
              /* Collapsed Header with Chevron Button prominently at top */
              <div className="flex flex-col items-center gap-2.5 w-full">
                <Link
                  to={isAdminSection ? '/admin' : '/student/chat'}
                  className="w-8 h-8 rounded-lg bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center mt-1 shadow-xs"
                  title="Morpheus Home"
                >
                  <Layers className="w-4 h-4 text-[#EA7957]" />
                </Link>

                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="w-9 h-9 rounded-xl bg-[#2E1E17]/75 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center hover:bg-[#3D291F]/90 hover:border-[#EA7957]/30 text-[#D4C2B8] hover:text-white transition-all relative group/collapse cursor-pointer shadow-xs"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A120E]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/collapse:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    Expand sidebar
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links List */}
          <nav
            aria-label="Application sections"
            className={`py-3 space-y-1 flex-1 ${isCollapsed ? 'px-2' : 'px-3'}`}
          >
            {currentNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => {
                  if (isCollapsed) {
                    return `relative group/navitem flex items-center justify-center w-11 h-11 mx-auto rounded-2xl transition-all ${
                      isActive
                        ? 'bg-[#FCE4DA] text-[#A9432B] shadow-sm'
                        : 'text-[#D4C2B8] hover:bg-[#302119]/60 hover:backdrop-blur-sm hover:text-[#F5ECE5]'
                    }`;
                  }
                  return `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FCE4DA] text-[#A9432B] font-bold border-l-4 border-[#EA7957] shadow-xs'
                      : 'text-[#F5ECE5] hover:bg-[#302119]/60 hover:backdrop-blur-sm hover:text-white'
                  }`;
                }}
              >
                {({ isActive }) =>
                  isCollapsed ? (
                    <>
                      <item.icon
                        className={`w-5 h-5 ${
                          isActive ? 'text-[#A9432B]' : 'text-[#D4C2B8]'
                        }`}
                      />
                      {/* Tooltip for collapsed rail item */}
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A120E]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                        {item.label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-[#A9432B]' : 'text-[#D4C2B8]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 ${
                          isActive ? 'text-[#A9432B]' : 'text-[#6E5648]'
                        }`}
                      />
                    </>
                  )
                }
              </NavLink>
            ))}

            {/* Portal Switcher for Admins */}
            {isAdmin && (
              <div className="pt-3 mt-3 border-t border-[#E7DAD1]/10">
                {!isAdminSection ? (
                  !isCollapsed ? (
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-[#2E1E17]/75 backdrop-blur-md text-[#EA7957] border border-[#EA7957]/30 hover:bg-[#3B261D]/90 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#EA7957]" />
                        <span>Admin Portal</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className="relative group/portal flex items-center justify-center w-11 h-11 mx-auto rounded-2xl bg-[#2E1E17]/75 backdrop-blur-md text-[#EA7957] border border-[#EA7957]/30 hover:bg-[#3B261D]/90 transition-all shadow-xs"
                      title="Admin Portal"
                    >
                      <ShieldCheck className="w-5 h-5 text-[#EA7957]" />
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A120E]/95 backdrop-blur-xl text-[#EA7957] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/portal:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl font-bold">
                        Admin Portal
                      </div>
                    </Link>
                  )
                ) : (
                  !isCollapsed ? (
                    <Link
                      to="/student/chat"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-[#2E1E17]/75 backdrop-blur-md text-[#EA7957] border border-[#EA7957]/30 hover:bg-[#3B261D]/90 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-[#EA7957]" />
                        <span>Student Assistant</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to="/student/chat"
                      onClick={onClose}
                      className="relative group/portal flex items-center justify-center w-11 h-11 mx-auto rounded-2xl bg-[#2E1E17]/75 backdrop-blur-md text-[#EA7957] border border-[#EA7957]/30 hover:bg-[#3B261D]/90 transition-all shadow-xs"
                      title="Student Assistant"
                    >
                      <ExternalLink className="w-5 h-5 text-[#EA7957]" />
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A120E]/95 backdrop-blur-xl text-[#EA7957] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/portal:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl font-bold">
                        Student Assistant
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </nav>

          {/* User Profile Bar at bottom */}
          <div className="p-3 border-t border-[#E7DAD1]/10 bg-[#1A110C]/40 backdrop-blur-md relative">
            {!isCollapsed ? (
              <div className="flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#2E1F18]/60 transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-[#E2C2B3] text-[#251A14] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {userInitial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-[#F5ECE5] truncate leading-tight">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-[#9E8C82] truncate leading-tight">
                      {displayEmail}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-1 rounded-lg text-[#A39084] hover:text-white hover:bg-[#3E2C22]/70 transition-colors cursor-pointer"
                    aria-label="User menu"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute bottom-full right-0 mb-2 w-48 bg-[#1A110C]/92 backdrop-blur-2xl border border-[#E7DAD1]/15 rounded-xl shadow-2xl py-1 z-50 text-xs font-sans"
                      onMouseLeave={() => setShowUserMenu(false)}
                    >
                      <div className="px-3 py-2 border-b border-[#E7DAD1]/10">
                        <p className="font-semibold text-[#F5ECE5] truncate">{displayName}</p>
                        <p className="text-[10px] text-[#A39084] font-mono truncate">{displayEmail}</p>
                      </div>
                      <Link
                        to="/student/settings"
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onClose) onClose();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-[#D4C2B8] hover:text-white hover:bg-[#2E1F18]/60 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          to={isAdminSection ? '/student/chat' : '/admin'}
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onClose) onClose();
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-[#EA7957] hover:bg-[#2E1F18]/60 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isAdminSection ? 'Switch to Student' : 'Admin Portal'}</span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-[#2E1F18]/60 transition-colors border-t border-[#E7DAD1]/10"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-full bg-[#E2C2B3] text-[#251A14] flex items-center justify-center font-bold text-xs mx-auto cursor-pointer hover:ring-2 hover:ring-[#EA7957]/50 transition-all relative group/usericon shadow-xs"
                  aria-label="User account"
                >
                  {userInitial}
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A120E]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/usericon:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    {displayName}
                  </div>
                </button>

                {showUserMenu && (
                  <div
                    className="absolute bottom-full left-full ml-2 mb-2 w-48 bg-[#1A110C]/92 backdrop-blur-2xl border border-[#E7DAD1]/15 rounded-xl shadow-2xl py-1 z-50 text-xs font-sans"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-[#E7DAD1]/10">
                      <p className="font-semibold text-[#F5ECE5] truncate">{displayName}</p>
                      <p className="text-[10px] text-[#A39084] font-mono truncate">{displayEmail}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-[#2E1F18]/60 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
