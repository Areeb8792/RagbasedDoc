import api from './api';

export const adminService = {
  async getOverviewAnalytics() {
    const response = await api.get('/admin/analytics/overview/');
    return response.data;
  },

  async getQuestionsAnalytics() {
    const response = await api.get('/admin/analytics/questions/');
    return response.data;
  },

  async getKnowledgeGaps(params = {}) {
    const response = await api.get('/admin/analytics/knowledge-gaps/', { params });
    return response.data;
  },

  async updateKnowledgeGap(id, data) {
    const response = await api.patch(`/admin/analytics/knowledge-gaps/${id}/`, data);
    return response.data;
  },

  async getFeedbackList(params = {}) {
    const response = await api.get('/feedback/admin/', { params });
    return response.data;
  },

  async updateFeedback(id, data) {
    const response = await api.patch(`/feedback/admin/${id}/`, data);
    return response.data;
  },

  async getFaqs(params = {}) {
    const response = await api.get('/faqs/admin/', { params });
    return response.data;
  },

  async getStudentFaqs(params = {}) {
    const response = await api.get('/faqs/', { params });
    return response.data;
  },

  async createFaq(data) {
    const response = await api.post('/faqs/admin/', data);
    return response.data;
  },

  async updateFaq(id, data) {
    const response = await api.patch(`/faqs/admin/${id}/`, data);
    return response.data;
  },

  async deleteFaq(id) {
    const response = await api.delete(`/faqs/admin/${id}/`);
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/auth/admin/users/', { params });
    return response.data;
  },

  async updateUser(id, data) {
    const response = await api.patch(`/auth/admin/users/${id}/`, data);
    return response.data;
  },

  async getAuditLogs(params = {}) {
    const response = await api.get('/admin/audit-logs/', { params });
    return response.data;
  },
};
