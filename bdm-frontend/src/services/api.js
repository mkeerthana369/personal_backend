import axios from 'axios';

// CRITICAL: Update this to match your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bdm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('bdm_token');
    }
    return Promise.reject(error);
  }
);

// ============================================
// CLAUSES API
// ============================================
export const clausesAPI = {
  getAll: (params) => api.get('/clauses', { params }),
  getById: (id) => api.get(`/clauses/${id}`),
  create: (data) => api.post('/clauses', data),
  update: (id, data) => api.put(`/clauses/${id}`, data),
  delete: (id) => api.delete(`/clauses/${id}`),
  
  // AI Generation
  generateAI: (data) => api.post('/clauses/generate-ai', data),
  
  // Merge & Sample
  merge: (data) => api.post('/clauses/merge', data),
  markAsSample: (id, isSample) => api.post(`/clauses/${id}/mark-sample`, { is_sample: isSample }),
  cloneSample: (id, data) => api.post(`/clauses/${id}/clone`, data),
};

// ============================================
// TEMPLATES API
// ============================================
export const templatesAPI = {
  getAll: (params) => api.get('/templates', { params }),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  
  // AI Generation
  generateAI: (data) => api.post('/templates/generate-ai', data),
};

// ============================================
// DOCUMENTS API
// ============================================
export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  generate: (data) => api.post('/documents/generate', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  
  // Content & Translation
  getContent: (id, lang = 'en') => api.get(`/documents/${id}/content`, { params: { lang } }),
  
  // FIXED: Translation endpoints matching backend
  translatePreview: (id, lang) => api.post('/translate/preview', { 
    original_id: id,
    original_type: 'document',
    target_lang: lang 
  }),
  translateConfirm: (previewId) => api.post('/translate/confirm', { preview_id: previewId }),
  
  // PDF Operations - FIXED to match backend routes
  generatePdf: (id, data) => api.post('/pdf/generate-translated', {
    document_id: id,
    target_lang: data.lang
  }, { responseType: 'blob' }),
  
  // Bulk Operations
  bulkGenerateFromExcel: (templateId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', templateId);
    return api.post('/documents/bulk-generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      timeout: 120000 // 2 minutes for bulk operations
    });
  },
  
  aiBulkGenerateFromExcel: (documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return api.post('/documents/bulk-generate-ai', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      timeout: 180000 // 3 minutes for AI bulk
    });
  },
};

// ============================================
// PDF API
// ============================================
export const pdfAPI = {
  getPreviewUrl: (docId) => `${API_BASE_URL.replace('/api', '')}/api/pdf/generate/${docId}`,
  
  download: async (docId, filename) => {
    try {
      const response = await api.get(`/pdf/generate/${docId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================
// SYSTEM API
// ============================================
export const systemAPI = {
  health: () => axios.get(`${API_BASE_URL.replace('/api', '')}/health`),
  aiConfig: () => axios.get(`${API_BASE_URL.replace('/api', '')}/ai-config`),
};

export default api;