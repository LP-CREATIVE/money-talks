import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const ideas = {
  getAll: (params) => api.get('/ideas', { params }),
  getById: (id) => api.get(`/ideas/${id}`),
  create: (data) => api.post('/ideas', data),
  updateRankings: () => api.post('/ideas/update-rankings'),
};

export const escrow = {
  contribute: (data) => api.post('/escrow/contribute', data),
  getMyContributions: () => api.get('/escrow/my-contributions'),
  getIdeaContributions: (ideaId) => api.get(`/escrow/idea/${ideaId}`),
};

export const questions = {
  add: (data) => api.post('/questions/add', data),
  getIdeaQuestions: (ideaId) => api.get(`/questions/idea/${ideaId}`),
  getById: (id) => api.get(`/questions/${id}`)
};

export const matching = {
  findExperts: (questionId, params = {}) => 
    api.get(`/matching/question/${questionId}/experts`, { params }),
  notifyExperts: (questionId, expertIds) => 
    api.post(`/matching/question/${questionId}/notify`, { expertIds }),
};

export const answers = {
  submit: (data) => api.post('/answers/submit', data),
  submitExpert: (data) => api.post('/answers/expert', data),
  getByQuestion: (questionId) => api.get(`/answers/question/${questionId}`),
  rate: (answerId, data) => api.post(`/answers/${answerId}/rate`, data),
  getMyAnswers: () => api.get('/answers/expert/my-answers'),
  deleteAnswer: (answerId) => api.delete(`/answers/expert/answers/${answerId}`),
};

export const expert = {
  getProfile: () => api.get('/expert-details/profile'),
  updateProfile: (data) => api.post('/expert/profile', data),
  submitEvidence: (data) => api.post('/expert/evidence', data),
  getVerificationStatus: () => api.get('/expert/verification-status'),
  getQuestions: () => api.get('/expert/questions'),
};

export const philosophy = {
  getAll: (params) => api.get("/philosophy", { params }),
  create: (data) => api.post("/philosophy", data),
  update: (id, data) => api.put(`/philosophy/${id}`, data),
  delete: (id) => api.delete(`/philosophy/${id}`),
  toggle: (id) => api.post(`/philosophy/${id}/toggle`),
};

export const resale = {
  listAnswer: (data) => api.post('/resale/list', data),
  getMarketplace: (params = {}) => api.get('/resale/marketplace', { params }),
  purchase: (data) => api.post('/resale/purchase', data),
  confirmPurchase: (data) => api.post('/resale/purchase/confirm', data),
  getMyActivity: () => api.get('/resale/my-activity'),
  unlist: (answerId) => api.delete(`/resale/unlist/${answerId}`)
};

export const affiliate = {
  getDashboard: () => api.get('/affiliate/dashboard'),
  getReferralLink: () => api.get('/affiliate/referral-link'),
  getEarnings: (params) => api.get('/affiliate/earnings', { params }),
  requestPayout: (data) => api.post('/affiliate/payout', data)
};

export const expertOnboarding = {
  updateEmployment: (employment) => api.put('/expert-onboarding/employment', { employment }),
  addObservablePattern: (data) => api.post('/expert-onboarding/observable-pattern', data),
  submitProfile: (data) => api.post('/expert-onboarding/submit', data),
  getProfile: () => api.get('/expert-onboarding/profile'),
  updateExpertise: (expertise) => api.put('/expert-onboarding/expertise', { expertise }),
  addCompanyRelationship: (data) => api.post('/expert-onboarding/company-relationship', data),
  addConnection: (data) => api.post('/expert-onboarding/connection', data),
};

export const observablePatterns = {
  getPatterns: () => api.get('/expert/observable/patterns'),
  createPattern: (data) => api.post('/expert/observable/patterns', data),
  updatePattern: (id, data) => api.put(`/expert/observable/patterns/${id}`, data),
  deletePattern: (id) => api.delete(`/expert/observable/patterns/${id}`),
  getCompanyPatterns: (company) => api.get(`/expert/observable/patterns/company/${company}`),
  getStats: () => api.get('/expert/observable/patterns/stats'),
  recordObservation: (questionId, data) => api.post(`/expert/observable/observations/question/${questionId}`, data),
  getQuestionObservations: (questionId) => api.get(`/expert/observable/observations/question/${questionId}`)
};


// Admin API endpoints
export const admin = {
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  banUser: (userId) => api.post(`/admin/users/${userId}/ban`),
  verifyUser: (userId) => api.post(`/admin/users/${userId}/verify`),
  
  // Metrics
  getMetrics: (params) => api.get('/admin/metrics', { params }),
  getRevenueStats: () => api.get('/admin/metrics/revenue'),
  getUserStats: () => api.get('/admin/metrics/users'),
  
  // Answer management
  getStats: () => api.get('/admin/stats'),
  getPendingAnswers: () => api.get('/admin/answers/pending'),
  approveAnswer: (answerId) => api.post(`/admin/answers/${answerId}/approve`),
  rejectAnswer: (answerId, reason) => api.post(`/admin/answers/${answerId}/reject`, { reason })
};
export const demo = {
  sendOutreachEmail: (data) => api.post('/demo/send-outreach', data),
  getPreview: (token) => api.get(`/demo/preview/${token}`),
};

export default api;

// File upload function
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/answers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

// Update answers object to include uploadFile
answers.uploadFile = uploadFile;
