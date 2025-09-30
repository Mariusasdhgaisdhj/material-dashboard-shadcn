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
    const checkAuth = async () => {
      try {
        // Check localStorage for existing session
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const requestBody = { email: email, password };
      const apiEndpoint = apiUrl('/users/login');
      
      console.log('=== LOGIN DEBUG ===');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('API Endpoint:', apiEndpoint);
      console.log('Request Body:', requestBody);
      
      // Use your existing working /users/login endpoint
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      if (response.ok) {
        const userData = await response.json();
        // Transform the user data to match frontend expectations
        const transformedUser = {
          id: userData.data.id,
          username: userData.data.name,
          email: userData.data.email,
          firstName: userData.data.name,
          lastName: userData.data.name,
          title: userData.data.role === 'admin' ? 'System Administrator' : userData.data.role,
          isAdmin: userData.data.role === 'admin',
          role: userData.data.role,
          createdAt: userData.data.created_at
        };
        setUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));
        navigate('/');
        return true;
      } else {
        const errorData = await response.json();
        console.log('=== LOGIN ERROR ===');
        console.log('Error Response:', errorData);
        console.log('Error Message:', errorData.message);
        console.error('Login failed:', errorData.message);
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
      await fetch(apiUrl('/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      navigate('/auth/sign-in');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(apiUrl('/auth/me'), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.data || userData);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
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
