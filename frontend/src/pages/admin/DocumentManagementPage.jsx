import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/documentService';
import {
  Files,
  Upload,
  RefreshCw,
  Trash2,
  Eye,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  FileText,
  Search,
  Loader2,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DocumentManagementPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'General Policies',
    description: '',
    visibility: 'published',
  });
  const [uploading, setUploading] = useState(false);

  // Chunk inspection modal state
  const [inspectChunksDoc, setInspectChunksDoc] = useState(null);
  const [chunksList, setChunksList] = useState([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  // Policy comparison modal state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareDoc1, setCompareDoc1] = useState('');
  const [compareDoc2, setCompareDoc2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.document_status = statusFilter;
      if (search) params.search = search;
      const data = await documentService.getDocuments(params);
      setDocuments(data.results || data || []);
    } catch (err) {
      toast.error('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [statusFilter, search]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a document file to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadForm.title.trim()) formData.append('title', uploadForm.title.trim());
    formData.append('category', uploadForm.category);
    formData.append('description', uploadForm.description);
    formData.append('visibility', uploadForm.visibility);

    try {
      await documentService.uploadDocument(formData);
      toast.success('Document uploaded & indexed into vector space!');
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadForm({ title: '', category: 'General Policies', description: '', visibility: 'published' });
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Ingestion failed. Ensure file format is valid.');
    } finally {
      setUploading(false);
    }
  };

  const handleReprocess = async (docId) => {
    try {
      toast.loading('Reprocessing & regenerating embeddings...', { id: 'reprocess' });
      await documentService.reprocessDocument(docId);
      toast.success('Embeddings regenerated & vectors updated!', { id: 'reprocess' });
      fetchDocs();
    } catch (err) {
      toast.error('Failed to reprocess document.', { id: 'reprocess' });
    }
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" and its vector chunks?`)) {
      return;
    }

    try {
      await documentService.deleteDocument(docId);
      toast.success('Document deleted successfully.');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  const handleInspectChunks = async (doc) => {
    setInspectChunksDoc(doc);
    setChunksLoading(true);
    try {
      const data = await documentService.getDocumentChunks(doc.id);
      setChunksList(data.results || data || []);
    } catch (err) {
      toast.error('Failed to load document chunks.');
    } finally {
      setChunksLoading(false);
    }
  };

  const handleRunComparison = async () => {
    if (!compareDoc1 || !compareDoc2) {
      toast.error('Select both documents to perform conflict analysis.');
      return;
    }

    setComparing(true);
    setComparisonResult(null);
    try {
      const result = await documentService.comparePolicies(compareDoc1, compareDoc2);
      setComparisonResult(result);
    } catch (err) {
      toast.error('Failed to run comparison.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#EA7957]/15 text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957]" />
            <span>Ingestion Pipeline</span>
            <span>//</span>
            <span>Vector Chunking &amp; OCR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-1.5">
            Documents &amp; RAG Ingestion
          </h1>
          <p className="text-xs text-[#D4C2B8] mt-0.5">
            Manage repository files, PyMuPDF extraction, sentence-transformers indexing, and policy versions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCompareModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-[#E7DAD1]/14 hover:border-[#EA7957]/50 bg-[#2A1A12]/80 backdrop-blur-md text-[#F5ECE5] text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#EA7957]" />
            <span>Conflict Review</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono font-bold uppercase flex items-center gap-2 shadow-lg shadow-[#EA7957]/25 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7669]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or filename..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#1A100B]/75 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957] focus:outline-none shadow-inner placeholder:text-[#6D594C]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-[#1A100B]/75 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#D4C2B8] font-mono focus:border-[#EA7957] focus:outline-none cursor-pointer"
        >
          <option value="">All Processing Statuses</option>
          <option value="indexed">Indexed & Active</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed Ingestion</option>
          <option value="uploaded">Uploaded (Pending)</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-[#231711]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#251812]/80 backdrop-blur-md border-b border-[#E7DAD1]/10 text-[#A89284] font-mono uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Vector Chunks</th>
                <th className="py-3.5 px-4">Last Indexed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DAD1]/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8C7669] font-mono">Loading indexed documents...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8C7669] font-mono">No repository documents found.</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#2C1D16]/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#FBF8F5] max-w-xs truncate">
                      {doc.title}
                      <span className="block text-[10px] text-[#8C7669] font-mono mt-0.5 truncate">{doc.original_filename}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]">{doc.category}</td>
                    <td className="py-3.5 px-4 font-mono text-[#EA7957]">v{doc.version}</td>
                    <td className="py-3.5 px-4">
                      {doc.document_status === 'indexed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1E3324]/80 text-[#76C893] border border-[#76C893]/30">
                          <CheckCircle2 className="w-3 h-3" /> INDEXED
                        </span>
                      )}
                      {doc.document_status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#35251E]/80 text-[#EA7957] border border-[#EA7957]/30 animate-pulse">
                          <Clock className="w-3 h-3" /> PROCESSING
                        </span>
                      )}
                      {doc.document_status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3D1E1E]/80 text-red-400 border border-red-500/30">
                          <AlertCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                      {doc.document_status === 'uploaded' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#180E09]/80 text-[#8C7669] border border-[#E7DAD1]/10">
                          UPLOADED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#D4C2B8]">{doc.chunks_count || 0}</td>
                    <td className="py-3.5 px-4 text-[#8C7669] font-mono">
                      {doc.indexed_at ? new Date(doc.indexed_at).toLocaleDateString().toUpperCase() : 'PENDING'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleInspectChunks(doc)}
                        className="p-1.5 rounded-lg text-[#8C7669] hover:text-[#76C893] hover:bg-[#1E3324]/50 transition-colors cursor-pointer"
                        title="Inspect Chunks"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        className="p-1.5 rounded-lg text-[#8C7669] hover:text-[#EA7957] hover:bg-[#2A1911]/80 transition-colors cursor-pointer"
                        title="Reprocess Document"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1.5 rounded-lg text-[#8C7669] hover:text-red-400 hover:bg-[#3F1A1A]/70 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full border border-[#E7DAD1]/16 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                Upload Institutional Document
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-[#8C7669] hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  File (.pdf, .docx, .txt) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.txt"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                  className="w-full text-xs text-[#D4C2B8] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:font-mono file:bg-[#EA7957] file:text-white hover:file:bg-[#df6a47] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Derived from filename if left blank"
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957] focus:outline-none shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                    Category
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957] focus:outline-none cursor-pointer"
                  >
                    <option value="Attendance">Attendance</option>
                    <option value="Examinations">Examinations</option>
                    <option value="Scholarships">Scholarships</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Academics">Academics</option>
                    <option value="General Policies">General Policies</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                    Visibility
                  </label>
                  <select
                    value={uploadForm.visibility}
                    onChange={(e) => setUploadForm({ ...uploadForm, visibility: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:border-[#EA7957] focus:outline-none cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (Restricted)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E7DAD1]/10">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#EA7957]/25 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Index Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Chunks Modal */}
      {inspectChunksDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-2xl w-full border border-[#E7DAD1]/16 shadow-2xl flex flex-col max-h-[85vh] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <div>
                <span className="text-[10px] font-mono text-[#EA7957] uppercase">Vector Inspection</span>
                <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                  {inspectChunksDoc.title}
                </h3>
              </div>
              <button onClick={() => setInspectChunksDoc(null)} className="text-[#8C7669] hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chunksLoading ? (
                <div className="py-8 text-center text-[#8C7669] font-mono">Loading vector chunks...</div>
              ) : chunksList.length === 0 ? (
                <div className="py-8 text-center text-[#8C7669] font-mono">No chunks found for this document.</div>
              ) : (
                chunksList.map((chunk, idx) => (
                  <div key={chunk.id || idx} className="p-3.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#EA7957]">
                      <span>CHUNK #{chunk.chunk_index}</span>
                      <span>PAGE {chunk.page_number || 'N/A'}</span>
                    </div>
                    <p className="font-mono text-[11px] leading-relaxed text-[#D4C2B8] whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#E7DAD1]/10 flex justify-end">
              <button
                onClick={() => setInspectChunksDoc(null)}
                className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Conflict Comparison Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-2xl w-full border border-[#E7DAD1]/16 shadow-2xl flex flex-col max-h-[85vh] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <div>
                <span className="text-[10px] font-mono text-[#EA7957] uppercase">Regulatory Analysis</span>
                <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                  Policy Conflict Review
                </h3>
              </div>
              <button onClick={() => setCompareModalOpen(false)} className="text-[#8C7669] hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#D4C2B8] block mb-1">DOCUMENT A (BASE)</label>
                  <select
                    value={compareDoc1}
                    onChange={(e) => setCompareDoc1(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-mono text-[#FBF8F5] cursor-pointer"
                  >
                    <option value="">Select Document A</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#D4C2B8] block mb-1">DOCUMENT B (TARGET)</label>
                  <select
                    value={compareDoc2}
                    onChange={(e) => setCompareDoc2(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-mono text-[#FBF8F5] cursor-pointer"
                  >
                    <option value="">Select Document B</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunComparison}
                disabled={comparing}
                className="w-full py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-bold transition-all shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50"
              >
                {comparing ? 'Analyzing Regulations...' : 'Run Conflict Detection'}
              </button>

              {comparisonResult && (
                <div className="p-4 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs space-y-2 shadow-inner">
                  <span className="font-bold text-[#EA7957] font-mono block">Analysis Summary:</span>
                  <p className="font-sans leading-relaxed text-[#D4C2B8]">
                    {comparisonResult.summary || 'No conflicting numeric thresholds detected between selected policies.'}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E7DAD1]/10 flex justify-end">
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
