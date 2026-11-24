import api from './api';

export const documentIntelligenceService = {
  // --- Knowledge Collections ---
  async getCollections(params = {}) {
    const response = await api.get('/documents/collections/', { params });
    return response.data;
  },

  async createCollection(data) {
    const response = await api.post('/documents/collections/', data);
    return response.data;
  },

  async updateCollection(id, data) {
    const response = await api.patch(`/documents/collections/${id}/`, data);
    return response.data;
  },

  async deleteCollection(id, deleteDocuments = false) {
    const response = await api.delete(`/documents/collections/${id}/`, {
      params: { delete_documents: deleteDocuments },
    });
    return response.data;
  },

  // --- Statistics & Metrics ---
  async getPersonalStats() {
    const response = await api.get('/documents/personal/stats/');
    return response.data;
  },

  // --- Personal Documents ---
  async getPersonalDocuments(params = {}) {
    const response = await api.get('/documents/personal/', { params });
    return response.data;
  },

  async uploadPersonalDocument(formData, onUploadProgress) {
    const response = await api.post('/documents/personal/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  async bulkUploadPersonalDocuments(formData, onUploadProgress) {
    const response = await api.post('/documents/personal/bulk-upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  async movePersonalDocument(id, collectionId) {
    const response = await api.patch(`/documents/personal/${id}/`, {
      collection_id: collectionId || null,
    });
    return response.data;
  },

  async getPersonalDocument(id) {
    const response = await api.get(`/documents/personal/${id}/`);
    return response.data;
  },

  async updatePersonalDocument(id, data) {
    const response = await api.patch(`/documents/personal/${id}/`, data);
    return response.data;
  },

  async deletePersonalDocument(id) {
    const response = await api.delete(`/documents/personal/${id}/`);
    return response.data;
  },

  async reprocessPersonalDocument(id) {
    const response = await api.post(`/documents/personal/${id}/reprocess/`);
    return response.data;
  },

  // --- Intelligence Features ---
  async getDocumentPreview(id) {
    const response = await api.get(`/documents/personal/${id}/preview/`);
    return response.data;
  },

  async summarizeDocument(id) {
    const response = await api.post(`/documents/personal/${id}/summarize/`);
    return response.data;
  },

  async getStudyMaterials(id) {
    const response = await api.post(`/documents/personal/${id}/study-materials/`);
    return response.data;
  },
};

export default documentIntelligenceService;
