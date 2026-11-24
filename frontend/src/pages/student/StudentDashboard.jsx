import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { documentIntelligenceService } from '../../services/documentIntelligenceService';
import { chatService } from '../../services/chatService';
import {
  Folder,
  FolderPlus,
  Files,
  HardDrive,
  Clock,
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  ArrowRight,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronRight,
  Zap,
  FolderInput,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Statistics state
  const [stats, setStats] = useState({
    total_documents: 0,
    total_folders: 0,
    total_storage_bytes: 0,
    storage_used_formatted: '0 B',
    recently_uploaded: 0,
    recent_days: 7,
    indexed_documents: 0,
    failed_documents: 0,
    processing_documents: 0,
  });

  // Folders and Unorganized Documents states
  const [folders, setFolders] = useState([]);
  const [unorganizedDocs, setUnorganizedDocs] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folderSearch, setFolderSearch] = useState('');

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderData, setNewFolderData] = useState({
    name: '',
    description: '',
    color: '#EA7957',
    icon: 'folder',
  });
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderData, setEditFolderData] = useState({
    name: '',
    description: '',
    color: '#EA7957',
    icon: 'folder',
  });

  const [deletingFolder, setDeletingFolder] = useState(null);
  const [deleteOption, setDeleteOption] = useState('keep_docs'); // 'keep_docs' | 'delete_all'

  const [activeMenuFolderId, setActiveMenuFolderId] = useState(null);

  // Moving unorganized document modal
  const [movingDoc, setMovingDoc] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState('');

  const colorOptions = [
    { label: 'Terracotta', value: '#EA7957' },
    { label: 'Sage', value: '#BDD9B0' },
    { label: 'Warm Charcoal', value: '#35271F' },
    { label: 'Sky Blue', value: '#3B82F6' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Purple', value: '#8B5CF6' },
  ];

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, foldersData, unorgData, convsData] = await Promise.all([
        documentIntelligenceService.getPersonalStats(),
        documentIntelligenceService.getCollections(),
        documentIntelligenceService.getPersonalDocuments({ unorganized: 'true' }),
        chatService.getConversations(),
      ]);

      setStats(statsData || {});
      setFolders(foldersData.results || foldersData || []);
      setUnorganizedDocs(unorgData.results || unorgData || []);
      setRecentConversations(convsData.results || convsData || []);
    } catch (err) {
      console.error('Dashboard data load error:', err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuFolderId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Create folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderData.name.trim()) {
      toast.error('Please enter a folder name.');
      return;
    }
    setCreatingFolder(true);
    try {
      const created = await documentIntelligenceService.createCollection(newFolderData);
      setFolders((prev) => [created, ...prev]);
      setStats((prev) => ({ ...prev, total_folders: (prev.total_folders || 0) + 1 }));
      setIsCreateFolderOpen(false);
      setNewFolderData({ name: '', description: '', color: '#EA7957', icon: 'folder' });
      toast.success(`Folder "${created.name}" created!`);
    } catch (err) {
      toast.error('Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Edit folder
  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    if (!editFolderData.name.trim()) return;
    try {
      const updated = await documentIntelligenceService.updateCollection(editingFolder.id, editFolderData);
      setFolders((prev) => prev.map((f) => (f.id === editingFolder.id ? updated : f)));
      setEditingFolder(null);
      toast.success('Folder updated successfully.');
    } catch (err) {
      toast.error('Failed to update folder.');
    }
  };

  // Delete folder
  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    try {
      const deleteDocs = deleteOption === 'delete_all';
      await documentIntelligenceService.deleteCollection(deletingFolder.id, deleteDocs);
      toast.success(
        deleteDocs
          ? `Folder "${deletingFolder.name}" and all documents deleted.`
          : `Folder "${deletingFolder.name}" deleted. Documents moved to Unorganized.`
      );
      setDeletingFolder(null);
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to delete folder.');
    }
  };

  // Move unorganized document to folder
  const handleMoveUnorganizedDoc = async () => {
    if (!movingDoc || !targetFolderId) return;
    try {
      await documentIntelligenceService.movePersonalDocument(movingDoc.id, targetFolderId);
      toast.success('Document moved into selected folder.');
      setMovingDoc(null);
      setTargetFolderId('');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to move document.');
    }
  };

  // Filtered folders
  const filteredFolders = folders.filter((f) => {
    if (!folderSearch.trim()) return true;
    const q = folderSearch.toLowerCase();
    return f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-sans pb-12">
      {/* 1. Warm Editorial Welcome Header */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#241711]/75 backdrop-blur-2xl border border-[#E7DAD1]/12 shadow-xl relative overflow-hidden">
        {/* Ambient warm glow */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 pointer-events-none rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #EA7957 0%, transparent 70%)' }}
        />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FBF8F5] font-heading tracking-tight">
              Welcome back,{' '}
              <span className="text-[#EA7957]">
                {user?.first_name ? `${user.first_name}` : user?.username || 'Scholar'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#D4C2B8] leading-relaxed">
              Your personalized AI-powered document workspace. Organize custom folders, upload research notes, and ask grounded questions.
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-[#EA7957]/25 transition-all cursor-pointer active:scale-98"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Folder</span>
            </button>

            <Link
              to="/student/chat"
              className="px-4 py-2.5 rounded-xl bg-[#2E1E17]/80 backdrop-blur-md hover:bg-[#3D281F]/90 border border-[#E7DAD1]/15 text-[#F5ECE5] text-xs font-mono font-semibold tracking-wider uppercase flex items-center gap-2 shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-[#EA7957]" />
              <span>Launch Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Real-Time Dynamic Document Statistics */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono font-bold text-[#A89284] uppercase tracking-wider">
            Workspace Statistics
          </h2>
          <span className="text-[11px] font-mono text-[#8C7669]">
            Live DB sync • {user?.username}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Stat 1: Total Documents */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-[#8C7669]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A89284]">Total Documents</span>
              <div className="w-8 h-8 rounded-xl bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center text-[#EA7957] shadow-xs">
                <Files className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading">
                {loading ? '—' : stats.total_documents || 0}
              </span>
              <span className="text-[11px] font-mono text-[#76C893]">
                {stats.indexed_documents || 0} indexed
              </span>
            </div>
          </div>

          {/* Stat 2: Total Folders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-[#8C7669]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A89284]">Total Folders</span>
              <div className="w-8 h-8 rounded-xl bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center text-[#EA7957] shadow-xs">
                <Folder className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading">
                {loading ? '—' : stats.total_folders || 0}
              </span>
              <span className="text-[11px] font-mono text-[#A89284]">
                collections
              </span>
            </div>
          </div>

          {/* Stat 3: Storage Used */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-[#8C7669]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A89284]">Storage Used</span>
              <div className="w-8 h-8 rounded-xl bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center text-[#EA7957] shadow-xs">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading">
                {loading ? '—' : stats.storage_used_formatted || '0 B'}
              </span>
            </div>
          </div>

          {/* Stat 4: Recently Uploaded */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-[#8C7669]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A89284]">Recently Uploaded</span>
              <div className="w-8 h-8 rounded-xl bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center text-[#EA7957] shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading">
                {loading ? '—' : stats.recently_uploaded || 0}
              </span>
              <span className="text-[11px] font-mono text-[#A89284]">
                last 7 days
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. My Document Folders Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FBF8F5] font-heading">
              My Document Folders
            </h2>
            <p className="text-xs text-[#A89284]">
              Organize your research documents into custom folders for targeted AI retrieval.
            </p>
          </div>

          {/* Search Folders & Create CTA */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7669]" />
              <input
                type="text"
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                placeholder="Search folders..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#1A100B]/75 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957] focus:outline-none placeholder:text-[#6D594C] shadow-inner"
              />
              {folderSearch && (
                <button
                  type="button"
                  onClick={() => setFolderSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7669] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/15 text-[#F5ECE5] text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#EA7957]" />
              <span>Create Folder</span>
            </button>
          </div>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Card 0: + Create New Folder Card */}
          <div
            onClick={() => setIsCreateFolderOpen(true)}
            className="p-5 rounded-2xl border-2 border-dashed border-[#E7DAD1]/18 hover:border-[#EA7957]/80 bg-[#20140E]/50 backdrop-blur-lg hover:bg-[#2B1B14]/70 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer group min-h-[170px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#2A1911]/80 backdrop-blur-md border border-[#E7DAD1]/14 group-hover:border-[#EA7957]/40 flex items-center justify-center text-[#EA7957] group-hover:scale-110 transition-transform shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#FBF8F5] font-heading group-hover:text-[#EA7957] transition-colors block">
                + Create New Folder
              </span>
              <span className="text-[11px] text-[#8C7669] mt-0.5 block">
                Group subjects, notes &amp; syllabus
              </span>
            </div>
          </div>

          {/* Folder Cards */}
          {filteredFolders.map((folder) => {
            const isMenuOpen = activeMenuFolderId === folder.id;

            return (
              <div
                key={folder.id}
                onClick={() => navigate(`/student/folders/${folder.id}`)}
                className="p-5 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 hover:border-[#EA7957]/50 shadow-sm hover:shadow-xl hover:bg-[#2B1C15]/80 transition-all group flex flex-col justify-between cursor-pointer relative min-h-[170px]"
              >
                <div>
                  {/* Top Row: Icon & Action Menu */}
                  <div className="flex items-center justify-between pb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${folder.color || '#EA7957'}22`,
                        color: folder.color || '#EA7957',
                        border: `1px solid ${folder.color || '#EA7957'}44`,
                      }}
                    >
                      <Folder className="w-5 h-5" />
                    </span>

                    {/* Three-dot Action Menu */}
                    <div
                      className="relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuFolderId(isMenuOpen ? null : folder.id);
                      }}
                    >
                      <button
                        type="button"
                        className="p-1 rounded-lg text-[#8C7669] hover:text-white hover:bg-[#34241C]/80 transition-colors"
                        title="Folder options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 bg-[#1A110C]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-xl shadow-2xl py-1 z-30 divide-y divide-[#E7DAD1]/10 text-xs font-mono"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuFolderId(null);
                              navigate(`/student/folders/${folder.id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-[#D4C2B8] hover:bg-[#2D1C15]/80 hover:text-[#FBF8F5] flex items-center gap-2"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-[#EA7957]" />
                            <span>Open Folder</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuFolderId(null);
                              navigate('/student/chat', { state: { pinnedCollection: folder } });
                            }}
                            className="w-full text-left px-3 py-2 text-[#D4C2B8] hover:bg-[#2D1C15]/80 hover:text-[#FBF8F5] flex items-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#EA7957]" />
                            <span>Chat with Folder</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuFolderId(null);
                              setEditingFolder(folder);
                              setEditFolderData({
                                name: folder.name,
                                description: folder.description || '',
                                color: folder.color || '#EA7957',
                                icon: folder.icon || 'folder',
                              });
                            }}
                            className="w-full text-left px-3 py-2 text-[#D4C2B8] hover:bg-[#2D1C15]/80 hover:text-[#FBF8F5] flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Edit / Rename</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuFolderId(null);
                              setDeletingFolder(folder);
                              setDeleteOption('keep_docs');
                            }}
                            className="w-full text-left px-3 py-2 text-red-400 hover:bg-[#2D1C15]/80 hover:text-red-300 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Folder</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Folder Title & Description */}
                  <h3 className="font-bold text-sm text-[#FBF8F5] font-heading group-hover:text-[#EA7957] transition-colors truncate">
                    {folder.name}
                  </h3>
                  <p className="text-xs text-[#8C7669] line-clamp-2 mt-1 leading-relaxed">
                    {folder.description || 'No description provided.'}
                  </p>
                </div>

                {/* Bottom Row: Document count & updated date */}
                <div className="mt-4 pt-3 border-t border-[#E7DAD1]/10 flex items-center justify-between text-[11px] font-mono text-[#8C7669]">
                  <span className="px-2 py-0.5 rounded-full bg-[#180E09]/80 backdrop-blur-xs border border-[#E7DAD1]/10 text-[#D4C2B8]">
                    {folder.documents_count || 0} Docs
                  </span>
                  <span>{folder.updated_at ? new Date(folder.updated_at).toLocaleDateString() : 'Recent'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Unorganized Documents Quick Access (if any exist) */}
      {unorganizedDocs.length > 0 && (
        <section className="p-5 sm:p-6 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#322018] border border-[#483024] flex items-center justify-center text-[#EA7957]">
                <Files className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#FBF8F5] font-heading">
                  Unorganized Documents ({unorganizedDocs.length})
                </h3>
                <p className="text-xs text-[#8C7669]">
                  Documents uploaded outside of a folder. Move them into custom folders to structure your research.
                </p>
              </div>
            </div>

            <Link
              to="/student/documents"
              className="text-xs font-mono font-medium text-[#EA7957] hover:underline flex items-center gap-1"
            >
              <span>View in My Documents</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unorganizedDocs.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl bg-[#1A100B]/70 backdrop-blur-md border border-[#E7DAD1]/10 hover:border-[#EA7957]/30 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#EA7957] shrink-0" />
                  <span className="truncate font-medium text-[#FBF8F5]">{doc.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMovingDoc(doc);
                    setTargetFolderId(folders[0]?.id || '');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#2A1A12]/80 backdrop-blur-xs hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#EA7957] text-[11px] font-mono shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FolderInput className="w-3 h-3" />
                  <span>Move</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Recent Conversations & Quick Chat Access */}
      <section className="p-5 sm:p-6 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#EA7957]" />
            <h3 className="font-bold text-sm text-[#FBF8F5] font-heading">
              Recent Academic Inquiries
            </h3>
          </div>
          <Link to="/student/chat" className="text-xs font-mono text-[#EA7957] hover:underline flex items-center gap-1">
            <span>Open Chat Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentConversations.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8C7669] space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-[#EA7957]" />
            <p>No recent conversations found. Ask your first academic question!</p>
            <Link
              to="/student/chat"
              className="inline-block px-3 py-1.5 rounded-lg bg-[#EA7957] text-white text-xs font-mono uppercase mt-1 shadow-md shadow-[#EA7957]/20"
            >
              Start New Chat
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentConversations.slice(0, 6).map((conv) => (
              <Link
                key={conv.id}
                to={`/student/chat?id=${conv.id}`}
                className="p-3.5 rounded-xl bg-[#1A100B]/70 backdrop-blur-md border border-[#E7DAD1]/10 hover:border-[#EA7957]/50 hover:bg-[#251711]/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8C7669]">
                    <span className="text-[#EA7957]">
                      {conv.scope === 'collection' && conv.collection_name
                        ? `📁 ${conv.collection_name}`
                        : conv.scope === 'document' && conv.document_title
                        ? `📄 ${conv.document_title}`
                        : '🌐 All Documents'}
                    </span>
                    <span>{conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <p className="text-xs font-medium text-[#FBF8F5] truncate group-hover:text-[#EA7957] transition-colors">
                    {conv.title || 'Inquiry Session'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8C7669] pt-1">
                  <span>{conv.message_count || 1} message(s)</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* MODAL 1: Create New Folder */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#EA7957]" />
                <span>Create New Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateFolderOpen(false)}
                className="text-[#8C7669] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={newFolderData.name}
                  onChange={(e) => setNewFolderData({ ...newFolderData, name: e.target.value })}
                  placeholder="e.g. Semester 5 Notes, Operating Systems, Java..."
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-sm text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newFolderData.description}
                  onChange={(e) => setNewFolderData({ ...newFolderData, description: e.target.value })}
                  placeholder="e.g. Unit 1 to 4 lecture notes and laboratory guides"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none resize-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-2">
                  Folder Color Accent
                </label>
                <div className="flex items-center gap-3">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewFolderData({ ...newFolderData, color: c.value })}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        newFolderData.color === c.value ? 'scale-115 ring-2 ring-white shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    >
                      {newFolderData.color === c.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderData.name.trim()}
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold uppercase shadow-lg shadow-[#EA7957]/25 disabled:opacity-50 cursor-pointer"
                >
                  {creatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Folder */}
      {editingFolder && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#EA7957]" />
                <span>Edit Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingFolder(null)}
                className="text-[#8C7669] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={editFolderData.name}
                  onChange={(e) => setEditFolderData({ ...editFolderData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-sm text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={editFolderData.description}
                  onChange={(e) => setEditFolderData({ ...editFolderData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none resize-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-2">
                  Folder Color
                </label>
                <div className="flex items-center gap-3">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setEditFolderData({ ...editFolderData, color: c.value })}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        editFolderData.color === c.value ? 'scale-115 ring-2 ring-white shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                    >
                      {editFolderData.color === c.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold uppercase shadow-lg shadow-[#EA7957]/25 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Folder Safe Dialog */}
      {deletingFolder && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center shadow-xs">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#FBF8F5] font-heading">Delete Folder</h3>
                <p className="text-xs text-[#8C7669]">Folder: {deletingFolder.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#D4C2B8] leading-relaxed">
              Choose what happens to the documents currently inside this folder:
            </p>

            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  deleteOption === 'keep_docs'
                    ? 'border-[#EA7957]/80 bg-[#EA7957]/15 shadow-sm'
                    : 'border-[#E7DAD1]/12 bg-[#1A100B]/60 hover:bg-[#251711]/70'
                }`}
              >
                <input
                  type="radio"
                  name="del_folder_opt"
                  checked={deleteOption === 'keep_docs'}
                  onChange={() => setDeleteOption('keep_docs')}
                  className="mt-0.5 accent-[#EA7957]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#FBF8F5]">Keep documents safe (Move to Unorganized)</div>
                  <div className="text-[11px] text-[#8C7669] mt-0.5">
                    Deletes only the folder tag. Files remain in your library.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  deleteOption === 'delete_all'
                    ? 'border-red-500/80 bg-red-950/40 shadow-sm'
                    : 'border-[#E7DAD1]/12 bg-[#1A100B]/60 hover:bg-[#251711]/70'
                }`}
              >
                <input
                  type="radio"
                  name="del_folder_opt"
                  checked={deleteOption === 'delete_all'}
                  onChange={() => setDeleteOption('delete_all')}
                  className="mt-0.5 accent-red-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-red-300">Permanently delete folder AND all documents</div>
                  <div className="text-[11px] text-[#8C7669] mt-0.5">
                    Irreversibly deletes all files, vector chunks, and citations.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
              <button
                type="button"
                onClick={() => setDeletingFolder(null)}
                className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFolder}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Move Unorganized Doc */}
      {movingDoc && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading flex items-center gap-2">
                <FolderInput className="w-4 h-4 text-[#EA7957]" />
                <span>Move to Folder</span>
              </h3>
              <button type="button" onClick={() => setMovingDoc(null)} className="text-[#8C7669] hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#D4C2B8]">
              Move <strong className="text-white">{movingDoc.title}</strong> into a custom folder:
            </p>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                Destination Folder
              </label>
              <select
                value={targetFolderId}
                onChange={(e) => setTargetFolderId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="">Select a folder...</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
              <button
                type="button"
                onClick={() => setMovingDoc(null)}
                className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMoveUnorganizedDoc}
                disabled={!targetFolderId}
                className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold uppercase shadow-lg shadow-[#EA7957]/25 disabled:opacity-50 cursor-pointer"
              >
                Move Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
