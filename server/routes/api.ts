import { Router } from 'express';
import { getDbStatus } from '../config/db.ts';
import { authenticateToken, authorize } from '../middleware/auth.ts';
import * as authCtrl from '../controllers/authController.ts';
import * as donCtrl from '../controllers/donationController.ts';
import * as ngoCtrl from '../controllers/ngoController.ts';
import * as volCtrl from '../controllers/volunteerController.ts';
import * as emCtrl from '../controllers/emergencyController.ts';
import * as hgCtrl from '../controllers/hungerController.ts';
import * as catCtrl from '../controllers/categoryController.ts';
import * as notifCtrl from '../controllers/notificationController.ts';
import * as admCtrl from '../controllers/adminController.ts';
import * as aiCtrl from '../controllers/aiExpiryController.ts';

import {
  loginRateLimiter,
  registerRateLimiter,
  otpVerifyRateLimiter,
  otpRequestRateLimiter,
  forgotPasswordRateLimiter,
} from '../middleware/rateLimiter.ts';

const router = Router();

// 1. Health check & status
router.get('/health', (req, res) => {
  const db = getDbStatus();
  res.json({
    status: 'ok',
    service: 'MealBridge Belagavi Operational API',
    region: 'Belagavi, Karnataka, India',
    timestamp: new Date().toISOString(),
    database: db,
  });
});

// 2. Authentication
router.post('/auth/register', registerRateLimiter, authCtrl.register);
router.post('/auth/verify-email-otp', otpVerifyRateLimiter, authCtrl.verifyEmailOtp);
router.post('/auth/resend-email-otp', otpRequestRateLimiter, authCtrl.resendEmailOtp);
router.post('/auth/login', loginRateLimiter, authCtrl.login);
router.post('/auth/forgot-password', forgotPasswordRateLimiter, authCtrl.forgotPassword);
router.post('/auth/reset-password', otpVerifyRateLimiter, authCtrl.resetPassword);
router.post('/auth/logout', authenticateToken, authCtrl.logout);
router.get('/auth/providers-status', authCtrl.getProvidersStatus);
router.get('/auth/me', authenticateToken, authCtrl.getCurrentUser);
router.put('/auth/profile', authenticateToken, authCtrl.updateProfile);

// 3. Food Categories
router.get('/categories', catCtrl.listCategories);
router.post('/categories', authenticateToken, authorize('ADMIN'), catCtrl.createCategory);
router.put('/categories/:id', authenticateToken, authorize('ADMIN'), catCtrl.updateCategory);

// 4. Donations
router.post('/donations', authenticateToken, authorize('DONOR', 'ADMIN'), donCtrl.createDonation);
router.get('/donations', donCtrl.listDonations);
router.get('/donations/stats/donor', authenticateToken, donCtrl.getDonorStats);
router.get('/donations/:id', donCtrl.getDonationById);
router.post('/donations/:id/cancel', authenticateToken, donCtrl.cancelDonation);

// 5. NGO Operations
router.get('/ngo/profile', authenticateToken, authorize('NGO', 'ADMIN'), ngoCtrl.getNGOProfile);
router.put('/ngo/profile', authenticateToken, authorize('NGO', 'ADMIN'), ngoCtrl.updateNGOProfile);
router.get('/ngo/matches', authenticateToken, authorize('NGO', 'ADMIN'), ngoCtrl.getRecommendedMatches);
router.post('/ngo/matches/accept', authenticateToken, authorize('NGO', 'ADMIN'), ngoCtrl.acceptMatch);
router.post('/ngo/matches/reject', authenticateToken, authorize('NGO', 'ADMIN'), ngoCtrl.rejectMatch);
router.post('/ngo/tasks/assign', authenticateToken, authorize('NGO', 'ADMIN'), ngoCtrl.assignVolunteerToTask);
router.get('/ngo/volunteers', authenticateToken, authorize('NGO', 'ADMIN'), ngoCtrl.getRecommendedVolunteers);

// 6. Volunteers & Tasks
router.get('/volunteers/tasks', authenticateToken, authorize('VOLUNTEER', 'ADMIN'), volCtrl.getMyTasks);
router.post('/volunteers/tasks/:taskId/accept', authenticateToken, authorize('VOLUNTEER', 'ADMIN'), volCtrl.acceptTask);
router.post('/volunteers/tasks/:taskId/decline', authenticateToken, authorize('VOLUNTEER', 'ADMIN'), volCtrl.declineTask);
router.patch('/volunteers/tasks/:taskId/status', authenticateToken, volCtrl.updateTaskStatus);
router.post('/volunteers/tasks/:taskId/proof', authenticateToken, volCtrl.submitProof);
router.post('/volunteers/tasks/:taskId/verify', authenticateToken, authorize('NGO', 'ADMIN'), volCtrl.verifyProof);

// 7. Emergency SOS (15 km radius)
router.post('/emergency/sos', authenticateToken, emCtrl.createEmergencySOS);
router.get('/emergency', emCtrl.listEmergencyAlerts);
router.post('/emergency/:id/respond', authenticateToken, authorize('NGO', 'ADMIN'), emCtrl.respondToEmergency);
router.post('/emergency/:id/resolve', authenticateToken, authorize('NGO', 'ADMIN', 'DONOR'), emCtrl.resolveEmergency);

// 8. Public Hunger Spotting (48h retention)
router.post('/hunger/report', hgCtrl.createHungerReport);
router.get('/hunger/reports', hgCtrl.listHungerReports);
router.post('/hunger/reports/:id/verify', authenticateToken, authorize('NGO', 'ADMIN'), hgCtrl.verifyHungerReport);

// 9. AI Expiry Prediction
router.post('/ai/expiry-estimate', aiCtrl.estimateShelfLife);

// 10. Notifications
router.get('/notifications', authenticateToken, notifCtrl.getMyNotifications);
router.patch('/notifications/:id/read', authenticateToken, notifCtrl.markNotificationRead);
router.post('/notifications/read-all', authenticateToken, notifCtrl.markAllNotificationsRead);

// 11. Admin Operations
router.get('/admin/stats', authenticateToken, authorize('ADMIN'), admCtrl.getAdminDashboardStats);
router.get('/admin/users', authenticateToken, authorize('ADMIN'), admCtrl.listUsers);
router.patch('/admin/users/:id/status', authenticateToken, authorize('ADMIN'), admCtrl.updateUserStatus);
router.get('/admin/ngos', authenticateToken, authorize('ADMIN'), admCtrl.listNGOs);
router.post('/admin/ngos/:id/verify', authenticateToken, authorize('ADMIN'), admCtrl.verifyNGO);
router.get('/admin/audit-logs', authenticateToken, authorize('ADMIN'), admCtrl.getAuditLogs);
router.get('/admin/settings', authenticateToken, authorize('ADMIN'), admCtrl.getSystemSettings);
router.put('/admin/settings', authenticateToken, authorize('ADMIN'), admCtrl.updateSystemSettings);

export default router;
