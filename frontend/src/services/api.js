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
  getByIdea: (ideaId) => api.get(`/questions/idea/${ideaId}`),
  getById: (id) => api.get(`/questions/${id}`),  bid: (data) => api.post('/questions/bid', data),
  getMinimumEscrow: () => api.get('/questions/minimum-escrow'),
};

export default api;

export const matching = {
  findExperts: (questionId, params = {}) => 
    api.get(`/matching/question/${questionId}/experts`, { params }),
  notifyExperts: (questionId, expertIds) => 
    api.post(`/matching/question/${questionId}/notify`, { expertIds }),
};

export const answers = {
  submitExpert: (data) => api.post('/answers/submit', data),
  getByQuestion: (questionId) => api.get(`/answers/question/${questionId}`),
  rate: (answerId, data) => api.post(`/answers/${answerId}/rate`, data)
};
export const expert = {
  getProfile: () => api.get('/expert/profile'),
  updateProfile: (data) => api.post('/expert/profile', data),
  submitEvidence: (data) => api.post('/expert/evidence', data),
  getVerificationStatus: () => api.get('/expert/verification-status'),
  getQuestions: () => api.get("/expert/questions"),};
