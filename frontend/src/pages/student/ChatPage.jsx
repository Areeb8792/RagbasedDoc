import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../../services/chatService';
import { documentIntelligenceService } from '../../services/documentIntelligenceService';
import { SourceExplorerModal } from '../../components/chat/SourceExplorerModal';
import { SimplifyModal } from '../../components/chat/SimplifyModal';
import { FeedbackModal } from '../../components/chat/FeedbackModal';
import { useAuth } from '../../context/AuthContext';
import { ChatHistorySidebar } from '../../components/chat/ChatHistorySidebar';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Download,
  Mic,
  MicOff,
  Copy,
  Bookmark,
  BookmarkCheck,
  FileCheck2,
  AlertCircle,
  Loader2,
  Zap,
  Layers,
  FileText,
  Folder,
  X,
  GraduationCap,
  BarChart3,
  Bed,
  History,
  ChevronDown,
  Check,
  File,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const { user } = useAuth();
  const userKey = user?.id ? `_${user.id}` : '';

  // Independent Chat History Sidebar state (isolated per user on shared devices)
  const [historyCollapsed, setHistoryCollapsed] = useState(() => {
    try {
      const uVal = localStorage.getItem(`morpheus_chat_history_collapsed${userKey}`);
      if (uVal !== null) return uVal === 'true';
      return localStorage.getItem('morpheus_chat_history_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const toggleHistoryCollapse = () => {
    setHistoryCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`morpheus_chat_history_collapsed${userKey}`, String(next));
        localStorage.setItem('morpheus_chat_history_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Knowledge Context: Folder & File Selection (Modes 1, 2, 3)
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [folderDocuments, setFolderDocuments] = useState([]);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

  // Modals state
  const [activeCitation, setActiveCitation] = useState(null);
  const [simplifyTargetId, setSimplifyTargetId] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await chatService.getConversations();
        const convList = data.results || data || [];
        setConversations(convList);

        const paramId = searchParams.get('id');
        if (paramId) {
          loadConversation(paramId);
        } else if (location.state?.initialQuestion) {
          handleSendQuestion(location.state.initialQuestion);
        } else if (convList.length > 0 && !currentConversationId) {
          loadConversation(convList[0].id);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    fetchConversations();
  }, [searchParams]);

  // Load folders & detect route state or URL pinned folder/file
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const data = await documentIntelligenceService.getCollections();
        const list = data.results || data || [];
        setFolders(list);

        // Check route state (e.g. navigating from FolderDetailsPage or Dashboard)
        if (location.state?.pinnedCollection) {
          setSelectedFolder(location.state.pinnedCollection);
          toast(`Knowledge Scope: Folder "${location.state.pinnedCollection.name}"`, { icon: '📁' });
        }
        if (location.state?.pinnedDocument) {
          setSelectedFile(location.state.pinnedDocument);
          toast(`Knowledge Scope: File "${location.state.pinnedDocument.title}"`, { icon: '📄' });
        }
      } catch (e) {
        console.error('Failed to load folders:', e);
      }
    };
    fetchFolders();

    const docId = searchParams.get('document_id');
    const docTitle = searchParams.get('document_title');
    if (docId) {
      setSelectedFile({ id: docId, title: docTitle ? decodeURIComponent(docTitle) : 'Document' });
      toast(`Pinned Document: ${docTitle ? decodeURIComponent(docTitle) : 'Document'}`, { icon: '📄' });
    }

    const colId = searchParams.get('collection_id');
    const colName = searchParams.get('collection_name');
    if (colId) {
      setSelectedFolder({ id: colId, name: colName ? decodeURIComponent(colName) : 'Folder' });
      toast(`Pinned Folder: ${colName ? decodeURIComponent(colName) : 'Folder'}`, { icon: '📁' });
    }
  }, [searchParams, location.state]);

  // When selectedFolder changes, fetch documents inside that folder
  useEffect(() => {
    if (selectedFolder?.id) {
      documentIntelligenceService
        .getPersonalDocuments({ collection_id: selectedFolder.id })
        .then((data) => setFolderDocuments(data.results || data || []))
        .catch(() => setFolderDocuments([]));
    } else {
      setFolderDocuments([]);
    }
  }, [selectedFolder?.id]);

  const loadConversation = async (conversationId) => {
    try {
      setLoading(true);
      setCurrentConversationId(conversationId);
      setSearchParams({ id: conversationId });
      const detail = await chatService.getConversationDetail(conversationId);
      setMessages(detail.messages || []);
      if (detail.collection) {
        setSelectedFolder(detail.collection);
      } else {
        setSelectedFolder(null);
      }
      if (detail.document) {
        setSelectedFile(detail.document);
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      toast.error('Could not load session messages.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await chatService.createConversation('New Academic Inquiry');
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setSearchParams({ id: newConv.id });
      toast.success('Started new inquiry.');
    } catch (err) {
      toast.error('Failed to initialize new conversation.');
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm('Delete this inquiry history?')) return;

    try {
      await chatService.deleteConversation(conversationId);
      const remaining = conversations.filter((c) => c.id !== conversationId);
      setConversations(remaining);
      if (currentConversationId === conversationId) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
          setSearchParams({});
        }
      }
      toast.success('Inquiry removed.');
    } catch (err) {
      toast.error('Failed to remove inquiry.');
    }
  };

  const handleRenameConversation = async (conversationId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      await chatService.updateConversation(conversationId, { title: newTitle.trim() });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle.trim() } : c))
      );
      toast.success('Conversation renamed.');
    } catch (err) {
      toast.error('Failed to rename conversation.');
    }
  };

  const handleSendQuestion = async (customQuery = null) => {
    const query = (customQuery || inputQuery).trim();
    if (!query || loading) return;

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputQuery('');
    setLoading(true);

    let scopeParam = 'all';
    let docIdParam = null;
    let colIdParam = null;
    let activeContextLabel = 'Searching across all your documents';

    if (selectedFile) {
      scopeParam = 'document';
      docIdParam = selectedFile.id;
      colIdParam = selectedFolder ? selectedFolder.id : null;
      activeContextLabel = `Searching in: ${selectedFile.title || selectedFile.original_filename}`;
    } else if (selectedFolder) {
      scopeParam = 'collection';
      colIdParam = selectedFolder.id;
      docIdParam = null;
      activeContextLabel = `Searching in: ${selectedFolder.name}`;
    } else {
      scopeParam = 'all';
      docIdParam = null;
      colIdParam = null;
      activeContextLabel = 'Searching across all your documents';
    }

    try {
      const response = await chatService.askQuestion({
        query: query,
        conversation_id: currentConversationId,
        scope: scopeParam,
        document_id: docIdParam,
        collection_id: colIdParam,
      });

      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        setSearchParams({ id: response.conversation_id });
        const updated = await chatService.getConversations();
        setConversations(updated.results || updated || []);
      } else {
        // Refresh conversation list to capture updated title/timestamp
        const updated = await chatService.getConversations();
        setConversations(updated.results || updated || []);
      }

      // Robust response parsing supporting dual backend contract
      const rawMsg = response.message || {};
      const answerContent =
        rawMsg.content ||
        response.answer ||
        response.content ||
        '';

      const citations =
        rawMsg.citations ||
        response.citations ||
        [];

      const followUps =
        rawMsg.follow_up_suggestions ||
        response.follow_up_suggestions ||
        [];

      const insufficientEvidence =
        rawMsg.insufficient_evidence ??
        response.insufficient_evidence ??
        false;

      const evidenceStatus =
        rawMsg.response_status ||
        response.evidence_status ||
        (insufficientEvidence ? 'not_found' : 'fully_supported');

      const messageId =
        rawMsg.id ||
        response.message_id ||
        `asst-${Date.now()}`;

      const responseTime =
        rawMsg.response_time_ms ||
        response.response_time_ms ||
        0;

      // Final safety guarantee: an assistant message is NEVER blank
      let finalContent = (answerContent || '').trim();
      if (!finalContent) {
        if (evidenceStatus === 'processing') {
          finalContent = 'Your document is still being processed. Please try again once indexing is complete.';
        } else if (insufficientEvidence) {
          finalContent = "I couldn't find relevant information in your uploaded documents for this question.";
        } else {
          finalContent = 'No response content could be generated. Please try asking again.';
        }
      }

      const assistantMsg = {
        id: messageId,
        role: 'assistant',
        content: finalContent,
        citations: citations,
        follow_up_suggestions: followUps,
        insufficient_evidence: insufficientEvidence,
        evidence_status: evidenceStatus,
        response_time_ms: responseTime,
        is_saved: rawMsg.is_saved || false,
        context_label: activeContextLabel,
        created_at: rawMsg.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI response error:', err);
      const errMsg =
        typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            'Failed to retrieve answer. Please retry.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Response copied to clipboard.');
  };

  const handleToggleBookmark = async (msg) => {
    try {
      if (msg.is_saved && msg.saved_answer_id) {
        await chatService.removeSavedAnswer(msg.saved_answer_id);
        msg.is_saved = false;
        msg.saved_answer_id = null;
        toast.success('Bookmark removed.');
        setMessages([...messages]);
      } else {
        const saved = await chatService.saveAnswer({
          message_id: msg.id,
          question: messages.find((m) => m.role === 'user')?.content || 'Inquiry',
          answer: msg.content,
          citations: msg.citations || [],
        });
        msg.is_saved = true;
        msg.saved_answer_id = saved.id;
        toast.success('Answer saved to bookmarks.');
        setMessages([...messages]);
      }
    } catch (err) {
      toast.error('Failed to update bookmark.');
    }
  };

  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening... Speak your question.', { icon: '🎙️' });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice input error. Please type your query.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-3">
      {/* Top Header matching Reference Design (Status badge removed as requested) */}
      <div className="flex items-center justify-between gap-3 shrink-0 pt-0.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#FBF8F5] font-heading">
            Assistant Chat
          </h1>
        </div>

        {/* Action Buttons: Mobile History Toggle + New Inquiry */}
        <div className="flex items-center gap-2">
          {/* Mobile History Drawer Button (< lg) */}
          <button
            type="button"
            onClick={() => setMobileHistoryOpen(true)}
            className="lg:hidden px-3 py-2 rounded-lg bg-[#2E1E17]/75 backdrop-blur-md hover:bg-[#3D2C22]/90 border border-[#E7DAD1]/12 text-[#D4C2B8] hover:text-white text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            aria-label="Open conversation history"
          >
            <History className="w-3.5 h-3.5 text-[#EA7957]" />
            <span>History</span>
          </button>

          {/* + NEW INQUIRY button */}
          <button
            onClick={handleNewConversation}
            className="px-3.5 py-2 rounded-lg bg-[#2E1E17]/75 backdrop-blur-md hover:bg-[#3D2C22]/90 border border-[#E7DAD1]/12 text-[#F5ECE5] text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#EA7957]" />
            <span>+ NEW INQUIRY</span>
          </button>
        </div>
      </div>

      {/* THREE-COLUMN DESKTOP LAYOUT (Universal Nav + History Sidebar + Chat Workspace) */}
      <div className="flex-1 min-h-0 flex gap-3 relative overflow-hidden h-full">
        {/* SIDEBAR 2: Dedicated AI Assistant Conversation History Sidebar */}
        <ChatHistorySidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={loadConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          isCollapsed={historyCollapsed}
          onToggleCollapse={toggleHistoryCollapse}
          isMobileOpen={mobileHistoryOpen}
          onCloseMobile={() => setMobileHistoryOpen(false)}
        />

        {/* CENTRAL CHAT WORKSPACE (Static in place; only inner messages area scrolls) */}
        <div className="flex-1 min-w-0 min-h-0 bg-[#20140E]/75 backdrop-blur-2xl border border-[#E7DAD1]/12 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-200 h-full">
          {/* Main Feed: Welcome State OR Messages Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {messages.length === 0 ? (
              /* AUTHORITATIVE WELCOME STATE */
              <div className="min-h-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-3 sm:py-5 my-auto">
                {/* Central Lightning Squircle */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FCE4DA]/90 backdrop-blur-md border border-[#EA7957]/40 flex items-center justify-center text-[#EA7957] shadow-sm mb-2.5">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-[#EA7957]" />
                </div>

                {/* Welcome Heading */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#FBF8F5] font-heading tracking-tight">
                  Morpheus AI Assistant
                </h2>

                {/* SAMPLE INQUIRIES Section Divider with Horizontal Rules */}
                <div className="relative my-4 sm:my-6 flex items-center justify-center w-full max-w-2xl">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E7DAD1]/10" />
                  </div>
                  <div className="relative px-4 py-0.5 rounded-full bg-[#241812]/80 backdrop-blur-md border border-[#E7DAD1]/10 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#A89284] uppercase shadow-xs">
                    Sample Inquiries
                  </div>
                </div>

                {/* 4 Sample Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-2xl">
                  {/* Card 1: Attendance requirement? */}
                  <button
                    onClick={() =>
                      handleSendQuestion('What is the minimum attendance requirement for examinations?')
                    }
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#2A1B14]/65 backdrop-blur-md border border-[#E7DAD1]/10 hover:border-[#EA7957]/45 hover:bg-[#36231A]/85 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group shadow-xs hover:shadow-lg min-h-[110px]"
                  >
                    <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-[#FCE4DA] group-hover:scale-105 transition-transform" />
                    <span className="text-xs sm:text-sm font-medium text-[#FBF8F5] leading-snug">
                      Attendance<br />requirement?
                    </span>
                  </button>

                  {/* Card 2: 10-point grading scale? */}
                  <button
                    onClick={() =>
                      handleSendQuestion('Explain the 10-point relative grading scale and passing marks.')
                    }
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#2A1B14]/65 backdrop-blur-md border border-[#E7DAD1]/10 hover:border-[#EA7957]/45 hover:bg-[#36231A]/85 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group shadow-xs hover:shadow-lg min-h-[110px]"
                  >
                    <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-[#FCE4DA] group-hover:scale-105 transition-transform" />
                    <span className="text-xs sm:text-sm font-medium text-[#FBF8F5] leading-snug">
                      10-point<br />grading scale?
                    </span>
                  </button>

                  {/* Card 3: Scholarship eligibility? */}
                  <button
                    onClick={() =>
                      handleSendQuestion('What are the eligibility brackets for merit-based scholarships?')
                    }
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#2A1B14]/65 backdrop-blur-md border border-[#E7DAD1]/10 hover:border-[#EA7957]/45 hover:bg-[#36231A]/85 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group shadow-xs hover:shadow-lg min-h-[110px]"
                  >
                    <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-[#FCE4DA] group-hover:scale-105 transition-transform" />
                    <span className="text-xs sm:text-sm font-medium text-[#FBF8F5] leading-snug">
                      Scholarship<br />eligibility?
                    </span>
                  </button>

                  {/* Card 4: Hostel night-out leave? */}
                  <button
                    onClick={() =>
                      handleSendQuestion('What is the procedure and curfew time for hostel night-out leave?')
                    }
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#2A1B14]/65 backdrop-blur-md border border-[#E7DAD1]/10 hover:border-[#EA7957]/45 hover:bg-[#36231A]/85 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group shadow-xs hover:shadow-lg min-h-[110px]"
                  >
                    <Bed className="w-6 h-6 sm:w-7 sm:h-7 text-[#FCE4DA] group-hover:scale-105 transition-transform" />
                    <span className="text-xs sm:text-sm font-medium text-[#FBF8F5] leading-snug">
                      Hostel<br />night-out leave?
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Message Thread when conversation exists */
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                    >
                      <div
                        className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#352118]/80 backdrop-blur-md text-[#FBF8F5] border border-[#EA7957]/25 shadow-md'
                            : 'bg-[#20140E]/80 backdrop-blur-xl border border-[#E7DAD1]/12 text-[#FBF8F5] shadow-xl'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="space-y-3">
                            {/* Evidence Status & Knowledge Context */}
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E7DAD1]/10 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {msg.insufficient_evidence ? (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#EA7957]">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>NO RELEVANT EVIDENCE FOUND</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#8EC47E]">
                                    <FileCheck2 className="w-3.5 h-3.5 text-[#8EC47E]" />
                                    <span>GROUND-TRUTH ANSWER</span>
                                  </span>
                                )}

                                {msg.context_label && (
                                  <span className="text-[10px] font-mono text-[#D4C2B8] px-2 py-0.5 rounded-md bg-[#180E09]/75 backdrop-blur-md border border-[#E7DAD1]/10">
                                    {msg.context_label}
                                  </span>
                                )}
                              </div>

                              {msg.response_time_ms > 0 && (
                                <span className="text-[10px] text-[#A89284] font-mono">
                                  {msg.response_time_ms}MS
                                </span>
                              )}
                            </div>

                            {/* Markdown Output */}
                            <div className="prose prose-sm prose-invert max-w-none text-xs sm:text-sm text-[#FBF8F5] leading-relaxed">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {/* Source Citations */}
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="pt-2 border-t border-[#E7DAD1]/10 space-y-1.5">
                                <span className="text-[10px] font-mono font-bold text-[#A89284] uppercase tracking-wider block">
                                  Verified Citations ({msg.citations.length})
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.citations.map((c, cIdx) => (
                                    <button
                                      key={c.id || cIdx}
                                      onClick={() => setActiveCitation(c)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-[#190F0A]/75 backdrop-blur-md text-[#F5ECE5] hover:border-[#EA7957] border border-[#E7DAD1]/12 shadow-xs transition-all cursor-pointer"
                                      title="Click to view official excerpt"
                                    >
                                      <FileCheck2 className="w-3.5 h-3.5 text-[#EA7957]" />
                                      <span>
                                        {c.document_title || 'Document'} • {c.page_number ? `P.${c.page_number}` : (c.section_title || 'General')}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Bar */}
                            <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#E7DAD1]/10 text-xs">
                              <button
                                onClick={() => handleCopyMessage(msg.content)}
                                className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-white hover:bg-[#36231A]/70 transition-colors flex items-center gap-1 font-mono text-[11px] cursor-pointer"
                                title="Copy response"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </button>

                              <button
                                onClick={() => handleToggleBookmark(msg)}
                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 font-mono text-[11px] cursor-pointer ${
                                  msg.is_saved
                                    ? 'text-[#EA7957] font-semibold'
                                    : 'text-[#D4C2B8] hover:text-white hover:bg-[#36231A]/70'
                                }`}
                                title="Bookmark answer"
                              >
                                {msg.is_saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                <span>{msg.is_saved ? 'Saved' : 'Save'}</span>
                              </button>

                              <button
                                onClick={() => setSimplifyTargetId(msg.id)}
                                className="p-1.5 rounded-lg text-[#D4C2B8] hover:text-white hover:bg-[#36231A]/70 transition-colors flex items-center gap-1 font-mono text-[11px] cursor-pointer"
                                title="Simplify response"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#EA7957]" />
                                <span>Simplify</span>
                              </button>
                            </div>

                            {/* Follow-up Suggestions */}
                            {msg.follow_up_suggestions && msg.follow_up_suggestions.length > 0 && (
                              <div className="pt-2 space-y-1">
                                <span className="text-[10px] font-mono font-bold text-[#A89284] uppercase tracking-wider block">
                                  Follow-Up Suggestions
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.follow_up_suggestions.map((fQ, fIdx) => (
                                    <button
                                      key={fIdx}
                                      onClick={() => handleSendQuestion(fQ)}
                                      className="text-left text-xs px-2.5 py-1 rounded-lg bg-[#1E120D]/75 backdrop-blur-md border border-[#E7DAD1]/10 hover:border-[#EA7957]/50 hover:bg-[#2C1B13]/90 text-[#D4C2B8] hover:text-white transition-all cursor-pointer shadow-xs"
                                    >
                                      {fQ}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2.5 text-xs font-mono text-[#D4C2B8] bg-[#221610]/80 backdrop-blur-xl border border-[#E7DAD1]/12 p-3 rounded-xl w-fit shadow-md">
                    <Loader2 className="w-4 h-4 animate-spin text-[#EA7957]" />
                    <span>Retrieving official evidence &amp; synthesizing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Docked Bottom Controls & Composer */}
          <div className="p-3.5 border-t border-[#E7DAD1]/10 bg-[#1A110C]/80 backdrop-blur-xl space-y-2.5 shrink-0">
            {/* Knowledge Context Selector Bar (Part 4) */}
            <div className="flex items-center justify-between text-xs flex-wrap gap-2.5 px-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Active Knowledge Context Display Badge */}
                {selectedFolder ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#291A12]/80 backdrop-blur-md border border-[#EA7957]/50 text-xs shadow-xs">
                    <Folder className="w-3.5 h-3.5 text-[#EA7957]" />
                    <span className="text-[#A89284] font-mono text-[11px] uppercase">Folder:</span>
                    <span className="font-bold text-[#FBF8F5] max-w-[150px] truncate">{selectedFolder.name}</span>

                    {/* Optional Specific File Selector inside this Folder */}
                    {folderDocuments.length > 0 && (
                      <>
                        <span className="text-[#5C4538]">/</span>
                        {selectedFile ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#20140E]/85 backdrop-blur-md border border-[#EA7957]/40 text-[#EA7957]">
                            <FileText className="w-3 h-3" />
                            <span className="font-medium text-[#FBF8F5] max-w-[130px] truncate">
                              {selectedFile.title || selectedFile.original_filename}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedFile(null)}
                              className="p-0.5 hover:text-white rounded text-[#A89284]"
                              title="Clear specific file (keep folder)"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => {
                              const found = folderDocuments.find((d) => d.id === e.target.value);
                              setSelectedFile(found || null);
                            }}
                            className="bg-[#1C120D]/80 backdrop-blur-md border border-[#E7DAD1]/15 rounded-lg px-2 py-0.5 text-[11px] text-[#D4C2B8] focus:outline-none cursor-pointer"
                          >
                            <option value="">Specific File (Optional)...</option>
                            {folderDocuments.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                📄 {doc.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFolder(null);
                        setSelectedFile(null);
                      }}
                      className="p-1 text-[#A89284] hover:text-white rounded ml-0.5"
                      title="Clear folder selection (Return to automatic search)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : selectedFile ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#291A12]/80 backdrop-blur-md border border-[#EA7957]/50 text-xs shadow-xs">
                    <FileText className="w-3.5 h-3.5 text-[#EA7957]" />
                    <span className="text-[#A89284] font-mono text-[11px] uppercase">File:</span>
                    <span className="font-bold text-[#FBF8F5] max-w-[180px] truncate">
                      {selectedFile.title || selectedFile.original_filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-[#A89284] hover:text-white rounded ml-0.5"
                      title="Clear file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* MODE 3: Automatic / Nothing Selected */
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C120D]/75 backdrop-blur-md border border-[#E7DAD1]/10 text-xs shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#76C893]" />
                    <span className="text-[#D4C2B8] font-medium text-xs">
                      Searching across all your documents
                    </span>
                    <span className="text-[10px] text-[#8C7669] font-mono hidden sm:inline">
                      (Semantic Auto-Selection)
                    </span>
                  </div>
                )}

                {/* Choose Knowledge Folder Button / Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFolderPickerOpen(!isFolderPickerOpen)}
                    className="px-3 py-1.5 rounded-lg bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#382319]/90 border border-[#E7DAD1]/15 text-[#F5ECE5] text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-[#EA7957]" />
                    <span>{selectedFolder ? 'Change Folder' : 'Choose Folder'}</span>
                    <ChevronDown className="w-3 h-3 text-[#A89284]" />
                  </button>

                  {/* Dropdown Menu */}
                  {isFolderPickerOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#1A110C]/95 backdrop-blur-2xl border border-[#E7DAD1]/16 rounded-xl shadow-2xl z-50 overflow-hidden py-1 divide-y divide-[#E7DAD1]/10">
                      <div className="p-2.5 bg-[#251812]/80 backdrop-blur-md flex items-center justify-between">
                        <span className="text-xs font-bold text-[#FBF8F5] font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-[#EA7957]" />
                          Select Target Folder / Scope
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsFolderPickerOpen(false)}
                          className="text-[#8C7669] hover:text-white p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                        {/* Option: Search all documents */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFolder(null);
                            setSelectedFile(null);
                            setIsFolderPickerOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            !selectedFolder && !selectedFile
                              ? 'bg-[#EA7957]/20 border border-[#EA7957]/40 text-[#EA7957] font-bold'
                              : 'text-[#D4C2B8] hover:bg-[#2C1D16]/70'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#76C893]" />
                            <span>🌐 All Documents (Automatic)</span>
                          </div>
                          {!selectedFolder && !selectedFile && <Check className="w-3.5 h-3.5" />}
                        </button>

                        {/* Custom Folders */}
                        {folders.length === 0 ? (
                          <div className="p-3 text-center text-xs text-[#8C7669]">
                            <p>No custom folders created yet.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsFolderPickerOpen(false);
                                navigate('/student/dashboard');
                              }}
                              className="text-[#EA7957] hover:underline text-[11px] mt-1 inline-block"
                            >
                              + Create one on Dashboard
                            </button>
                          </div>
                        ) : (
                          folders.map((f) => {
                            const isSelected = selectedFolder?.id === f.id;
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  setSelectedFolder(f);
                                  setSelectedFile(null);
                                  setIsFolderPickerOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-[#EA7957]/20 border border-[#EA7957]/40 text-[#EA7957] font-bold'
                                    : 'text-[#D4C2B8] hover:bg-[#2C1D16]/70'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Folder className="w-3.5 h-3.5 text-[#EA7957] shrink-0" />
                                  <span className="truncate">{f.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#8C7669] shrink-0 ml-2">
                                  {f.documents_count || 0} docs
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isListening
                    ? 'bg-[#EA7957] text-white border-[#EA7957] shadow-lg shadow-[#EA7957]/30 animate-pulse'
                    : 'bg-[#2A1A12]/80 backdrop-blur-md border-[#E7DAD1]/15 text-[#F5ECE5] hover:bg-[#382319]/90'
                }`}
                title="Voice input (speech recognition)"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#EA7957]" />}
                <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>

            {/* Input Composer Box */}
            <div className="flex items-center gap-2 bg-[#160E09]/80 backdrop-blur-xl border border-[#E7DAD1]/15 rounded-xl px-4 py-2.5 focus-within:border-[#EA7957]/70 focus-within:shadow-[0_0_15px_rgba(234,121,87,0.15)] transition-all">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuestion();
                  }
                }}
                placeholder="Ask anything about college regulations, attendance, fees, exams... (Enter to send)"
                rows={1}
                className="w-full py-1 text-sm bg-transparent border-none text-[#FBF8F5] focus:outline-none resize-none placeholder:text-[#8C7669] leading-relaxed"
              />

              <button
                onClick={() => handleSendQuestion()}
                disabled={!inputQuery.trim() || loading}
                className="p-2 rounded-xl bg-[#2A1A12]/80 backdrop-blur-md hover:bg-[#EA7957] text-[#EA7957] hover:text-white border border-[#E7DAD1]/15 hover:border-[#EA7957] transition-all disabled:opacity-40 cursor-pointer shadow-sm shrink-0 flex items-center justify-center"
                title="Send inquiry"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SourceExplorerModal
        isOpen={!!activeCitation}
        onClose={() => setActiveCitation(null)}
        citation={activeCitation}
      />

      <SimplifyModal
        isOpen={!!simplifyTargetId}
        onClose={() => setSimplifyTargetId(null)}
        messageId={simplifyTargetId}
      />

      {feedbackTarget && (
        <FeedbackModal
          isOpen={true}
          onClose={() => setFeedbackTarget(null)}
          messageId={feedbackTarget.messageId}
          initialRating={feedbackTarget.rating}
        />
      )}
    </div>
  );
};
