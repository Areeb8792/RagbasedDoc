import api from './api';

export const documentService = {
  async getDocuments(params = {}) {
    const response = await api.get('/documents/', { params });
    return response.data;
  },

  async uploadDocument(formData) {
    const response = await api.post('/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getDocument(id) {
    const response = await api.get(`/documents/${id}/`);
    return response.data;
  },

  async updateDocument(id, data) {
    const response = await api.patch(`/documents/${id}/`, data);
    return response.data;
  },

  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}/`);
    return response.data;
  },

  async reprocessDocument(id) {
    const response = await api.post(`/documents/${id}/reprocess/`);
    return response.data;
  },

  async getChunks(id) {
    const response = await api.get(`/documents/${id}/chunks/`);
    return response.data;
  },

  async getVersions(id) {
    const response = await api.get(`/documents/${id}/versions/`);
    return response.data;
  },

  async compareVersions(id, otherId) {
    const response = await api.get(`/documents/${id}/compare/${otherId}/`);
    return response.data;
  },
};
