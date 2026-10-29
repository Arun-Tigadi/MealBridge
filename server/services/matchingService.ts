import { store } from '../data/store.ts';
import { IDonation, IMatch, INGO } from '../models/types.ts';
import { sendNotification } from './notificationService.ts';

export interface MatchRecommendation {
  ngo: INGO;
  distanceKm: number;
  score: number;
  scoreBreakdown: {
    distanceScore: number;
    capacityScore: number;
    categoryScore: number;
    workloadScore: number;
  };
}

export function runMatchingForDonation(donation: IDonation): IMatch[] {
  // Check if donation is expired or cancelled
  const now = new Date();
  if (new Date(donation.expiryTime) <= now) {
    console.log(`[MatchingEngine] Donation ${donation._id} is already expired. Matching aborted.`);
    return [];
  }

  const radiusKm = store.systemSettings.matchingRadiusKm || 10;
  const requireVerified = store.systemSettings.requireNgoVerification;

  const candidateMatches: { ngo: INGO; distanceKm: number; score: number }[] = [];

  for (const ngo of store.ngos) {
    // 1. Verification check
    if (requireVerified && !ngo.verified) {
      continue;
    }

    // 2. Distance check (10 km standard radius in Belagavi region)
    const distance = store.calculateDistanceKm(
      donation.latitude,
      donation.longitude,
      ngo.latitude,
      ngo.longitude
    );

    if (distance > radiusKm) {
      continue;
    }

    // 3. Category compatibility check
    const acceptsCategory =
      ngo.categoriesAccepted.length === 0 ||
      ngo.categoriesAccepted.some(
        (cat) => cat.toLowerCase() === donation.category.toLowerCase()
      );

    if (!acceptsCategory) {
      continue;
    }

    // 4. Capacity and workload check
    const remainingCapacity = Math.max(0, ngo.dailyCapacityKg - ngo.currentWorkloadKg);
    // Rough weight approximation: 1 meal ~ 0.4 kg
    const estimatedWeightKg = donation.unit === 'kg' ? donation.quantity : donation.quantity * 0.4;
    if (remainingCapacity < estimatedWeightKg * 0.5) {
      // NGO has insufficient operational capacity right now
      continue;
    }

    // 5. Calculate weighted recommendation score (0 - 100)
    // Distance weight: 40% (closer = higher)
    const distanceScore = Math.max(0, 40 * (1 - distance / radiusKm));

    // Capacity weight: 30%
    const capacityRatio = Math.min(1, remainingCapacity / (ngo.dailyCapacityKg || 1));
    const capacityScore = 30 * capacityRatio;

    // Category exact match bonus: 15%
    const categoryScore = 15;

    // Workload score: 15% (lower current workload = higher responsiveness)
    const workloadScore = Math.max(0, 15 * (1 - ngo.currentWorkloadKg / (ngo.dailyCapacityKg || 1)));

    const totalScore = Math.round(distanceScore + capacityScore + categoryScore + workloadScore);

    candidateMatches.push({
      ngo,
      distanceKm: distance,
      score: totalScore,
    });
  }

  // Sort descending by score
  candidateMatches.sort((a, b) => b.score - a.score);

  const createdMatches: IMatch[] = [];

  // Recommend up to top 3 eligible NGOs
  const topCandidates = candidateMatches.slice(0, 3);

  for (const candidate of topCandidates) {
    // Check if match already exists
    const existing = store.matches.find(
      (m) => m.donationId === donation._id && m.ngoId === candidate.ngo._id
    );

    if (!existing) {
      const matchRecord: IMatch = {
        _id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        donationId: donation._id,
        ngoId: candidate.ngo._id,
        distanceKm: candidate.distanceKm,
        recommendationScore: candidate.score,
        status: 'RECOMMENDED',
        createdAt: new Date().toISOString(),
      };

      store.matches.push(matchRecord);
      createdMatches.push(matchRecord);

      // Notify NGO of recommended donation
      sendNotification({
        recipientId: candidate.ngo.userId,
        recipientRole: 'NGO',
        title: 'New Food Donation Recommended',
        message: `${donation.quantity} ${donation.unit} of "${donation.foodName}" available ${candidate.distanceKm} km away in Belagavi. Recommendation score: ${candidate.score}%.`,
        type: 'MATCH_RECOMMENDATION',
        referenceId: donation._id,
      });
    }
  }

  if (createdMatches.length > 0 && donation.status === 'ACTIVE') {
    donation.status = 'MATCHED';
    donation.updatedAt = new Date().toISOString();
  }

  return createdMatches;
}
