import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'buyer' | 'seller';
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<any>;
  logout: () => void;
  loading: boolean;
  fetchUserProfile: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clean up old token format on initialization
  useEffect(() => {
    const oldToken = localStorage.getItem('token');
    if (oldToken && !localStorage.getItem('accessToken')) {
      console.log('🔄 Migrating old token format to new format');
      localStorage.removeItem('token');
      // Don't migrate old token as it's not compatible with new format
    }
  }, []);

  // Axios interceptor for automatic token refresh
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && refreshToken && !isRefreshing) {
          originalRequest._retry = true;
          setIsRefreshing(true);

          try {
            const response = await axios.post('http://localhost:3001/api/users/refresh-token', {
              refreshToken: refreshToken
            });

            const { accessToken } = response.data;
            setToken(accessToken);
            localStorage.setItem('accessToken', accessToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            console.log('✅ Token refreshed automatically, retrying request');
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('Automatic token refresh failed:', refreshError);
            logout();
            return Promise.reject(refreshError);
          } finally {
            setIsRefreshing(false);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, refreshToken, isRefreshing]);

  useEffect(() => {
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user profile
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users/profile');
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      
      // If token is invalid, try to refresh it
      if (error.response?.status === 401 && refreshToken) {
        try {
          await refreshAccessToken();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          logout();
        }
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/users/refresh-token', {
        refreshToken: refreshToken
      });

      const { accessToken, expiresAt } = response.data;
      setToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      console.log('✅ Access token refreshed successfully');
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/users/login', {
        email,
        password,
      });

      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      
      // Store both tokens
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(user);
      
      // Save to localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      console.log('✅ Login successful, tokens stored');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string, role: string = 'buyer') => {
    try {
      const response = await axios.post('http://localhost:3001/api/users/register', {
        email,
        password,
        name,
        role,
      });

      // Registration only returns a success message, not token/user
      // User needs to verify email and then login
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to revoke token
      if (token) {
        await axios.post('http://localhost:3001/api/users/logout', {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      // ignore errors during logout
      console.log('Logout request failed (this is normal):', e);
    }
    
    // Clear state and localStorage
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token'); // Clean up old format
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('✅ Logout successful, tokens cleared');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    fetchUserProfile,
    refreshToken: refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};