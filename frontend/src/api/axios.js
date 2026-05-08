import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5003/api',
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle common errors globally
api.interceptors.response.use(
  response => response,
  error => {
    // Don't retry on auth errors — let the auth context handle logout
    if (error.response?.status === 401) {
      return Promise.reject(error);
    }

    // Log timeout errors for debugging
    if (error.code === 'ECONNABORTED') {
      console.warn('[API] Request timed out:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default api;
