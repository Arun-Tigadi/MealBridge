import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { ITask } from '../models/types.ts';
import { sendNotification } from '../services/notificationService.ts';
import { logAudit } from '../services/auditService.ts';

export function getNGOProfile(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const ngo = store.ngos.find((n) => n.userId === req.user?._id);
  if (!ngo) {
    res.status(404).json({ success: false, error: 'NGO profile not found for this user.' });
    return;
  }

  res.json({ success: true, ngo });
}

export function updateNGOProfile(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const ngo = store.ngos.find((n) => n.userId === req.user?._id);
  if (!ngo) {
    res.status(404).json({ success: false, error: 'NGO profile not found.' });
    return;
  }

  const { orgName, contactPerson, phone, serviceRadiusKm, categoriesAccepted, dailyCapacityKg, address, latitude, longitude } = req.body;

  if (orgName) ngo.orgName = orgName;
  if (contactPerson) ngo.contactPerson = contactPerson;
  if (phone) ngo.phone = phone;
  if (serviceRadiusKm) ngo.serviceRadiusKm = Number(serviceRadiusKm);
  if (Array.isArray(categoriesAccepted)) ngo.categoriesAccepted = categoriesAccepted;
  if (dailyCapacityKg) ngo.dailyCapacityKg = Number(dailyCapacityKg);
  if (address) ngo.address = address;
  if (latitude !== undefined) ngo.latitude = Number(latitude);
  if (longitude !== undefined) ngo.longitude = Number(longitude);
  ngo.updatedAt = new Date().toISOString();

  res.json({ success: true, ngo });
}

export function getRecommendedMatches(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const ngo = store.ngos.find((n) => n.userId === req.user?._id);
  if (!ngo) {
    res.status(404).json({ success: false, error: 'NGO profile not found.' });
    return;
  }

  const matches = store.matches
    .filter((m) => m.ngoId === ngo._id && (m.status === 'RECOMMENDED' || m.status === 'VIEWED'))
    .map((m) => {
      const donation = store.donations.find((d) => d._id === m.donationId);
      return { ...m, donation };
    })
    .filter((m) => m.donation && m.donation.status !== 'EXPIRED' && m.donation.status !== 'CANCELLED');

  res.json({ success: true, count: matches.length, matches });
}

