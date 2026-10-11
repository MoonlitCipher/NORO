import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = api.getToken();
      if (token) {
        try {
          const profile = await authApi.me();
          setUser(profile);
          api.setUser(profile);
        } catch (e) {
          console.warn('Failed to refresh user profile on load', e);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
