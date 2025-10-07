import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '@/lib/api';

interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  location?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl('/users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const userData = await response.json();
        const transformedUser = {
          id: userData.data.id,
          username: userData.data.name,
          email: userData.data.email,
          firstName: userData.data.firstname || userData.data.name,
          lastName: userData.data.lastname || userData.data.name,
          mobile: userData.data.phone,
          avatar: userData.data.profilepicture,
          title: userData.data.role === 'admin' ? 'System Administrator' : userData.data.role,
          isAdmin: userData.data.role === 'admin',
          role: userData.data.role,
          createdAt: userData.data.created_at
        } as any;
        setUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));
        navigate('/');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // No backend endpoint; clear local state
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      navigate('/auth/sign-in');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const current = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null);
      if (!current?.id) return;
      const res = await fetch(apiUrl(`/users/${current.id}`));
      if (!res.ok) return;
      const payload = await res.json();
      const d = payload?.data || payload;
      if (!d) return;
      const transformedUser = {
        id: d.id,
        username: d.name,
        email: d.email,
        firstName: d.firstname || d.name,
        lastName: d.lastname || d.name,
        mobile: d.phone,
        avatar: d.profilepicture,
        title: d.role === 'admin' ? 'System Administrator' : d.role,
        isAdmin: d.role === 'admin',
        role: d.role,
        createdAt: d.created_at
      } as any;
      setUser(transformedUser);
      localStorage.setItem('user', JSON.stringify(transformedUser));
    } catch (e) {
      console.error('Failed to fetch user profile from backend:', e);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
