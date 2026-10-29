import {
  User,
  NGO,
  Volunteer,
  FoodCategory,
  Donation,
  Match,
  Task,
  EmergencyAlert,
  HungerReport,
  AuditLog,
  SystemSettings,
  NotificationItem,
  UserRole,
} from '../types.ts';

const STORE_KEY = 'mealbridge_demo_store_v6';
const CURRENT_USER_KEY = 'mealbridge_demo_current_user';
const TOKEN_KEY = 'mealbridge_demo_token';

// Haversine distance calculator for Belagavi geographical calculations
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

export interface DemoStoreData {
  users: User[];
  ngos: NGO[];
  volunteers: Volunteer[];
  categories: FoodCategory[];
  donations: Donation[];
  matches: Match[];
  tasks: Task[];
  emergencyAlerts: EmergencyAlert[];
  hungerReports: HungerReport[];
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  notifications: NotificationItem[];
}

const SEED_DATA: DemoStoreData = {
  users: [
    {
      _id: 'user-donor-1',
      name: 'Maratha Mandir Caterers & Banquet',
      email: 'donor@mealbridge.org',
      phone: '+91 98451 22334',
      role: 'DONOR',
      status: 'ACTIVE',
      address: 'Club Road, Near Camp, Belagavi',
      city: 'Belagavi',
      region: 'Belagavi Urban',
      latitude: 15.856,
      longitude: 74.505,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'user-ngo-1',
      name: 'Annapurna Seva Trust (Belagavi)',
      email: 'ngo@mealbridge.org',
      phone: '+91 83124 55901',
      role: 'NGO',
      status: 'ACTIVE',
      address: 'Tilakwadi 2nd Gate, Congress Road, Belagavi',
      city: 'Belagavi',
      region: 'Tilakwadi',
      latitude: 15.834,
      longitude: 74.502,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'user-vol-1',
      name: 'Suresh Patil (Rapid Two-Wheeler)',
      email: 'volunteer@mealbridge.org',
      phone: '+91 94481 99012',
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      address: 'Angol Main Road, Belagavi',
      city: 'Belagavi',
      region: 'Angol',
      latitude: 15.842,
      longitude: 74.508,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'user-vol-2',
      name: 'Irfan Nadaf (Heavy Van Logistics)',
      email: 'irfan.volunteer@mealbridge.org',
      phone: '+91 98860 33412',
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      address: 'Camp Cantonment Area, Belagavi',
      city: 'Belagavi',
      region: 'Camp',
      latitude: 15.86,
      longitude: 74.502,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'user-vol-3',
      name: 'Deepa Kulkarni (Four-Wheeler Express)',
      email: 'deepa.volunteer@mealbridge.org',
      phone: '+91 99014 77209',
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      address: 'Tilakwadi 1st Gate, Belagavi',
      city: 'Belagavi',
      region: 'Tilakwadi',
      latitude: 15.838,
      longitude: 74.504,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'user-vol-4',
      name: 'Sunil Belgaonkar (City Courier)',
      email: 'sunil.volunteer@mealbridge.org',
      phone: '+91 94482 11099',
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      address: 'Shahapur Shivaji Road, Belagavi',
      city: 'Belagavi',
      region: 'Shahapur',
      latitude: 15.847,
      longitude: 74.516,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'user-admin-1',
      name: 'Belagavi Administration Hub',
      email: 'admin@mealbridge.org',
      phone: '+91 83124 00100',
      role: 'ADMIN',
      status: 'ACTIVE',
      address: 'Deputy Commissioner Complex, Belagavi',
      city: 'Belagavi',
      region: 'Civil Lines',
      latitude: 15.85,
      longitude: 74.5,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'user-pub-1',
      name: 'Pooja Deshmukh (Citizen Spotter)',
      email: 'public@mealbridge.org',
      phone: '+91 97401 88411',
      role: 'PUBLIC',
      status: 'ACTIVE',
      address: 'Shahapur Main Market, Belagavi',
      city: 'Belagavi',
      region: 'Shahapur',
      latitude: 15.845,
      longitude: 74.515,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  ngos: [
    {
      _id: 'ngo-1',
      userId: 'user-ngo-1',
      orgName: 'Annapurna Seva Trust',
      registrationNumber: 'KA-BLG-TRUST-2018-994',
      contactPerson: 'Mahesh Kulkarni',
      phone: '+91 83124 55901',
      email: 'ngo@mealbridge.org',
      serviceRadiusKm: 10,
      serviceAreas: ['Tilakwadi', 'Camp', 'Angol', 'Shahapur', 'Civil Lines'],
      categoriesAccepted: ['Prepared Meals', 'Cooked Rice & Curries', 'Bakery & Bread', 'Fresh Produce'],
      dailyCapacityKg: 350,
      currentWorkloadKg: 120,
      verified: true,
      verifiedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      verifiedBy: 'user-admin-1',
      address: 'Tilakwadi 2nd Gate, Congress Road, Belagavi',
      latitude: 15.834,
      longitude: 74.502,
    },
    {
      _id: 'ngo-2',
      userId: 'user-pub-1',
      orgName: 'Belagavi Roti Bank & Relief Network',
      registrationNumber: 'KA-BLG-SOC-2022-108',
      contactPerson: 'Ramesh Hiremath',
      phone: '+91 98450 11223',
      email: 'rotibank.blg@example.org',
      serviceRadiusKm: 12,
      serviceAreas: ['Camp', 'Khasbag', 'Vadgaon'],
      categoriesAccepted: ['Prepared Meals', 'Cooked Rice & Curries', 'Dry Rations'],
      dailyCapacityKg: 200,
      currentWorkloadKg: 40,
      verified: false, // Pending verification in Admin tab
      address: 'Near Old Bus Stand, Camp, Belagavi',
      latitude: 15.861,
      longitude: 74.509,
    },
  ],

  volunteers: [
    {
      _id: 'vol-1',
      userId: 'user-vol-1',
      transportType: 'TWO_WHEELER',
      vehicleNumber: 'KA-22-EZ-4491',
      available: true,
      currentTaskCount: 1,
      maxTasks: 3,
      verified: true,
      completedDeliveries: 42,
      rating: 4.9,
      latitude: 15.842,
      longitude: 74.508,
    },
    {
      _id: 'vol-2',
      userId: 'user-vol-2',
      transportType: 'VAN',
      vehicleNumber: 'KA-22-V-8821',
      available: true,
      currentTaskCount: 0,
      maxTasks: 6,
      verified: true,
      completedDeliveries: 35,
      rating: 5.0,
      latitude: 15.86,
      longitude: 74.502,
    },
    {
      _id: 'vol-3',
      userId: 'user-vol-3',
      transportType: 'FOUR_WHEELER',
      vehicleNumber: 'KA-22-MB-1029',
      available: true,
      currentTaskCount: 0,
      maxTasks: 5,
      verified: true,
      completedDeliveries: 28,
      rating: 4.8,
      latitude: 15.838,
      longitude: 74.504,
    },
    {
      _id: 'vol-4',
      userId: 'user-vol-4',
      transportType: 'TWO_WHEELER',
      vehicleNumber: 'KA-22-EV-1904',
      available: true,
      currentTaskCount: 1,
      maxTasks: 3,
      verified: true,
      completedDeliveries: 19,
      rating: 4.7,
      latitude: 15.847,
      longitude: 74.516,
    },
  ],

  categories: [
    {
      _id: 'cat-1',
      name: 'Prepared Meals',
      description: 'Cooked banquets, catering surplus, warm buffets, and thali meals',
      icon: 'Utensils',
      shelfLifeGuidance: 'Must be consumed within 4 to 6 hours if held hot (>60°C).',
      foodHandlingTips: 'Keep insulated in thermal containers, avoid cross-contamination.',
      urgencyClassification: 'CRITICAL',
      active: true,
      donationCount: 18,
    },
    {
      _id: 'cat-2',
      name: 'Cooked Rice & Curries',
      description: 'Basmati rice, jeera rice, sambar, dal makhani, and subzis',
      icon: 'Soup',
      shelfLifeGuidance: 'Perishable: distribute within 4 hours in Belagavi climate.',
      foodHandlingTips: 'Maintain tight lid seals; ensure clean ladles.',
      urgencyClassification: 'CRITICAL',
      active: true,
      donationCount: 24,
    },
    {
      _id: 'cat-3',
      name: 'Bakery & Bread',
      description: 'Fresh bread loaves, dinner rolls, pav, and unsliced baked goods',
      icon: 'Wheat',
      shelfLifeGuidance: 'Stable for 12-24 hours if packaged dry and cool.',
      foodHandlingTips: 'Protect from moisture and humidity.',
      urgencyClassification: 'MEDIUM',
      active: true,
      donationCount: 12,
    },
    {
      _id: 'cat-4',
      name: 'Dairy & Sweets',
      description: 'Paneer, curd, pasteurized milk packets, peda, and dairy sweets',
      icon: 'Milk',
      shelfLifeGuidance: 'Highly sensitive: requires chilled cold-chain (<5°C) or fast distribution.',
      foodHandlingTips: 'Inspect aroma and texture before handover.',
      urgencyClassification: 'HIGH',
      active: true,
      donationCount: 9,
    },
    {
      _id: 'cat-5',
      name: 'Fresh Produce',
      description: 'Whole vegetables, seasonal fruit crates from APMC Belagavi yard',
      icon: 'Apple',
      shelfLifeGuidance: 'Usable for 24-48 hours depending on ripeness.',
      foodHandlingTips: 'Keep ventilated in clean plastic crates.',
      urgencyClassification: 'STANDARD',
      active: true,
      donationCount: 15,
    },
    {
      _id: 'cat-6',
      name: 'Packaged Goods',
      description: 'Unopened staples, atta, rice bags, pulses, and cooking oil',
      icon: 'Package',
      shelfLifeGuidance: 'Refer to printed best-before dates on packaging.',
      foodHandlingTips: 'Inspect seal integrity and dry storage.',
      urgencyClassification: 'STANDARD',
      active: true,
      donationCount: 11,
    },
  ],

  donations: [
    {
      _id: 'don-1',
      donorId: 'user-donor-1',
      donorName: 'Maratha Mandir Caterers & Banquet',
      donorPhone: '+91 98451 22334',
      foodName: 'Vegetable Rice & Dum Biryani',
      category: 'Prepared Meals',
      quantity: 35,
      unit: 'meals',
      description: 'Surplus from wedding reception lunch. High quality steamed basmati vegetable rice with paneer and fresh herbs.',
      ingredients: ['Basmati rice', 'Paneer', 'Carrots', 'Beans', 'Ghee', 'Mild Spices'],
      preparationTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      isVegetarian: true,
      allergens: ['Dairy (Paneer)'],
      pickupAddress: 'Maratha Mandir Hall, Club Road, Belagavi',
      latitude: 15.856,
      longitude: 74.505,
      availableFrom: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      availableUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      contactName: 'Sanjay Deshpande',
      contactPhone: '+91 98451 22334',
      storageInformation: 'Kept in insulated thermal dispensers at >60°C.',
      status: 'DELIVERED',
      matchedNgoId: 'ngo-1',
      assignedTaskId: 'task-2',
      assignedVolunteerId: 'vol-1',
      assignedVolunteerName: 'Suresh Patil',
      assignmentTimestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      acceptedDeliveryAddress: 'Belagavi Annapurna Shelter Hub, Tilakwadi 2nd Gate',
      acceptedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      shelfLifeEstimateHours: 5,
      riskLevel: 'LOW',
      aiDisclaimer: 'Guidance model prediction. Food must be visually inspected and temperature-verified prior to community distribution.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      _id: 'don-2',
      donorId: 'user-donor-1',
      donorName: 'Maratha Mandir Caterers & Banquet',
      donorPhone: '+91 98451 22334',
      foodName: 'Fresh Wheat Rotis & Dal Tadka',
      category: 'Cooked Rice & Curries',
      quantity: 50,
      unit: 'packets',
      description: 'Hot rotis and yellow lentil dal packed in foil containers.',
      ingredients: ['Whole wheat flour', 'Toor dal', 'Tomatoes', 'Cumin', 'Coriander'],
      preparationTime: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      expiryTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      isVegetarian: true,
      allergens: ['Wheat / Gluten'],
      pickupAddress: 'Mandoli Road Kitchen, Belagavi',
      latitude: 15.848,
      longitude: 74.492,
      availableFrom: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      availableUntil: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      contactName: 'Sanjay Deshpande',
      contactPhone: '+91 98451 22334',
      storageInformation: 'Clean foil meal boxes.',
      status: 'COMPLETED',
      matchedNgoId: 'ngo-1',
      assignedTaskId: 'task-1',
      shelfLifeEstimateHours: 4,
      riskLevel: 'LOW',
      createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      _id: 'don-3',
      donorId: 'user-donor-1',
      donorName: 'Maratha Mandir Caterers & Banquet',
      donorPhone: '+91 98451 22334',
      foodName: 'Assorted Bakery Bread & Sweet Buns',
      category: 'Bakery & Bread',
      quantity: 20,
      unit: 'boxes',
      description: 'Morning baked bread surplus in sealed cartons.',
      ingredients: ['Flour', 'Yeast', 'Sugar', 'Butter'],
      preparationTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expiryTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      isVegetarian: true,
      allergens: ['Gluten'],
      pickupAddress: 'Camp Cantonment Bakery Depot, Belagavi',
      latitude: 15.864,
      longitude: 74.502,
      availableFrom: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      availableUntil: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      contactName: 'Prakash K.',
      contactPhone: '+91 98451 22334',
      storageInformation: 'Dry carton packaging, ambient room temperature.',
      status: 'ACTIVE',
      shelfLifeEstimateHours: 20,
      riskLevel: 'LOW',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ],

  matches: [
    {
      _id: 'match-1',
      donationId: 'don-1',
      ngoId: 'ngo-1',
      distanceKm: 2.3,
      recommendationScore: 96,
      status: 'ACCEPTED',
      actionAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      deliveryAddress: 'Belagavi Annapurna Shelter Hub, Tilakwadi 2nd Gate',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'match-2',
      donationId: 'don-3',
      ngoId: 'ngo-1',
      distanceKm: 3.5,
      recommendationScore: 88,
      status: 'RECOMMENDED',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'match-3',
      donationId: 'don-2',
      ngoId: 'ngo-1',
      distanceKm: 1.8,
      recommendationScore: 98,
      status: 'ACCEPTED',
      actionAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    },
  ],

  tasks: [
    {
      _id: 'task-1',
      donationId: 'don-2',
      ngoId: 'ngo-1',
      volunteerId: 'vol-1',
      status: 'COMPLETED',
      pickupAddress: 'Mandoli Road Kitchen, Belagavi',
      pickupLat: 15.848,
      pickupLng: 74.492,
      deliveryAddress: 'Annapurna Shelter Hub, Tilakwadi 2nd Gate, Belagavi',
      deliveryLat: 15.834,
      deliveryLng: 74.502,
      instructions: 'Deliver 50 meal packets to night distribution desk.',
      pickupTimestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      deliveryTimestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      proofImageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60',
      proofNotes: 'All 50 meal packets handed over in clean condition. Received by coordinator Mahesh.',
      verifiedByNgo: true,
      verifiedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      _id: 'task-2',
      donationId: 'don-1',
      ngoId: 'ngo-1',
      volunteerId: 'vol-1',
      status: 'PROOF_SUBMITTED',
      pickupAddress: 'Maratha Mandir Hall, Club Road, Belagavi',
      pickupLat: 15.856,
      pickupLng: 74.505,
      deliveryAddress: 'Belagavi Annapurna Shelter Hub, Tilakwadi 2nd Gate',
      deliveryLat: 15.834,
      deliveryLng: 74.502,
      instructions: 'Deliver 35 meal dispensers in clean condition. Handle insulated thermal containers with care.',
      assignedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      acceptedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      pickupTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      deliveryTimestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      assignedVolunteerName: 'Suresh Patil',
      volunteerPhone: '+91 94481 99012',
      volunteerVehicle: 'KA-22-EX-4401 (Rapid Two-Wheeler)',
      proofImageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60',
      proofNotes: 'All 35 hot vegetable rice & paneer dum biryani meals handed over to Tilakwadi center coordinator in clean containers. Temperature verified warm.',
      verifiedByNgo: false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],

  emergencyAlerts: [
    {
      _id: 'sos-1',
      reportedBy: 'user-pub-1',
      reporterName: 'Pooja Deshmukh',
      reporterPhone: '+91 97401 88411',
      foodType: 'Prepared Cooked Meals',
      category: 'Prepared Meals',
      quantityNeeded: '50 Meals & Water',
      address: 'Near Belagavi Central Bus Stand (CBT), Station Road',
      latitude: 15.861,
      longitude: 74.512,
      urgencyReason: 'Stranded rural bus passengers and daily laborers with children without evening food.',
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'sos-2',
      reportedBy: 'user-admin-1',
      reporterName: 'District Relief Cell',
      reporterPhone: '+91 83124 00100',
      foodType: 'Packed Rations & Dry Foods',
      category: 'Packaged Goods',
      quantityNeeded: '30 Dry Food Kits',
      address: 'Near Belagavi Railway Station Goods Shed Area',
      latitude: 15.859,
      longitude: 74.509,
      urgencyReason: 'Seasonal migrant laborers affected by sudden heavy showers.',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      status: 'RESPONDED',
      respondedByNgoId: 'ngo-1',
      respondedByNgoName: 'Annapurna Seva Trust (Belagavi)',
      responseNote: 'Annapurna Seva Trust dispatched van with 35 food kits and dry tarpaulins.',
      respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      reliefType: 'Dry Ration Food Kits & Drinking Water',
      reliefQuantity: '30 Kits',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'sos-3',
      reportedBy: 'user-pub-1',
      reporterName: 'Pooja Deshmukh',
      reporterPhone: '+91 97401 88411',
      foodType: 'Prepared Cooked Meals & Water Packs',
      category: 'Prepared Meals',
      quantityNeeded: '45 Hot Meal Packs',
      address: 'Shahapur Old Market Courtyard, Belagavi',
      latitude: 15.845,
      longitude: 74.515,
      urgencyReason: 'Destitute families with elderly people stranded during road repairs.',
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status: 'CLOSED',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      respondedByNgoId: 'ngo-1',
      respondedByNgoName: 'Annapurna Seva Trust (Belagavi)',
      responseNote: 'Rapid response team alerted and ready for immediate deployment.',
      respondedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
      reliefType: 'Fresh Cooked Meals & Bottled Water',
      reliefQuantity: '45 Meal Packs',
      dispatchedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      assignedVolunteerId: 'vol-2',
      assignedVolunteerName: 'Irfan Nadaf (Heavy Van Logistics)',
      volunteerPhone: '+91 98860 33412',
      vehicleType: 'Heavy Relief Van',
      vehicleNumber: 'KA-22-EA-9081',
      dispatchNote: 'Dispatched via Camp route with insulated warm containers.',
      inProgressAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      deliveredQuantity: '45 Meal Packs',
      deliveryNotes: 'Meals distributed to all 45 individuals in orderly lines. Clean water supplied.',
      recipientNotes: 'Community elder Sri Ramappa received and coordinated smooth queue.',
      proofPhotoUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60',
      proofSubmittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      verifiedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      verifiedByUserId: 'user-ngo-1',
      verifiedByUserName: 'Annapurna Seva Trust (Belagavi)',
      verificationNotes: 'Handover verified and compliant with municipal health and hygiene standards.',
      closedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
  ],

  hungerReports: [
    {
      _id: 'hunger-1',
      reportedBy: 'user-pub-1',
      reporterName: 'Pooja Deshmukh',
      address: 'Bogarves Circle, Under Flyover, Belagavi',
      latitude: 15.853,
      longitude: 74.507,
      description: 'Group of 14 homeless laborers and elderly individuals seeking dinner assistance.',
      photoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&auto=format&fit=crop&q=60',
      approximatePeople: 14,
      urgency: 'HIGH',
      status: 'VERIFIED',
      verifiedByNgoId: 'ngo-1',
      verificationNotes: 'Field volunteer visited; meals supplied and shelter shelter mapped.',
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'hunger-2',
      reportedBy: 'user-vol-1',
      reporterName: 'Suresh Patil',
      address: 'Near Old Belagavi Temple, Shahapur',
      latitude: 15.845,
      longitude: 74.515,
      description: 'Approximately 8 destitute individuals near the market courtyard.',
      approximatePeople: 8,
      urgency: 'MEDIUM',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ],

  auditLogs: [
    {
      _id: 'audit-1',
      action: 'SYSTEM_BOOTSTRAP',
      userId: 'user-admin-1',
      userName: 'Belagavi Administration Hub',
      userRole: 'ADMIN',
      details: 'MealBridge Belagavi municipal redistribution network initialized in high-fidelity demo mode with localStorage persistence.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'audit-2',
      action: 'DONATION_POSTED',
      userId: 'user-donor-1',
      userName: 'Maratha Mandir Caterers',
      userRole: 'DONOR',
      details: 'Posted 35 meals of Vegetable Dum Biryani. Automated 10 km mesh matched 1 verified NGO in Belagavi.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'audit-3',
      action: 'DELIVERY_VERIFIED',
      userId: 'user-ngo-1',
      userName: 'Annapurna Seva Trust',
      userRole: 'NGO',
      details: 'Verified task proof for 50 meal packets delivered by Volunteer Suresh Patil.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ],

  systemSettings: {
    matchingRadiusKm: 10,
    emergencyRadiusKm: 15,
    hungerReportExpiryHours: 48,
    requireNgoVerification: true,
    allowPublicRegistrations: true,
    belagaviCenterLat: 15.8497,
    belagaviCenterLng: 74.4977,
  },

  notifications: [
    {
      _id: 'notif-1',
      recipientId: 'user-ngo-1',
      title: 'New Surplus Food Match (10 KM)',
      message: 'Vegetable Dum Biryani (35 meals) available at Maratha Mandir Hall, Club Road (2.3 km away).',
      type: 'MATCH_RECOMMENDED',
      referenceId: 'don-1',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: 'notif-2',
      recipientId: 'user-donor-1',
      title: 'Delivery Completed & Verified',
      message: 'Annapurna Seva Trust verified the successful handover of 50 meal packets.',
      type: 'DELIVERY_COMPLETED',
      referenceId: 'don-2',
      read: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      _id: 'notif-3',
      recipientId: 'user-ngo-1',
      title: 'Delivery Proof Submitted — Awaiting Verification',
      message: 'Volunteer Suresh Patil has submitted delivery proof for Vegetable Rice & Dum Biryani (35 meals). Please review and sign off.',
      type: 'PROOF_SUBMITTED',
      referenceId: 'task-2',
      read: false,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
};

// Pure localStorage state manager
export function getStore(): DemoStoreData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      saveStore(SEED_DATA);
      return JSON.parse(JSON.stringify(SEED_DATA));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse localStorage store. Resetting to seed data:', err);
    saveStore(SEED_DATA);
    return JSON.parse(JSON.stringify(SEED_DATA));
  }
}

export function saveStore(store: DemoStoreData): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('mealbridge_demo_store_updated', { detail: store }));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function resetStore(): DemoStoreData {
  saveStore(SEED_DATA);
  return JSON.parse(JSON.stringify(SEED_DATA));
}

// Session Helpers
export function getDemoStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setDemoStoredUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export function getDemoStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setDemoStoredToken(token: string | null): void {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}
