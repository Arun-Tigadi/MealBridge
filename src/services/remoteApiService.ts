import {
  User,
  Donation,
  FoodCategory,
  EmergencyAlert,
  HungerReport,
  NotificationItem,
  SystemSettings,
  AuditLog,
} from '../types.ts';
import { getStoredToken } from './api.ts';

/**
 * ============================================================================
 * MEALBRIDGE FUTURE BACKEND SERVICE (EXPRESS + MONGODB REST API)
 * ============================================================================
 * This service client connects directly to the Node.js Express + MongoDB backend
 * via `/api/*` endpoints when external database persistence (MONGO_URI) and
 * token signing (JWT_SECRET) are enabled.
 *
 * It is completely separated from the client-side DemoStore / DemoService.
 */

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}

export const remoteApiService = {
  // Health
  checkHealth: () => request<{ status: string; service: string; database: any }>('/api/health'),

  // Auth
  register: (userData: any) =>
    request<{
      success: boolean;
      message: string;
      token?: string;
      user?: User;
      emailDeliveryConfigured: boolean;
      emailDelivered: boolean;
      dependencyNotice?: string;
      requiresVerification?: boolean;
      email?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  verifyEmailOtp: (payload: { email: string; otp: string }) =>
    request<{ success: boolean; message: string; token: string; user: User }>(
      '/api/auth/verify-email-otp',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  resendEmailOtp: (email: string) =>
    request<{
      success: boolean;
      message: string;
      emailDeliveryConfigured: boolean;
      emailDelivered: boolean;
      dependencyNotice?: string;
      cooldownRemainingSec?: number;
    }>('/api/auth/resend-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User; requiresVerification?: boolean; email?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    ),

  logout: () =>
    request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  getProvidersStatus: () =>
    request<{
      success: boolean;
      email: { configured: boolean; provider: string };
      sms: { configured: boolean; provider: string; notice: string };
    }>('/api/auth/providers-status'),

  getCurrentUser: () =>
    request<{ success: boolean; user: User; linkedProfile: any }>('/api/auth/me'),

  updateProfile: (profileData: any) =>
    request<{ success: boolean; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  forgotPassword: (email: string) =>
    request<{
      success: boolean;
      message: string;
      emailDeliveryConfigured: boolean;
      emailDelivered: boolean;
      dependencyNotice?: string;
    }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { email: string; otp: string; newPassword: string; confirmPassword?: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Categories
  getCategories: () =>
    request<{ success: boolean; categories: FoodCategory[] }>('/api/categories'),

  createCategory: (cat: any) =>
    request<{ success: boolean; category: FoodCategory }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    }),

  // Donations
  createDonation: (donationData: any) =>
    request<{ success: boolean; donation: Donation; matchesCount: number; expiryPrediction: any }>(
      '/api/donations',
      {
        method: 'POST',
        body: JSON.stringify(donationData),
      }
    ),

  getDonations: (params?: { category?: string; status?: string; search?: string; mineOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.mineOnly) query.append('mineOnly', 'true');
    return request<{ success: boolean; count: number; donations: Donation[] }>(
      `/api/donations?${query.toString()}`
    );
  },

  getDonationById: (id: string) =>
    request<{ success: boolean; donation: Donation; matches: any[]; task?: any }>(
      `/api/donations/${id}`
    ),

  cancelDonation: (id: string) =>
    request<{ success: boolean; message: string; donation: Donation }>(
      `/api/donations/${id}/cancel`,
      { method: 'POST' }
    ),

  getDonorStats: () =>
    request<{ success: boolean; stats: any }>('/api/donations/stats/donor'),

  // NGO Operations
  getNGOProfile: () => request<{ success: boolean; ngo: any }>('/api/ngo/profile'),

  getRecommendedMatches: () =>
    request<{ success: boolean; count: number; matches: any[] }>('/api/ngo/matches'),

  acceptMatch: (payload: { matchId: string; deliveryAddress?: string; instructions?: string }) =>
    request<{ success: boolean; message: string; task: any; donation: Donation }>(
      '/api/ngo/matches/accept',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  rejectMatch: (payload: { matchId: string; rejectionReason?: string }) =>
    request<{ success: boolean; message: string }>('/api/ngo/matches/reject', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  assignVolunteer: (payload: { taskId: string; volunteerId: string }) =>
    request<{ success: boolean; message: string; task: any }>('/api/ngo/tasks/assign', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getRecommendedVolunteers: (taskId?: string) =>
    request<{ success: boolean; count: number; volunteers: any[] }>(
      `/api/ngo/volunteers${taskId ? `?taskId=${taskId}` : ''}`
    ),

  // Volunteers
  getMyTasks: () => request<{ success: boolean; count: number; tasks: any[] }>('/api/volunteers/tasks'),

  acceptTask: (taskId: string) =>
    request<{ success: boolean; task: any }>(`/api/volunteers/tasks/${taskId}/accept`, {
      method: 'POST',
    }),

  declineTask: (taskId: string) =>
    request<{ success: boolean; message: string }>(`/api/volunteers/tasks/${taskId}/decline`, {
      method: 'POST',
    }),

  updateTaskStatus: (taskId: string, status: string) =>
    request<{ success: boolean; task: any; donation: Donation }>(
      `/api/volunteers/tasks/${taskId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    ),

  submitProof: (taskId: string, payload: { proofImageUrl: string; proofNotes: string }) =>
    request<{ success: boolean; task: any }>(`/api/volunteers/tasks/${taskId}/proof`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyProof: (taskId: string) =>
    request<{ success: boolean; task: any }>(`/api/volunteers/tasks/${taskId}/verify`, {
      method: 'POST',
    }),

  // Emergency SOS
  createEmergencySOS: (payload: any) =>
    request<{ success: boolean; alert: EmergencyAlert; notifiedNgos: number; radiusKm: number }>(
      '/api/emergency/sos',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getEmergencyAlerts: () =>
    request<{ success: boolean; count: number; alerts: EmergencyAlert[] }>('/api/emergency'),

  respondToEmergency: (id: string, responseNote?: string) =>
    request<{ success: boolean; alert: EmergencyAlert }>(`/api/emergency/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ responseNote }),
    }),

  // Hunger Spotting
  createHungerReport: (payload: any) =>
    request<{ success: boolean; message: string; report: HungerReport }>('/api/hunger/report', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getHungerReports: () =>
    request<{ success: boolean; count: number; reports: HungerReport[] }>('/api/hunger/reports'),

  verifyHungerReport: (id: string, payload: { status: string; verificationNotes?: string }) =>
    request<{ success: boolean; report: HungerReport }>(`/api/hunger/reports/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // AI Expiry
  estimateShelfLife: (payload: any) =>
    request<{ success: boolean; prediction: any; aiEnrichedInsights?: string; disclaimer: string }>(
      '/api/ai/expiry-estimate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; count: number; unreadCount: number; notifications: NotificationItem[] }>(
      '/api/notifications'
    ),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // Admin
  getAdminStats: () =>
    request<{ success: boolean; stats: any }>('/api/admin/stats'),

  getAdminUsers: (params?: { role?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return request<{ success: boolean; count: number; users: User[] }>(`/api/admin/users?${query.toString()}`);
  },

  updateUserStatus: (id: string, status: string, reason?: string) =>
    request<{ success: boolean; user: User }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  getAdminNGOs: () => request<{ success: boolean; ngos: any[] }>('/api/admin/ngos'),

  verifyNGO: (id: string, verified: boolean, rejectionReason?: string) =>
    request<{ success: boolean; ngo: any }>(`/api/admin/ngos/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verified, rejectionReason }),
    }),

  getAuditLogs: () => request<{ success: boolean; count: number; logs: AuditLog[] }>('/api/admin/audit-logs'),

  getSystemSettings: () => request<{ success: boolean; settings: SystemSettings }>('/api/admin/settings'),

  updateSystemSettings: (settings: Partial<SystemSettings>) =>
    request<{ success: boolean; settings: SystemSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};
