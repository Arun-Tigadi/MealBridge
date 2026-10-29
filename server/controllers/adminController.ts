import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { AccountStatus } from '../models/types.ts';
import { logAudit } from '../services/auditService.ts';
import { sendNotification } from '../services/notificationService.ts';

export function getAdminDashboardStats(req: AuthRequest, res: Response): void {
  const usersByRole = {
    DONOR: store.users.filter((u) => u.role === 'DONOR').length,
    NGO: store.users.filter((u) => u.role === 'NGO').length,
    VOLUNTEER: store.users.filter((u) => u.role === 'VOLUNTEER').length,
    PUBLIC: store.users.filter((u) => u.role === 'PUBLIC').length,
    ADMIN: store.users.filter((u) => u.role === 'ADMIN').length,
  };

  const pendingNgoVerifications = store.ngos.filter((n) => !n.verified).length;
  const activeDonations = store.donations.filter((d) => ['ACTIVE', 'MATCHED', 'CLAIMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length;
  const completedDonations = store.donations.filter((d) => ['DELIVERED', 'COMPLETED'].includes(d.status)).length;
  const expiredDonations = store.donations.filter((d) => d.status === 'EXPIRED').length;
  const activeTasks = store.tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
  const activeSOSAlerts = store.emergencyAlerts.filter((e) => e.status === 'ACTIVE').length;
  const activeHungerReports = store.hungerReports.filter((h) => h.status === 'PENDING' || h.status === 'VERIFIED').length;

  res.json({
    success: true,
    stats: {
      totalUsers: store.users.length,
      usersByRole,
      pendingNgoVerifications,
      activeDonations,
      completedDonations,
      expiredDonations,
      activeTasks,
      activeSOSAlerts,
      activeHungerReports,
      matchingRadiusKm: store.systemSettings.matchingRadiusKm,
      emergencyRadiusKm: store.systemSettings.emergencyRadiusKm,
    },
  });
}

export function listUsers(req: AuthRequest, res: Response): void {
  const { role, status, search } = req.query;
  let filtered = store.users.map(({ password: _, ...userSafe }) => userSafe);

  if (role && typeof role === 'string' && role !== 'ALL') {
    filtered = filtered.filter((u) => u.role === role);
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    filtered = filtered.filter((u) => u.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q));
  }

  res.json({ success: true, count: filtered.length, users: filtered });
}

export function updateUserStatus(req: AuthRequest, res: Response): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Forbidden. Admin authorization required.' });
    return;
  }

  const { id } = req.params;
  const { status, reason } = req.body as { status: AccountStatus; reason?: string };

  const targetUser = store.users.find((u) => u._id === id);
  if (!targetUser) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  // Prevent modifying fellow admin accounts
  if (targetUser.role === 'ADMIN' && targetUser._id !== req.user._id) {
    res.status(403).json({ success: false, error: 'Cannot modify another administrator account.' });
    return;
  }

  targetUser.status = status;
  targetUser.updatedAt = new Date().toISOString();

  logAudit({
    action: 'USER_STATUS_CHANGED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Changed status of user ${targetUser.email} to ${status}. Reason: ${reason || 'Administrative action'}`,
    ipAddress: req.ip,
  });

  sendNotification({
    recipientId: targetUser._id,
    title: 'Account Status Updated',
    message: `Your MealBridge account status has been updated to ${status}.`,
    type: 'ACCOUNT_VERIFICATION',
  });

  const { password: _, ...userSafe } = targetUser;
  res.json({ success: true, user: userSafe });
}

export function listNGOs(req: AuthRequest, res: Response): void {
  const list = store.ngos.map((ngo) => {
    const user = store.users.find((u) => u._id === ngo.userId);
    return {
      ...ngo,
      user: user ? { name: user.name, email: user.email, phone: user.phone, status: user.status } : null,
    };
  });
  res.json({ success: true, ngos: list });
}

export function verifyNGO(req: AuthRequest, res: Response): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Only administrators can verify NGOs.' });
    return;
  }

  const { id } = req.params;
  const { verified, rejectionReason } = req.body;

  const ngo = store.ngos.find((n) => n._id === id);
  if (!ngo) {
    res.status(404).json({ success: false, error: 'NGO not found.' });
    return;
  }

  ngo.verified = verified === true;
  ngo.verifiedAt = verified ? new Date().toISOString() : undefined;
  ngo.verifiedBy = verified ? req.user._id : undefined;
  ngo.rejectionReason = !verified ? rejectionReason : undefined;
  ngo.updatedAt = new Date().toISOString();

  const user = store.users.find((u) => u._id === ngo.userId);
  if (user) {
    user.status = verified ? 'ACTIVE' : 'REJECTED';
    user.updatedAt = new Date().toISOString();
  }

  logAudit({
    action: verified ? 'NGO_VERIFIED' : 'NGO_REJECTED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Admin ${verified ? 'verified' : 'rejected'} NGO ${ngo.orgName} (${ngo.registrationNumber})`,
  });

  sendNotification({
    recipientId: ngo.userId,
    recipientRole: 'NGO',
    title: verified ? 'NGO Registration Verified' : 'NGO Registration Verification Update',
    message: verified
      ? `Congratulations! Belagavi Administration has verified ${ngo.orgName}. You may now accept food donation matches.`
      : `Your registration could not be verified: ${rejectionReason || 'Please resubmit valid registration credentials.'}`,
    type: 'ACCOUNT_VERIFICATION',
  });

  res.json({ success: true, message: `NGO ${verified ? 'verified' : 'rejected'} successfully.`, ngo });
}

export function getAuditLogs(req: AuthRequest, res: Response): void {
  res.json({ success: true, count: store.auditLogs.length, logs: store.auditLogs });
}

export function getSystemSettings(req: AuthRequest, res: Response): void {
  res.json({ success: true, settings: store.systemSettings });
}

export function updateSystemSettings(req: AuthRequest, res: Response): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Only administrators can update system settings.' });
    return;
  }

  const { matchingRadiusKm, emergencyRadiusKm, hungerReportExpiryHours, requireNgoVerification } = req.body;

  if (matchingRadiusKm !== undefined) store.systemSettings.matchingRadiusKm = Number(matchingRadiusKm);
  if (emergencyRadiusKm !== undefined) store.systemSettings.emergencyRadiusKm = Number(emergencyRadiusKm);
  if (hungerReportExpiryHours !== undefined) store.systemSettings.hungerReportExpiryHours = Number(hungerReportExpiryHours);
  if (requireNgoVerification !== undefined) store.systemSettings.requireNgoVerification = Boolean(requireNgoVerification);
  store.systemSettings.updatedAt = new Date().toISOString();

  logAudit({
    action: 'SYSTEM_SETTINGS_UPDATED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Updated system settings: Matching radius ${store.systemSettings.matchingRadiusKm} km, SOS radius ${store.systemSettings.emergencyRadiusKm} km`,
  });

  res.json({ success: true, settings: store.systemSettings });
}
