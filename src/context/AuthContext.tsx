import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api.ts';
import { getDemoStoredUser, setDemoStoredUser } from '../services/demoStore.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; requiresVerification?: boolean; email?: string }>;
  register: (data: any) => Promise<{
    success: boolean;
    message: string;
    emailDeliveryConfigured: boolean;
    emailDelivered: boolean;
    dependencyNotice?: string;
    requiresVerification?: boolean;
    email?: string;
  }>;
  verifyEmailOtp: (payload: { email: string; otp: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  resendEmailOtp: (email: string) => Promise<{
    success: boolean;
    message: string;
    emailDeliveryConfigured: boolean;
    emailDelivered: boolean;
    dependencyNotice?: string;
    cooldownRemainingSec?: number;
  }>;
  forgotPassword: (email: string) => Promise<{
    success: boolean;
    message: string;
    emailDeliveryConfigured: boolean;
    emailDelivered: boolean;
    dependencyNotice?: string;
  }>;
  resetPassword: (payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getDemoStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      // If fresh launch with no prior token, bootstrap as pre-seeded demo Donor for preview
      try {
        const res = await api.login({ email: 'donor@mealbridge.org', password: 'Password123!' });
        if (res.success && res.token && res.user) {
          setStoredToken(res.token);
          setDemoStoredUser(res.user);
          setToken(res.token);
          setUser(res.user);
        }
      } catch (err) {
        console.warn('Initial demo auto-login notice:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await api.getCurrentUser();
      if (res.success && res.user) {
        setUser(res.user);
        setDemoStoredUser(res.user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        setDemoStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      // Notice: Accounts start in unverified PENDING state.
      // Token is NOT issued until OTP is successfully verified on server.
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailOtp = async (payload: { email: string; otp: string }) => {
    setIsLoading(true);
    try {
      const res = await api.verifyEmailOtp(payload);
      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        setDemoStoredUser(res.user);
        setToken(res.token);
        setUser(res.user);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailOtp = async (email: string) => {
    return api.resendEmailOtp(email);
  };

  const forgotPassword = async (email: string) => {
    return api.forgotPassword(email);
  };

  const resetPassword = async (payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }) => {
    return api.resetPassword(payload);
  };

  const logout = () => {
    try {
      api.logout();
    } catch {
      // ignore
    }
    removeStoredToken();
    setDemoStoredUser(null);
    setToken(null);
    setUser(null);
  };

  // Handy one-click role switch for development testing of verified demo personas
  const quickSwitchRole = async (role: UserRole) => {
    const roleEmails: Record<UserRole, string> = {
      ADMIN: 'admin@mealbridge.org',
      DONOR: 'donor@mealbridge.org',
      NGO: 'ngo@mealbridge.org',
      VOLUNTEER: 'volunteer@mealbridge.org',
      PUBLIC: 'public@mealbridge.org',
    };

    const email = roleEmails[role];
    if (email) {
      await login({ email, password: 'Password123!' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyEmailOtp,
        resendEmailOtp,
        forgotPassword,
        resetPassword,
        logout,
        quickSwitchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
