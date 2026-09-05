import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true // Extremely important for HttpOnly cookies
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const path = window.location.pathname;

    if (status === 401) {
      if (!path.includes('/login') && !path.includes('/signup') && !path.includes('/forgot-password') && !path.includes('/reset-password')) {
        window.location.href = '/login';
      }
    } else if (status === 403 && err.response?.data?.unverified) {
      if (!path.includes('/verification-pending')) {
        window.location.href = '/verification-pending';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
