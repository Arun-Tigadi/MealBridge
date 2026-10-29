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
import {
  getStore,
  saveStore,
  haversineDistanceKm,
  getDemoStoredUser,
  setDemoStoredUser,
  getDemoStoredToken,
  setDemoStoredToken,
} from './demoStore.ts';

// Helper to simulate a small async tick so UI feels authentic and responsive
const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

function getActiveUser(): User {
  const user = getDemoStoredUser();
  if (user) return user;
  const store = getStore();
  // Default to donor if not logged in
  return store.users[0];
}

export const demoService = {
  // Service Health & Metadata
  checkHealth: async () => {
    await delay();
    return {
      status: 'ok',
      service: 'MealBridge Belagavi Client Demo Engine',
      database: {
        isConnected: true,
        mode: 'localStorage_demo',
        message: 'Operating on client-side demo state with localStorage persistence. Ready for future MongoDB integration.',
      },
    };
  },

  // Auth Operations
  register: async (userData: any) => {
    await delay(60);
    const store = getStore();

    // Check if email already exists
    const existing = store.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists in the Belagavi network.');
    }

    const newUser: User = {
      _id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: userData.role === 'NGO' ? 'PENDING' : 'ACTIVE',
      address: userData.address || 'Belagavi, Karnataka',
      city: 'Belagavi',
      region: 'Belagavi Urban',
      latitude: userData.latitude || 15.8497,
      longitude: userData.longitude || 74.4977,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    if (userData.role === 'NGO') {
      const newNgo: NGO = {
        _id: `ngo-${Date.now()}`,
        userId: newUser._id,
        orgName: userData.orgName || userData.name,
        registrationNumber: userData.registrationNumber || 'REG-PENDING',
        contactPerson: userData.name,
        phone: userData.phone,
        email: userData.email,
        serviceRadiusKm: 10,
        serviceAreas: ['Belagavi Urban', 'Tilakwadi', 'Camp'],
        categoriesAccepted: ['Prepared Meals', 'Cooked Rice & Curries', 'Bakery & Bread'],
        dailyCapacityKg: userData.dailyCapacityKg || 150,
        currentWorkloadKg: 0,
        verified: false, // Requires Admin approval
        address: userData.address || 'Belagavi, Karnataka',
        latitude: userData.latitude || 15.8497,
        longitude: userData.longitude || 74.4977,
      };
      store.ngos.push(newNgo);
    } else if (userData.role === 'VOLUNTEER') {
      const newVol: Volunteer = {
        _id: `vol-${Date.now()}`,
        userId: newUser._id,
        transportType: userData.transportType || 'TWO_WHEELER',
        vehicleNumber: userData.vehicleNumber || 'KA-22',
        available: true,
        currentTaskCount: 0,
        maxTasks: 4,
        verified: true,
        completedDeliveries: 0,
        rating: 5.0,
        latitude: userData.latitude || 15.8497,
        longitude: userData.longitude || 74.4977,
      };
      store.volunteers.push(newVol);
    }

    // Add Audit Log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'USER_REGISTERED',
      userId: newUser._id,
      userName: newUser.name,
      userRole: newUser.role,
      details: `New account registered as ${newUser.role} in Belagavi network.`,
      timestamp: new Date().toISOString(),
    });

    saveStore(store);
    const token = `demo-token-${newUser._id}-${Date.now()}`;
    setDemoStoredToken(token);
    setDemoStoredUser(newUser);

    return {
      success: true,
      token,
      user: newUser,
    };
  },

  login: async (credentials: { email: string; password: string }) => {
    await delay(60);
    const store = getStore();

    const user = store.users.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!user) {
      throw new Error('Account not found. Please check your email or select one of the 1-click test roles.');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      throw new Error(`This account is currently ${user.status}. Please contact Belagavi Administration.`);
    }

    const token = `demo-token-${user._id}-${Date.now()}`;
    setDemoStoredToken(token);
    setDemoStoredUser(user);

    return {
      success: true,
      token,
      user,
    };
  },

  getCurrentUser: async () => {
    await delay();
    const storedUser = getDemoStoredUser();
    if (!storedUser) {
      return {
        success: false,
        user: null as any,
        linkedProfile: null,
      };
    }
    const store = getStore();
    const user = store.users.find((u) => u._id === storedUser._id) || storedUser;
    let linkedProfile = null;
    if (user.role === 'NGO') {
      linkedProfile = store.ngos.find((n) => n.userId === user._id) || null;
    } else if (user.role === 'VOLUNTEER') {
      linkedProfile = store.volunteers.find((v) => v.userId === user._id) || null;
    }

    return {
      success: true,
      user,
      linkedProfile,
    };
  },

  updateProfile: async (profileData: any) => {
    await delay();
    const store = getStore();
    const currentUser = getActiveUser();

    const idx = store.users.findIndex((u) => u._id === currentUser._id);
    if (idx !== -1) {
      store.users[idx] = {
        ...store.users[idx],
        name: profileData.name || store.users[idx].name,
        phone: profileData.phone || store.users[idx].phone,
        address: profileData.address || store.users[idx].address,
        latitude: profileData.latitude ?? store.users[idx].latitude,
        longitude: profileData.longitude ?? store.users[idx].longitude,
      };

      // Also update linked NGO or Volunteer records
      if (currentUser.role === 'NGO') {
        const ngoIdx = store.ngos.findIndex((n) => n.userId === currentUser._id);
        if (ngoIdx !== -1) {
          store.ngos[ngoIdx].contactPerson = store.users[idx].name;
          store.ngos[ngoIdx].phone = store.users[idx].phone;
          store.ngos[ngoIdx].address = store.users[idx].address || '';
          if (store.users[idx].latitude && store.users[idx].longitude) {
            store.ngos[ngoIdx].latitude = store.users[idx].latitude!;
            store.ngos[ngoIdx].longitude = store.users[idx].longitude!;
          }
        }
      }

      saveStore(store);
      setDemoStoredUser(store.users[idx]);
      return { success: true, user: store.users[idx] };
    }

    throw new Error('User not found');
  },

  forgotPassword: async (email: string) => {
    await delay();
    return {
      success: true,
      message: 'Demo password reset OTP generated: 123456',
      demoOtp: '123456',
    };
  },

  resetPassword: async (payload: { email: string; otp: string; newPassword: string }) => {
    await delay();
    return {
      success: true,
      message: 'Password successfully reset.',
    };
  },

  // Categories
  getCategories: async () => {
    await delay();
    const store = getStore();
    return {
      success: true,
      categories: store.categories,
    };
  },

  createCategory: async (cat: any) => {
    await delay();
    const store = getStore();
    const newCat: FoodCategory = {
      _id: `cat-${Date.now()}`,
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'Utensils',
      shelfLifeGuidance: cat.shelfLifeGuidance || 'Distribute promptly.',
      foodHandlingTips: cat.foodHandlingTips || 'Keep clean and covered.',
      urgencyClassification: cat.urgencyClassification || 'MEDIUM',
      active: true,
      donationCount: 0,
    };
    store.categories.push(newCat);
    saveStore(store);
    return { success: true, category: newCat };
  },

  // Donations
  createDonation: async (donationData: any) => {
    await delay(70);
    const store = getStore();
    const user = getActiveUser();

    const newDonation: Donation = {
      _id: `don-${Date.now()}`,
      donorId: user._id,
      donorName: user.name,
      donorPhone: user.phone,
      foodName: donationData.foodName,
      category: donationData.category,
      quantity: Number(donationData.quantity),
      unit: donationData.unit || 'meals',
      description: donationData.description || '',
      ingredients: Array.isArray(donationData.ingredients) ? donationData.ingredients : [],
      preparationTime: donationData.preparationTime || new Date().toISOString(),
      expiryTime: donationData.expiryTime || new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      isVegetarian: Boolean(donationData.isVegetarian),
      allergens: Array.isArray(donationData.allergens) ? donationData.allergens : [],
      pickupAddress: donationData.pickupAddress || user.address || 'Belagavi',
      latitude: donationData.latitude || user.latitude || 15.85,
      longitude: donationData.longitude || user.longitude || 74.5,
      availableFrom: donationData.preparationTime || new Date().toISOString(),
      availableUntil: donationData.expiryTime || new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      contactName: donationData.contactName || user.name,
      contactPhone: donationData.contactPhone || user.phone,
      storageInformation: donationData.storageInformation || 'Standard storage',
      status: 'ACTIVE',
      shelfLifeEstimateHours: 5,
      riskLevel: 'LOW',
      aiDisclaimer: 'Guidance model estimate. Visually inspect food condition prior to serving.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.donations.unshift(newDonation);

    // Run Automated 10 KM Belagavi Matching Engine
    let matchesCount = 0;
    const verifiedNgos = store.ngos.filter((n) => n.verified);

    for (const ngo of verifiedNgos) {
      const dist = haversineDistanceKm(
        newDonation.latitude,
        newDonation.longitude,
        ngo.latitude,
        ngo.longitude
      );

      // Match criteria: within 10 km (or custom service radius)
      if (dist <= (ngo.serviceRadiusKm || 10)) {
        // Calculate score
        let score = 100 - Math.round(dist * 6);
        if (ngo.categoriesAccepted.includes(newDonation.category)) {
          score += 10;
        }
        score = Math.max(50, Math.min(99, score));

        const newMatch: Match = {
          _id: `match-${Date.now()}-${matchesCount}`,
          donationId: newDonation._id,
          ngoId: ngo._id,
          distanceKm: dist,
          recommendationScore: score,
          status: 'RECOMMENDED',
          createdAt: new Date().toISOString(),
          donation: newDonation,
          ngo,
        };

        store.matches.unshift(newMatch);
        matchesCount++;

        // Notify the NGO
        store.notifications.unshift({
          _id: `notif-${Date.now()}-${matchesCount}`,
          recipientId: ngo.userId,
          title: 'New Surplus Food Match (10 KM)',
          message: `${newDonation.foodName} (${newDonation.quantity} ${newDonation.unit}) matched within ${dist} km from your shelter hub.`,
          type: 'MATCH_RECOMMENDED',
          referenceId: newDonation._id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Add Audit Log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'DONATION_POSTED',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      details: `Listed "${newDonation.foodName}" (${newDonation.quantity} ${newDonation.unit}). Generated ${matchesCount} NGO matches in 10 km radius.`,
      timestamp: new Date().toISOString(),
    });

    saveStore(store);

    return {
      success: true,
      donation: newDonation,
      matchesCount,
      expiryPrediction: {
        estimatedSafeHours: 5,
        riskLevel: 'LOW',
        safetyGuidance: [
          'Maintain warm storage (>60°C) until pickup.',
          'Advise NGO logistics team to use insulated containers.',
        ],
      },
    };
  },

  getDonations: async (params?: {
    category?: string;
    status?: string;
    search?: string;
    mineOnly?: boolean;
  }) => {
    await delay();
    const store = getStore();
    const user = getActiveUser();

    let list = [...store.donations];

    if (params?.mineOnly) {
      list = list.filter((d) => d.donorId === user._id);
    }

    if (params?.category) {
      list = list.filter((d) => d.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params?.status) {
      list = list.filter((d) => d.status === params.status);
    }

    if (params?.search) {
      const term = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.foodName.toLowerCase().includes(term) ||
          d.pickupAddress.toLowerCase().includes(term) ||
          d.category.toLowerCase().includes(term)
      );
    }

    return {
      success: true,
      count: list.length,
      donations: list,
    };
  },

  getDonationById: async (id: string) => {
    await delay();
    const store = getStore();
    const donation = store.donations.find((d) => d._id === id);
    if (!donation) {
      throw new Error('Donation not found');
    }

    const matches = store.matches
      .filter((m) => m.donationId === id)
      .map((m) => ({
        ...m,
        ngo: store.ngos.find((n) => n._id === m.ngoId),
      }));

    const task = store.tasks.find((t) => t.donationId === id);

    return {
      success: true,
      donation,
      matches,
      task,
    };
  },

  cancelDonation: async (id: string) => {
    await delay();
    const store = getStore();
    const idx = store.donations.findIndex((d) => d._id === id);
    if (idx === -1) throw new Error('Donation not found');

    store.donations[idx].status = 'CANCELLED';
    store.donations[idx].updatedAt = new Date().toISOString();

    // Cancel pending matches
    store.matches.forEach((m) => {
      if (m.donationId === id && m.status === 'RECOMMENDED') {
        m.status = 'CANCELLED';
      }
    });

    saveStore(store);

    return {
      success: true,
      message: 'Donation cancelled.',
      donation: store.donations[idx],
    };
  },

  getDonorStats: async () => {
    await delay();
    const store = getStore();
    const user = getActiveUser();
    const myDons = store.donations.filter((d) => d.donorId === user._id);

    const totalDonations = myDons.length;
    const activeDonations = myDons.filter((d) =>
      ['ACTIVE', 'MATCHED', 'CLAIMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
    ).length;
    const completedDonations = myDons.filter((d) => d.status === 'COMPLETED' || d.status === 'DELIVERED').length;
    const estimatedMealsProvided = myDons.reduce((acc, d) => acc + (d.unit === 'meals' ? d.quantity : d.quantity * 2), 0);

    return {
      success: true,
      stats: {
        totalDonations,
        activeDonations,
        completedDonations,
        estimatedMealsProvided,
      },
    };
  },

  // NGO Operations
  getNGOProfile: async () => {
    await delay();
    const store = getStore();
    const user = getActiveUser();
    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];
    return {
      success: true,
      ngo,
    };
  },

  getRecommendedMatches: async () => {
    await delay();
    const store = getStore();
    const user = getActiveUser();
    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];

    // Get all matches for this NGO, hydrate with donation data
    const matches = store.matches
      .filter((m) => m.ngoId === ngo._id)
      .map((m) => {
        const donation = store.donations.find((d) => d._id === m.donationId);
        return {
          ...m,
          donation,
          ngo,
        };
      })
      .filter((m) => m.donation && m.donation.status !== 'CANCELLED');

    return {
      success: true,
      count: matches.length,
      matches,
    };
  },

  acceptMatch: async (payload: { matchId: string; deliveryAddress?: string; instructions?: string }) => {
    await delay(60);
    const store = getStore();
    const matchIdx = store.matches.findIndex((m) => m._id === payload.matchId);
    if (matchIdx === -1) throw new Error('Match recommendation not found');

    const match = store.matches[matchIdx];
    const donIdx = store.donations.findIndex((d) => d._id === match.donationId);
    if (donIdx === -1) throw new Error('Associated donation not found');

    const donation = store.donations[donIdx];

    // Check expiry
    if (new Date(donation.expiryTime).getTime() <= Date.now()) {
      throw new Error('This surplus food donation has expired and cannot be accepted.');
    }

    const ngo = store.ngos.find((n) => n._id === match.ngoId);
    const resolvedDeliveryAddress = payload.deliveryAddress || ngo?.address || 'Belagavi Annapurna Shelter Hub, Tilakwadi 2nd Gate';

    match.status = 'ACCEPTED';
    match.actionAt = new Date().toISOString();
    match.deliveryAddress = resolvedDeliveryAddress;

    // Workflow Rule: Accepted donation moves from "MATCHED" to "PICKUP ASSIGNMENT PENDING"
    // No automatic assignment: NGO coordinator must explicitly select and confirm volunteer assignment.
    donation.status = 'PICKUP_ASSIGNMENT_PENDING';
    donation.matchedNgoId = match.ngoId;
    donation.acceptedDeliveryAddress = resolvedDeliveryAddress;
    donation.acceptedAt = new Date().toISOString();
    donation.updatedAt = new Date().toISOString();

    // Notify Donor
    store.notifications.unshift({
      _id: `notif-${Date.now()}-donor`,
      recipientId: donation.donorId,
      title: 'Donation Accepted by NGO',
      message: `${ngo?.orgName || 'An NGO'} has accepted your surplus donation of ${donation.foodName}. A verified logistics volunteer is being assigned for pickup.`,
      type: 'MATCH_ACCEPTED',
      referenceId: donation._id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Notify NGO Coordinator
    store.notifications.unshift({
      _id: `notif-${Date.now()}-ngo`,
      recipientId: ngo?.userId || 'user-ngo-1',
      title: 'Match Accepted - Assign Volunteer Required',
      message: `You accepted ${donation.foodName} (${donation.quantity} ${donation.unit}). Please select and assign a verified Belagavi volunteer for pickup.`,
      type: 'PICKUP_PENDING',
      referenceId: donation._id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    saveStore(store);

    return {
      success: true,
      message: 'Match accepted. Donation is in PICKUP ASSIGNMENT PENDING state.',
      donation,
      match,
    };
  },

  rejectMatch: async (payload: { matchId: string; rejectionReason?: string }) => {
    await delay();
    const store = getStore();
    const idx = store.matches.findIndex((m) => m._id === payload.matchId);
    if (idx === -1) throw new Error('Match not found');

    store.matches[idx].status = 'REJECTED';
    store.matches[idx].actionAt = new Date().toISOString();
    store.matches[idx].rejectionReason = payload.rejectionReason || 'Declined by NGO';

    saveStore(store);
    return { success: true, message: 'Match declined.' };
  },

  getNGOAcceptedDonations: async () => {
    await delay(30);
    const store = getStore();
    const user = getActiveUser();
    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];

    // All donations matched or accepted by this NGO
    const acceptedStatuses: string[] = [
      'PICKUP_ASSIGNMENT_PENDING',
      'PICKUP_ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
      'PROOF_SUBMITTED',
      'COMPLETED',
    ];

    const donations = store.donations
      .filter((d) => d.matchedNgoId === ngo._id && acceptedStatuses.includes(d.status))
      .map((d) => {
        const match = store.matches.find((m) => m.donationId === d._id && m.ngoId === ngo._id);
        const task = store.tasks.find((t) => t.donationId === d._id);
        const assignedVol = d.assignedVolunteerId
          ? store.volunteers.find((v) => v._id === d.assignedVolunteerId)
          : task?.volunteerId
          ? store.volunteers.find((v) => v._id === task.volunteerId)
          : undefined;

        const assignedVolUser = assignedVol
          ? store.users.find((u) => u._id === assignedVol.userId)
          : undefined;

        const isExpired = new Date(d.expiryTime).getTime() <= Date.now();
        const remainingMs = Math.max(0, new Date(d.expiryTime).getTime() - Date.now());
        const remainingHours = Math.round((remainingMs / (1000 * 60 * 60)) * 10) / 10;

        return {
          ...d,
          match,
          task,
          assignedVolunteer: assignedVol
            ? {
                ...assignedVol,
                user: assignedVolUser,
              }
            : undefined,
          isExpired,
          remainingHours,
          canAssignVolunteer:
            !isExpired &&
            (d.status === 'PICKUP_ASSIGNMENT_PENDING' ||
              task?.status === 'DECLINED' ||
              !d.assignedVolunteerId),
        };
      });

    return {
      success: true,
      count: donations.length,
      donations,
    };
  },

  getDeliveriesAwaitingVerification: async () => {
    await delay(30);
    const store = getStore();
    const user = getActiveUser();
    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];

    // Find all tasks awaiting verification for this NGO
    const tasks = store.tasks
      .filter((t) => t.status === 'PROOF_SUBMITTED' && (!t.ngoId || t.ngoId === ngo._id))
      .map((t) => {
        const donation = store.donations.find((d) => d._id === t.donationId);
        const vol = t.volunteerId ? store.volunteers.find((v) => v._id === t.volunteerId) : undefined;
        const volUser = vol ? store.users.find((u) => u._id === vol.userId) : undefined;
        const donorUser = donation ? store.users.find((u) => u._id === donation.donorId) : undefined;

        return {
          ...t,
          donation,
          ngo,
          volunteer: vol ? { ...vol, user: volUser } : undefined,
          donor: donorUser,
        };
      });

    return {
      success: true,
      count: tasks.length,
      tasks,
    };
  },

  assignVolunteer: async (payload: {
    donationId: string;
    volunteerId: string;
    instructions?: string;
    isReassignment?: boolean;
  }) => {
    await delay(60);
    const store = getStore();
    const donIdx = store.donations.findIndex((d) => d._id === payload.donationId);
    if (donIdx === -1) throw new Error('Donation record not found in system.');
    const donation = store.donations[donIdx];

    // Validation 1: Expired check
    if (new Date(donation.expiryTime).getTime() <= Date.now()) {
      throw new Error(
        'This donation has passed its safe expiry cutoff and cannot receive a volunteer pickup assignment.'
      );
    }

    // Validation 2: Authorization check - Only accepting NGO can assign
    const user = getActiveUser();
    const activeNgo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];
    if (donation.matchedNgoId && donation.matchedNgoId !== activeNgo._id) {
      throw new Error('Only the NGO that accepted this surplus food match can assign volunteers.');
    }

    // Validation 3: Duplicate assignment prevention
    if (
      !payload.isReassignment &&
      donation.status === 'PICKUP_ASSIGNED' &&
      donation.assignedVolunteerId
    ) {
      const existingTask = store.tasks.find((t) => t.donationId === donation._id);
      if (
        existingTask &&
        ['ASSIGNED', 'ACCEPTED', 'PICKUP_STARTED', 'PICKED_UP', 'IN_TRANSIT'].includes(
          existingTask.status
        )
      ) {
        throw new Error(
          'A volunteer is already actively assigned to this pickup. Use reassignment to change the driver.'
        );
      }
    }

    // Validation 4: Volunteer existence
    const vol = store.volunteers.find((v) => v._id === payload.volunteerId);
    if (!vol) throw new Error('Selected volunteer was not found in the Belagavi network.');
    const volUser = store.users.find((u) => u._id === vol.userId);

    const assignmentTime = new Date().toISOString();

    // If reassigning, release prior volunteer load
    if (donation.assignedVolunteerId && donation.assignedVolunteerId !== vol._id) {
      const prevVol = store.volunteers.find((v) => v._id === donation.assignedVolunteerId);
      if (prevVol) {
        prevVol.currentTaskCount = Math.max(0, (prevVol.currentTaskCount || 1) - 1);
        prevVol.available = true;
      }
    }

    // Create or update pickup task
    let task: Task;
    const existingTaskIdx = store.tasks.findIndex((t) => t.donationId === donation._id);

    const deliveryAddress =
      donation.acceptedDeliveryAddress ||
      activeNgo.address ||
      'Belagavi Annapurna Shelter Hub, Tilakwadi 2nd Gate';

    if (existingTaskIdx !== -1) {
      task = store.tasks[existingTaskIdx];
      task.volunteerId = vol._id;
      task.assignedVolunteerName = volUser?.name || 'Volunteer';
      task.volunteerPhone = volUser?.phone || '';
      task.volunteerVehicle = vol.vehicleNumber;
      task.status = 'ASSIGNED';
      task.assignedAt = assignmentTime;
      task.declinedAt = undefined;
      task.declineReason = undefined;
      task.instructions =
        payload.instructions ||
        task.instructions ||
        `Deliver ${donation.quantity} ${donation.unit} safely in clean insulated containers.`;
      task.updatedAt = assignmentTime;
    } else {
      task = {
        _id: `task-${Date.now()}`,
        donationId: donation._id,
        ngoId: donation.matchedNgoId || activeNgo._id,
        volunteerId: vol._id,
        assignedVolunteerName: volUser?.name || 'Volunteer',
        volunteerPhone: volUser?.phone || '',
        volunteerVehicle: vol.vehicleNumber,
        status: 'ASSIGNED',
        assignedAt: assignmentTime,
        pickupAddress: donation.pickupAddress,
        pickupLat: donation.latitude,
        pickupLng: donation.longitude,
        deliveryAddress,
        deliveryLat: activeNgo.latitude || 15.834,
        deliveryLng: activeNgo.longitude || 74.502,
        instructions:
          payload.instructions ||
          `Deliver ${donation.quantity} ${donation.unit} safely in clean insulated containers. Verify temperature with donor.`,
        createdAt: assignmentTime,
        updatedAt: assignmentTime,
      };
      store.tasks.unshift(task);
    }

    // Update Donation Status
    donation.status = 'PICKUP_ASSIGNED';
    donation.assignedTaskId = task._id;
    donation.assignedVolunteerId = vol._id;
    donation.assignedVolunteerName = volUser?.name || 'Volunteer';
    donation.assignmentTimestamp = assignmentTime;
    donation.updatedAt = assignmentTime;

    // Update Volunteer task load & availability
    vol.currentTaskCount = (vol.currentTaskCount || 0) + 1;
    if (vol.currentTaskCount >= vol.maxTasks) {
      vol.available = false;
    }

    // Notifications:
    // 1. NGO Notification
    store.notifications.unshift({
      _id: `notif-${Date.now()}-ngo`,
      recipientId: activeNgo.userId,
      title: 'Volunteer Dispatched for Pickup',
      message: `Assigned ${volUser?.name || 'Volunteer'} (${vol.transportType} ${vol.vehicleNumber || ''}) for ${donation.foodName} from ${donation.pickupAddress}.`,
      type: 'VOLUNTEER_ASSIGNED',
      referenceId: task._id,
      read: false,
      createdAt: assignmentTime,
    });

    // 2. Volunteer Notification
    store.notifications.unshift({
      _id: `notif-${Date.now()}-vol`,
      recipientId: vol.userId,
      title: 'New Delivery Task Assigned',
      message: `Pickup Assignment: ${donation.foodName} (${donation.quantity} ${donation.unit}) from ${donation.pickupAddress}. Please accept to begin transit.`,
      type: 'TASK_ASSIGNED',
      referenceId: task._id,
      read: false,
      createdAt: assignmentTime,
    });

    // 3. Donor Notification
    store.notifications.unshift({
      _id: `notif-${Date.now()}-donor`,
      recipientId: donation.donorId,
      title: 'Pickup Volunteer Dispatched',
      message: `Volunteer ${volUser?.name || 'Volunteer'} (${vol.transportType} ${vol.vehicleNumber || ''}) has been assigned to collect your surplus food.`,
      type: 'VOLUNTEER_DISPATCHED',
      referenceId: donation._id,
      read: false,
      createdAt: assignmentTime,
    });

    // Audit log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'VOLUNTEER_ASSIGNMENT',
      userId: user._id,
      userName: activeNgo.orgName,
      userRole: 'NGO',
      details: `Assigned volunteer ${volUser?.name} (${vol.transportType}) to pickup ${donation.foodName} (${donation.quantity} ${donation.unit})`,
      timestamp: assignmentTime,
    });

    saveStore(store);

    return {
      success: true,
      message: `Successfully assigned ${volUser?.name} for pickup.`,
      task,
      donation,
      volunteer: vol,
    };
  },

  reassignVolunteer: async (payload: {
    donationId: string;
    volunteerId: string;
    instructions?: string;
  }) => {
    return demoService.assignVolunteer({
      ...payload,
      isReassignment: true,
    });
  },

  getRecommendedVolunteers: async (params?: {
    donationId?: string;
    pickupLat?: number;
    pickupLng?: number;
    quantity?: number;
    category?: string;
  }) => {
    await delay(30);
    const store = getStore();

    let targetLat = params?.pickupLat || 15.856;
    let targetLng = params?.pickupLng || 74.505;
    let quantity = params?.quantity || 35;

    if (params?.donationId) {
      const don = store.donations.find((d) => d._id === params.donationId);
      if (don) {
        targetLat = don.latitude;
        targetLng = don.longitude;
        quantity = don.quantity;
      }
    }

    const volunteers = store.volunteers.map((v) => {
      const user = store.users.find((u) => u._id === v.userId);

      // Distance from pickup location
      let distanceKm = 2.4;
      if (v.latitude && v.longitude && targetLat && targetLng) {
        distanceKm = haversineDistanceKm(v.latitude, v.longitude, targetLat, targetLng);
      }

      // Transport suitability based on cargo volume
      let transportSuitability = 'Standard Logistics';
      let suitabilityPoints = 15;

      if (quantity > 50) {
        if (v.transportType === 'VAN') {
          transportSuitability = 'Optimal: Large cargo space for bulk surplus';
          suitabilityPoints = 25;
        } else if (v.transportType === 'FOUR_WHEELER') {
          transportSuitability = 'Suitable: Standard vehicle trunk capacity';
          suitabilityPoints = 20;
        } else {
          transportSuitability = 'Limited: Two-wheeler carrier has smaller capacity';
          suitabilityPoints = 10;
        }
      } else {
        if (v.transportType === 'TWO_WHEELER') {
          transportSuitability = 'Optimal: Fast city navigation through Belagavi markets';
          suitabilityPoints = 25;
        } else if (v.transportType === 'FOUR_WHEELER') {
          transportSuitability = 'Suitable: Weather-safe city transit';
          suitabilityPoints = 22;
        } else {
          transportSuitability = 'High-capacity cargo transit';
          suitabilityPoints = 18;
        }
      }

      // Recommendation algorithm score (out of 100)
      let score = 40;

      // 1. Availability score (up to 25 pts)
      if (v.available && v.currentTaskCount < v.maxTasks) {
        score += 25;
      } else if (v.currentTaskCount >= v.maxTasks) {
        score -= 20;
      }

      // 2. Current load factor (up to 15 pts)
      if (v.currentTaskCount === 0) {
        score += 15;
      } else if (v.currentTaskCount === 1) {
        score += 8;
      }

      // 3. Distance proximity score (up to 20 pts)
      if (distanceKm <= 2.0) {
        score += 20;
      } else if (distanceKm <= 4.0) {
        score += 14;
      } else if (distanceKm <= 7.0) {
        score += 8;
      } else {
        score += 2;
      }

      // 4. Rating & delivery track record (up to 10 pts)
      if (v.rating >= 4.9) score += 10;
      else if (v.rating >= 4.7) score += 7;
      else score += 4;

      // 5. Suitability points
      score += suitabilityPoints;

      // Clamp between 45 and 99
      const recommendationScore = Math.min(99, Math.max(45, Math.round(score)));

      let recommendationReason = 'Available verified volunteer';
      if (distanceKm <= 2.5 && v.currentTaskCount === 0) {
        recommendationReason = '⭐ Top Recommendation: Closest arrival & zero active load';
      } else if (v.currentTaskCount === 0) {
        recommendationReason = 'Zero active tasks with rapid availability';
      } else if (distanceKm <= 2.0) {
        recommendationReason = 'Fastest local arrival in Belagavi city center';
      }

      return {
        ...v,
        user,
        distanceKm,
        recommendationScore,
        transportSuitability,
        recommendationReason,
        isRecommended: recommendationScore >= 85,
      };
    });

    // Sort descending by recommendationScore
    volunteers.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      success: true,
      count: volunteers.length,
      volunteers,
    };
  },

  getTaskById: async (taskId: string) => {
    await delay(30);
    const store = getStore();
    const task = store.tasks.find((t) => t._id === taskId);
    if (!task) throw new Error('Task not found');

    const donation = store.donations.find((d) => d._id === task.donationId);
    const ngo = store.ngos.find((n) => n._id === task.ngoId);
    const vol = task.volunteerId
      ? store.volunteers.find((v) => v._id === task.volunteerId)
      : undefined;
    const volUser = vol ? store.users.find((u) => u._id === vol.userId) : undefined;

    return {
      success: true,
      task: {
        ...task,
        donation,
        ngo,
        volunteer: vol ? { ...vol, user: volUser } : undefined,
      },
    };
  },

  // Volunteers Operations
  getMyTasks: async () => {
    await delay();
    const store = getStore();
    const user = getActiveUser();
    const vol = store.volunteers.find((v) => v.userId === user._id) || store.volunteers[0];

    // Return tasks assigned to this volunteer or pending pickup tasks in the city
    const tasks = store.tasks
      .filter((t) => !t.volunteerId || t.volunteerId === vol._id)
      .map((t) => {
        const donation = store.donations.find((d) => d._id === t.donationId);
        const ngo = store.ngos.find((n) => n._id === t.ngoId);
        const taskVol = t.volunteerId ? store.volunteers.find((v) => v._id === t.volunteerId) : vol;
        const taskVolUser = taskVol ? store.users.find((u) => u._id === taskVol.userId) : user;

        return {
          ...t,
          donation,
          ngo,
          volunteer: taskVol ? { ...taskVol, user: taskVolUser } : undefined,
        };
      });

    return {
      success: true,
      count: tasks.length,
      tasks,
    };
  },

  acceptTask: async (taskId: string) => {
    await delay(40);
    const store = getStore();
    const user = getActiveUser();
    const vol = store.volunteers.find((v) => v.userId === user._id) || store.volunteers[0];

    const idx = store.tasks.findIndex((t) => t._id === taskId);
    if (idx === -1) throw new Error('Task not found');

    const task = store.tasks[idx];
    task.volunteerId = vol._id;
    task.status = 'ACCEPTED';
    task.acceptedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    const donIdx = store.donations.findIndex((d) => d._id === task.donationId);
    if (donIdx !== -1) {
      store.donations[donIdx].updatedAt = new Date().toISOString();
    }

    const ngo = store.ngos.find((n) => n._id === task.ngoId);
    if (ngo) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}`,
        recipientId: ngo.userId,
        title: 'Task Accepted by Volunteer',
        message: `${task.assignedVolunteerName || user.name || 'Volunteer'} has accepted the pickup task for ${task.pickupAddress}.`,
        type: 'TASK_ACCEPTED',
        referenceId: task._id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveStore(store);
    return { success: true, message: 'Pickup task accepted. You can now navigate to donor.', task };
  },

  declineTask: async (taskId: string, reason?: string) => {
    await delay(40);
    const store = getStore();
    const idx = store.tasks.findIndex((t) => t._id === taskId);
    if (idx === -1) throw new Error('Task not found');

    const task = store.tasks[idx];
    const prevVolId = task.volunteerId;
    const prevVolName = task.assignedVolunteerName;
    const declineReason = reason || 'Volunteer unavailable at this time';

    task.status = 'DECLINED';
    task.declinedAt = new Date().toISOString();
    task.declineReason = declineReason;
    task.updatedAt = new Date().toISOString();

    // Release volunteer load
    if (prevVolId) {
      const vol = store.volunteers.find((v) => v._id === prevVolId);
      if (vol) {
        vol.currentTaskCount = Math.max(0, (vol.currentTaskCount || 1) - 1);
        vol.available = true;
      }
    }

    // Revert donation status to PICKUP_ASSIGNMENT_PENDING
    const donIdx = store.donations.findIndex((d) => d._id === task.donationId);
    if (donIdx !== -1) {
      const don = store.donations[donIdx];
      don.status = 'PICKUP_ASSIGNMENT_PENDING';
      don.assignedVolunteerId = undefined;
      don.assignedVolunteerName = undefined;
      don.updatedAt = new Date().toISOString();
    }

    // Notify NGO that volunteer declined and reassignment is needed
    const ngo = store.ngos.find((n) => n._id === task.ngoId);
    if (ngo) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-declined`,
        recipientId: ngo.userId,
        title: 'Volunteer Declined Pickup - Reassignment Required',
        message: `${prevVolName || 'Assigned volunteer'} declined the pickup task. Reason: "${declineReason}". Please reassign to an available driver.`,
        type: 'TASK_DECLINED',
        referenceId: task._id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveStore(store);
    return {
      success: true,
      message: 'Task declined and returned to NGO dispatch queue for reassignment.',
      task,
    };
  },

  updateTaskStatus: async (taskId: string, status: any) => {
    await delay(50);
    const store = getStore();
    const idx = store.tasks.findIndex((t) => t._id === taskId);
    if (idx === -1) throw new Error('Task not found');

    const task = store.tasks[idx];
    task.status = status;
    const now = new Date().toISOString();
    task.updatedAt = now;

    if (status === 'PICKED_UP') {
      task.pickupTimestamp = now;
    } else if (status === 'DELIVERED') {
      task.deliveryTimestamp = now;
    }

    // Preserve lifecycle: ACTIVE -> MATCHED -> PICKUP ASSIGNED -> PICKED UP -> IN TRANSIT -> DELIVERED -> COMPLETED
    const donIdx = store.donations.findIndex((d) => d._id === task.donationId);
    let updatedDonation: Donation | undefined;

    if (donIdx !== -1) {
      if (status === 'PICKED_UP') store.donations[donIdx].status = 'PICKED_UP';
      else if (status === 'IN_TRANSIT') store.donations[donIdx].status = 'IN_TRANSIT';
      else if (status === 'DELIVERED' || status === 'PROOF_SUBMITTED') {
        store.donations[donIdx].status = 'DELIVERED';
      } else if (status === 'COMPLETED' || status === 'VERIFIED') {
        store.donations[donIdx].status = 'COMPLETED';
      }
      store.donations[donIdx].updatedAt = now;
      updatedDonation = store.donations[donIdx];
    }

    // Milestone notifications
    const ngo = store.ngos.find((n) => n._id === task.ngoId);
    if (ngo && status === 'PICKED_UP') {
      store.notifications.unshift({
        _id: `notif-${Date.now()}`,
        recipientId: ngo.userId,
        title: 'Food Picked Up by Volunteer',
        message: `${task.assignedVolunteerName || 'Volunteer'} has collected food from ${task.pickupAddress} and is en route.`,
        type: 'FOOD_PICKED_UP',
        referenceId: task._id,
        read: false,
        createdAt: now,
      });
    } else if (ngo && status === 'IN_TRANSIT') {
      store.notifications.unshift({
        _id: `notif-${Date.now()}`,
        recipientId: ngo.userId,
        title: 'Food In Transit',
        message: `${task.assignedVolunteerName || 'Volunteer'} is in transit to ${task.deliveryAddress}.`,
        type: 'IN_TRANSIT',
        referenceId: task._id,
        read: false,
        createdAt: now,
      });
    } else if (ngo && status === 'DELIVERED') {
      store.notifications.unshift({
        _id: `notif-${Date.now()}`,
        recipientId: ngo.userId,
        title: 'Food Delivered at Hub',
        message: `${task.assignedVolunteerName || 'Volunteer'} has arrived and unloaded food at ${task.deliveryAddress}.`,
        type: 'FOOD_DELIVERED',
        referenceId: task._id,
        read: false,
        createdAt: now,
      });
    }

    saveStore(store);

    return {
      success: true,
      task,
      donation: updatedDonation || ({} as any),
    };
  },

  submitProof: async (taskId: string, payload: { proofImageUrl: string; proofNotes: string }) => {
    await delay(60);
    const store = getStore();
    const idx = store.tasks.findIndex((t) => t._id === taskId);
    if (idx === -1) throw new Error('Task not found');

    store.tasks[idx].proofImageUrl = payload.proofImageUrl;
    store.tasks[idx].proofNotes = payload.proofNotes;
    store.tasks[idx].status = 'PROOF_SUBMITTED';
    store.tasks[idx].deliveryTimestamp = new Date().toISOString();
    store.tasks[idx].updatedAt = new Date().toISOString();

    const donIdx = store.donations.findIndex((d) => d._id === store.tasks[idx].donationId);
    if (donIdx !== -1) {
      store.donations[donIdx].status = 'DELIVERED';
    }

    // Notify NGO
    const ngo = store.ngos.find((n) => n._id === store.tasks[idx].ngoId);
    if (ngo) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}`,
        recipientId: ngo.userId,
        title: 'Delivery Proof Submitted',
        message: `Volunteer has uploaded delivery proof. Please review and verify.`,
        type: 'PROOF_SUBMITTED',
        referenceId: taskId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveStore(store);

    return {
      success: true,
      task: store.tasks[idx],
    };
  },

  verifyDelivery: async (taskId: string, payload?: { verificationNotes?: string }) => {
    await delay(60);
    const store = getStore();
    const user = getActiveUser();

    // Security Rule 1: Donor cannot approve delivery
    if (user.role === 'DONOR') {
      throw new Error('Access denied: Donors cannot verify delivery handovers.');
    }

    // Security Rule 2: Volunteer cannot approve their own delivery
    if (user.role === 'VOLUNTEER') {
      throw new Error('Access denied: Volunteers cannot verify their own delivery handovers.');
    }

    const taskIdx = store.tasks.findIndex((t) => t._id === taskId);
    if (taskIdx === -1) throw new Error('Delivery task not found in system.');
    const task = store.tasks[taskIdx];

    // Security Rule 3: Already completed delivery cannot be verified again
    if (task.status === 'COMPLETED' || task.status === 'VERIFIED') {
      throw new Error('A completed delivery cannot be verified again.');
    }

    const activeNgo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];

    // Security Rule 4: Only the NGO that accepted the donation can verify the delivery
    if (task.ngoId && task.ngoId !== activeNgo._id) {
      throw new Error('Only the NGO that accepted this donation match can verify and complete the delivery.');
    }

    const now = new Date().toISOString();
    const verificationNotes =
      payload?.verificationNotes?.trim() ||
      'Delivery handover inspected, temperature and portion count verified compliant.';

    // 1. Update Task
    task.status = 'COMPLETED';
    task.verifiedByNgo = true;
    task.verifiedAt = now;
    task.verifiedByUserId = user._id;
    task.verifiedByUserName = activeNgo.orgName;
    task.verificationNotes = verificationNotes;
    task.updatedAt = now;

    // 2. Update Donation
    const donIdx = store.donations.findIndex((d) => d._id === task.donationId);
    let donation: Donation | undefined;
    if (donIdx !== -1) {
      store.donations[donIdx].status = 'COMPLETED';
      store.donations[donIdx].verifiedAt = now;
      store.donations[donIdx].verifiedByNgoId = activeNgo._id;
      store.donations[donIdx].verificationNotes = verificationNotes;
      store.donations[donIdx].updatedAt = now;
      donation = store.donations[donIdx];
    }

    // 3. Close the volunteer task & update statistics
    let volUser: User | undefined;
    if (task.volunteerId) {
      const volIdx = store.volunteers.findIndex((v) => v._id === task.volunteerId);
      if (volIdx !== -1) {
        store.volunteers[volIdx].completedDeliveries =
          (store.volunteers[volIdx].completedDeliveries || 0) + 1;
        store.volunteers[volIdx].currentTaskCount = Math.max(
          0,
          (store.volunteers[volIdx].currentTaskCount || 1) - 1
        );
        store.volunteers[volIdx].available = true;
        volUser = store.users.find((u) => u._id === store.volunteers[volIdx].userId);
      }
    }

    // 4. Update NGO workload
    if (donation) {
      activeNgo.currentWorkloadKg = Math.max(
        0,
        (activeNgo.currentWorkloadKg || 0) - (donation.quantity || 10)
      );
    }

    // 5. Create Audit Trail Entry
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'DELIVERY_VERIFIED',
      userId: user._id,
      userName: activeNgo.orgName,
      userRole: 'NGO',
      details: `Delivery verified and completed by ${activeNgo.orgName} for "${
        donation?.foodName || 'Food'
      }" (${donation?.quantity || 0} ${donation?.unit || 'portions'}) from ${
        donation?.donorName || 'Donor'
      } delivered by ${task.assignedVolunteerName || 'Volunteer'}. Notes: ${verificationNotes}`,
      timestamp: now,
    });

    // 6. Notifications for Donor, Volunteer, and NGO
    if (donation?.donorId) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-donor`,
        recipientId: donation.donorId,
        title: 'Delivery Verified & Completed',
        message: 'Your food donation has been successfully delivered and verified by the NGO.',
        type: 'DELIVERY_COMPLETED',
        referenceId: donation._id,
        read: false,
        createdAt: now,
      });
    }

    if (volUser?._id) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-vol`,
        recipientId: volUser._id,
        title: 'Delivery Verified',
        message: 'Delivery verified successfully. Your task has been completed.',
        type: 'TASK_COMPLETED',
        referenceId: task._id,
        read: false,
        createdAt: now,
      });
    }

    store.notifications.unshift({
      _id: `notif-${Date.now()}-ngo`,
      recipientId: user._id,
      title: 'Delivery Verification Sign-off',
      message: 'Delivery verified and completed.',
      type: 'DELIVERY_VERIFIED',
      referenceId: task._id,
      read: false,
      createdAt: now,
    });

    saveStore(store);

    return {
      success: true,
      message: 'Delivery verified and completed successfully.',
      task,
      donation,
    };
  },

  rejectProof: async (taskId: string, payload: { rejectionReason: string }) => {
    await delay(60);
    const store = getStore();
    const user = getActiveUser();

    // Security Rule 1: Donor cannot review delivery proof
    if (user.role === 'DONOR') {
      throw new Error('Access denied: Donors cannot review delivery proof.');
    }

    // Security Rule 2: Volunteer cannot reject proof
    if (user.role === 'VOLUNTEER') {
      throw new Error('Access denied: Volunteers cannot reject delivery proof.');
    }

    // Rule: Rejection requires a reason
    const reason = payload?.rejectionReason?.trim();
    if (!reason) {
      throw new Error('Rejection requires a reason explaining why the proof was not approved.');
    }

    const taskIdx = store.tasks.findIndex((t) => t._id === taskId);
    if (taskIdx === -1) throw new Error('Delivery task not found in system.');
    const task = store.tasks[taskIdx];

    if (task.status === 'COMPLETED') {
      throw new Error('Cannot reject proof for an already completed delivery.');
    }

    const activeNgo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];

    // Rule: Only the NGO that accepted the donation can reject proof
    if (task.ngoId && task.ngoId !== activeNgo._id) {
      throw new Error('Only the NGO that accepted this donation match can review its delivery proof.');
    }

    const now = new Date().toISOString();

    // Change task status to PROOF_REJECTED
    task.status = 'PROOF_REJECTED';
    task.proofRejectionReason = reason;
    task.proofRejectedAt = now;
    task.updatedAt = now;

    const donation = store.donations.find((d) => d._id === task.donationId);

    // Keep volunteer assigned & task open for resubmission
    let volUser: User | undefined;
    if (task.volunteerId) {
      const vol = store.volunteers.find((v) => v._id === task.volunteerId);
      if (vol) {
        volUser = store.users.find((u) => u._id === vol.userId);
      }
    }

    // Record rejection in the audit trail
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'DELIVERY_PROOF_REJECTED',
      userId: user._id,
      userName: activeNgo.orgName,
      userRole: 'NGO',
      details: `Delivery proof rejected by ${activeNgo.orgName} for "${
        donation?.foodName || 'Food'
      }". Reason: "${reason}". Task kept open for volunteer resubmission.`,
      timestamp: now,
    });

    // Notify the assigned volunteer
    if (volUser?._id) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-vol-reject`,
        recipientId: volUser._id,
        title: 'Delivery Proof Rejected - Resubmission Required',
        message: `The NGO requested resubmission of delivery proof for ${
          donation?.foodName || 'the food batch'
        }. Reason: "${reason}". Please take a clearer photo and resubmit.`,
        type: 'PROOF_REJECTED',
        referenceId: task._id,
        read: false,
        createdAt: now,
      });
    }

    // Notify NGO
    store.notifications.unshift({
      _id: `notif-${Date.now()}-ngo-reject`,
      recipientId: user._id,
      title: 'Delivery Proof Rejected',
      message: `Proof rejected for ${donation?.foodName || 'delivery task'}. Volunteer has been prompted to resubmit.`,
      type: 'PROOF_REJECTED',
      referenceId: task._id,
      read: false,
      createdAt: now,
    });

    saveStore(store);

    return {
      success: true,
      message: 'Delivery proof rejected. Volunteer has been notified to resubmit.',
      task,
    };
  },

  verifyProof: async (taskId: string, payload?: { verificationNotes?: string }) => {
    return demoService.verifyDelivery(taskId, payload);
  },

  // Emergency SOS (15 KM Radius)
  createEmergencySOS: async (payload: any) => {
    await delay(60);
    const store = getStore();
    const user = getActiveUser();

    const newAlert: EmergencyAlert = {
      _id: `sos-${Date.now()}`,
      reportedBy: user._id,
      reporterName: user.name,
      reporterPhone: user.phone,
      foodType: payload.foodType || 'Prepared Meals',
      category: payload.category || 'Prepared Meals',
      quantityNeeded: payload.quantityNeeded || '50 Meals',
      address: payload.address || 'Belagavi',
      latitude: payload.latitude || 15.85,
      longitude: payload.longitude || 74.5,
      urgencyReason: payload.urgencyReason || 'Immediate relief needed',
      expiresAt: new Date(Date.now() + (payload.durationHours || 4) * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    store.emergencyAlerts.unshift(newAlert);

    // Calculate NGOs within 15 km
    let notifiedNgos = 0;
    store.ngos.forEach((ngo) => {
      const dist = haversineDistanceKm(newAlert.latitude, newAlert.longitude, ngo.latitude, ngo.longitude);
      if (dist <= 15) {
        notifiedNgos++;
        store.notifications.unshift({
          _id: `notif-${Date.now()}-${notifiedNgos}`,
          recipientId: ngo.userId,
          title: 'EMERGENCY FOOD SOS (15 KM)',
          message: `Urgent requirement at ${newAlert.address} (${dist} km away): ${newAlert.quantityNeeded}.`,
          type: 'EMERGENCY_ALERT',
          referenceId: newAlert._id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    saveStore(store);

    return {
      success: true,
      alert: newAlert,
      notifiedNgos: Math.max(1, notifiedNgos),
      radiusKm: 15,
    };
  },

  getEmergencyAlerts: async () => {
    await delay();
    const store = getStore();
    return {
      success: true,
      count: store.emergencyAlerts.length,
      alerts: store.emergencyAlerts,
    };
  },

  respondToEmergency: async (
    id: string,
    payload?: string | { responseNote?: string; reliefType?: string; reliefQuantity?: string }
  ) => {
    await delay(50);
    const store = getStore();
    const idx = store.emergencyAlerts.findIndex((a) => a._id === id);
    if (idx === -1) throw new Error('Emergency alert not found');

    const user = getActiveUser();
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw new Error('Access denied: Only verified NGOs can officially respond to emergency food incidents.');
    }

    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];
    const now = new Date().toISOString();

    const note = typeof payload === 'string' ? payload : payload?.responseNote || 'Dispatched field support.';
    const reliefType = typeof payload === 'object' ? payload?.reliefType : undefined;
    const reliefQuantity = typeof payload === 'object' ? payload?.reliefQuantity : undefined;

    const alert = store.emergencyAlerts[idx];
    alert.status = 'RESPONDED';
    alert.respondedByNgoId = ngo._id;
    alert.respondedByNgoName = ngo.orgName;
    alert.responseNote = note;
    alert.respondedAt = now;
    alert.reliefType = reliefType || 'Prepared Cooked Meals & Water';
    alert.reliefQuantity = reliefQuantity || alert.quantityNeeded;
    alert.updatedAt = now;

    // Audit log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'EMERGENCY_RESPONDED',
      userId: user._id,
      userName: ngo.orgName,
      userRole: 'NGO',
      details: `Emergency SOS responded by ${ngo.orgName} at ${alert.address}. Note: ${note}`,
      timestamp: now,
    });

    // Notify reporter
    if (alert.reportedBy) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-sos-rep`,
        recipientId: alert.reportedBy,
        title: 'Emergency SOS Responded',
        message: `${ngo.orgName} has responded to your emergency distress call: "${note}". Relief is being organized.`,
        type: 'EMERGENCY_RESPONDED',
        referenceId: alert._id,
        read: false,
        createdAt: now,
      });
    }

    saveStore(store);

    return {
      success: true,
      alert,
    };
  },

  startEmergencyDispatch: async (
    id: string,
    payload: {
      reliefQuantity: string;
      reliefType: string;
      assignedVolunteerId?: string;
      assignedVolunteerName: string;
      volunteerPhone?: string;
      vehicleType?: string;
      vehicleNumber?: string;
      dispatchNote?: string;
    }
  ) => {
    await delay(50);
    const store = getStore();
    const idx = store.emergencyAlerts.findIndex((a) => a._id === id);
    if (idx === -1) throw new Error('Emergency alert not found in system.');

    const user = getActiveUser();
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw new Error('Access denied: Only authorized NGOs can dispatch relief operations.');
    }

    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];
    const alert = store.emergencyAlerts[idx];

    if (alert.status !== 'RESPONDED' && alert.status !== 'ACTIVE' && alert.status !== 'PROOF_REJECTED') {
      throw new Error(`Cannot start dispatch for incident with status "${alert.status}". Must be RESPONDED.`);
    }

    const now = new Date().toISOString();

    alert.status = 'DISPATCHED';
    alert.dispatchedAt = now;
    alert.reliefQuantity = payload.reliefQuantity;
    alert.reliefType = payload.reliefType;
    alert.assignedVolunteerId = payload.assignedVolunteerId || 'vol-1';
    alert.assignedVolunteerName = payload.assignedVolunteerName;
    alert.volunteerPhone = payload.volunteerPhone || '+91 94481 99012';
    alert.vehicleType = payload.vehicleType || 'Relief Vehicle';
    alert.vehicleNumber = payload.vehicleNumber || 'KA-22-EM-1080';
    alert.dispatchNote = payload.dispatchNote || 'Emergency relief team en route.';
    alert.updatedAt = now;

    // Audit log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'EMERGENCY_DISPATCHED',
      userId: user._id,
      userName: ngo.orgName,
      userRole: 'NGO',
      details: `Emergency relief dispatched by ${ngo.orgName} to ${alert.address}. Relief: ${payload.reliefQuantity} (${payload.reliefType}). Driver/Volunteer: ${payload.assignedVolunteerName} (${alert.vehicleType}). Note: ${payload.dispatchNote}`,
      timestamp: now,
    });

    // Notify reporter
    if (alert.reportedBy) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-rep-disp`,
        recipientId: alert.reportedBy,
        title: 'Emergency Relief Dispatched',
        message: `${ngo.orgName} dispatched ${payload.assignedVolunteerName} with ${payload.reliefQuantity} (${payload.reliefType}) to ${alert.address}.`,
        type: 'EMERGENCY_DISPATCHED',
        referenceId: alert._id,
        read: false,
        createdAt: now,
      });
    }

    // Notify assigned volunteer
    if (payload.assignedVolunteerId) {
      const vol = store.volunteers.find((v) => v._id === payload.assignedVolunteerId);
      if (vol) {
        store.notifications.unshift({
          _id: `notif-${Date.now()}-vol-disp`,
          recipientId: vol.userId,
          title: '🚨 Emergency SOS Task Dispatched',
          message: `You are assigned to deliver ${payload.reliefQuantity} emergency relief to ${alert.address}. Contact: ${alert.reporterPhone}.`,
          type: 'EMERGENCY_DISPATCH_ASSIGNED',
          referenceId: alert._id,
          read: false,
          createdAt: now,
        });
      }
    }

    // Notify NGO
    store.notifications.unshift({
      _id: `notif-${Date.now()}-ngo-disp`,
      recipientId: user._id,
      title: 'Emergency Dispatch Active',
      message: `Emergency dispatch started for ${alert.address} with driver ${payload.assignedVolunteerName}.`,
      type: 'EMERGENCY_DISPATCH_CONFIRMED',
      referenceId: alert._id,
      read: false,
      createdAt: now,
    });

    saveStore(store);

    return {
      success: true,
      message: 'Emergency relief dispatch active.',
      alert,
    };
  },

  markEmergencyInProgress: async (id: string) => {
    await delay(50);
    const store = getStore();
    const idx = store.emergencyAlerts.findIndex((a) => a._id === id);
    if (idx === -1) throw new Error('Emergency alert not found.');

    const alert = store.emergencyAlerts[idx];
    if (alert.status !== 'DISPATCHED' && alert.status !== 'PROOF_REJECTED') {
      throw new Error(`Cannot transition to IN_PROGRESS from status "${alert.status}".`);
    }

    const user = getActiveUser();
    const now = new Date().toISOString();

    alert.status = 'IN_PROGRESS';
    alert.inProgressAt = now;
    alert.updatedAt = now;

    // Audit log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'EMERGENCY_IN_PROGRESS',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      details: `Emergency relief operation marked IN PROGRESS at ${alert.address} by ${alert.assignedVolunteerName || user.name}.`,
      timestamp: now,
    });

    // Notify reporter
    if (alert.reportedBy) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-prog`,
        recipientId: alert.reportedBy,
        title: 'Relief Team Arriving',
        message: `Emergency relief team is actively on site / approaching ${alert.address}.`,
        type: 'EMERGENCY_IN_PROGRESS',
        referenceId: alert._id,
        read: false,
        createdAt: now,
      });
    }

    saveStore(store);

    return {
      success: true,
      message: 'Emergency relief status updated to IN_PROGRESS.',
      alert,
    };
  },

  submitEmergencyReliefDelivery: async (
    id: string,
    payload: {
      deliveredQuantity: string;
      deliveryNotes: string;
      recipientNotes?: string;
      proofPhotoUrl?: string;
      deliveryTimestamp?: string;
    }
  ) => {
    await delay(60);
    const store = getStore();
    const idx = store.emergencyAlerts.findIndex((a) => a._id === id);
    if (idx === -1) throw new Error('Emergency alert not found.');

    const alert = store.emergencyAlerts[idx];
    const user = getActiveUser();
    const now = new Date().toISOString();

    alert.status = 'DELIVERED';
    alert.deliveredAt = payload.deliveryTimestamp || now;
    alert.deliveredQuantity = payload.deliveredQuantity || alert.reliefQuantity || alert.quantityNeeded;
    alert.deliveryNotes = payload.deliveryNotes;
    alert.recipientNotes = payload.recipientNotes || 'Handover received on site.';
    alert.proofPhotoUrl =
      payload.proofPhotoUrl ||
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60';
    alert.proofSubmittedAt = now;
    alert.updatedAt = now;

    // Audit log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'EMERGENCY_RELIEF_DELIVERED',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      details: `Emergency relief delivered at ${alert.address}. Quantity: ${alert.deliveredQuantity}. Notes: ${payload.deliveryNotes}. Awaiting NGO verification.`,
      timestamp: now,
    });

    // Notify responding NGO
    if (alert.respondedByNgoId) {
      const ngo = store.ngos.find((n) => n._id === alert.respondedByNgoId);
      if (ngo) {
        store.notifications.unshift({
          _id: `notif-${Date.now()}-ngo-verify-sos`,
          recipientId: ngo.userId,
          title: '🚨 Emergency Relief Awaiting Verification',
          message: `Delivery proof submitted for emergency SOS at ${alert.address} (${alert.deliveredQuantity}). Please inspect and sign off.`,
          type: 'EMERGENCY_DELIVERY_SUBMITTED',
          referenceId: alert._id,
          read: false,
          createdAt: now,
        });
      }
    }

    // Notify reporter
    if (alert.reportedBy) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-rep-del`,
        recipientId: alert.reportedBy,
        title: 'Emergency Relief Handover Completed',
        message: `Relief delivery has been completed on site (${alert.deliveredQuantity}). NGO verification underway.`,
        type: 'EMERGENCY_DELIVERED',
        referenceId: alert._id,
        read: false,
        createdAt: now,
      });
    }

    saveStore(store);

    return {
      success: true,
      message: 'Relief delivery proof submitted. Awaiting NGO verification sign-off.',
      alert,
    };
  },

  verifyAndCloseEmergency: async (
    id: string,
    payload?: { verificationNotes?: string }
  ) => {
    await delay(60);
    const store = getStore();
    const idx = store.emergencyAlerts.findIndex((a) => a._id === id);
    if (idx === -1) throw new Error('Emergency alert not found in system.');

    const user = getActiveUser();
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw new Error('Access denied: Only an authorized NGO can verify and close emergency SOS incidents.');
    }

    const alert = store.emergencyAlerts[idx];
    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];

    // Security check: Only responding NGO can verify
    if (alert.respondedByNgoId && alert.respondedByNgoId !== ngo._id && user.role !== 'ADMIN') {
      throw new Error('Only the NGO that responded and dispatched this emergency relief can sign off and close it.');
    }

    const now = new Date().toISOString();
    const notes =
      payload?.verificationNotes?.trim() ||
      'Emergency relief handover inspected and verified compliant. All distress requirements resolved.';

    alert.status = 'CLOSED';
    alert.verifiedAt = now;
    alert.closedAt = now;
    alert.verifiedByUserId = user._id;
    alert.verifiedByUserName = ngo.orgName;
    alert.verificationNotes = notes;
    alert.updatedAt = now;

    // Audit log permanent event
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'EMERGENCY_VERIFIED_AND_CLOSED',
      userId: user._id,
      userName: ngo.orgName,
      userRole: 'NGO',
      details: `Emergency SOS verified & CLOSED by ${ngo.orgName} at ${alert.address}. Relief: ${alert.deliveredQuantity || alert.reliefQuantity || alert.quantityNeeded}. Notes: ${notes}`,
      timestamp: now,
    });

    // Notify reporter
    if (alert.reportedBy) {
      store.notifications.unshift({
        _id: `notif-${Date.now()}-rep-closed`,
        recipientId: alert.reportedBy,
        title: 'Emergency SOS Resolved & Closed',
        message: `Your emergency distress alert at ${alert.address} was verified and officially closed by ${ngo.orgName}. Thank you for alerting the community!`,
        type: 'EMERGENCY_CLOSED',
        referenceId: alert._id,
        read: false,
        createdAt: now,
      });
    }

    // Notify responding NGO
    store.notifications.unshift({
      _id: `notif-${Date.now()}-ngo-closed`,
      recipientId: user._id,
      title: 'Emergency SOS Successfully Closed',
      message: `Emergency SOS at ${alert.address} has been verified and permanently closed in emergency history.`,
      type: 'EMERGENCY_CLOSED_CONFIRMED',
      referenceId: alert._id,
      read: false,
      createdAt: now,
    });

    saveStore(store);

    return {
      success: true,
      message: 'Emergency relief verified and closed successfully.',
      alert,
    };
  },

  rejectEmergencyProof: async (
    id: string,
    payload: { rejectionReason: string }
  ) => {
    await delay(60);
    const store = getStore();
    const idx = store.emergencyAlerts.findIndex((a) => a._id === id);
    if (idx === -1) throw new Error('Emergency alert not found.');

    const user = getActiveUser();
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw new Error('Access denied: Only authorized NGOs can review or reject relief delivery proof.');
    }

    const reason = payload?.rejectionReason?.trim();
    if (!reason) {
      throw new Error('Rejection requires a reason explaining why the proof was not approved.');
    }

    const alert = store.emergencyAlerts[idx];
    const ngo = store.ngos.find((n) => n.userId === user._id) || store.ngos[0];
    const now = new Date().toISOString();

    alert.status = 'PROOF_REJECTED';
    alert.proofRejectionReason = reason;
    alert.proofRejectedAt = now;
    alert.updatedAt = now;

    // Audit log
    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'EMERGENCY_PROOF_REJECTED',
      userId: user._id,
      userName: ngo.orgName,
      userRole: 'NGO',
      details: `Emergency relief proof rejected by ${ngo.orgName} for incident at ${alert.address}. Reason: "${reason}". Kept open for resubmission.`,
      timestamp: now,
    });

    // Notify volunteer
    if (alert.assignedVolunteerId) {
      const vol = store.volunteers.find((v) => v._id === alert.assignedVolunteerId);
      if (vol) {
        store.notifications.unshift({
          _id: `notif-${Date.now()}-vol-sos-reject`,
          recipientId: vol.userId,
          title: 'Emergency Relief Proof Rejected - Action Required',
          message: `The NGO requested resubmission for emergency relief at ${alert.address}. Reason: "${reason}". Please resubmit valid proof.`,
          type: 'EMERGENCY_PROOF_REJECTED',
          referenceId: alert._id,
          read: false,
          createdAt: now,
        });
      }
    }

    // Notify NGO
    store.notifications.unshift({
      _id: `notif-${Date.now()}-ngo-sos-reject`,
      recipientId: user._id,
      title: 'Emergency Proof Rejected',
      message: `Proof rejected for incident at ${alert.address}. Resubmission requested.`,
      type: 'EMERGENCY_PROOF_REJECTED',
      referenceId: alert._id,
      read: false,
      createdAt: now,
    });

    saveStore(store);

    return {
      success: true,
      message: 'Proof rejected. Dispatch team has been notified to resubmit.',
      alert,
    };
  },

  getEmergencyAlertById: async (id: string) => {
    await delay(30);
    const store = getStore();
    const alert = store.emergencyAlerts.find((a) => a._id === id);
    if (!alert) throw new Error('Emergency alert not found.');
    return {
      success: true,
      alert,
    };
  },

  // Hunger Spotting (48-Hour Retention)
  createHungerReport: async (payload: any) => {
    await delay(60);
    const store = getStore();
    const user = getActiveUser();

    const newReport: HungerReport = {
      _id: `hunger-${Date.now()}`,
      reportedBy: user._id,
      reporterName: user.name,
      address: payload.address,
      latitude: payload.latitude || 15.85,
      longitude: payload.longitude || 74.5,
      description: payload.description,
      photoUrl: payload.photoUrl || '',
      approximatePeople: Number(payload.approximatePeople) || 5,
      urgency: payload.urgency || 'MEDIUM',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    store.hungerReports.unshift(newReport);

    saveStore(store);

    return {
      success: true,
      message: 'Hunger spot registered with 48-hour sensitive retention policy.',
      report: newReport,
    };
  },

  getHungerReports: async () => {
    await delay();
    const store = getStore();
    return {
      success: true,
      count: store.hungerReports.length,
      reports: store.hungerReports,
    };
  },

  verifyHungerReport: async (id: string, payload: { status: string; verificationNotes?: string }) => {
    await delay(50);
    const store = getStore();
    const idx = store.hungerReports.findIndex((r) => r._id === id);
    if (idx === -1) throw new Error('Hunger report not found');

    store.hungerReports[idx].status = payload.status as any;
    store.hungerReports[idx].verificationNotes = payload.verificationNotes;

    saveStore(store);

    return {
      success: true,
      report: store.hungerReports[idx],
    };
  },

  // AI Expiry Guidance Engine (Belagavi Climate Algorithmic Model)
  estimateShelfLife: async (payload: any) => {
    await delay(80);
    const category = (payload.category || '').toLowerCase();
    const storage = (payload.storageCondition || '').toLowerCase();

    let baseHours = 4;
    let riskLevel = 'LOW';
    const guidance: string[] = [];

    if (category.includes('prepared') || category.includes('meal') || category.includes('rice')) {
      if (storage.includes('warm') || storage.includes('60') || storage.includes('thermal')) {
        baseHours = 5;
        riskLevel = 'LOW';
        guidance.push('Thermal insulation maintains bacterial inhibition (>60°C).');
      } else if (storage.includes('refrigerat') || storage.includes('chilled')) {
        baseHours = 18;
        riskLevel = 'LOW';
        guidance.push('Refrigerated cold-chain safe for same-day evening distribution.');
      } else {
        baseHours = 3.5;
        riskLevel = 'MEDIUM';
        guidance.push('Ambient Belagavi temperatures require rapid consumption within 3.5 hours.');
      }
    } else if (category.includes('bakery') || category.includes('bread')) {
      baseHours = 20;
      riskLevel = 'LOW';
      guidance.push('Keep sealed from moisture and direct sunlight.');
    } else if (category.includes('dairy') || category.includes('milk') || category.includes('sweet')) {
      baseHours = storage.includes('chill') ? 12 : 3;
      riskLevel = storage.includes('chill') ? 'LOW' : 'HIGH';
      guidance.push('High-protein dairy undergoes rapid spoilage; verify smell and texture prior to serving.');
    } else if (category.includes('produce')) {
      baseHours = 36;
      riskLevel = 'LOW';
      guidance.push('Ensure ventilated crates; rinse before cooking.');
    } else {
      baseHours = 48;
      riskLevel = 'LOW';
      guidance.push('Dry goods: keep away from humidity.');
    }

    return {
      success: true,
      prediction: {
        estimatedSafeHours: baseHours,
        riskLevel,
        safetyGuidance: guidance,
      },
      aiEnrichedInsights: `Belagavi climate adjustment: Standard daytime ambient ~28°C. ${guidance.join(' ')}`,
      disclaimer: 'AI guidance model provides heuristic shelf-life estimates only. Food donors and distribution teams must perform sensory, visual, and temperature verification before serving to community members.',
    };
  },

  // Notifications
  getNotifications: async () => {
    await delay();
    const store = getStore();
    const user = getActiveUser();
    const list = store.notifications.filter((n) => n.recipientId === user._id || !n.recipientId);
    const unreadCount = list.filter((n) => !n.read).length;

    return {
      success: true,
      count: list.length,
      unreadCount,
      notifications: list,
    };
  },

  markNotificationRead: async (id: string) => {
    await delay(30);
    const store = getStore();
    const idx = store.notifications.findIndex((n) => n._id === id);
    if (idx !== -1) {
      store.notifications[idx].read = true;
      saveStore(store);
    }
    return { success: true };
  },

  markAllNotificationsRead: async () => {
    await delay(30);
    const store = getStore();
    const user = getActiveUser();
    store.notifications.forEach((n) => {
      if (n.recipientId === user._id || !n.recipientId) {
        n.read = true;
      }
    });
    saveStore(store);
    return { success: true };
  },

  // Administrator Operations
  getAdminStats: async () => {
    await delay();
    const store = getStore();

    const totalUsers = store.users.length;
    const totalDonors = store.users.filter((u) => u.role === 'DONOR').length;
    const totalNGOs = store.ngos.length;
    const verifiedNGOs = store.ngos.filter((n) => n.verified).length;
    const totalVolunteers = store.volunteers.length;
    const totalDonations = store.donations.length;
    const completedDonations = store.donations.filter((d) => d.status === 'COMPLETED').length;
    const activeEmergencies = store.emergencyAlerts.filter((a) => a.status === 'ACTIVE').length;
    const pendingHungerReports = store.hungerReports.filter((h) => h.status === 'PENDING').length;

    return {
      success: true,
      stats: {
        totalUsers,
        totalDonors,
        totalNGOs,
        verifiedNGOs,
        totalVolunteers,
        totalDonations,
        completedDonations,
        activeEmergencies,
        pendingHungerReports,
        matchingRadiusKm: store.systemSettings.matchingRadiusKm,
        emergencyRadiusKm: store.systemSettings.emergencyRadiusKm,
      },
    };
  },

  getAdminUsers: async (params?: { role?: string; status?: string; search?: string }) => {
    await delay();
    const store = getStore();
    let list = [...store.users];

    if (params?.role && params.role !== 'ALL') {
      list = list.filter((u) => u.role === params.role);
    }
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((u) => u.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.phone.includes(s)
      );
    }

    return {
      success: true,
      count: list.length,
      users: list,
    };
  },

  updateUserStatus: async (id: string, status: string, reason?: string) => {
    await delay(50);
    const store = getStore();
    const idx = store.users.findIndex((u) => u._id === id);
    if (idx === -1) throw new Error('User not found');

    store.users[idx].status = status as any;

    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'USER_STATUS_UPDATED',
      userId: 'user-admin-1',
      userName: 'Belagavi Administration Hub',
      userRole: 'ADMIN',
      details: `User ${store.users[idx].name} (${store.users[idx].email}) status changed to ${status}. Reason: ${reason || 'Admin action'}`,
      timestamp: new Date().toISOString(),
    });

    saveStore(store);

    return {
      success: true,
      user: store.users[idx],
    };
  },

  getAdminNGOs: async () => {
    await delay();
    const store = getStore();
    return {
      success: true,
      ngos: store.ngos,
    };
  },

  verifyNGO: async (id: string, verified: boolean, rejectionReason?: string) => {
    await delay(60);
    const store = getStore();
    const idx = store.ngos.findIndex((n) => n._id === id);
    if (idx === -1) throw new Error('NGO not found');

    store.ngos[idx].verified = verified;
    if (verified) {
      store.ngos[idx].verifiedAt = new Date().toISOString();
      store.ngos[idx].verifiedBy = 'user-admin-1';
      store.ngos[idx].rejectionReason = undefined;
    } else {
      store.ngos[idx].rejectionReason = rejectionReason || 'Documentation did not meet criteria';
    }

    // Update associated user status
    const uIdx = store.users.findIndex((u) => u._id === store.ngos[idx].userId);
    if (uIdx !== -1) {
      store.users[uIdx].status = verified ? 'ACTIVE' : 'REJECTED';
    }

    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: verified ? 'NGO_VERIFIED' : 'NGO_REJECTED',
      userId: 'user-admin-1',
      userName: 'Belagavi Administration Hub',
      userRole: 'ADMIN',
      details: `${store.ngos[idx].orgName} ${verified ? 'verified and approved' : 'rejected'}.`,
      timestamp: new Date().toISOString(),
    });

    saveStore(store);

    return {
      success: true,
      ngo: store.ngos[idx],
    };
  },

  getAuditLogs: async () => {
    await delay();
    const store = getStore();
    return {
      success: true,
      count: store.auditLogs.length,
      logs: store.auditLogs,
    };
  },

  getSystemSettings: async () => {
    await delay();
    const store = getStore();
    return {
      success: true,
      settings: store.systemSettings,
    };
  },

  updateSystemSettings: async (newSettings: Partial<SystemSettings>) => {
    await delay(50);
    const store = getStore();
    store.systemSettings = {
      ...store.systemSettings,
      ...newSettings,
    };

    store.auditLogs.unshift({
      _id: `audit-${Date.now()}`,
      action: 'SETTINGS_UPDATED',
      userId: 'user-admin-1',
      userName: 'Belagavi Administration Hub',
      userRole: 'ADMIN',
      details: `Updated parameters: Matching radius = ${store.systemSettings.matchingRadiusKm} km, Emergency radius = ${store.systemSettings.emergencyRadiusKm} km.`,
      timestamp: new Date().toISOString(),
    });

    saveStore(store);

    return {
      success: true,
      settings: store.systemSettings,
    };
  },
};
