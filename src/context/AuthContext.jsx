import React, { createContext, useContext, useState, useEffect } from 'react';
import { userOperations } from '../data/supabaseOperations';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const userData = localStorage.getItem('userData');
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await userOperations.authenticateUser(username, password);
      if (userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'Invalid username or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasAccess = (section) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(section) || user.role === 'Admin';
  };

  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    hasAccess,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};