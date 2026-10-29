import mongoose, { Schema } from 'mongoose';

// User Schema
export const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['DONOR', 'NGO', 'VOLUNTEER', 'PUBLIC', 'ADMIN'],
      default: 'DONOR',
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED', 'REJECTED'],
      default: 'ACTIVE',
    },
    avatar: { type: String },
    address: { type: String },
    city: { type: String, default: 'Belagavi' },
    region: { type: String, default: 'Karnataka, India' },
    latitude: { type: Number, default: 15.8497 },
    longitude: { type: Number, default: 74.4977 },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    emailOtpHash: { type: String },
    emailOtpExpiresAt: { type: String },
    emailOtpAttempts: { type: Number, default: 0 },
    emailOtpLastSentAt: { type: String },
    resetPasswordOtpHash: { type: String },
    resetPasswordOtpExpiresAt: { type: String },
    resetPasswordOtpAttempts: { type: Number, default: 0 },
    resetPasswordOtpLastSentAt: { type: String },
    phoneOtpHash: { type: String },
    phoneOtpExpiresAt: { type: String },
    phoneOtpAttempts: { type: Number, default: 0 },
    phoneOtpLastSentAt: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: String },
  },
  { timestamps: true }
);

// NGO Schema
export const NGOSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orgName: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    serviceRadiusKm: { type: Number, default: 10 },
    serviceAreas: [{ type: String }],
    categoriesAccepted: [{ type: String }],
    dailyCapacityKg: { type: Number, default: 250 },
    currentWorkloadKg: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    address: { type: String, required: true },
    latitude: { type: Number, required: true, default: 15.8497 },
    longitude: { type: Number, required: true, default: 74.4977 },
  },
  { timestamps: true }
);

// Volunteer Schema
export const VolunteerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    transportType: {
      type: String,
      enum: ['TWO_WHEELER', 'FOUR_WHEELER', 'VAN', 'FOOT'],
      default: 'TWO_WHEELER',
    },
    vehicleNumber: { type: String },
    available: { type: Boolean, default: true },
    currentTaskCount: { type: Number, default: 0 },
    maxTasks: { type: Number, default: 3 },
    verified: { type: Boolean, default: true },
    completedDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    latitude: { type: Number, default: 15.8497 },
    longitude: { type: Number, default: 74.4977 },
  },
  { timestamps: true }
);

// FoodCategory Schema
export const FoodCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Utensils' },
    shelfLifeGuidance: { type: String, required: true },
    foodHandlingTips: { type: String, required: true },
    urgencyClassification: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'STANDARD'],
      default: 'MEDIUM',
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Donation Schema
export const DonationSchema = new Schema(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    donorName: { type: String, required: true },
    donorPhone: { type: String, required: true },
    foodName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: {
      type: String,
      enum: ['kg', 'meals', 'boxes', 'packets', 'liters'],
      default: 'meals',
    },
    description: { type: String, required: true },
    ingredients: [{ type: String }],
    preparationTime: { type: Date, required: true },
    expiryTime: { type: Date, required: true },
    isVegetarian: { type: Boolean, default: true },
    allergens: [{ type: String }],
    pickupAddress: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    availableFrom: { type: Date, required: true },
    availableUntil: { type: Date, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    imageUrl: { type: String },
    storageInformation: { type: String, default: 'Store in cool, dry place' },
    additionalNotes: { type: String },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'ACTIVE',
        'MATCHED',
        'CLAIMED',
        'PICKUP_ASSIGNED',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'COMPLETED',
        'EXPIRED',
        'CANCELLED',
      ],
      default: 'ACTIVE',
    },
    matchedNgoId: { type: Schema.Types.ObjectId, ref: 'NGO' },
    assignedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    shelfLifeEstimateHours: { type: Number },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
    aiDisclaimer: { type: String },
  },
  { timestamps: true }
);

// Match Schema
export const MatchSchema = new Schema(
  {
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    distanceKm: { type: Number, required: true },
    recommendationScore: { type: Number, required: true },
    status: {
      type: String,
      enum: ['RECOMMENDED', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
      default: 'RECOMMENDED',
    },
    viewedAt: { type: Date },
    actionAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Task Schema
export const TaskSchema = new Schema(
  {
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: 'Volunteer' },
    status: {
      type: String,
      enum: [
        'ASSIGNED',
        'ACCEPTED',
        'PICKUP_STARTED',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'PROOF_SUBMITTED',
        'VERIFIED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'ASSIGNED',
    },
    pickupAddress: { type: String, required: true },
    pickupLat: { type: Number, required: true },
    pickupLng: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },
    deliveryLat: { type: Number, required: true },
    deliveryLng: { type: Number, required: true },
    instructions: { type: String },
    pickupTimestamp: { type: Date },
    deliveryTimestamp: { type: Date },
    proofImageUrl: { type: String },
    proofNotes: { type: String },
    verifiedByNgo: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Notification Schema
export const NotificationSchema = new Schema(
  {
    recipientId: { type: String, required: true },
    recipientRole: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    referenceId: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// EmergencyAlert Schema
export const EmergencyAlertSchema = new Schema(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reporterName: { type: String, required: true },
    reporterPhone: { type: String, required: true },
    foodType: { type: String, required: true },
    category: { type: String, required: true },
    quantityNeeded: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    urgencyReason: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESPONDED', 'CONFIRMED', 'RESOLVED', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    respondedByNgoId: { type: Schema.Types.ObjectId, ref: 'NGO' },
    responseNote: { type: String },
  },
  { timestamps: true }
);

// HungerReport Schema
export const HungerReportSchema = new Schema(
  {
    reportedBy: { type: String, required: true },
    reporterName: { type: String },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    description: { type: String, required: true },
    photoUrl: { type: String },
    approximatePeople: { type: Number, required: true },
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED', 'EXPIRED'],
      default: 'PENDING',
    },
    verifiedByNgoId: { type: String },
    verificationNotes: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// AuditLog Schema
export const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// SystemSettings Schema
export const SystemSettingsSchema = new Schema(
  {
    matchingRadiusKm: { type: Number, default: 10 },
    emergencyRadiusKm: { type: Number, default: 15 },
    hungerReportExpiryHours: { type: Number, default: 48 },
    requireNgoVerification: { type: Boolean, default: true },
    allowPublicRegistrations: { type: Boolean, default: true },
    belagaviCenterLat: { type: Number, default: 15.8497 },
    belagaviCenterLng: { type: Number, default: 74.4977 },
  },
  { timestamps: true }
);
