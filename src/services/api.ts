import { demoService } from './demoService.ts';
import { remoteApiService } from './remoteApiService.ts';
import { getDemoStoredToken, setDemoStoredToken } from './demoStore.ts';

const TOKEN_KEY = 'mealbridge_token';

// Mode Flag: Default to High-Fidelity Client-Side Demo with LocalStorage Persistence
// as requested without requiring MONGO_URI or JWT_SECRET.
export const PERSISTENCE_MODE: 'DEMO_LOCAL_STORAGE' | 'REMOTE_EXPRESS_MONGODB' =
  'DEMO_LOCAL_STORAGE';

export function getStoredToken(): string | null {
  const local = localStorage.getItem(TOKEN_KEY);
  if (local) return local;
  return getDemoStoredToken();
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  setDemoStoredToken(token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  setDemoStoredToken(null);
}

/**
 * ============================================================================
 * MEALBRIDGE DATA ACCESS FACADE
 * ============================================================================
 * Cleanly separates the frontend demo data layer from the future Express + MongoDB
 * REST backend.
 *
 * Current Active Layer: demoService (React state + localStorage persistence)
 * Future Backend Layer: remoteApiService (Express + MongoDB + JWT)
 */
export const api = {
  // Persistence Mode Inspection
  getPersistenceMode: () => PERSISTENCE_MODE,

  // Health
  checkHealth: demoService.checkHealth,

  // Auth
  register: remoteApiService.register,
  verifyEmailOtp: remoteApiService.verifyEmailOtp,
  resendEmailOtp: remoteApiService.resendEmailOtp,
  login: remoteApiService.login,
  logout: remoteApiService.logout,
  getProvidersStatus: remoteApiService.getProvidersStatus,
  getCurrentUser: remoteApiService.getCurrentUser,
  updateProfile: remoteApiService.updateProfile,
  forgotPassword: remoteApiService.forgotPassword,
  resetPassword: remoteApiService.resetPassword,

  // Categories
  getCategories: demoService.getCategories,
  createCategory: demoService.createCategory,

  // Donations
  createDonation: demoService.createDonation,
  getDonations: demoService.getDonations,
  getDonationById: demoService.getDonationById,
  cancelDonation: demoService.cancelDonation,
  getDonorStats: demoService.getDonorStats,

  // NGO Operations
  getNGOProfile: demoService.getNGOProfile,
  getRecommendedMatches: demoService.getRecommendedMatches,
  getNGOAcceptedDonations: demoService.getNGOAcceptedDonations,
  getDeliveriesAwaitingVerification: demoService.getDeliveriesAwaitingVerification,
  acceptMatch: demoService.acceptMatch,
  rejectMatch: demoService.rejectMatch,
  assignVolunteer: demoService.assignVolunteer,
  reassignVolunteer: demoService.reassignVolunteer,
  getRecommendedVolunteers: demoService.getRecommendedVolunteers,
  getTaskById: demoService.getTaskById,
  verifyDelivery: demoService.verifyDelivery,
  rejectProof: demoService.rejectProof,

  // Volunteers
  getMyTasks: demoService.getMyTasks,
  acceptTask: demoService.acceptTask,
  declineTask: demoService.declineTask,
  updateTaskStatus: demoService.updateTaskStatus,
  submitProof: demoService.submitProof,
  verifyProof: demoService.verifyProof,

  // Emergency SOS (15 KM Mesh & Lifecycle)
  createEmergencySOS: demoService.createEmergencySOS,
  getEmergencyAlerts: demoService.getEmergencyAlerts,
  getEmergencyAlertById: demoService.getEmergencyAlertById,
  respondToEmergency: demoService.respondToEmergency,
  startEmergencyDispatch: demoService.startEmergencyDispatch,
  markEmergencyInProgress: demoService.markEmergencyInProgress,
  submitEmergencyReliefDelivery: demoService.submitEmergencyReliefDelivery,
  verifyAndCloseEmergency: demoService.verifyAndCloseEmergency,
  rejectEmergencyProof: demoService.rejectEmergencyProof,

  // Hunger Spotting (48-Hour TTL)
  createHungerReport: demoService.createHungerReport,
  getHungerReports: demoService.getHungerReports,
  verifyHungerReport: demoService.verifyHungerReport,

  // AI Expiry Guidance
  estimateShelfLife: demoService.estimateShelfLife,

  // Notifications
  getNotifications: demoService.getNotifications,
  markNotificationRead: demoService.markNotificationRead,
  markAllNotificationsRead: demoService.markAllNotificationsRead,

  // Administrator Operations
  getAdminStats: demoService.getAdminStats,
  getAdminUsers: demoService.getAdminUsers,
  updateUserStatus: demoService.updateUserStatus,
  getAdminNGOs: demoService.getAdminNGOs,
  verifyNGO: demoService.verifyNGO,
  getAuditLogs: demoService.getAuditLogs,
  getSystemSettings: demoService.getSystemSettings,
  updateSystemSettings: demoService.updateSystemSettings,
};

// Re-export both for external modularity
export { demoService, remoteApiService };
