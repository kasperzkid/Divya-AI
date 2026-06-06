import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    if (stored) return stored;
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('token='));
    return cookieToken ? cookieToken.split('=')[1] : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginWithGoogle = async (payload) => {
    try {
      const body = typeof payload === 'string' ? { credential: payload } : payload;
      const res = await axios.post('/api/auth/google', body);
      localStorage.setItem('token', res.data.token);
      // Store token as cookie as well
      document.cookie = `token=${res.data.token}; path=/; max-age=31536000; SameSite=Lax`;
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };

  const loginWithTokenAndUser = (token, user) => {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=31536000; SameSite=Lax`;
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, loginWithTokenAndUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
