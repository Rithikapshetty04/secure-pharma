import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('securepharma_token') || null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const savedToken = localStorage.getItem('securepharma_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem('securepharma_token');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      localStorage.removeItem('securepharma_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('securepharma_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return {
      success: false,
      message: res.message || 'Authentication failed',
      accountStatus: res.accountStatus,
      userId: res.userId,
    };
  };

  const register = async (formData) => {
    const res = await api.register(formData);
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('securepharma_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    organization: user?.organization || null,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}