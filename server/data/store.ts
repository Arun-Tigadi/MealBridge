import bcrypt from 'bcryptjs';
import {
  IUser,
  INGO,
  IVolunteer,
  IFoodCategory,
  IDonation,
  IMatch,
  ITask,
  INotification,
  IEmergencyAlert,
  IHungerReport,
  IAuditLog,
  ISystemSettings,
  UserRole,
} from '../models/types.ts';

// Pre-seeded Belagavi geographic reference coordinates
// Belagavi City Center: 15.8497, 74.4977
// Tilakwadi: 15.8340, 74.5020
// Camp Area: 15.8620, 74.5120
// Shahapur: 15.8350, 74.5200
// Udyambag: 15.8150, 74.4980
// Hindwadi: 15.8410, 74.5080

class DataStore {
  public users: IUser[] = [];
  public ngos: INGO[] = [];
  public volunteers: IVolunteer[] = [];
  public foodCategories: IFoodCategory[] = [];
  public donations: IDonation[] = [];
  public matches: IMatch[] = [];
  public tasks: ITask[] = [];
  public notifications: INotification[] = [];
  public emergencyAlerts: IEmergencyAlert[] = [];
  public hungerReports: IHungerReport[] = [];
  public auditLogs: IAuditLog[] = [];
  public systemSettings: ISystemSettings = {
    matchingRadiusKm: 10,
    emergencyRadiusKm: 15,
    hungerReportExpiryHours: 48,
    requireNgoVerification: true,
    allowPublicRegistrations: true,
    belagaviCenterLat: 15.8497,
    belagaviCenterLng: 74.4977,
    updatedAt: new Date().toISOString(),
  };

  private initialized = false;

  constructor() {
    this.seedInitialData();
  }

