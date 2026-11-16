import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('devmatch_user');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('devmatch_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('devmatch_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/users/me')
        .then((res) => {
          if (res.data && res.data.data) {
            const profile = res.data.data;
            setUser((prev) => {
              const updated = { ...prev, ...profile };
              localStorage.setItem('devmatch_user', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (authData) => {
    const { token, id, name, email, role, profileImage } = authData;
    const userData = { id, name, email, role, profileImage };
    localStorage.setItem('devmatch_token', token);
    localStorage.setItem('devmatch_user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('devmatch_token');
    localStorage.removeItem('devmatch_user');
    setToken(null);
    setUser(null);
  };

  const updateProfileState = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('devmatch_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

