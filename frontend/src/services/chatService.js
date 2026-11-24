import api from './api';

export const chatService = {
  async getConversations(archived = false) {
    const response = await api.get('/chat/conversations/', {
      params: { archived },
    });
    return response.data;
  },

  async getConversation(id) {
    const response = await api.get(`/chat/conversations/${id}/`);
    return response.data;
  },

  async getConversationDetail(id) {
    return this.getConversation(id);
  },

  async createConversation(title = 'New Conversation') {
    const response = await api.post('/chat/conversations/', { title });
    return response.data;
  },

  async updateConversation(id, data) {
    const response = await api.patch(`/chat/conversations/${id}/`, data);
    return response.data;
  },

  async deleteConversation(id) {
    const response = await api.delete(`/chat/conversations/${id}/`);
    return response.data;
  },

  async askQuestion(questionOrObj, conversationId = null, category = null, language = null, options = {}) {
    let payload;
    if (typeof questionOrObj === 'object' && questionOrObj !== null) {
      payload = {
        question: questionOrObj.question || questionOrObj.query,
        conversation_id: questionOrObj.conversation_id || questionOrObj.conversationId,
        category: questionOrObj.category,
        language: questionOrObj.language,
        scope: questionOrObj.scope,
        collection_id: questionOrObj.collection_id || questionOrObj.collectionId,
        document_id: questionOrObj.document_id || questionOrObj.documentId,
      };
    } else {
      payload = {
        question: questionOrObj,
        conversation_id: conversationId,
        category,
        language,
        scope: options.scope,
        collection_id: options.collectionId || options.collection_id,
        document_id: options.documentId || options.document_id,
      };
    }
    const response = await api.post('/chat/ask/', payload);
    return response.data;
  },

  async simplifyMessage(messageId, style) {
    const response = await api.post(`/chat/messages/${messageId}/simplify/`, { style });
    return response.data;
  },

  async getSavedAnswers() {
    const response = await api.get('/chat/saved-answers/');
    return response.data;
  },

  async saveAnswer(messageId, note = '') {
    const response = await api.post('/chat/saved-answers/', {
      message_id: messageId,
      note,
    });
    return response.data;
  },

  async removeSavedAnswer(messageId) {
    const response = await api.delete(`/chat/saved-answers/${messageId}/`);
    return response.data;
  },

  async submitFeedback(messageId, rating, issueType = 'none', comment = '') {
    const response = await api.post('/feedback/', {
      message: messageId,
      rating,
      issue_type: issueType,
      comment,
    });
    return response.data;
  },

  getExportUrl(conversationId) {
    return `${api.defaults.baseURL}/chat/conversations/${conversationId}/export/`;
  },
};
