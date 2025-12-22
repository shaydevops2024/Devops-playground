import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password });

export const login = (username, password, captchaToken) =>
  api.post('/auth/login', { username, password, captchaToken });

export const logout = () => api.post('/auth/logout');

export const verifyToken = (token) =>
  api.get('/auth/verify', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.data);

export const getUserProfile = () => api.get('/user/profile').then((res) => res.data);

export const updateTheme = (theme) =>
  api.patch('/user/theme', { theme }).then((res) => res.data);

export const getUserStatistics = () =>
  api.get('/user/statistics').then((res) => res.data);

export const checkPrerequisites = (playgroundType) =>
  api.post('/playground/check-prerequisites', { playgroundType }).then((res) => res.data);

export const listScenarios = (playgroundType) =>
  api.get(`/playground/scenarios/${playgroundType}`).then((res) => res.data);

export const executeScenario = (playgroundType, scenarioName, scriptName = null) =>
  api.post('/playground/execute', { playgroundType, scenarioName, scriptName }).then((res) => res.data);

export const getExecutionStatus = (executionId) =>
  api.get(`/playground/execution/${executionId}`).then((res) => res.data);

export const getExecutionHistory = (limit = 50, offset = 0) =>
  api.get(`/playground/history?limit=${limit}&offset=${offset}`).then((res) => res.data);

export default api;