import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { IDonation } from '../models/types.ts';
import { predictShelfLife } from '../services/expiryPredictionService.ts';
import { runMatchingForDonation } from '../services/matchingService.ts';
import { logAudit } from '../services/auditService.ts';
import { sendNotification } from '../services/notificationService.ts';

// Helper to check and mark expired donations
function updateExpiredDonations() {
  const now = new Date();
  for (const don of store.donations) {
    if (
      (don.status === 'ACTIVE' || don.status === 'MATCHED' || don.status === 'DRAFT') &&
      new Date(don.expiryTime) <= now
    ) {
      don.status = 'EXPIRED';
      don.updatedAt = now.toISOString();

      // Mark associated matches as EXPIRED
      for (const m of store.matches) {
        if (m.donationId === don._id && (m.status === 'RECOMMENDED' || m.status === 'VIEWED')) {
          m.status = 'EXPIRED';
        }
      }
    }
  }
}

export function createDonation(req: AuthRequest, res: Response): void {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const {
      foodName,
      category,
      quantity,
      unit,
      description,
      ingredients,
      preparationTime,
      expiryTime,
      isVegetarian,
      allergens,
      pickupAddress,
      latitude,
      longitude,
      availableFrom,
      availableUntil,
      contactName,
      contactPhone,
      imageUrl,
      storageInformation,
      additionalNotes,
    } = req.body;

    if (!foodName || !category || !quantity || !pickupAddress) {
      res.status(400).json({ success: false, error: 'Food name, category, quantity, and pickup address are required.' });
      return;
    }

    // Call AI Expiry estimation
    const expiryPrediction = predictShelfLife({
      foodName,
      category,
      preparationTime: preparationTime || new Date().toISOString(),
      storageCondition: storageInformation || 'Room temperature',
      isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
    });

    const calculatedExpiry = expiryTime || expiryPrediction.recommendedExpiryTime;

    const newDonation: IDonation = {
      _id: `don-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      donorId: req.user._id,
      donorName: req.user.name,
      donorPhone: req.user.phone,
      foodName,
      category,
      quantity: Number(quantity),
      unit: unit || 'meals',
      description: description || '',
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      preparationTime: preparationTime || new Date().toISOString(),
      expiryTime: calculatedExpiry,
      isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
      allergens: Array.isArray(allergens) ? allergens : [],
      pickupAddress,
      latitude: Number(latitude) || req.user.latitude || 15.8497,
      longitude: Number(longitude) || req.user.longitude || 74.4977,
      availableFrom: availableFrom || new Date().toISOString(),
      availableUntil: availableUntil || calculatedExpiry,
      contactName: contactName || req.user.name,
      contactPhone: contactPhone || req.user.phone,
      imageUrl: imageUrl || '',
      storageInformation: storageInformation || 'Store in cool and clean conditions',
      additionalNotes: additionalNotes || '',
      status: 'ACTIVE',
      shelfLifeEstimateHours: expiryPrediction.estimatedShelfLifeHours,
      riskLevel: expiryPrediction.riskLevel,
      aiDisclaimer: expiryPrediction.disclaimer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.donations.unshift(newDonation);

    // Run backend matching engine (10 km radius Belagavi check)
    const matches = runMatchingForDonation(newDonation);

    // Audit log
    logAudit({
      action: 'DONATION_CREATED',
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      details: `Created donation: ${newDonation.foodName} (${newDonation.quantity} ${newDonation.unit}). Generated ${matches.length} NGO match recommendations.`,
      ipAddress: req.ip,
    });

    // Notify donor confirmation
    sendNotification({
      recipientId: req.user._id,
      recipientRole: 'DONOR',
      title: 'Donation Listed Successfully',
      message: `Your donation "${newDonation.foodName}" has been posted. We've notified ${matches.length} verified NGOs in Belagavi.`,
      type: 'NEW_DONATION',
      referenceId: newDonation._id,
    });

    res.status(201).json({
      success: true,
      donation: newDonation,
      matchesCount: matches.length,
      expiryPrediction,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error creating donation.' });
  }
}

export function listDonations(req: AuthRequest, res: Response): void {
  updateExpiredDonations();

  const { category, status, search, mineOnly } = req.query;

  let filtered = [...store.donations];

  if (mineOnly === 'true' && req.user) {
    filtered = filtered.filter((d) => d.donorId === req.user?._id);
  }

  if (category && typeof category === 'string' && category !== 'ALL') {
    filtered = filtered.filter((d) => d.category.toLowerCase() === category.toLowerCase());
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    filtered = filtered.filter((d) => d.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.foodName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.pickupAddress.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    donations: filtered,
  });
}

export function getDonationById(req: AuthRequest, res: Response): void {
  updateExpiredDonations();

  const { id } = req.params;
  const donation = store.donations.find((d) => d._id === id);

  if (!donation) {
    res.status(404).json({ success: false, error: 'Donation not found.' });
    return;
  }

  const matches = store.matches
    .filter((m) => m.donationId === id)
    .map((m) => {
      const ngo = store.ngos.find((n) => n._id === m.ngoId);
      return { ...m, ngo };
    });

  const task = store.tasks.find((t) => t.donationId === id);

  res.json({
    success: true,
    donation,
    matches,
    task,
  });
}

export function cancelDonation(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { id } = req.params;
  const donation = store.donations.find((d) => d._id === id);

  if (!donation) {
    res.status(404).json({ success: false, error: 'Donation not found.' });
    return;
  }

  // Ownership or Admin check
  if (donation.donorId !== req.user._id && req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Forbidden. You do not own this donation.' });
    return;
  }

  // Business Rule: Donors can only edit/cancel donations in allowed states!
  const cancellableStates = ['DRAFT', 'ACTIVE', 'MATCHED'];
  if (!cancellableStates.includes(donation.status)) {
    res.status(400).json({
      success: false,
      error: `Cannot cancel donation in '${donation.status}' state. It has already been assigned for pickup or completed.`,
    });
    return;
  }

  donation.status = 'CANCELLED';
  donation.updatedAt = new Date().toISOString();

  // Cancel associated matches
  for (const m of store.matches) {
    if (m.donationId === donation._id) {
      m.status = 'CANCELLED';
    }
  }

  logAudit({
    action: 'DONATION_CANCELLED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Cancelled donation ${donation._id}: ${donation.foodName}`,
  });

  res.json({ success: true, message: 'Donation cancelled successfully.', donation });
}

export function getDonorStats(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  updateExpiredDonations();

  const userDonations = store.donations.filter((d) => d.donorId === req.user?._id);

  const total = userDonations.length;
  const active = userDonations.filter((d) => ['ACTIVE', 'MATCHED', 'CLAIMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length;
  const completed = userDonations.filter((d) => ['DELIVERED', 'COMPLETED'].includes(d.status)).length;
  const expired = userDonations.filter((d) => d.status === 'EXPIRED').length;

  // Food saved in kg
  let foodSavedKg = 0;
  for (const d of userDonations) {
    if (['DELIVERED', 'COMPLETED'].includes(d.status)) {
      foodSavedKg += d.unit === 'kg' ? d.quantity : d.quantity * 0.4;
    }
  }

  res.json({
    success: true,
    stats: {
      totalDonations: total,
      activeDonations: active,
      completedDonations: completed,
      expiredDonations: expired,
      foodSavedKg: Math.round(foodSavedKg * 10) / 10,
    },
  });
}
