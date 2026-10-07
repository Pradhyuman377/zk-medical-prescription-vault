import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  seedDemo: async () => {
    const res = await api.post('/auth/seed-demo');
    return res.data;
  }
};

export const prescriptionService = {
  uploadAndExtractOCR: async (file) => {
    const formData = new FormData();
    formData.append('prescriptionImage', file);
    const res = await api.post('/prescriptions/upload-ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  issuePrescription: async (payload) => {
    const res = await api.post('/prescriptions/issue', payload);
    return res.data;
  },
  listPrescriptions: async () => {
    const res = await api.get('/prescriptions');
    return res.data;
  },
  getPrescriptionById: async (id) => {
    const res = await api.get(`/prescriptions/${id}`);
    return res.data;
  },
  dispensePrescription: async (id) => {
    const res = await api.post(`/prescriptions/${id}/dispense`);
    return res.data;
  }
};

export const securityService = {
  getAlerts: async () => {
    const res = await api.get('/security/alerts');
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/security/audit-logs');
    return res.data;
  },
  simulateTamper: async (id) => {
    const res = await api.post(`/security/simulate-tamper/${id}`);
    return res.data;
  },
  simulateDoubleFill: async () => {
    const res = await api.post('/security/simulate/double-fill');
    return res.data;
  },
  simulateTamperBitflip: async () => {
    const res = await api.post('/security/simulate/tamper-bitflip');
    return res.data;
  },
  simulateBotBurst: async () => {
    const res = await api.post('/security/simulate/bot-burst');
    return res.data;
  }
};

export default api;
