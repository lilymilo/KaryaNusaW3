import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5003/api',
  timeout: 30000, // 30s default (was 15s — too short for mobile)
});

let activeRequests = 0;
const updateLoadingState = (delta) => {
  activeRequests += delta;
  if (activeRequests < 0) activeRequests = 0;
  
  if (activeRequests === 1 && delta > 0) {
    window.dispatchEvent(new CustomEvent('global-loading-start'));
  } else if (activeRequests === 0) {
    window.dispatchEvent(new CustomEvent('global-loading-end'));
  }
};

api.interceptors.request.use(
  config => {
    updateLoadingState(1);
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    // Extend timeout for file uploads (multipart/form-data)
    if (config.data instanceof FormData) {
      config.timeout = 120000; // 2 minutes for uploads
    }
    
    return config;
  },
  error => {
    updateLoadingState(-1);
    return Promise.reject(error);
  }
);

// Response interceptor: handle common errors globally
api.interceptors.response.use(
  response => {
    updateLoadingState(-1);
    return response;
  },
  error => {
    updateLoadingState(-1);
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
