export type UserRole = 'DONOR' | 'NGO' | 'VOLUNTEER' | 'PUBLIC' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BLOCKED' | 'REJECTED';

export type DonationStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'MATCHED'
  | 'PICKUP_ASSIGNMENT_PENDING'
  | 'CLAIMED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PROOF_SUBMITTED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type MatchStatus =
  | 'RECOMMENDED'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type TaskStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'PICKUP_STARTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PROOF_SUBMITTED'
  | 'PROOF_REJECTED'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'CANCELLED';

export type EmergencyStatus =
  | 'ACTIVE'
  | 'RESPONDED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'PROOF_SUBMITTED'
  | 'PROOF_REJECTED'
  | 'CLOSED'
  | 'CONFIRMED'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'EXPIRED';

export type HungerReportStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'RESOLVED'
  | 'EXPIRED';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  avatar?: string;
  address?: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface NGO {
  _id: string;
  userId: string;
  orgName: string;
  registrationNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  serviceRadiusKm: number;
  serviceAreas: string[];
  categoriesAccepted: string[];
  dailyCapacityKg: number;
  currentWorkloadKg: number;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Volunteer {
  _id: string;
  userId: string;
  transportType: 'TWO_WHEELER' | 'FOUR_WHEELER' | 'VAN' | 'FOOT';
  vehicleNumber?: string;
  available: boolean;
  currentTaskCount: number;
  maxTasks: number;
  verified: boolean;
  completedDeliveries: number;
  rating: number;
  latitude?: number;
  longitude?: number;
}

export interface FoodCategory {
  _id: string;
  name: string;
  description: string;
  icon: string;
  shelfLifeGuidance: string;
  foodHandlingTips: string;
  urgencyClassification: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
  active: boolean;
  donationCount?: number;
}

export interface Donation {
  _id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: 'kg' | 'meals' | 'boxes' | 'packets' | 'liters';
  description: string;
  ingredients?: string[];
  preparationTime: string;
  expiryTime: string;
  isVegetarian: boolean;
  allergens?: string[];
  pickupAddress: string;
  latitude: number;
  longitude: number;
  availableFrom: string;
  availableUntil: string;
  contactName: string;
  contactPhone: string;
  imageUrl?: string;
  storageInformation: string;
  additionalNotes?: string;
  status: DonationStatus;
  matchedNgoId?: string;
  assignedTaskId?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignmentTimestamp?: string;
  acceptedDeliveryAddress?: string;
  acceptedAt?: string;
  verifiedAt?: string;
  verifiedByNgoId?: string;
  verificationNotes?: string;
  shelfLifeEstimateHours?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  aiDisclaimer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  _id: string;
  donationId: string;
  ngoId: string;
  distanceKm: number;
  recommendationScore: number;
  status: MatchStatus;
  viewedAt?: string;
  actionAt?: string;
  deliveryAddress?: string;
  rejectionReason?: string;
  createdAt: string;
  donation?: Donation;
  ngo?: NGO;
}

export interface Task {
  _id: string;
  donationId: string;
  ngoId: string;
  volunteerId?: string;
  status: TaskStatus;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  instructions?: string;
  assignedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  assignedVolunteerName?: string;
  volunteerPhone?: string;
  volunteerVehicle?: string;
  pickupTimestamp?: string;
  deliveryTimestamp?: string;
  proofImageUrl?: string;
  proofNotes?: string;
  verifiedByNgo?: boolean;
  verifiedAt?: string;
  verifiedByUserId?: string;
  verifiedByUserName?: string;
  verificationNotes?: string;
  proofRejectionReason?: string;
  proofRejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  donation?: Donation;
  ngo?: NGO;
  volunteer?: Volunteer & { user?: User };
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  read: boolean;
  createdAt: string;
}

export interface EmergencyAlert {
  _id: string;
  reportedBy: string;
  reporterName: string;
  reporterPhone: string;
  foodType: string;
  category: string;
  quantityNeeded: string;
  address: string;
  latitude: number;
  longitude: number;
  urgencyReason: string;
  expiresAt: string;
  status: EmergencyStatus;

  // Responded stage
  respondedByNgoId?: string;
  respondedByNgoName?: string;
  responseNote?: string;
  respondedAt?: string;
  reliefType?: string;
  reliefQuantity?: string;

  // Dispatch stage
  dispatchedAt?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  volunteerPhone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  dispatchNote?: string;

  // In Progress stage
  inProgressAt?: string;

  // Delivered & Proof stage
  deliveredAt?: string;
  deliveredQuantity?: string;
  deliveryNotes?: string;
  recipientNotes?: string;
  proofPhotoUrl?: string;
  proofSubmittedAt?: string;

  // Verification & Close stage
  verifiedAt?: string;
  verifiedByUserId?: string;
  verifiedByUserName?: string;
  verificationNotes?: string;
  proofRejectionReason?: string;
  proofRejectedAt?: string;
  closedAt?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface HungerReport {
  _id: string;
  reportedBy: string;
  reporterName?: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  photoUrl?: string;
  approximatePeople: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: HungerReportStatus;
  verifiedByNgoId?: string;
  verificationNotes?: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemSettings {
  matchingRadiusKm: number;
  emergencyRadiusKm: number;
  hungerReportExpiryHours: number;
  requireNgoVerification: boolean;
  allowPublicRegistrations: boolean;
  belagaviCenterLat: number;
  belagaviCenterLng: number;
}