export function acceptMatch(req: AuthRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const ngo = store.ngos.find((n) => n.userId === req.user?._id);
    if (!ngo) {
      res.status(404).json({ success: false, error: 'NGO profile not found.' });
      return;
    }

    // Business Rule 2: Only verified NGOs can accept operational donations!
    if (!ngo.verified) {
      res.status(403).json({
        success: false,
        error: 'Operation restricted. Your NGO registration is currently pending administrative verification by Belagavi authorities.',
      });
      return;
    }

    const { matchId, deliveryAddress, deliveryLat, deliveryLng, instructions } = req.body;
    const match = store.matches.find((m) => m._id === matchId);

    if (!match || match.ngoId !== ngo._id) {
      res.status(404).json({ success: false, error: 'Match recommendation not found for this NGO.' });
      return;
    }

    const donation = store.donations.find((d) => d._id === match.donationId);
    if (!donation) {
      res.status(404).json({ success: false, error: 'Associated donation not found.' });
      return;
    }

    if (donation.status === 'EXPIRED' || new Date(donation.expiryTime) <= new Date()) {
      res.status(400).json({ success: false, error: 'Cannot accept expired donation.' });
      return;
    }

    // Update match status
    match.status = 'ACCEPTED';
    match.actionAt = new Date().toISOString();

    // Update donation status
    donation.status = 'PICKUP_ASSIGNED';
    donation.matchedNgoId = ngo._id;
    donation.updatedAt = new Date().toISOString();

    // Create delivery Task
    const newTask: ITask = {
      _id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      donationId: donation._id,
      ngoId: ngo._id,
      status: 'ASSIGNED',
      pickupAddress: donation.pickupAddress,
      pickupLat: donation.latitude,
      pickupLng: donation.longitude,
      deliveryAddress: deliveryAddress || 'Sneha Community Distribution Center, Belagavi',
      deliveryLat: deliveryLat || 15.8350,
      deliveryLng: deliveryLng || 74.5200,
      instructions: instructions || 'Verify food temperature and packaging condition before handover.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.tasks.push(newTask);
    donation.assignedTaskId = newTask._id;

    // Update NGO workload
    const estimatedWeight = donation.unit === 'kg' ? donation.quantity : donation.quantity * 0.4;
    ngo.currentWorkloadKg = (ngo.currentWorkloadKg || 0) + estimatedWeight;

    // Log audit
    logAudit({
      action: 'MATCH_ACCEPTED',
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      details: `NGO ${ngo.orgName} accepted donation ${donation.foodName}. Created Task ${newTask._id}.`,
      ipAddress: req.ip,
    });

    // Notify Donor
    sendNotification({
      recipientId: donation.donorId,
      recipientRole: 'DONOR',
      title: 'NGO Accepted Your Donation!',
      message: `${ngo.orgName} has accepted your donation of ${donation.foodName}. A volunteer assignment is in progress.`,
      type: 'NGO_CONFIRMATION',
      referenceId: donation._id,
    });

    res.json({
      success: true,
      message: 'Donation match accepted successfully. Task created for volunteer assignment.',
      task: newTask,
      donation,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error accepting match.' });
  }
}

export function rejectMatch(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const ngo = store.ngos.find((n) => n.userId === req.user?._id);
  if (!ngo) {
    res.status(404).json({ success: false, error: 'NGO profile not found.' });
    return;
  }

  const { matchId, rejectionReason } = req.body;
  const match = store.matches.find((m) => m._id === matchId);

  if (!match || match.ngoId !== ngo._id) {
    res.status(404).json({ success: false, error: 'Match recommendation not found.' });
    return;
  }

  match.status = 'REJECTED';
  match.rejectionReason = rejectionReason || 'Operational capacity / route incompatibility';
  match.actionAt = new Date().toISOString();

  logAudit({
    action: 'MATCH_REJECTED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `NGO ${ngo.orgName} rejected match for donation ${match.donationId}. Reason: ${match.rejectionReason}`,
  });

  res.json({ success: true, message: 'Match declined.' });
}

export function assignVolunteerToTask(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const ngo = store.ngos.find((n) => n.userId === req.user?._id);
  if (!ngo) {
    res.status(404).json({ success: false, error: 'NGO profile not found.' });
    return;
  }

  // Business Rule: Only verified NGOs can assign volunteers to delivery tasks
  if (!ngo.verified) {
    res.status(403).json({
      success: false,
      error: 'Operation restricted. Your NGO registration is currently pending administrative verification by Belagavi authorities.',
    });
    return;
  }

  const { taskId, volunteerId } = req.body;
  const task = store.tasks.find((t) => t._id === taskId);

  if (!task || task.ngoId !== ngo._id) {
    res.status(404).json({ success: false, error: 'Task not found or not owned by your NGO.' });
    return;
  }

  const volunteer = store.volunteers.find((v) => v._id === volunteerId);
  if (!volunteer) {
    res.status(404).json({ success: false, error: 'Volunteer not found.' });
    return;
  }

  task.volunteerId = volunteer._id;
  task.status = 'ASSIGNED';
  task.updatedAt = new Date().toISOString();

  volunteer.currentTaskCount = (volunteer.currentTaskCount || 0) + 1;

  // Notify Volunteer
  sendNotification({
    recipientId: volunteer.userId,
    recipientRole: 'VOLUNTEER',
    title: 'New Food Pickup Task Assigned',
    message: `${ngo.orgName} has assigned you to pick up food from ${task.pickupAddress} and deliver to ${task.deliveryAddress}.`,
    type: 'VOLUNTEER_ASSIGNMENT',
    referenceId: task._id,
  });

  res.json({ success: true, message: 'Volunteer assigned successfully.', task });
}

export function getRecommendedVolunteers(req: AuthRequest, res: Response): void {
  const { taskId } = req.query;
  let referenceLat = 15.8497;
  let referenceLng = 74.4977;

  if (taskId && typeof taskId === 'string') {
    const task = store.tasks.find((t) => t._id === taskId);
    if (task) {
      referenceLat = task.pickupLat;
      referenceLng = task.pickupLng;
    }
  }

  const list = store.volunteers.map((vol) => {
    const user = store.users.find((u) => u._id === vol.userId);
    const distance = store.calculateDistanceKm(
      referenceLat,
      referenceLng,
      vol.latitude || 15.8497,
      vol.longitude || 74.4977
    );

    // Score based on availability, low task load, rating, and distance
    const distanceScore = Math.max(0, 40 * (1 - distance / 15));
    const loadScore = Math.max(0, 30 * (1 - vol.currentTaskCount / (vol.maxTasks || 3)));
    const ratingScore = (vol.rating / 5) * 30;
    const totalScore = Math.round(distanceScore + loadScore + ratingScore);

    return {
      volunteer: vol,
      user: user ? { name: user.name, phone: user.phone, email: user.email } : null,
      distanceKm: distance,
      recommendationScore: totalScore,
    };
  });

  list.sort((a, b) => b.recommendationScore - a.recommendationScore);

  res.json({ success: true, count: list.length, volunteers: list });
}
