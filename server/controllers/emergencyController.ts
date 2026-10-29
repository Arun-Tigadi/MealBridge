import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { IEmergencyAlert } from '../models/types.ts';
import { sendNotification } from '../services/notificationService.ts';
import { logAudit } from '../services/auditService.ts';

export function createEmergencySOS(req: AuthRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    // Rate-limiting check: Prevent multiple active SOS from the same user within 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentActive = store.emergencyAlerts.find(
      (a) =>
        a.reportedBy === req.user?._id &&
        a.status === 'ACTIVE' &&
        new Date(a.createdAt) > fifteenMinsAgo
    );

    if (recentActive) {
      res.status(429).json({
        success: false,
        error: 'You already have an active Emergency SOS broadcast submitted within the last 15 minutes. Please wait for NGOs to respond or contact the emergency control room.',
      });
      return;
    }

    const { foodType, category, quantityNeeded, address, latitude, longitude, urgencyReason, durationHours } = req.body;

    if (!foodType || !quantityNeeded || !address || !urgencyReason) {
      res.status(400).json({
        success: false,
        error: 'Food type, quantity needed, address, and urgency reason are mandatory for emergency SOS.',
      });
      return;
    }

    const hours = Number(durationHours) || 4;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const newAlert: IEmergencyAlert = {
      _id: `sos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reportedBy: req.user._id,
      reporterName: req.user.name,
      reporterPhone: req.user.phone,
      foodType,
      category: category || 'Prepared Meals',
      quantityNeeded,
      address,
      latitude: Number(latitude) || req.user.latitude || 15.8497,
      longitude: Number(longitude) || req.user.longitude || 74.4977,
      urgencyReason,
      expiresAt,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    store.emergencyAlerts.unshift(newAlert);

    // Notify all verified NGOs within 15 km emergency radius
    const emergencyRadius = store.systemSettings.emergencyRadiusKm || 15;
    let notifiedCount = 0;

    for (const ngo of store.ngos) {
      if (!ngo.verified) continue;
      const distance = store.calculateDistanceKm(
        newAlert.latitude,
        newAlert.longitude,
        ngo.latitude,
        ngo.longitude
      );

      if (distance <= emergencyRadius) {
        notifiedCount++;
        sendNotification({
          recipientId: ngo.userId,
          recipientRole: 'NGO',
          title: '🚨 EMERGENCY FOOD SOS BROADCAST',
          message: `Urgent need for ${newAlert.quantityNeeded} at ${newAlert.address} (${distance} km away). Reason: ${newAlert.urgencyReason}`,
          type: 'EMERGENCY_ALERT',
          referenceId: newAlert._id,
        });
      }
    }

    logAudit({
      action: 'EMERGENCY_SOS_TRIGGERED',
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      details: `Triggered SOS for ${newAlert.foodType} at ${newAlert.address}. Notified ${notifiedCount} NGOs within ${emergencyRadius} km.`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      alert: newAlert,
      notifiedNgos: notifiedCount,
      radiusKm: emergencyRadius,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error triggering emergency SOS.' });
  }
}

export function listEmergencyAlerts(req: AuthRequest, res: Response): void {
  // Update expired alerts
  const now = new Date();
  for (const a of store.emergencyAlerts) {
    if (a.status === 'ACTIVE' && new Date(a.expiresAt) <= now) {
      a.status = 'EXPIRED';
    }
  }

  res.json({ success: true, count: store.emergencyAlerts.length, alerts: store.emergencyAlerts });
}

export function respondToEmergency(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const ngo = store.ngos.find((n) => n.userId === req.user?._id);
  if (!ngo) {
    res.status(403).json({ success: false, error: 'Only verified NGOs can respond to emergency SOS alerts.' });
    return;
  }

  const { id } = req.params;
  const { responseNote } = req.body;

  const alert = store.emergencyAlerts.find((a) => a._id === id);
  if (!alert) {
    res.status(404).json({ success: false, error: 'Emergency alert not found.' });
    return;
  }

  alert.status = 'RESPONDED';
  alert.respondedByNgoId = ngo._id;
  alert.responseNote = responseNote || `${ngo.orgName} is dispatching immediate relief response team.`;

  // Notify reporter
  sendNotification({
    recipientId: alert.reportedBy,
    title: 'NGO Responded to your SOS',
    message: `${ngo.orgName} has mobilized to assist your emergency request at ${alert.address}.`,
    type: 'EMERGENCY_ALERT',
    referenceId: alert._id,
  });

  logAudit({
    action: 'EMERGENCY_SOS_RESPONDED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `NGO ${ngo.orgName} responded to SOS ${alert._id}`,
  });

  res.json({ success: true, message: 'Response recorded.', alert });
}

export function resolveEmergency(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { id } = req.params;
  const alert = store.emergencyAlerts.find((a) => a._id === id);

  if (!alert) {
    res.status(404).json({ success: false, error: 'Alert not found.' });
    return;
  }

  alert.status = 'RESOLVED';

  logAudit({
    action: 'EMERGENCY_SOS_RESOLVED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Emergency SOS ${alert._id} resolved`,
  });

  res.json({ success: true, message: 'Emergency SOS marked as resolved.', alert });
}
