import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';

// Always set axios Authorization header from localStorage token on app load
const token = localStorage.getItem('accessToken');
if (token && token !== 'null' && token !== 'undefined') {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} else {
  delete axios.defaults.headers.common['Authorization'];
}

// Global Axios request interceptor for debugging
axios.interceptors.request.use(config => {
  console.log('AXIOS REQUEST:', config.url, 'Authorization:', config.headers['Authorization']);
  return config;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
