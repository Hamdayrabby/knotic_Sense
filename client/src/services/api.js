import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base config
const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('knotic_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401 (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect on 401 for auth endpoints (login/register)
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        const isOnAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

        if (error.response?.status === 401 && !isAuthEndpoint && !isOnAuthPage) {
            // Token expired or invalid - auto logout
            localStorage.removeItem('knotic_token');
            localStorage.removeItem('knotic_user');
            window.location.href = '/login';
        } else if (error.response?.data?.message) {
            // Global error toast for other errors
            toast.error(error.response.data.message);
        } else if (error.message === 'Network Error') {
            toast.error('Network error. Check your connection.');
        }
        return Promise.reject(error);
    }
);

export default api;
