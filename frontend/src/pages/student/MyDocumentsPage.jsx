import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentIntelligenceService } from '../../services/documentIntelligenceService';
import {
  Files,
  UploadCloud,
  FolderPlus,
  Folder,
  FileText,
  FileCode,
  FileSpreadsheet,
  Search,
  Sparkles,
  BookOpen,
  Brain,
  MessageSquare,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Layers,
  HelpCircle,
  RotateCw,
  X,
  ExternalLink,
  Sliders,
  Filter,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MyDocumentsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Data states
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null); // null = "all"
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // 'UPLOADING' | 'EXTRACTING' | 'CHUNKING' | 'INDEXING' | 'READY'
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    collection_id: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Modal states
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [newCollectionData, setNewCollectionData] = useState({
    name: '',
    description: '',
    color: '#EA7957',
  });
  const [creatingCollection, setCreatingCollection] = useState(false);

  // AI Feature Modals
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [summaryDoc, setSummaryDoc] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [studyDoc, setStudyDoc] = useState(null);
  const [studyData, setStudyData] = useState(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyActiveTab, setStudyActiveTab] = useState('quiz'); // 'quiz' | 'flashcards' | 'definitions'
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({});

  // Color options for collections
  const colorOptions = [
    { label: 'Terracotta', value: '#EA7957' },
    { label: 'Sage', value: '#BDD9B0' },
    { label: 'Warm Charcoal', value: '#35271F' },
    { label: 'Sky Blue', value: '#3B82F6' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Purple', value: '#8B5CF6' },
  ];

  // Fetch Collections & Documents
  const loadData = async () => {
    try {
      setLoading(true);
      const [collsData, docsData] = await Promise.all([
        documentIntelligenceService.getCollections(),
        documentIntelligenceService.getPersonalDocuments(
          selectedCollection ? { collection_id: selectedCollection } : {}
        ),
      ]);
      setCollections(collsData.results || collsData || []);
      setDocuments(docsData.results || docsData || []);
    } catch (err) {
      toast.error('Failed to load personal documents and collections.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCollection]);

  // Handle Drag & Drop
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = ['.pdf', '.docx', '.pptx', '.txt', '.md'];
    if (!allowed.includes(ext)) {
      toast.error(`Unsupported file type. Please upload ${allowed.join(', ')}`);
      return;
    }
    setSelectedFile(file);
    if (!uploadForm.title) {
      const derived = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadForm((prev) => ({ ...prev, title: derived }));
    }
  };

  // Upload handler with real progression stages
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select or drop a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadForm.title) formData.append('title', uploadForm.title);
    if (uploadForm.description) formData.append('description', uploadForm.description);
    if (uploadForm.collection_id || selectedCollection) {
      formData.append('collection_id', uploadForm.collection_id || selectedCollection);
    }
    formData.append('is_personal', 'true');

    try {
      setUploading(true);
      setUploadStage('UPLOADING FILE');
      setUploadProgress(20);

      const stageTimer1 = setTimeout(() => {
        setUploadStage('EXTRACTING TEXT & METADATA');
        setUploadProgress(50);
      }, 700);

      const stageTimer2 = setTimeout(() => {
        setUploadStage('STRUCTURAL CHUNKING & EMBEDDINGS');
        setUploadProgress(80);
      }, 1600);

      const res = await documentIntelligenceService.uploadPersonalDocument(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 40) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setUploadProgress(100);
      setUploadStage('INDEXED & READY');

      toast.success('Document indexed successfully!');
      setSelectedFile(null);
      setUploadForm({ title: '', description: '', collection_id: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        setUploading(false);
        setUploadStage('');
        setUploadProgress(0);
        loadData();
      }, 800);
    } catch (err) {
      setUploading(false);
      setUploadStage('');
      const errDetail = err.response?.data?.file?.[0] || err.response?.data?.message || 'Upload failed.';
      toast.error(`Upload error: ${errDetail}`);
      console.error(err);
    }
  };

  // Create Collection Handler
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionData.name.trim()) {
      toast.error('Collection name is required.');
      return;
    }
    try {
      setCreatingCollection(true);
      const created = await documentIntelligenceService.createCollection(newCollectionData);
      toast.success(`Collection "${created.name}" created!`);
      setNewCollectionData({ name: '', description: '', color: '#EA7957' });
      setIsCreateCollectionOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create collection.');
    } finally {
      setCreatingCollection(false);
    }
  };

  // Delete Document Handler
  const handleDeleteDocument = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove its vectors and text index.`)) {
      return;
    }
    try {
      await documentIntelligenceService.deletePersonalDocument(id);
      toast.success('Document deleted.');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  // Reprocess Document Handler
  const handleReprocessDocument = async (id) => {
    try {
      toast.loading('Reprocessing document...', { id: 'reprocess' });
      await documentIntelligenceService.reprocessPersonalDocument(id);
      toast.success('Reprocessing complete!', { id: 'reprocess' });
      loadData();
    } catch (err) {
      toast.error('Reprocessing failed.', { id: 'reprocess' });
    }
  };

  // Preview Document Handler
  const handleOpenPreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    try {
      const data = await documentIntelligenceService.getDocumentPreview(doc.id);
      setPreviewDoc(data);
    } catch (err) {
      toast.error('Could not load preview text.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Summary Handler
  const handleOpenSummary = async (doc) => {
    setSummaryDoc(doc);
    setSummaryData(null);
    setSummaryLoading(true);
    try {
      const data = await documentIntelligenceService.summarizeDocument(doc.id);
      setSummaryData(data.summary);
    } catch (err) {
      toast.error('Could not generate document summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Study Materials Handler
  const handleOpenStudy = async (doc) => {
    setStudyDoc(doc);
    setStudyData(null);
    setStudyLoading(true);
    setCurrentFlashcardIndex(0);
    setIsCardFlipped(false);
    setSelectedQuizAnswers({});
    try {
      const data = await documentIntelligenceService.getStudyMaterials(doc.id);
      setStudyData(data.study_materials);
    } catch (err) {
      toast.error('Could not generate study materials.');
    } finally {
      setStudyLoading(false);
    }
  };

  // Chat with Document
  const handleChatWithDocument = (doc) => {
    navigate(`/student/chat?document_id=${doc.id}&document_title=${encodeURIComponent(doc.title)}`);
  };

  // Chat with Collection
  const handleChatWithCollection = (collectionId, collectionName) => {
    navigate(`/student/chat?collection_id=${collectionId}&collection_name=${encodeURIComponent(collectionName)}`);
  };

  // Filter documents by search query
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q) ||
      doc.collection_name?.toLowerCase().includes(q) ||
      doc.original_filename?.toLowerCase().includes(q)
    );
  });

  // Calculate summary metrics
  const totalDocs = documents.length;
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunks_count || 0), 0);
  const totalPages = documents.reduce((sum, d) => sum + (d.page_count || 1), 0);

  // File type icon helper
  const getFileIcon = (fileType) => {
    const t = (fileType || '').toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-5 h-5 text-[#EA7957]" />;
    if (t.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (t.includes('ppt')) return <FileSpreadsheet className="w-5 h-5 text-amber-500" />;
    return <FileCode className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase bg-[#EA7957]/15 text-[#EA7957] border border-[#EA7957]/30">
              Domain-Agnostic RAG
            </span>
            <span className="text-xs text-[#8C7669] font-mono">Personal Document Ingestion</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#FBF8F5] tracking-tight font-heading">
            My Documents & Collections
          </h1>
          <p className="text-sm text-[#D4C2B8] mt-1 max-w-2xl leading-relaxed">
            Upload study resources, lecture slides, papers, or textbooks across any subject.
            Morpheus extracts text, builds vector embeddings, and enables isolated grounded questioning.
          </p>
        </div>

        {/* Global Telemetry Metrics */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl border border-[#E7DAD1]/12 bg-[#231711]/70 backdrop-blur-xl text-center shadow-sm">
            <span className="block text-[10px] font-mono text-[#8C7669] uppercase">Documents</span>
            <span className="text-lg font-bold font-mono text-[#FBF8F5]">{totalDocs}</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl border border-[#E7DAD1]/12 bg-[#231711]/70 backdrop-blur-xl text-center shadow-sm">
            <span className="block text-[10px] font-mono text-[#8C7669] uppercase">Collections</span>
            <span className="text-lg font-bold font-mono text-[#FBF8F5]">{collections.length}</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl border border-[#E7DAD1]/12 bg-[#231711]/70 backdrop-blur-xl text-center shadow-sm">
            <span className="block text-[10px] font-mono text-[#8C7669] uppercase">Vector Chunks</span>
            <span className="text-lg font-bold font-mono text-[#EA7957]">{totalChunks}</span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="bg-[#231711]/75 backdrop-blur-2xl rounded-2xl border border-[#E7DAD1]/12 p-6 shadow-xl">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[#EA7957] bg-[#3A2218]/70 backdrop-blur-xl scale-[1.005] shadow-xl'
                : selectedFile
                ? 'border-[#76C893]/60 bg-[#1E3324]/40 backdrop-blur-md'
                : 'border-[#E7DAD1]/18 hover:border-[#EA7957]/60 bg-[#20140E]/60 backdrop-blur-lg hover:bg-[#2A1C16]/75 shadow-sm'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.pptx,.txt,.md"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                  selectedFile
                    ? 'bg-[#1E3324]/80 text-[#76C893] border border-[#76C893]/40'
                    : 'bg-[#2A1911]/80 text-[#EA7957] border border-[#E7DAD1]/14'
                }`}
              >
                {selectedFile ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-[#FBF8F5] font-mono">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[#8C7669] mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion pipeline
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-[#FBF8F5]">
                    Drop any document here, or <span className="text-[#EA7957] underline">browse files</span>
                  </p>
                  <p className="text-xs text-[#8C7669] mt-1">
                    Supports <span className="font-mono text-[#FBF8F5]">PDF, DOCX, PPTX, TXT, MD</span> up to 25MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Optional Metadata Controls */}
          {selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#D4C2B8] font-mono uppercase mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g. Stanford CS229 Lecture 1"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] focus:outline-hidden focus:border-[#EA7957]/70 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4C2B8] font-mono uppercase mb-1">
                  Assign to Collection
                </label>
                <select
                  value={uploadForm.collection_id || selectedCollection || ''}
                  onChange={(e) => setUploadForm({ ...uploadForm, collection_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] focus:outline-hidden focus:border-[#EA7957]/70 shadow-inner cursor-pointer"
                >
                  <option value="">General (No Collection)</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      📁 {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4C2B8] font-mono uppercase mb-1">
                  Brief Description (Optional)
                </label>
                <input
                  type="text"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="e.g. Supervised learning algorithms and notes"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] focus:outline-hidden focus:border-[#EA7957]/70 shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Upload & Ingestion Progression Bar */}
          {uploading && (
            <div className="p-4 rounded-xl border border-[#76C893]/30 bg-[#1E3324]/40 backdrop-blur-md space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-[#76C893] flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  {uploadStage}
                </span>
                <span className="font-bold text-[#76C893]">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#2D1C14] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#EA7957] to-[#df6a47] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedFile && !uploading && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 text-xs font-mono uppercase text-[#D4C2B8] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase bg-[#EA7957] hover:bg-[#df6a47] text-white transition-all shadow-lg shadow-[#EA7957]/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ingest &amp; Index Document</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Knowledge Collections Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#EA7957]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#FBF8F5] font-mono">
              Document Folders
            </h2>
          </div>

          <button
            onClick={() => setIsCreateCollectionOpen(true)}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase px-3 py-1.5 rounded-xl border border-[#E7DAD1]/15 bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 text-[#F5ECE5] transition-all cursor-pointer shadow-xs"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#EA7957]" />
            <span>New Collection</span>
          </button>
        </div>

        {/* Collections Scroll Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCollection(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCollection === null
                ? 'bg-[#EA7957]/20 border border-[#EA7957]/50 text-[#EA7957] font-bold shadow-sm'
                : 'bg-[#1A100B]/70 backdrop-blur-md text-[#D4C2B8] border border-[#E7DAD1]/12 hover:bg-[#281811]/80 hover:text-white'
            }`}
          >
            <span>All My Documents</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                selectedCollection === null ? 'bg-[#EA7957]/30 text-white' : 'bg-[#160D08]/80 text-[#8C7669]'
              }`}
            >
              {totalDocs}
            </span>
          </button>

          {collections.map((col) => {
            const isSelected = selectedCollection === col.id;
            return (
              <div key={col.id} className="flex items-center shrink-0">
                <button
                  onClick={() => setSelectedCollection(col.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#EA7957]/20 border border-[#EA7957]/50 text-[#EA7957] font-bold shadow-sm'
                      : 'bg-[#1A100B]/70 backdrop-blur-md text-[#D4C2B8] border border-[#E7DAD1]/12 hover:bg-[#281811]/80 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.color || '#EA7957' }}
                  />
                  <span>{col.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      isSelected ? 'bg-[#EA7957]/30 text-white' : 'bg-[#160D08]/80 text-[#8C7669]'
                    }`}
                  >
                    {col.documents_count || 0}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Action banner when a specific collection is pinned */}
        {selectedCollection && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#EA7957]/30 bg-[#2E1911]/70 backdrop-blur-md text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#EA7957]">Filtered to Collection:</span>
              <span className="font-bold text-[#FBF8F5]">
                {collections.find((c) => c.id === selectedCollection)?.name}
              </span>
              <span className="text-[#8C7669]">
                — Retrieval isolation is ACTIVE. Queries will retrieve strictly from this domain.
              </span>
            </div>
            <button
              onClick={() => {
                const cur = collections.find((c) => c.id === selectedCollection);
                handleChatWithCollection(cur.id, cur.name);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EA7957] text-white font-semibold hover:bg-[#df6a47] transition-all shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat in this Collection</span>
            </button>
          </div>
        )}
      </div>

      {/* Document List Header with Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8C7669] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search uploaded documents..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E7DAD1]/14 bg-[#1A100B]/75 backdrop-blur-md text-[#FBF8F5] focus:outline-hidden focus:border-[#EA7957] shadow-inner placeholder:text-[#6D594C]"
            />
          </div>

          <div className="text-xs font-mono text-[#8C7669]">
            Showing {filteredDocuments.length} of {totalDocs} indexed files
          </div>
        </div>

        {/* Documents Grid / Table */}
        {loading ? (
          <div className="py-16 text-center">
            <RotateCw className="w-8 h-8 text-[#EA7957] animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-[#8C7669]">Loading indexed document chunks...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[#E7DAD1]/15 bg-[#231711]/70 backdrop-blur-xl">
            <Files className="w-10 h-10 text-[#8C7669] mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-[#FBF8F5]">
              No documents found in this view
            </p>
            <p className="text-xs text-[#8C7669] mt-1">
              Drag and drop a PDF, DOCX, PPTX, or TXT file above to start questioning your materials.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredDocuments.map((doc) => {
              const isIndexed = doc.document_status === 'indexed';
              const isFailed = doc.document_status === 'failed';
              const isProcessing = !isIndexed && !isFailed;

              return (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl border border-[#E7DAD1]/10 bg-[#231711]/70 backdrop-blur-xl hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-lg"
                >
                  {/* Left: Document Info */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#2A1911]/80 backdrop-blur-md border border-[#E7DAD1]/12 text-[#EA7957] shadow-xs">
                      {getFileIcon(doc.file_type || doc.original_filename)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#FBF8F5] font-heading">
                          {doc.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-[#180E09]/80 backdrop-blur-xs text-[#A89284] border border-[#E7DAD1]/10">
                          .{doc.file_type || 'pdf'}
                        </span>
                        {doc.collection_name && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#EA7957]/15 text-[#EA7957] border border-[#EA7957]/30 flex items-center gap-1">
                            📁 {doc.collection_name}
                          </span>
                        )}
                      </div>

                      {doc.description && (
                        <p className="text-xs text-[#D4C2B8] line-clamp-1">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] font-mono text-[#8C7669] pt-1">
                        <span>{doc.page_count ? `${doc.page_count} pages` : 'Single file'}</span>
                        <span>•</span>
                        <span className="text-[#EA7957] font-bold">{doc.chunks_count || 0} chunks</span>
                        <span>•</span>
                        <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
                    {/* Status Badge */}
                    {isIndexed ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-[#1E3324]/80 backdrop-blur-xs text-[#76C893] border border-[#76C893]/30 flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        READY
                      </span>
                    ) : isFailed ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-[#3D1E1E]/80 backdrop-blur-xs text-red-400 border border-red-500/30 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        FAILED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-[#35251E]/80 backdrop-blur-xs text-[#EA7957] border border-[#EA7957]/30 flex items-center gap-1.5 animate-pulse">
                        <RotateCw className="w-3 h-3 animate-spin" />
                        {doc.document_status.toUpperCase()}
                      </span>
                    )}

                    {/* Action: Preview */}
                    <button
                      onClick={() => handleOpenPreview(doc)}
                      title="Preview Document Chunks"
                      className="p-2 rounded-xl border border-[#E7DAD1]/12 bg-[#2A1A12]/80 backdrop-blur-md text-[#D4C2B8] hover:text-white hover:bg-[#382319]/90 transition-all cursor-pointer shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Action: AI Summary */}
                    <button
                      onClick={() => handleOpenSummary(doc)}
                      title="Generate Executive Summary & Takeaways"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7DAD1]/12 bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 text-xs font-semibold text-[#F5ECE5] transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#EA7957]" />
                      <span>Summary</span>
                    </button>

                    {/* Action: Study Pack (Quiz + Flashcards) */}
                    <button
                      onClick={() => handleOpenStudy(doc)}
                      title="Generate Study Quiz and Flashcards"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7DAD1]/12 bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 text-xs font-semibold text-[#F5ECE5] transition-all cursor-pointer shadow-xs"
                    >
                      <Brain className="w-3.5 h-3.5 text-[#76C893]" />
                      <span>Study Pack</span>
                    </button>

                    {/* Action: Direct Chat */}
                    <button
                      onClick={() => handleChatWithDocument(doc)}
                      title="Chat directly grounded on this document"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EA7957] text-white text-xs font-bold hover:bg-[#df6a47] transition-all shadow-lg shadow-[#EA7957]/25 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask AI</span>
                    </button>

                    {/* Action: Reprocess if failed */}
                    {isFailed && (
                      <button
                        onClick={() => handleReprocessDocument(doc.id)}
                        title="Retry indexing"
                        className="p-2 rounded-xl border border-red-500/30 text-red-400 bg-red-950/30 hover:bg-red-950/50 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Action: Delete */}
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      title="Delete document"
                      className="p-2 rounded-xl border border-transparent text-[#8C7669] hover:text-red-400 hover:bg-[#3F1A1A]/70 transition-all cursor-pointer"
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

      {/* ================= MODAL: CREATE COLLECTION ================= */}
      {isCreateCollectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl border border-[#E7DAD1]/16 w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7DAD1]/10">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#EA7957]" />
                <h3 className="text-base font-bold text-[#FBF8F5] font-heading">
                  Create New Folder
                </h3>
              </div>
              <button
                onClick={() => setIsCreateCollectionOpen(false)}
                className="text-[#8C7669] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCollectionData.name}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, name: e.target.value })}
                  placeholder="e.g. Machine Learning, Biology 101, Microeconomics"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] focus:outline-hidden focus:border-[#EA7957]/70 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newCollectionData.description}
                  onChange={(e) => setNewCollectionData({ ...newCollectionData, description: e.target.value })}
                  placeholder="What topics or syllabi does this collection cover?"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] focus:outline-hidden focus:border-[#EA7957]/70 shadow-inner resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#D4C2B8] uppercase mb-1.5">
                  Collection Color Accent
                </label>
                <div className="flex items-center gap-3">
                  {colorOptions.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setNewCollectionData({ ...newCollectionData, color: c.value })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newCollectionData.color === c.value
                          ? 'scale-115 ring-2 ring-white shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7DAD1]/10">
                <button
                  type="button"
                  onClick={() => setIsCreateCollectionOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase text-[#D4C2B8] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCollection}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase bg-[#EA7957] hover:bg-[#df6a47] text-white transition-all shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50"
                >
                  {creatingCollection ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PREVIEW DOCUMENT ================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl border border-[#E7DAD1]/16 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#E7DAD1]/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#EA7957]" />
                  <h3 className="text-sm font-bold text-[#FBF8F5] font-heading">
                    Document Text Chunks Preview
                  </h3>
                </div>
                <p className="text-xs text-[#8C7669] mt-0.5 font-mono">
                  {previewDoc.title} • {previewDoc.page_count ? `${previewDoc.page_count} Pages` : ''} • {previewDoc.chunks_count} Vector Chunks
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-[#8C7669] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chunks Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {previewLoading ? (
                <div className="py-12 text-center">
                  <RotateCw className="w-6 h-6 text-[#EA7957] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-mono text-[#8C7669]">Loading indexed text chunks...</p>
                </div>
              ) : previewDoc.sample_chunks && previewDoc.sample_chunks.length > 0 ? (
                previewDoc.sample_chunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-4 rounded-xl border border-[#E7DAD1]/12 bg-[#160D08]/85 backdrop-blur-md space-y-2 shadow-inner"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8C7669]">
                      <span className="font-bold text-[#EA7957]">Chunk #{chunk.chunk_index + 1}</span>
                      <span>
                        {chunk.page_number ? `Page ${chunk.page_number}` : (chunk.section_title || 'General')}
                      </span>
                    </div>
                    <p className="text-xs text-[#D4C2B8] leading-relaxed whitespace-pre-wrap font-sans">
                      {chunk.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#8C7669] text-center py-8">No sample chunks found.</p>
              )}
            </div>

            <div className="p-4 border-t border-[#E7DAD1]/10 flex items-center justify-between">
              <span className="text-xs text-[#8C7669]">
                Showing top indexed chunks used for vector semantic retrieval
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-mono uppercase font-semibold rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: AI EXECUTIVE SUMMARY ================= */}
      {summaryDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl border border-[#E7DAD1]/16 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E7DAD1]/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2A1911]/80 border border-[#E7DAD1]/12 text-[#EA7957] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FBF8F5] font-heading">
                    AI Executive Summary & Breakdown
                  </h3>
                  <p className="text-xs text-[#8C7669] font-mono">{summaryDoc.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSummaryDoc(null)}
                className="text-[#8C7669] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {summaryLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RotateCw className="w-8 h-8 text-[#EA7957] animate-spin mx-auto" />
                  <p className="text-sm font-bold text-[#FBF8F5]">
                    Analyzing document content with Gemini...
                  </p>
                  <p className="text-xs font-mono text-[#8C7669]">
                    Synthesizing core takeaways, rules, and section summaries
                  </p>
                </div>
              ) : summaryData ? (
                <>
                  {/* Executive Overview */}
                  <div className="p-4 rounded-xl border border-[#E7DAD1]/12 bg-[#160D08]/85 backdrop-blur-md space-y-2 shadow-inner">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#EA7957]">
                      Executive Synthesis
                    </span>
                    <p className="text-xs text-[#D4C2B8] leading-relaxed whitespace-pre-wrap">
                      {summaryData.executive_summary}
                    </p>
                  </div>

                  {/* Key Takeaways */}
                  {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FBF8F5]">
                        Core Takeaways & Directives
                      </span>
                      <div className="space-y-1.5">
                        {summaryData.key_takeaways.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 p-3 rounded-xl border border-[#E7DAD1]/10 bg-[#231711]/70 backdrop-blur-md text-xs text-[#D4C2B8]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957] mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Breakdown */}
                  {summaryData.section_breakdown && summaryData.section_breakdown.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FBF8F5]">
                        Section-by-Section Breakdown
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {summaryData.section_breakdown.map((sec, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl border border-[#E7DAD1]/10 bg-[#160D08]/85 backdrop-blur-md space-y-1 shadow-inner"
                          >
                            <span className="text-xs font-bold text-[#EA7957] block font-mono">
                              {sec.heading}
                            </span>
                            <p className="text-xs text-[#8C7669] leading-relaxed">
                              {sec.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-[#E7DAD1]/10 flex items-center justify-between">
              <button
                onClick={() => handleChatWithDocument(summaryDoc)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-[#EA7957] hover:bg-[#df6a47] text-white shadow-lg shadow-[#EA7957]/25 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Deep Questions on this Document</span>
              </button>
              <button
                onClick={() => setSummaryDoc(null)}
                className="px-4 py-2 text-xs font-mono uppercase text-[#D4C2B8] hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: STUDY PACK (QUIZ & FLASHCARDS) ================= */}
      {studyDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl border border-[#E7DAD1]/16 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header with Tabs */}
            <div className="p-5 border-b border-[#E7DAD1]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2A1911]/80 border border-[#E7DAD1]/12 text-[#76C893] flex items-center justify-center shadow-xs">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FBF8F5] font-heading">
                    Active Recall Study Pack
                  </h3>
                  <p className="text-xs text-[#8C7669] font-mono">{studyDoc.title}</p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12">
                <button
                  onClick={() => setStudyActiveTab('quiz')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    studyActiveTab === 'quiz'
                      ? 'bg-[#EA7957] text-white shadow-sm'
                      : 'text-[#D4C2B8] hover:text-white'
                  }`}
                >
                  Practice Quiz
                </button>
                <button
                  onClick={() => setStudyActiveTab('flashcards')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    studyActiveTab === 'flashcards'
                      ? 'bg-[#EA7957] text-white shadow-sm'
                      : 'text-[#D4C2B8] hover:text-white'
                  }`}
                >
                  Flashcards
                </button>
                <button
                  onClick={() => setStudyActiveTab('definitions')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    studyActiveTab === 'definitions'
                      ? 'bg-[#EA7957] text-white shadow-sm'
                      : 'text-[#D4C2B8] hover:text-white'
                  }`}
                >
                  Key Terms
                </button>
                <button
                  onClick={() => setStudyDoc(null)}
                  className="p-1 ml-2 text-[#8C7669] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {studyLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RotateCw className="w-8 h-8 text-[#EA7957] animate-spin mx-auto" />
                  <p className="text-sm font-bold text-[#FBF8F5]">
                    Generating Grounded Study Questions & Flashcards...
                  </p>
                  <p className="text-xs font-mono text-[#8C7669]">
                    Constructing recall questions directly from document text chunks
                  </p>
                </div>
              ) : studyData ? (
                <>
                  {/* TAB 1: PRACTICE QUIZ */}
                  {studyActiveTab === 'quiz' && (
                    <div className="space-y-6">
                      {studyData.practice_questions && studyData.practice_questions.length > 0 ? (
                        studyData.practice_questions.map((q, idx) => {
                          const selected = selectedQuizAnswers[q.id || idx];
                          const isAnswered = selected !== undefined;
                          const isCorrect = selected === q.correct_answer;

                          return (
                            <div
                              key={q.id || idx}
                              className="p-5 rounded-2xl border border-[#E7DAD1]/12 bg-[#160D08]/85 backdrop-blur-md space-y-3.5 shadow-inner"
                            >
                              <div className="flex items-start gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#EA7957]/20 text-[#EA7957] border border-[#EA7957]/30">
                                  Q{idx + 1}
                                </span>
                                <h4 className="text-xs font-bold text-[#FBF8F5] leading-relaxed">
                                  {q.question}
                                </h4>
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 gap-2 pt-1">
                                {q.options.map((opt, optIdx) => {
                                  const isThisSelected = selected === opt;
                                  const isThisCorrect = opt === q.correct_answer;

                                  let btnClass = 'border-[#E7DAD1]/12 bg-[#231711]/70 hover:border-[#EA7957]/50 text-[#D4C2B8] hover:text-white';
                                  if (isAnswered) {
                                    if (isThisCorrect) {
                                      btnClass = 'border-[#76C893]/50 bg-[#1E3324]/80 text-[#76C893] font-bold';
                                    } else if (isThisSelected) {
                                      btnClass = 'border-red-500/50 bg-[#3D1E1E]/80 text-red-400';
                                    } else {
                                      btnClass = 'border-[#E7DAD1]/08 opacity-50 text-[#8C7669]';
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => {
                                        if (!isAnswered) {
                                          setSelectedQuizAnswers({
                                            ...selectedQuizAnswers,
                                            [q.id || idx]: opt,
                                          });
                                        }
                                      }}
                                      className={`flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${btnClass}`}
                                    >
                                      <span>{opt}</span>
                                      {isAnswered && isThisCorrect && (
                                        <Check className="w-4 h-4 text-[#76C893]" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Explanation once answered */}
                              {isAnswered && (
                                <div className="p-3.5 rounded-xl border border-[#76C893]/30 bg-[#1E3324]/40 backdrop-blur-xs text-xs text-[#76C893] space-y-1">
                                  <span className="font-bold font-mono">
                                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                                  </span>
                                  <p className="leading-relaxed">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-[#8C7669] text-center py-8">No quiz questions generated.</p>
                      )}
                    </div>
                  )}

                  {/* TAB 2: FLASHCARDS */}
                  {studyActiveTab === 'flashcards' && (
                    <div className="space-y-4">
                      {studyData.flashcards && studyData.flashcards.length > 0 ? (
                        (() => {
                          const card = studyData.flashcards[currentFlashcardIndex];
                          const total = studyData.flashcards.length;

                          return (
                            <div className="flex flex-col items-center space-y-4 max-w-lg mx-auto">
                              <span className="text-xs font-mono text-[#8C7669]">
                                Card {currentFlashcardIndex + 1} of {total}
                              </span>

                              {/* Interactive 3D Card */}
                              <div
                                onClick={() => setIsCardFlipped(!isCardFlipped)}
                                className="w-full h-64 p-8 rounded-2xl border border-[#E7DAD1]/14 bg-[#231711]/80 backdrop-blur-xl hover:border-[#EA7957]/60 transition-all cursor-pointer shadow-xl flex flex-col justify-between text-center select-none"
                              >
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C7669]">
                                  {isCardFlipped ? 'Back (Answer / Definition)' : 'Front (Concept / Prompt)'}
                                </span>

                                <div className="my-auto">
                                  <p className="text-sm font-bold text-[#FBF8F5] leading-relaxed">
                                    {isCardFlipped ? card.back : card.front}
                                  </p>
                                </div>

                                <span className="text-[11px] text-[#EA7957] font-mono">
                                  Click card to flip
                                </span>
                              </div>

                              {/* Navigation Controls */}
                              <div className="flex items-center gap-3">
                                <button
                                  disabled={currentFlashcardIndex === 0}
                                  onClick={() => {
                                    setIsCardFlipped(false);
                                    setCurrentFlashcardIndex((prev) => Math.max(0, prev - 1));
                                  }}
                                  className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 bg-[#2A1A12]/80 backdrop-blur-md text-[#D4C2B8] hover:text-white text-xs font-mono uppercase font-semibold disabled:opacity-40 hover:bg-[#382319]/90 cursor-pointer"
                                >
                                  Previous
                                </button>
                                <button
                                  disabled={currentFlashcardIndex === total - 1}
                                  onClick={() => {
                                    setIsCardFlipped(false);
                                    setCurrentFlashcardIndex((prev) => Math.min(total - 1, prev + 1));
                                  }}
                                  className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 bg-[#2A1A12]/80 backdrop-blur-md text-[#D4C2B8] hover:text-white text-xs font-mono uppercase font-semibold disabled:opacity-40 hover:bg-[#382319]/90 cursor-pointer"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-xs text-[#8C7669] text-center py-8">No flashcards generated.</p>
                      )}
                    </div>
                  )}

                  {/* TAB 3: KEY DEFINITIONS */}
                  {studyActiveTab === 'definitions' && (
                    <div className="space-y-3">
                      {studyData.key_definitions && studyData.key_definitions.length > 0 ? (
                        studyData.key_definitions.map((def, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-[#E7DAD1]/12 bg-[#160D08]/85 backdrop-blur-md space-y-1 shadow-inner"
                          >
                            <span className="text-xs font-bold font-mono text-[#EA7957]">
                              {def.term}
                            </span>
                            <p className="text-xs text-[#D4C2B8] leading-relaxed">
                              {def.definition}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#8C7669] text-center py-8">No definitions extracted.</p>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-[#E7DAD1]/10 flex items-center justify-end">
              <button
                onClick={() => setStudyDoc(null)}
                className="px-4 py-2 text-xs font-mono uppercase font-bold rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white shadow-lg shadow-[#EA7957]/25 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocumentsPage;
