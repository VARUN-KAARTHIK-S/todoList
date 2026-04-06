import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api/users';

// Helper: attach or remove the Bearer token on all axios requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On app mount: restore session from localStorage if token exists
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // No token — just show login page, no network call needed
        setLoading(false);
        return;
      }
      // Token found — attach it and verify with the server
      setAuthToken(token);
      try {
        const response = await axios.get(`${API_URL}/getuser`);
        setUser(response.data.data.user);
      } catch (err) {
        // Token is expired or invalid — clear everything
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { token, data } = response.data;
      setAuthToken(token);          // Store token in localStorage + set axios header
      setUser(data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      const { token, data } = response.data;
      setAuthToken(token);          // Store token in localStorage + set axios header
      setUser(data.user);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check all fields.';
      console.log('Server registration error:', msg); // Debug the 400 message
      setError(msg);
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);   // Clears localStorage + axios header
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
