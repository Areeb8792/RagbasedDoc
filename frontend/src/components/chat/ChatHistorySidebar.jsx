import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  X,
  Clock,
  MoreVertical,
  Edit2,
  Check,
} from 'lucide-react';

/**
 * Group conversations by timestamp into: Today, Yesterday, Previous 7 Days, Older
 */
const groupConversationsByDate = (conversations) => {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysAgoStart = todayStart - 6 * 86400000;

  conversations.forEach((conv) => {
    const rawDate = conv.updated_at || conv.created_at;
    const time = rawDate ? new Date(rawDate).getTime() : 0;

    if (!time || isNaN(time)) {
      groups.older.push(conv);
    } else if (time >= todayStart) {
      groups.today.push(conv);
    } else if (time >= yesterdayStart) {
      groups.yesterday.push(conv);
    } else if (time >= sevenDaysAgoStart) {
      groups.previous7Days.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
};

const formatTimeOrDate = (rawDate) => {
  if (!rawDate) return '';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const ChatHistorySidebar = ({
  conversations = [],
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const menuRef = useRef(null);

  // Close three-dot menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group filtered results
  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  const hasAnyConversations = conversations.length > 0;
  const hasSearchResults = filteredConversations.length > 0;

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setRenamingId(conv.id);
    setRenameTitle(conv.title || '');
  };

  const handleSaveRename = (convId, e) => {
    if (e) e.stopPropagation();
    if (renameTitle.trim() && onRenameConversation) {
      onRenameConversation(convId, renameTitle.trim());
    }
    setRenamingId(null);
  };

  const handleKeyDownRename = (convId, e) => {
    if (e.key === 'Enter') {
      handleSaveRename(convId, e);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
    }
  };

  const renderGroup = (label, list) => {
    if (!list || list.length === 0) return null;

    return (
      <div key={label} className="space-y-1 mb-3">
        <div className="text-[10px] font-mono font-bold text-[#8C7669] uppercase tracking-wider px-2 py-1">
          {label}
        </div>
        {list.map((conv) => {
          const isActive = currentConversationId === conv.id;
          const isEditing = renamingId === conv.id;
          const isMenuOpen = activeMenuId === conv.id;
          const dateStr = formatTimeOrDate(conv.updated_at || conv.created_at);

          return (
            <div
              key={conv.id}
              onClick={() => {
                if (!isEditing) {
                  onSelectConversation(conv.id);
                  if (onCloseMobile) onCloseMobile();
                }
              }}
              className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#FCE4DA] text-[#A9432B] font-bold border-l-3 border-[#EA7957] shadow-xs'
                  : 'text-[#D4C2B8] hover:bg-[#2F2019] hover:text-[#FBF8F5]'
              }`}
              title={conv.title || 'Inquiry Session'}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-[#A9432B]' : 'text-[#8C7669] group-hover:text-[#D4C2B8]'
                  }`}
                />
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDownRename(conv.id, e)}
                      autoFocus
                      className="w-full bg-[#1A110C] border border-[#EA7957] text-[#FBF8F5] text-xs px-1.5 py-0.5 rounded outline-none"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSaveRename(conv.id, e)}
                      className="p-1 text-[#EA7957] hover:text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(null);
                      }}
                      className="p-1 text-[#8C7669] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{conv.title || 'Untitled Inquiry'}</span>
                    {dateStr && (
                      <span className={`text-[9px] font-mono leading-none mt-0.5 ${isActive ? 'text-[#A9432B]/70' : 'text-[#8C7669]'}`}>
                        {dateStr}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Three-Dot Hover Action Menu */}
              {!isEditing && (
                <div className="relative" ref={isMenuOpen ? menuRef : null}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : conv.id);
                    }}
                    className={`p-1 rounded text-[#8C7669] hover:text-[#EA7957] hover:bg-[#3D2920] transition-all opacity-0 group-hover:opacity-100 ${
                      isActive ? 'opacity-100 hover:bg-[#F8D2C2]' : ''
                    } ${isMenuOpen ? 'opacity-100 bg-[#3D2920] text-white' : ''}`}
                    title="Conversation options"
                    aria-label="Conversation options"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-32 bg-[#1A120E] border border-[#3E2B21] rounded-xl shadow-xl py-1 z-50 text-xs font-sans"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(conv, e)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[#D4C2B8] hover:text-white hover:bg-[#2F2019] transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-[#EA7957]" />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          setActiveMenuId(null);
                          onDeleteConversation(conv.id, e);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-[#2F2019] transition-colors border-t border-[#3E2B21]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const content = (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {!isCollapsed ? (
        /* EXPANDED HISTORY SIDEBAR */
        <>
          {/* Header */}
          <div className="p-3.5 border-b border-[#E7DAD1]/10 flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#EA7957]" />
                <span className="font-mono text-xs font-bold text-[#F5ECE5] tracking-wider uppercase">
                  Conversations
                </span>
              </div>

              {/* Independent Collapse Toggle */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-7 h-7 rounded-lg bg-[#2E1E17]/75 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center hover:bg-[#38261E]/90 hover:border-[#EA7957]/30 text-[#D4C2B8] hover:text-white transition-all cursor-pointer relative group/colbtn shrink-0 shadow-xs"
                aria-label="Collapse conversation history"
                title="Collapse history"
              >
                <PanelLeftClose className="w-4 h-4" />
                <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-[#1A110C]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/colbtn:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  Collapse history
                </div>
              </button>
            </div>

            {/* Prominent + NEW CHAT button */}
            <button
              type="button"
              onClick={() => {
                onNewConversation();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#EA7957] to-[#e06843] hover:from-[#df6a47] hover:to-[#d45834] border border-[#EA7957]/40 text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ NEW CHAT</span>
            </button>

            {/* Search Input */}
            <div className="relative mt-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7669]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#170E09]/75 backdrop-blur-md border border-[#E7DAD1]/12 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957]/60 focus:outline-none placeholder:text-[#6D594C] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7669] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Grouped History List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {!hasAnyConversations ? (
              <div className="text-center py-8 px-4 text-[#8C7669]">
                <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40 text-[#EA7957]" />
                <p className="text-xs font-mono">No previous chats yet.</p>
                <p className="text-[11px] text-[#6D594C] mt-1">Start your first academic inquiry above!</p>
              </div>
            ) : !hasSearchResults ? (
              <div className="text-center py-8 px-4 text-[#8C7669]">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-mono">No matching conversations found.</p>
              </div>
            ) : (
              <>
                {renderGroup('Today', groupedConversations.today)}
                {renderGroup('Yesterday', groupedConversations.yesterday)}
                {renderGroup('Previous 7 Days', groupedConversations.previous7Days)}
                {renderGroup('Older', groupedConversations.older)}
              </>
            )}
          </div>
        </>
      ) : (
        /* COLLAPSED HISTORY SIDEBAR (SLIM RAIL ~54px) */
        <div className="flex flex-col items-center py-3 px-1.5 gap-3 h-full">
          {/* Expand Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-xl bg-[#2E1E17]/75 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center text-[#D4C2B8] hover:text-white hover:bg-[#38261E]/90 transition-all cursor-pointer relative group/expbtn shadow-xs"
            aria-label="Expand conversation history"
            title="Expand history"
          >
            <PanelLeftOpen className="w-4 h-4 text-[#EA7957]" />
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A110C]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/expbtn:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              Expand conversations
            </div>
          </button>

          {/* Quick + New Chat Icon */}
          <button
            type="button"
            onClick={onNewConversation}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#EA7957] to-[#e06843] hover:from-[#df6a47] hover:to-[#d45834] border border-[#EA7957]/40 text-white flex items-center justify-center transition-all cursor-pointer relative group/quicknew shadow-xs active:scale-95"
            aria-label="New inquiry"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A110C]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/quicknew:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              New Chat
            </div>
          </button>

          {/* History Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8C7669] relative group/historyicon mt-1">
            <History className="w-4 h-4" />
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1A110C]/95 backdrop-blur-xl text-[#F5ECE5] text-xs font-sans rounded-md border border-[#E7DAD1]/15 whitespace-nowrap opacity-0 group-hover/historyicon:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              {conversations.length} Saved Inquiries
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Overlay Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1E130E]/92 backdrop-blur-2xl border-r border-[#E7DAD1]/15 transition-transform duration-200 lg:hidden shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-[#E7DAD1]/10">
          <span className="font-mono text-xs font-bold text-[#F5ECE5] uppercase tracking-wider">
            Conversations
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#8C7669] hover:text-white hover:bg-[#35251E]/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)]">
          {content}
        </div>
      </div>

      {/* Desktop In-Flow Sidebar (Between Universal Sidebar and Chat Panel) */}
      <aside
        id="ai-assistant-history-sidebar"
        aria-label="AI Assistant Conversation History"
        className={`hidden lg:flex flex-col bg-[#1E130E]/75 backdrop-blur-2xl border border-[#E7DAD1]/10 rounded-2xl shrink-0 transition-all duration-300 ease-in-out shadow-lg overflow-hidden h-full ${
          isCollapsed ? 'w-[54px]' : 'w-[270px]'
        }`}
      >
        {content}
      </aside>
    </>
  );
};
