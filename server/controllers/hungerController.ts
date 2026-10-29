import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { IHungerReport } from '../models/types.ts';
import { logAudit } from '../services/auditService.ts';
import { sendNotification } from '../services/notificationService.ts';

export function createHungerReport(req: AuthRequest, res: Response): void {
  try {
    const { address, latitude, longitude, description, photoUrl, approximatePeople, urgency } = req.body;

    if (!address || !description) {
      res.status(400).json({ success: false, error: 'Address and description of hunger spot are required.' });
      return;
    }

    const expiryHours = store.systemSettings.hungerReportExpiryHours || 48;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

    const report: IHungerReport = {
      _id: `hunger-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reportedBy: req.user ? req.user._id : 'anonymous-public',
      reporterName: req.user ? req.user.name : 'Concerned Citizen',
      address,
      latitude: Number(latitude) || 15.8497,
      longitude: Number(longitude) || 74.4977,
      description,
      photoUrl: photoUrl || '',
      approximatePeople: Number(approximatePeople) || 10,
      urgency: urgency || 'MEDIUM',
      status: 'PENDING',
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    store.hungerReports.unshift(report);

    // Notify NGOs in Belagavi
    for (const ngo of store.ngos) {
      if (ngo.verified) {
        sendNotification({
          recipientId: ngo.userId,
          recipientRole: 'NGO',
          title: 'New Hunger Spot Reported',
          message: `Public report: ${report.approximatePeople} people near ${report.address}. Awaiting field verification.`,
          type: 'HUNGER_REPORT',
          referenceId: report._id,
        });
      }
    }

    if (req.user) {
      logAudit({
        action: 'HUNGER_REPORT_SUBMITTED',
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        details: `Reported hunger spot near ${report.address} (${report.approximatePeople} people)`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Hunger report submitted. It will be verified by local NGOs and held under our 48-hour privacy retention policy.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating hunger report.' });
  }
}

export function listHungerReports(req: AuthRequest, res: Response): void {
  // Purge/hide reports expired after 48 hours
  const now = new Date();
  const activeReports = store.hungerReports.filter((r) => new Date(r.expiresAt) > now);

  // If public or unauthenticated, hide exact contact details for privacy
  const sanitized = activeReports.map((r) => {
    if (!req.user || (req.user.role !== 'NGO' && req.user.role !== 'ADMIN')) {
      return {
        ...r,
        reporterName: 'Verified Community Reporter',
      };
    }
    return r;
  });

  res.json({ success: true, count: sanitized.length, reports: sanitized });
}

export function verifyHungerReport(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { id } = req.params;
  const { status, verificationNotes } = req.body;

  const report = store.hungerReports.find((r) => r._id === id);
  if (!report) {
    res.status(404).json({ success: false, error: 'Hunger report not found.' });
    return;
  }

  report.status = status || 'VERIFIED';
  report.verificationNotes = verificationNotes || 'Verified by field team.';
  report.verifiedByNgoId = req.user._id;

  logAudit({
    action: 'HUNGER_REPORT_VERIFIED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Updated hunger report ${report._id} to status: ${report.status}`,
  });

  res.json({ success: true, message: 'Report status updated.', report });
}
