import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        // Get the token from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || localStorage.getItem('accessToken');
        
        console.log('OAuthSuccess: token in localStorage before set:', localStorage.getItem('accessToken'));
        
        if (token) {
          // Store the token
          localStorage.setItem('accessToken', token);
          console.log('OAuthSuccess: token in localStorage after set:', localStorage.getItem('accessToken'));
          
          // Set axios default header
          const axios = require('axios');
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user profile to complete login
          try {
            const response = await axios.get('http://localhost:3001/api/users/profile');
            const user = response.data.user;
            
            // Update auth context
            // Note: We're not calling login() here since we already have the token
            // The AuthContext will pick up the token from localStorage on next render
            
            console.log('✅ OAuth login successful, user:', user);
            navigate('/dashboard');
          } catch (error) {
            console.error('Failed to fetch user profile after OAuth:', error);
            navigate('/login');
          }
        } else {
          console.error('No token found in OAuth success');
          navigate('/login');
        }
      } catch (error) {
        console.error('OAuth success handling error:', error);
        navigate('/login');
      }
    };

    handleOAuthSuccess();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-grey">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-dark-grey mb-2">Completing Login...</h2>
          <p className="text-grey">Please wait while we set up your account.</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthSuccess; 