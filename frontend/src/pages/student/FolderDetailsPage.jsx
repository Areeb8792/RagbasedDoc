import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentIntelligenceService } from '../../services/documentIntelligenceService';
import {
  Folder,
  ArrowLeft,
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  Search,
  Plus,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Edit2,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  FolderInput,
  X,
  File,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FolderDetailsPage = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [folder, setFolder] = useState(null);
  const [allFolders, setAllFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name' | 'size'

  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [editFolderData, setEditFolderData] = useState({ name: '', description: '', color: '#EA7957', icon: 'folder' });

  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState('keep_docs'); // 'keep_docs' | 'delete_all'

  const [moveDoc, setMoveDoc] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState('');

  const [deleteDoc, setDeleteDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const colorOptions = [
    { label: 'Terracotta', value: '#EA7957' },
    { label: 'Sage', value: '#BDD9B0' },
    { label: 'Warm Charcoal', value: '#35271F' },
    { label: 'Sky Blue', value: '#3B82F6' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Purple', value: '#8B5CF6' },
  ];

  const iconOptions = ['folder', 'book', 'code', 'file-text', 'layers', 'database'];

  const loadFolderAndDocuments = async () => {
    try {
      setLoading(true);
      const [collsData, docsData] = await Promise.all([
        documentIntelligenceService.getCollections(),
        documentIntelligenceService.getPersonalDocuments({ collection_id: folderId }),
      ]);

      const colls = collsData.results || collsData || [];
      const current = colls.find((c) => String(c.id) === String(folderId));
      if (!current) {
        toast.error('Folder not found.');
        navigate('/student/dashboard');
        return;
      }

      setFolder(current);
      setAllFolders(colls);
      setEditFolderData({
        name: current.name,
        description: current.description || '',
        color: current.color || '#EA7957',
        icon: current.icon || 'folder',
      });
      setDocuments(docsData.results || docsData || []);
    } catch (err) {
      console.error('Failed to load folder details:', err);
      toast.error('Error loading folder.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolderAndDocuments();
  }, [folderId]);

  // Handle Multi-file Upload
  const handleFilesUpload = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('collection_id', folderId);

    try {
      setUploadProgress(40);
      const response = await documentIntelligenceService.bulkUploadPersonalDocuments(
        formData,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(percent, 90));
          }
        }
      );
      setUploadProgress(100);
      toast.success(`Successfully uploaded and indexed ${response.uploaded_count || files.length} document(s)!`);
      if (response.errors && response.errors.length > 0) {
        response.errors.forEach((err) => toast.error(err));
      }
      loadFolderAndDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.error || 'Failed to upload files. Please retry.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Edit folder
  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    if (!editFolderData.name.trim()) {
      toast.error('Folder name cannot be empty.');
      return;
    }
    try {
      const updated = await documentIntelligenceService.updateCollection(folderId, editFolderData);
      setFolder(updated);
      setIsEditFolderOpen(false);
      toast.success('Folder updated successfully.');
    } catch (err) {
      toast.error('Failed to update folder.');
    }
  };

  // Delete folder
  const handleDeleteFolder = async () => {
    try {
      const deleteDocs = deleteOption === 'delete_all';
      await documentIntelligenceService.deleteCollection(folderId, deleteDocs);
      toast.success(
        deleteDocs ? 'Folder and all documents deleted.' : 'Folder deleted. Documents moved to Unorganized.'
      );
      navigate('/student/dashboard');
    } catch (err) {
      toast.error('Failed to delete folder.');
    }
  };

  // Move document
  const handleMoveDocument = async () => {
    if (!moveDoc) return;
    try {
      await documentIntelligenceService.movePersonalDocument(moveDoc.id, targetFolderId || null);
      toast.success(
        targetFolderId ? 'Document moved to destination folder.' : 'Document moved to Unorganized.'
      );
      setMoveDoc(null);
      setTargetFolderId('');
      loadFolderAndDocuments();
    } catch (err) {
      toast.error('Failed to move document.');
    }
  };

  // Delete document
  const handleDeleteDocument = async () => {
    if (!deleteDoc) return;
    try {
      await documentIntelligenceService.deletePersonalDocument(deleteDoc.id);
      toast.success('Document deleted successfully.');
      setDeleteDoc(null);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id));
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  // Reprocess document
  const handleReprocessDocument = async (docId) => {
    try {
      toast.loading('Reprocessing & vector indexing document...', { id: `rep-${docId}` });
      await documentIntelligenceService.reprocessPersonalDocument(docId);
      toast.success('Document reprocessed successfully!', { id: `rep-${docId}` });
      loadFolderAndDocuments();
    } catch (err) {
      toast.error('Reprocessing failed.', { id: `rep-${docId}` });
    }
  };

  // Preview document
  const handleOpenPreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    try {
      const preview = await documentIntelligenceService.getDocumentPreview(doc.id);
      setPreviewData(preview);
    } catch (err) {
      toast.error('Failed to load document preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Chat with folder
  const handleChatWithFolder = () => {
    navigate('/student/chat', {
      state: {
        pinnedCollection: folder,
      },
    });
  };

  // Chat with single doc
  const handleChatWithDocument = (doc) => {
    navigate('/student/chat', {
      state: {
        pinnedCollection: folder,
        pinnedDocument: doc,
      },
    });
  };

  // Filtered and sorted documents
  const filteredDocuments = documents
    .filter((doc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.original_filename && doc.original_filename.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'size') return (b.file_size || 0) - (a.file_size || 0);
      return 0;
    });

  const getFileIcon = (fileType) => {
    const ft = (fileType || '').toLowerCase();
    if (ft.includes('pdf')) return <FileText className="w-5 h-5 text-[#EA7957]" />;
    if (ft.includes('doc') || ft.includes('word')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (ft.includes('ppt') || ft.includes('presentation')) return <FileSpreadsheet className="w-5 h-5 text-amber-400" />;
    if (ft.includes('txt') || ft.includes('md')) return <FileCode className="w-5 h-5 text-emerald-400" />;
    return <File className="w-5 h-5 text-[#A89284]" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-6 animate-pulse">
        <div className="h-8 w-48 bg-[#2A1D17] rounded-lg" />
        <div className="h-40 bg-[#271A14] rounded-2xl border border-[#3E2B21]" />
        <div className="h-64 bg-[#271A14] rounded-2xl border border-[#3E2B21]" />
      </div>
    );
  }

  if (!folder) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <Link
            to="/student/dashboard"
            className="w-9 h-9 rounded-xl bg-[#2A1D17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center text-[#D4C2B8] hover:text-white hover:bg-[#38261E]/90 hover:border-[#EA7957]/30 transition-all shadow-xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8C7669]">
              <Link to="/student/dashboard" className="hover:text-[#EA7957] transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#D4C2B8]">My Folders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading tracking-tight flex items-center gap-2.5 mt-0.5">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${folder.color || '#EA7957'}25`, color: folder.color || '#EA7957' }}
              >
                <Folder className="w-4 h-4" />
              </span>
              <span>{folder.name}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleChatWithFolder}
            className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-[#EA7957]/25 transition-all cursor-pointer active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat With Folder</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/15 text-[#F5ECE5] text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#EA7957]" />
            <span>Upload Files</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditFolderOpen(true)}
            className="p-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Edit Folder Name / Description"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteFolderOpen(true)}
            className="p-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#3F1A1A]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-red-400 transition-colors cursor-pointer shadow-xs"
            title="Delete Folder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Folder Overview Card & Description */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#231711]/75 backdrop-blur-2xl border border-[#E7DAD1]/12 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs sm:text-sm text-[#D4C2B8] leading-relaxed">
            {folder.description || 'No folder description provided. Upload documents below to expand this folder.'}
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-[#8C7669] pt-1">
            <span>{documents.length} Document(s)</span>
            <span>•</span>
            <span>Updated {folder.updated_at ? new Date(folder.updated_at).toLocaleDateString() : 'Recently'}</span>
          </div>
        </div>

        {/* Quick Scope Notification */}
        <div className="px-4 py-3 rounded-xl bg-[#180E09]/80 backdrop-blur-md border border-[#E7DAD1]/10 text-xs text-[#A89284] flex items-center gap-3 shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#EA7957] animate-pulse" />
          <div>
            <div className="font-mono text-[11px] font-bold text-[#FBF8F5] uppercase">Isolated RAG Scope</div>
            <div className="text-[10px] text-[#8C7669]">Questions in this folder will query only these {documents.length} files.</div>
          </div>
        </div>
      </div>

      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
        onChange={(e) => handleFilesUpload(e.target.files)}
        className="hidden"
      />

      {/* 3. Drag-and-Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer relative overflow-hidden ${
          isDragging
            ? 'border-[#EA7957] bg-[#3A2218]/70 backdrop-blur-xl shadow-xl scale-[1.005]'
            : 'border-[#E7DAD1]/18 hover:border-[#EA7957]/60 bg-[#20140E]/60 backdrop-blur-lg hover:bg-[#2A1C16]/75 shadow-sm'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2A1911]/80 backdrop-blur-md border border-[#E7DAD1]/14 flex items-center justify-center text-[#EA7957] shadow-sm">
            <UploadCloud className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm sm:base font-bold text-[#FBF8F5] font-heading">
              Drag &amp; Drop documents into <span className="text-[#EA7957]">{folder.name}</span>
            </h3>
            <p className="text-xs text-[#8C7669] mt-0.5">
              or click to browse from your computer. Upload multiple files at once.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#A89284] px-3 py-1 rounded-full bg-[#180E09]/80 backdrop-blur-xs border border-[#E7DAD1]/10">
            <span>Supported: PDF, DOCX, PPTX, TXT, MD</span>
            <span>•</span>
            <span>Up to 25MB per file</span>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="absolute inset-0 bg-[#160E0A]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 space-y-3 z-10">
            <RefreshCw className="w-7 h-7 text-[#EA7957] animate-spin" />
            <div className="space-y-1.5 w-full max-w-md text-center">
              <div className="flex items-center justify-between text-xs font-mono text-[#D4C2B8]">
                <span>Extracting, OCR &amp; Vector Indexing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#2D1C14] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#EA7957] to-[#df6a47] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Document List & Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#FBF8F5] font-heading">
              Folder Documents ({documents.length})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7669]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in folder..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#1A100B]/75 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957] focus:outline-none placeholder:text-[#6D594C] shadow-inner"
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

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#1A100B]/75 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#D4C2B8] font-mono focus:border-[#EA7957] focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Title A-Z</option>
              <option value="size">Sort: File Size</option>
            </select>
          </div>
        </div>

        {/* Documents Table / Cards */}
        {filteredDocuments.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center text-[#EA7957] mx-auto opacity-70">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FBF8F5] font-heading">
                {searchQuery ? 'No matching documents found' : 'No documents in this folder yet'}
              </h3>
              <p className="text-xs text-[#8C7669] mt-1">
                {searchQuery
                  ? 'Try clearing your search query.'
                  : 'Drop study materials, notes, or research papers above to begin asking grounded questions.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#E7DAD1]/10 bg-[#231711]/70 backdrop-blur-xl border border-[#E7DAD1]/10 rounded-2xl overflow-hidden shadow-md">
            {filteredDocuments.map((doc) => {
              const isIndexed = doc.document_status === 'indexed';
              const isFailed = doc.document_status === 'failed';
              const isProcessing = !isIndexed && !isFailed;

              return (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-[#2C1D16]/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#2E1E17]/80 backdrop-blur-md border border-[#E7DAD1]/12 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#FBF8F5] font-heading truncate max-w-md group-hover:text-[#EA7957] transition-colors">
                          {doc.title || doc.original_filename}
                        </h4>
                        {/* Status Badge */}
                        {isIndexed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#1E3324]/80 backdrop-blur-xs text-[#76C893] border border-[#76C893]/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Indexed &amp; Active</span>
                          </span>
                        ) : isFailed ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#3D1E1E]/80 backdrop-blur-xs text-red-400 border border-red-500/30"
                            title={doc.processing_error || 'Processing encountered an error'}
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Processing Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#35251E]/80 backdrop-blur-xs text-[#EA7957] border border-[#EA7957]/30 animate-pulse">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>Ingesting &amp; Vectorizing...</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-[#8C7669] flex-wrap">
                        <span>{doc.original_filename}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        {doc.page_count > 0 && (
                          <>
                            <span>•</span>
                            <span>{doc.page_count} page(s)</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Actions */}
                  <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 flex-wrap">
                    {/* Ask in Chatbot isolated to this document */}
                    <button
                      type="button"
                      onClick={() => handleChatWithDocument(doc)}
                      className="px-3 py-1.5 rounded-lg bg-[#2E1E17]/80 backdrop-blur-md hover:bg-[#3D281F]/90 border border-[#E7DAD1]/14 text-[#EA7957] hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-xs"
                      title="Ask question isolated to this specific file"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    {/* Preview document */}
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(doc)}
                      className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-white hover:bg-[#3D2C22]/80 transition-colors"
                      title="Preview Chunks & Metadata"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Download document */}
                    <a
                      href={`/api/v1/documents/personal/${doc.id}/download/`}
                      download
                      className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-white hover:bg-[#3D2C22]/80 transition-colors"
                      title="Download original file"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {/* Move to another folder */}
                    <button
                      type="button"
                      onClick={() => {
                        setMoveDoc(doc);
                        setTargetFolderId(doc.collection || '');
                      }}
                      className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-white hover:bg-[#3D2C22]/80 transition-colors"
                      title="Move to another folder"
                    >
                      <FolderInput className="w-4 h-4" />
                    </button>

                    {/* Reprocess if failed */}
                    {isFailed && (
                      <button
                        type="button"
                        onClick={() => handleReprocessDocument(doc.id)}
                        className="p-1.5 rounded-lg text-[#EA7957] hover:text-white hover:bg-[#3D2C22]/80 transition-colors"
                        title="Retry processing"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete document */}
                    <button
                      type="button"
                      onClick={() => setDeleteDoc(doc)}
                      className="p-1.5 rounded-lg text-[#8C7669] hover:text-red-400 hover:bg-[#3F1A1A]/80 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Edit Folder */}
      {isEditFolderOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#EA7957]" />
                <span>Edit Folder</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditFolderOpen(false)}
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
                  placeholder="e.g. Operating Systems Notes"
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-sm text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={editFolderData.description}
                  onChange={(e) => setEditFolderData({ ...editFolderData, description: e.target.value })}
                  placeholder="What topics or documents belong here?"
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
                      title={c.label}
                    >
                      {editFolderData.color === c.value && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
                <button
                  type="button"
                  onClick={() => setIsEditFolderOpen(false)}
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

      {/* MODAL 2: Delete Folder with Safe Option */}
      {isDeleteFolderOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center shadow-xs">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#FBF8F5] font-heading">Delete Folder</h3>
                <p className="text-xs text-[#8C7669]">Folder: {folder.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#D4C2B8] leading-relaxed">
              Choose how you want to handle the <strong className="text-white">{documents.length} document(s)</strong> currently inside this folder:
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
                  name="del_opt"
                  checked={deleteOption === 'keep_docs'}
                  onChange={() => setDeleteOption('keep_docs')}
                  className="mt-0.5 accent-[#EA7957]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#FBF8F5]">Keep documents safe (Move to Unorganized)</div>
                  <div className="text-[11px] text-[#8C7669] mt-0.5">
                    Deletes the folder container only. Your files and embeddings remain safe in your personal library.
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
                  name="del_opt"
                  checked={deleteOption === 'delete_all'}
                  onChange={() => setDeleteOption('delete_all')}
                  className="mt-0.5 accent-red-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-red-300">Permanently delete folder AND all documents</div>
                  <div className="text-[11px] text-[#8C7669] mt-0.5">
                    Removes the folder and permanently deletes all files, vector chunks, and citations.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
              <button
                type="button"
                onClick={() => setIsDeleteFolderOpen(false)}
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

      {/* MODAL 3: Move Document */}
      {moveDoc && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading flex items-center gap-2">
                <FolderInput className="w-4 h-4 text-[#EA7957]" />
                <span>Move Document</span>
              </h3>
              <button type="button" onClick={() => setMoveDoc(null)} className="text-[#8C7669] hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#D4C2B8]">
              Move <strong className="text-white">{moveDoc.title}</strong> to a different folder:
            </p>

            <div>
              <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                Select Destination Folder
              </label>
              <select
                value={targetFolderId}
                onChange={(e) => setTargetFolderId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="">📂 Unorganized (No folder)</option>
                {allFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name} {String(f.id) === String(folderId) ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
              <button
                type="button"
                onClick={() => setMoveDoc(null)}
                className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMoveDocument}
                className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold uppercase shadow-lg shadow-[#EA7957]/25 cursor-pointer"
              >
                Move Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Single Document Confirmation */}
      {deleteDoc && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-[#FBF8F5] font-heading flex items-center gap-2 text-red-400">
              <Trash2 className="w-4 h-4" />
              <span>Delete Document</span>
            </h3>
            <p className="text-xs text-[#D4C2B8] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{deleteDoc.title}</strong>? Its indexed chunks and vector embeddings will be removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DAD1]/10">
              <button
                type="button"
                onClick={() => setDeleteDoc(null)}
                className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDocument}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Document Preview with Sample Chunks */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-[#EA7957] shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-[#FBF8F5] font-heading truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-xs font-mono text-[#8C7669]">{previewDoc.original_filename}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewData(null);
                }}
                className="text-[#8C7669] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {previewLoading ? (
                <div className="py-12 text-center text-xs text-[#8C7669]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#EA7957]" />
                  <span>Loading document chunks &amp; metadata...</span>
                </div>
              ) : previewData ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12">
                      <span className="text-[10px] text-[#8C7669] uppercase block">Format</span>
                      <span className="font-bold text-[#FBF8F5] uppercase">{previewData.file_type}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12">
                      <span className="text-[10px] text-[#8C7669] uppercase block">Pages</span>
                      <span className="font-bold text-[#FBF8F5]">{previewData.page_count || 1}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12">
                      <span className="text-[10px] text-[#8C7669] uppercase block">Total Chunks</span>
                      <span className="font-bold text-[#FBF8F5]">{previewData.chunks_count || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12">
                      <span className="text-[10px] text-[#8C7669] uppercase block">Status</span>
                      <span className="font-bold text-[#76C893]">{previewData.document_status}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-[#D4C2B8] uppercase">
                      Sample Vectorized Chunks ({previewData.sample_chunks?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {previewData.sample_chunks?.map((chunk, idx) => (
                        <div
                          key={chunk.id || idx}
                          className="p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs space-y-1.5 shadow-inner"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#8C7669]">
                            <span>Chunk #{chunk.chunk_index + 1} {chunk.page_number ? `• Page ${chunk.page_number}` : ''}</span>
                            <span>{chunk.token_count || 0} tokens</span>
                          </div>
                          <p className="text-[#D4C2B8] font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                            {chunk.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E7DAD1]/10 shrink-0">
              <a
                href={`/api/v1/documents/personal/${previewDoc.id}/download/`}
                download
                className="px-3.5 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  handleChatWithDocument(previewDoc);
                }}
                className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold uppercase flex items-center gap-1.5 shadow-lg shadow-[#EA7957]/25 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat With This Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderDetailsPage;
