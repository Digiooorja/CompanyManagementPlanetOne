import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authStorage } from '../../utils/authStorage';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: number;
  department?: string;
  departmentDetails?: {
    id: number;
    name: string;
  };
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStandardUser: boolean;
  canEdit: boolean;
  canUpload: boolean;
  hasPermission: (key: string) => boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Guest user object for view-only access
const GUEST_USER: User = {
  id: 0,
  username: 'guest',
  email: 'guest@example.com',
  firstName: 'Guest',
  lastName: 'User',
  role: 'Guest'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from session storage on mount, or set guest user
  useEffect(() => {
    const savedToken = authStorage.getToken();
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      // Set guest user for view-only access
      setUser(GUEST_USER);
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Bind the current tab to this user's ID
        authStorage.setActiveUserId(userData.id);
      } else {
        authStorage.clearSession();
        setToken(null);
        setUser(GUEST_USER);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      authStorage.clearSession();
      setToken(null);
      setUser(GUEST_USER);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch (parseError) {
          console.warn('Login error response could not be parsed as JSON', parseError);
        }
        throw new Error(errorBody?.error || 'Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      authStorage.saveSession(data.user.id, data.token, data.user);
      // Re-fetch via /me so the resolved RBAC permission set is populated
      // immediately, rather than only after the next page load.
      await fetchCurrentUser(data.token);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch (parseError) {
          console.warn('Register error response could not be parsed as JSON', parseError);
        }
        throw new Error(errorBody?.error || 'Registration failed');
      }

      const result = await response.json();
      setToken(result.token);
      authStorage.saveSession(result.user.id, result.token, result.user);
      await fetchCurrentUser(result.token);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(GUEST_USER);
    setToken(null);
    authStorage.clearSession();
  };

  const isGuest = !token && user?.role === 'Guest';
  const isAdmin = user?.role === 'Admin';
  const isManager = ['Admin', 'Manager'].includes(user?.role || '');
  const isStandardUser = user?.role === 'User';
  const canEdit = !isGuest && isManager;
  const canUpload = !isGuest;

  // Fine-grained permission check backed by the RBAC matrix (§4) — use this
  // for the newer role-gated modules instead of the coarse isManager/canEdit
  // flags, so the business roles (Legal/Compliance Officer, Finance/Accounts,
  // etc.) see the right affordances without needing 'Manager' or 'Admin'.
  const hasPermission = (key: string) => {
    if (isGuest) return false;
    if (isAdmin) return true;
    return !!user?.permissions?.includes(key);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isGuest,
    isAdmin,
    isManager,
    isStandardUser,
    canEdit,
    canUpload,
    hasPermission,
    isLoading,
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
