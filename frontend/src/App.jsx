import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Student Layout & Pages
import { StudentLayout } from './components/layout/StudentLayout';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ChatPage } from './pages/student/ChatPage';
import { MyDocumentsPage } from './pages/student/MyDocumentsPage';
import { FolderDetailsPage } from './pages/student/FolderDetailsPage';
import { SavedAnswersPage } from './pages/student/SavedAnswersPage';
import { StudentSettingsPage } from './pages/student/StudentSettingsPage';

// Admin Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { DocumentManagementPage } from './pages/admin/DocumentManagementPage';
import { KnowledgeGapsPage } from './pages/admin/KnowledgeGapsPage';
import { FeedbackManagementPage } from './pages/admin/FeedbackManagementPage';
import { FaqManagementPage } from './pages/admin/FaqManagementPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              className: 'text-xs font-mono font-semibold rounded-xl shadow-2xl border border-[#E7DAD1]/16 bg-[#20140E]/90 backdrop-blur-xl text-[#FBF8F5]',
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="chat" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="folders/:folderId" element={<FolderDetailsPage />} />
              <Route path="documents/folder/:folderId" element={<FolderDetailsPage />} />
              <Route path="documents" element={<MyDocumentsPage />} />
              <Route path="saved" element={<SavedAnswersPage />} />
              <Route path="settings" element={<StudentSettingsPage />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="documents" element={<DocumentManagementPage />} />
              <Route path="knowledge-gaps" element={<KnowledgeGapsPage />} />
              <Route path="feedback" element={<FeedbackManagementPage />} />
              <Route path="faqs" element={<FaqManagementPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
