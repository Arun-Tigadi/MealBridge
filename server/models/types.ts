export type UserRole = 'DONOR' | 'NGO' | 'VOLUNTEER' | 'PUBLIC' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BLOCKED' | 'REJECTED';

export type DonationStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'MATCHED'
  | 'CLAIMED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
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
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKUP_STARTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PROOF_SUBMITTED'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'CANCELLED';

export type EmergencyStatus =
  | 'ACTIVE'
  | 'RESPONDED'
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

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
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
  emailOtpHash?: string;
  emailOtpExpiresAt?: string;
  emailOtpAttempts?: number;
  emailOtpLastSentAt?: string;
  resetPasswordOtpHash?: string;
  resetPasswordOtpExpiresAt?: string;
  resetPasswordOtpAttempts?: number;
  resetPasswordOtpLastSentAt?: string;
  phoneOtpHash?: string;
  phoneOtpExpiresAt?: string;
  phoneOtpAttempts?: number;
  phoneOtpLastSentAt?: string;
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INGO {
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
  createdAt: string;
  updatedAt: string;
}

export interface IVolunteer {
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
  createdAt: string;
  updatedAt: string;
}

export interface IFoodCategory {
  _id: string;
  name: string;
  description: string;
  icon: string;
  shelfLifeGuidance: string;
  foodHandlingTips: string;
  urgencyClassification: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
  active: boolean;
  createdAt: string;
}

export interface IDonation {
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
  shelfLifeEstimateHours?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  aiDisclaimer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMatch {
  _id: string;
  donationId: string;
  ngoId: string;
  distanceKm: number;
  recommendationScore: number;
  status: MatchStatus;
  viewedAt?: string;
  actionAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface ITask {
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
  pickupTimestamp?: string;
  deliveryTimestamp?: string;
  proofImageUrl?: string;
  proofNotes?: string;
  verifiedByNgo?: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  recipientId: string;
  recipientRole?: UserRole;
  title: string;
  message: string;
  type:
    | 'NEW_DONATION'
    | 'MATCH_RECOMMENDATION'
    | 'NGO_CONFIRMATION'
    | 'VOLUNTEER_ASSIGNMENT'
    | 'TASK_ACCEPTED'
    | 'PICKUP_REMINDER'
    | 'DELIVERY_UPDATE'
    | 'PROOF_VERIFIED'
    | 'EXPIRY_WARNING'
    | 'EMERGENCY_ALERT'
    | 'HUNGER_REPORT'
    | 'ACCOUNT_VERIFICATION';
  referenceId?: string;
  read: boolean;
  createdAt: string;
}

export interface IEmergencyAlert {
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
  respondedByNgoId?: string;
  responseNote?: string;
  createdAt: string;
}

export interface IHungerReport {
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
  expiresAt: string; // 48h expiry policy
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ISystemSettings {
  matchingRadiusKm: number;
  emergencyRadiusKm: number;
  hungerReportExpiryHours: number;
  requireNgoVerification: boolean;
  allowPublicRegistrations: boolean;
  belagaviCenterLat: number;
  belagaviCenterLng: number;
  updatedAt: string;
}