  public async seedInitialData() {
    if (this.initialized) return;
    this.initialized = true;

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password123!', salt);

    // 1. Initial Users (one of each role)
    const adminUser: IUser = {
      _id: 'user-admin-1',
      name: 'Belagavi Admin Officer',
      email: 'admin@mealbridge.org',
      password: defaultPassword,
      phone: '+91 831 240 1001',
      role: 'ADMIN',
      status: 'ACTIVE',
      city: 'Belagavi',
      region: 'Karnataka, India',
      address: 'DC Office Complex, Belagavi, 590001',
      latitude: 15.8497,
      longitude: 74.4977,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const donorUser: IUser = {
      _id: 'user-donor-1',
      name: 'Patil Grand Banquet Hall',
      email: 'donor@mealbridge.org',
      password: defaultPassword,
      phone: '+91 98860 12345',
      role: 'DONOR',
      status: 'ACTIVE',
      city: 'Belagavi',
      region: 'Karnataka, India',
      address: 'Club Road, Camp, Belagavi, 590001',
      latitude: 15.8620,
      longitude: 74.5120,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ngoUser: IUser = {
      _id: 'user-ngo-1',
      name: 'Belagavi Annapurna Seva Trust',
      email: 'ngo@mealbridge.org',
      password: defaultPassword,
      phone: '+91 94481 55678',
      role: 'NGO',
      status: 'ACTIVE',
      city: 'Belagavi',
      region: 'Karnataka, India',
      address: 'Tilakwadi 2nd Gate, Belagavi, 590006',
      latitude: 15.8340,
      longitude: 74.5020,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const volunteerUser: IUser = {
      _id: 'user-vol-1',
      name: 'Rohan Deshmukh',
      email: 'volunteer@mealbridge.org',
      password: defaultPassword,
      phone: '+91 91234 56789',
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      city: 'Belagavi',
      region: 'Karnataka, India',
      address: 'Hindwadi, Near Congress Road, Belagavi, 590011',
      latitude: 15.8410,
      longitude: 74.5080,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const publicUser: IUser = {
      _id: 'user-pub-1',
      name: 'Pooja Kulkarni',
      email: 'public@mealbridge.org',
      password: defaultPassword,
      phone: '+91 99887 66554',
      role: 'PUBLIC',
      status: 'ACTIVE',
      city: 'Belagavi',
      region: 'Karnataka, India',
      address: 'Shahapur, Belagavi, 590003',
      latitude: 15.8350,
      longitude: 74.5200,
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.push(adminUser, donorUser, ngoUser, volunteerUser, publicUser);

    // 2. NGO Profile
    const ngoProfile: INGO = {
      _id: 'ngo-1',
      userId: ngoUser._id,
      orgName: 'Belagavi Annapurna Seva Trust',
      registrationNumber: 'KA-BEL-2021-NGO-4491',
      contactPerson: 'Suresh Patil (General Secretary)',
      phone: '+91 94481 55678',
      email: 'contact@annapurnatrust.org',
      serviceRadiusKm: 10,
      serviceAreas: ['Camp', 'Tilakwadi', 'Shahapur', 'Hindwadi', 'Udyambag', 'Vadgaon'],
      categoriesAccepted: ['Prepared Meals', 'Fresh Produce', 'Packaged Foods'],
      dailyCapacityKg: 350,
      currentWorkloadKg: 45,
      verified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: adminUser._id,
      address: 'Tilakwadi 2nd Gate, Belagavi, Karnataka 590006',
      latitude: 15.8340,
      longitude: 74.5020,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.ngos.push(ngoProfile);

    // 3. Volunteer Profile
    const volProfile: IVolunteer = {
      _id: 'vol-1',
      userId: volunteerUser._id,
      transportType: 'TWO_WHEELER',
      vehicleNumber: 'KA-22-EM-4092',
      available: true,
      currentTaskCount: 1,
      maxTasks: 3,
      verified: true,
      completedDeliveries: 14,
      rating: 4.9,
      latitude: 15.8410,
      longitude: 74.5080,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.volunteers.push(volProfile);

    // 4. Food Categories (as specified in requirements)
    const categories: IFoodCategory[] = [
      {
        _id: 'cat-1',
        name: 'Prepared Meals',
        description: 'Cooked rice, curries, chapati, dal, sambar, and buffet surplus from events & hotels.',
        icon: 'Soup',
        shelfLifeGuidance: 'Consume within 4-6 hours of preparation. Keep hot (above 60°C) or chilled (below 5°C).',
        foodHandlingTips: 'Use sanitized, food-grade airtight stainless containers. Never leave at room temperature beyond 2 hours.',
        urgencyClassification: 'CRITICAL',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'cat-2',
        name: 'Fresh Produce',
        description: 'Surplus raw vegetables, leafy greens, and whole fruits from agricultural APMC market Belagavi.',
        icon: 'Apple',
        shelfLifeGuidance: '2 to 5 days under shaded, cool ventilation.',
        foodHandlingTips: 'Inspect for mechanical bruising or mould; keep separated from ethylene-producing fruits.',
        urgencyClassification: 'MEDIUM',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'cat-3',
        name: 'Packaged Foods',
        description: 'Sealed bakery breads, biscuits, milk cartons, grain packets, dry rations before expiry date.',
        icon: 'Package',
        shelfLifeGuidance: 'Refer to printed Best Before / Expiry date on package. Inspect seal integrity.',
        foodHandlingTips: 'Check seal and tamper packaging. Store dry, away from direct sunlight.',
        urgencyClassification: 'STANDARD',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'cat-4',
        name: 'Specialty Items',
        description: 'Infant formulas, dietary snacks, nutritional supplements, diabetic foods, dairy sweets.',
        icon: 'Sparkles',
        shelfLifeGuidance: '12 to 24 hours for fresh dairy sweets; strict manufacturer labels for formulas.',
        foodHandlingTips: 'Maintain strict refrigeration for dairy products and clean hygienic dispensing.',
        urgencyClassification: 'HIGH',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'cat-5',
        name: 'Other',
        description: 'Assorted grocery staples, unpolished pulses, cooking oil, spices, or bulk event beverages.',
        icon: 'Utensils',
        shelfLifeGuidance: 'Varies by product; ensure food-grade containment.',
        foodHandlingTips: 'Label clearly with contents, prep date, and storage instructions.',
        urgencyClassification: 'STANDARD',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];
    this.foodCategories.push(...categories);

    // 5. Seed Initial Donations in Belagavi
    const now = new Date();
    const prepTime = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const expiryTime1 = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const expiryTime2 = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

    const donation1: IDonation = {
      _id: 'don-1',
      donorId: donorUser._id,
      donorName: donorUser.name,
      donorPhone: donorUser.phone,
      foodName: 'Wedding Feast Surplus: Veg Pulao & Paneer Curry',
      category: 'Prepared Meals',
      quantity: 65,
      unit: 'meals',
      description: 'Freshly prepared vegetarian feast surplus from afternoon banquet. Kept under warm insulated containers.',
      ingredients: ['Basmati Rice', 'Paneer', 'Green Peas', 'Ghee', 'Mild Spices'],
      preparationTime: prepTime,
      expiryTime: expiryTime1,
      isVegetarian: true,
      allergens: ['Dairy (Paneer)'],
      pickupAddress: 'Patil Banquet Hall, Club Road, Camp, Belagavi',
      latitude: 15.8620,
      longitude: 74.5120,
      availableFrom: now.toISOString(),
      availableUntil: expiryTime1,
      contactName: 'Mr. Ramesh Patil',
      contactPhone: '+91 98860 12345',
      storageInformation: 'Sealed stainless containers, maintained warm (>60°C)',
      status: 'ACTIVE',
      shelfLifeEstimateHours: 4,
      riskLevel: 'LOW',
      aiDisclaimer: 'Prototype shelf-life/risk estimate. This is not a food safety decision.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const donation2: IDonation = {
      _id: 'don-2',
      donorId: donorUser._id,
      donorName: donorUser.name,
      donorPhone: donorUser.phone,
      foodName: 'Chapati & Mixed Vegetable Sambar',
      category: 'Prepared Meals',
      quantity: 40,
      unit: 'meals',
      description: 'Hot fresh wheat chapatis (80 pcs) with vegetable dal sambar.',
      ingredients: ['Wheat Flour', 'Toor Dal', 'Carrot', 'Beans', 'Spices'],
      preparationTime: prepTime,
      expiryTime: expiryTime2,
      isVegetarian: true,
      allergens: ['Gluten (Wheat)'],
      pickupAddress: 'Patil Banquet Hall, Club Road, Camp, Belagavi',
      latitude: 15.8620,
      longitude: 74.5120,
      availableFrom: now.toISOString(),
      availableUntil: expiryTime2,
      contactName: 'Mr. Ramesh Patil',
      contactPhone: '+91 98860 12345',
      storageInformation: 'Sealed food warmer trays',
      status: 'MATCHED',
      matchedNgoId: ngoProfile._id,
      shelfLifeEstimateHours: 5,
      riskLevel: 'LOW',
      aiDisclaimer: 'Prototype shelf-life/risk estimate. This is not a food safety decision.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.donations.push(donation1, donation2);

    // 6. Match record for donation 2
    const match1: IMatch = {
      _id: 'match-1',
      donationId: donation2._id,
      ngoId: ngoProfile._id,
      distanceKm: 3.2,
      recommendationScore: 94,
      status: 'ACCEPTED',
      viewedAt: new Date().toISOString(),
      actionAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.matches.push(match1);

    // 7. Task record for delivery
    const task1: ITask = {
      _id: 'task-1',
      donationId: donation2._id,
      ngoId: ngoProfile._id,
      volunteerId: volProfile._id,
      status: 'IN_TRANSIT',
      pickupAddress: donation2.pickupAddress,
      pickupLat: donation2.latitude,
      pickupLng: donation2.longitude,
      deliveryAddress: 'Sneha Orphanage & Care Center, Shahapur, Belagavi',
      deliveryLat: 15.8350,
      deliveryLng: 74.5200,
      instructions: 'Deliver to Sister Grace at reception. Please verify insulated box seal upon delivery.',
      pickupTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(task1);

    // 8. Emergency Alert in Belagavi
    const emergency1: IEmergencyAlert = {
      _id: 'sos-1',
      reportedBy: publicUser._id,
      reporterName: 'Pooja Kulkarni',
      reporterPhone: '+91 99887 66554',
      foodType: 'Prepared Meals / Drinking Water',
      category: 'Prepared Meals',
      quantityNeeded: '45-50 meals urgently',
      address: 'Old Belagavi Bus Stand, Shelter Area, Belagavi',
      latitude: 15.8550,
      longitude: 74.5050,
      urgencyReason: 'Stranded migrant workers and children affected by unseasonal downpour without shelter food.',
      expiresAt: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.emergencyAlerts.push(emergency1);

    // 9. Public Hunger Spotting Report
    const hungerReport1: IHungerReport = {
      _id: 'hunger-1',
      reportedBy: publicUser._id,
      reporterName: 'Pooja Kulkarni',
      address: 'Near Belagavi Railway Station, Goods Yard Colony',
      latitude: 15.8590,
      longitude: 74.5150,
      description: 'Group of 25 elderly and construction laborers without evening meal.',
      approximatePeople: 25,
      urgency: 'HIGH',
      status: 'VERIFIED',
      verifiedByNgoId: ngoProfile._id,
      verificationNotes: 'Verified by Annapurna Trust field team; scheduled for evening route distribution.',
      expiresAt: new Date(now.getTime() + 42 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.hungerReports.push(hungerReport1);

    // 10. Audit Log entries
    this.auditLogs.push(
      {
        _id: 'log-1',
        action: 'USER_REGISTERED',
        userId: adminUser._id,
        userName: adminUser.name,
        userRole: 'ADMIN',
        details: 'Admin root profile initialized for Belagavi operational zone.',
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString(),
      },
      {
        _id: 'log-2',
        action: 'NGO_VERIFIED',
        userId: adminUser._id,
        userName: adminUser.name,
        userRole: 'ADMIN',
        details: 'Verified Belagavi Annapurna Seva Trust registration KA-BEL-2021-NGO-4491.',
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString(),
      }
    );

    // 11. Initial Notifications
    this.notifications.push(
      {
        _id: 'notif-1',
        recipientId: ngoUser._id,
        recipientRole: 'NGO',
        title: 'New Donation Match Available',
        message: '65 meals of Veg Pulao & Paneer Curry available within 3.5 km at Patil Banquet Hall.',
        type: 'MATCH_RECOMMENDATION',
        referenceId: donation1._id,
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'notif-2',
        recipientId: volunteerUser._id,
        recipientRole: 'VOLUNTEER',
        title: 'Task Assigned',
        message: 'You have been assigned delivery task for 40 meals from Patil Banquet Hall to Sneha Orphanage.',
        type: 'VOLUNTEER_ASSIGNMENT',
        referenceId: task1._id,
        read: false,
        createdAt: new Date().toISOString(),
      }
    );

    console.log('[DataStore] Seeded complete Belagavi operational state.');
  }

  // Haversine distance calculator in KM
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

export const store = new DataStore();
