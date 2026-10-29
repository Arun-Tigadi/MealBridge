import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { store } from '../data/store.ts';
import { generateToken, AuthRequest } from '../middleware/auth.ts';
import { logAudit } from '../services/auditService.ts';
import { emailService } from '../services/emailService.ts';
import { smsService } from '../services/smsService.ts';
import { UserRole, IUser } from '../models/types.ts';

// Email regex pattern (RFC 5322 compliant simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Phone number regex pattern (supports Indian +91 and international formats, min 10 digits)
const PHONE_REGEX = /^\+?[0-9\s\-().]{10,20}$/;

/**
 * Helper to generate cryptographically secure 6-digit OTP
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * 1. REGISTRATION
 * Collects name, email, phone (mobile), password, confirmPassword, and role.
 * Validates inputs, blocks ADMIN self-registration, prevents duplicate accounts,
 * creates user in PENDING unverified state, and hashes/dispatches 6-digit OTP.
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      address,
      latitude,
      longitude,
      orgName,
      registrationNumber,
      dailyCapacityKg,
      transportType,
      vehicleNumber,
    } = req.body;

    // 1. Validate mandatory fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, error: 'Full name is required (minimum 2 characters).' });
      return;
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }

    if (!phone || typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim()) || phone.replace(/\D/g, '').length < 10) {
      res.status(400).json({ success: false, error: 'A valid 10-digit mobile number is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
      });
      return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'Password and confirmation password do not match.',
      });
      return;
    }

    // 2. Strict Role Safety: ADMIN must NEVER be self-registered
    if (role === 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Administrator accounts cannot be self-registered. Municipal administrative privileges require direct authorization from Belagavi oversight officials.',
      });
      return;
    }

    const requestedRole: UserRole = ['DONOR', 'NGO', 'VOLUNTEER', 'PUBLIC'].includes(role)
      ? (role as UserRole)
      : 'DONOR';

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    // 3. Duplicate Account Prevention
    const existingEmail = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingEmail) {
      res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in or reset your password.',
      });
      return;
    }

    const existingPhone = store.users.find(
      (u) => u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );
    if (existingPhone) {
      res.status(400).json({
        success: false,
        error: 'An account with this mobile phone number already exists.',
      });
      return;
    }

    // 4. Secure Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Generate cryptographically secure 6-digit OTP & 5-minute expiry
    const otp = generateSecureOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 6. Create User in PENDING unverified state (Do not activate before OTP verification)
    const newUser: IUser = {
      _id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: requestedRole,
      status: 'PENDING',
      emailVerified: false,
      phoneVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: otpExpiresAt,
      emailOtpAttempts: 0,
      emailOtpLastSentAt: new Date().toISOString(),
      address: address || 'Belagavi, Karnataka, India',
      city: 'Belagavi',
      region: 'Karnataka, India',
      latitude: latitude ? Number(latitude) : 15.8497,
      longitude: longitude ? Number(longitude) : 74.4977,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    // If NGO role, create linked NGO profile with verified = false
    if (requestedRole === 'NGO') {
      const newNGO = {
        _id: `ngo-${Date.now()}`,
        userId: newUser._id,
        orgName: orgName || name,
        registrationNumber: registrationNumber || `KA-BEL-${Date.now()}`,
        contactPerson: name,
        phone: cleanPhone,
        email: newUser.email,
        serviceRadiusKm: 10,
        serviceAreas: ['Belagavi Central', 'Camp', 'Tilakwadi', 'Shahapur'],
        categoriesAccepted: ['Prepared Meals', 'Fresh Produce', 'Packaged Foods'],
        dailyCapacityKg: dailyCapacityKg ? Number(dailyCapacityKg) : 200,
        currentWorkloadKg: 0,
        verified: false, // Requires Admin verification before operating
        address: address || 'Belagavi, Karnataka',
        latitude: latitude ? Number(latitude) : 15.8497,
        longitude: longitude ? Number(longitude) : 74.4977,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.ngos.push(newNGO);
    }

    // If VOLUNTEER role, create linked volunteer profile
    if (requestedRole === 'VOLUNTEER') {
      const newVolunteer = {
        _id: `vol-${Date.now()}`,
        userId: newUser._id,
        transportType: transportType || 'TWO_WHEELER',
        vehicleNumber: vehicleNumber || 'KA-22-REG',
        available: true,
        currentTaskCount: 0,
        maxTasks: 3,
        verified: true,
        completedDeliveries: 0,
        rating: 5.0,
        latitude: latitude ? Number(latitude) : 15.8497,
        longitude: longitude ? Number(longitude) : 74.4977,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.volunteers.push(newVolunteer);
    }

    logAudit({
      action: 'USER_REGISTERED',
      userId: newUser._id,
      userName: newUser.name,
      userRole: newUser.role,
      details: `User registered with role ${newUser.role}. Awaiting OTP email verification.`,
      ipAddress: req.ip,
    });

    // 7. Dispatch Email OTP via configured email delivery provider
    const emailResult = await emailService.sendVerificationOtp(newUser.email, otp, newUser.name);

    // Mobile SMS OTP interface check
    const smsConfigured = smsService.isConfigured();

    // Prepare response
    // Strict compliance: Never pretend an email was sent if provider is unconfigured or failed.
    res.status(201).json({
      success: true,
      message: emailResult.delivered
        ? 'Account registered successfully. A 6-digit verification code has been dispatched to your email.'
        : emailResult.error
        ? `Account created in PENDING verification state, but email provider delivery failed: ${emailResult.error}`
        : 'Account created in PENDING verification state. Email delivery service is not configured on this server.',
      emailDeliveryConfigured: emailResult.configured,
      emailDelivered: emailResult.delivered,
      provider: emailResult.provider,
      providerError: emailResult.error,
      dependencyNotice: emailResult.error
        ? `Email provider (${emailResult.provider}) error: ${emailResult.error}`
        : emailResult.dependencyNotice,
      smsConfigured,
      requiresVerification: true,
      email: newUser.email,
      // For automated development test suite execution ONLY (never present in production)
      _devTestOtp: process.env.NODE_ENV === 'test' ? otp : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error during registration.' });
  }
}

/**
 * 2. VERIFY EMAIL OTP
 * Validates 6-digit OTP against bcrypt hash, checks 5-minute expiry,
 * limits attempts, invalidates OTP upon success, and activates account.
 */
export async function verifyEmailOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, error: 'Email and 6-digit verification code are required.' });
      return;
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      res.status(400).json({ success: false, error: 'Verification code must be a 6-digit number.' });
      return;
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      res.status(400).json({ success: false, error: 'Invalid verification request.' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        error: 'This account has already verified email. Please proceed to sign in.',
      });
      return;
    }

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      res.status(400).json({
        success: false,
        error: 'No active OTP verification code found. Please request a new code.',
      });
      return;
    }

    // Check expiration (5 minutes)
    const expiresAt = new Date(user.emailOtpExpiresAt).getTime();
    if (Date.now() > expiresAt) {
      // Invalidate expired OTP
      user.emailOtpHash = undefined;
      user.emailOtpExpiresAt = undefined;
      res.status(400).json({
        success: false,
        error: 'The verification code has expired (5-minute limit). Please click Resend Code to obtain a new OTP.',
      });
      return;
    }

    // Check attempt rate limits (Max 5 attempts before locking/invalidating OTP)
    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
    if (user.emailOtpAttempts > 5) {
      user.emailOtpHash = undefined;
      user.emailOtpExpiresAt = undefined;
      res.status(429).json({
        success: false,
        error: 'Maximum verification attempts exceeded. For security, this OTP has been invalidated. Please request a new code.',
      });
      return;
    }

    // Cryptographic comparison with stored hash
    const isMatch = await bcrypt.compare(cleanOtp, user.emailOtpHash);
    if (!isMatch) {
      const attemptsRemaining = 5 - user.emailOtpAttempts;
      res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
      });
      return;
    }

    // Success: Invalidate OTP to prevent reuse
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    user.emailOtpAttempts = 0;
    user.emailVerified = true;

    // Role-based activation:
    // NGOs remain in PENDING status awaiting administrative verification
    // Donors, Volunteers, and Public users become ACTIVE
    if (user.role === 'NGO') {
      user.status = 'PENDING';
    } else {
      user.status = 'ACTIVE';
    }
    user.updatedAt = new Date().toISOString();

    logAudit({
      action: 'EMAIL_VERIFIED',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      details: `User email ${user.email} verified successfully. Status: ${user.status}`,
      ipAddress: req.ip,
    });

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message:
        user.role === 'NGO'
          ? 'Email verified successfully! Note: As an NGO, your profile is pending administrative verification before full operational dispatch features are enabled.'
          : 'Email verified successfully! Your MealBridge account is now active.',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error verifying OTP.' });
  }
}

/**
 * 3. RESEND EMAIL OTP
 * Enforces 60-second cooldown between resends, generates new 6-digit OTP,
 * hashes it, and dispatches via email provider.
 */
export async function resendEmailOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email address is required to resend OTP.' });
      return;
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      res.status(400).json({ success: false, error: 'No account found with this email address.' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ success: false, error: 'This account is already verified. Please sign in.' });
      return;
    }

    // Cooldown check (60 seconds)
    if (user.emailOtpLastSentAt) {
      const elapsedSec = (Date.now() - new Date(user.emailOtpLastSentAt).getTime()) / 1000;
      if (elapsedSec < 60) {
        const remaining = Math.ceil(60 - elapsedSec);
        res.status(429).json({
          success: false,
          error: `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before requesting another OTP.`,
          cooldownRemainingSec: remaining,
        });
        return;
      }
    }

    // Generate new OTP & hash
    const otp = generateSecureOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = otpExpiresAt;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    const emailResult = await emailService.sendVerificationOtp(user.email, otp, user.name);

    res.json({
      success: true,
      message: emailResult.delivered
        ? 'A new 6-digit verification code has been dispatched to your email.'
        : emailResult.error
        ? `New verification OTP generated, but email delivery failed: ${emailResult.error}`
        : 'New verification OTP generated. Email delivery service is not configured on this server.',
      emailDeliveryConfigured: emailResult.configured,
      emailDelivered: emailResult.delivered,
      provider: emailResult.provider,
      providerError: emailResult.error,
      dependencyNotice: emailResult.error
        ? `Email provider (${emailResult.provider}) error: ${emailResult.error}`
        : emailResult.dependencyNotice,
      // For automated development test suite execution ONLY (never in production)
      _devTestOtp: process.env.NODE_ENV === 'test' ? otp : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error resending verification OTP.' });
  }
}

/**
 * 4. LOGIN
 * Verifies email and password, enforces email verification, blocks suspended accounts,
 * resets failed login counters, and returns JWT token with safe user profile.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || !user.password) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    // Check account lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const waitMin = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (60 * 1000));
      res.status(403).json({
        success: false,
        error: `Account temporarily locked due to excessive failed attempts. Please retry in ${waitMin} minute(s).`,
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    // Check email verification status: unverified users cannot login
    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        error: 'Your email address has not been verified. Please verify using the 6-digit OTP code sent to your email.',
        requiresVerification: true,
        email: user.email,
      });
      return;
    }

    // Check administrative account status
    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED' || user.status === 'REJECTED') {
      res.status(403).json({
        success: false,
        error: `Account ${user.status}. Please contact Belagavi MealBridge Support at support@mealbridge.org.`,
      });
      return;
    }

    // Reset failed login attempts on success
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;

    logAudit({
      action: 'USER_LOGIN',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      details: 'User logged in successfully with verified credentials',
      ipAddress: req.ip,
    });

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      token,
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error during login.' });
  }
}

/**
 * 5. CURRENT USER & PROFILE
 */
export function getCurrentUser(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }
  const { password: _, ...userSafe } = req.user;

  let linkedProfile = null;
  if (req.user.role === 'NGO') {
    linkedProfile = store.ngos.find((n) => n.userId === req.user?._id);
  } else if (req.user.role === 'VOLUNTEER') {
    linkedProfile = store.volunteers.find((v) => v.userId === req.user?._id);
  }

  res.json({
    success: true,
    user: userSafe,
    linkedProfile,
  });
}

export function updateProfile(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { name, phone, address, latitude, longitude, avatar } = req.body;
  const user = store.users.find((u) => u._id === req.user?._id);

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  // Security Rule: Users cannot change their role through profile editing
  if (name && typeof name === 'string') user.name = name.trim();
  if (phone && typeof phone === 'string') user.phone = phone.trim();
  if (address) user.address = address;
  if (latitude !== undefined) user.latitude = Number(latitude);
  if (longitude !== undefined) user.longitude = Number(longitude);
  if (avatar) user.avatar = avatar;
  user.updatedAt = new Date().toISOString();

  logAudit({
    action: 'PROFILE_UPDATED',
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    details: 'User updated profile contact details',
    ipAddress: req.ip,
  });

  const { password: _, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
}

/**
 * 6. FORGOT PASSWORD
 * Generates time-limited (10 min) reset OTP, stores bcrypt hash,
 * prevents account enumeration by returning neutral success message.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    let emailResult = { delivered: false, configured: false, dependencyNotice: undefined as string | undefined };
    let devOtp: string | undefined = undefined;

    if (user) {
      const resetOtp = generateSecureOtp();
      const resetOtpHash = await bcrypt.hash(resetOtp, 10);
      const resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      user.resetPasswordOtpHash = resetOtpHash;
      user.resetPasswordOtpExpiresAt = resetOtpExpiresAt;
      user.resetPasswordOtpAttempts = 0;
      user.resetPasswordOtpLastSentAt = new Date().toISOString();

      const result = await emailService.sendPasswordResetOtp(user.email, resetOtp, user.name);
      emailResult = {
        delivered: result.delivered,
        configured: result.configured,
        dependencyNotice: result.error
          ? `Email provider (${result.provider}) error: ${result.error}`
          : result.dependencyNotice,
      };

      if (process.env.NODE_ENV === 'test') {
        devOtp = resetOtp;
      }
    }

    // Always return neutral response to prevent user account enumeration
    res.json({
      success: true,
      message: 'If the email address exists in the MealBridge Belagavi directory, a 6-digit password reset code has been processed.',
      emailDeliveryConfigured: emailResult.configured,
      emailDelivered: emailResult.delivered,
      dependencyNotice: emailResult.dependencyNotice,
      _devTestOtp: devOtp,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error processing password reset request.' });
  }
}

/**
 * 7. RESET PASSWORD
 * Verifies reset OTP hash, validates new password complexity,
 * updates user password with bcrypt hash, and invalidates reset OTP.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, error: 'Email, verification code, and new password are required.' });
      return;
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'New password and confirmation password do not match.' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
      return;
    }

    const cleanOtp = String(otp).trim();
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt) {
      res.status(400).json({ success: false, error: 'Invalid or expired password reset request. Please request a new code.' });
      return;
    }

    // Check expiration (10 minutes)
    if (Date.now() > new Date(user.resetPasswordOtpExpiresAt).getTime()) {
      user.resetPasswordOtpHash = undefined;
      user.resetPasswordOtpExpiresAt = undefined;
      res.status(400).json({ success: false, error: 'Password reset code has expired. Please request a new code.' });
      return;
    }

    // Check attempt limit
    user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
    if (user.resetPasswordOtpAttempts > 5) {
      user.resetPasswordOtpHash = undefined;
      user.resetPasswordOtpExpiresAt = undefined;
      res.status(429).json({
        success: false,
        error: 'Too many invalid attempts. For security, this reset code has been invalidated. Please request a new code.',
      });
      return;
    }

    // Verify OTP against stored hash
    const isMatch = await bcrypt.compare(cleanOtp, user.resetPasswordOtpHash);
    if (!isMatch) {
      const attemptsRemaining = 5 - user.resetPasswordOtpAttempts;
      res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
      });
      return;
    }

    // Hash new password and invalidate reset OTP
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordOtpExpiresAt = undefined;
    user.resetPasswordOtpAttempts = 0;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    user.updatedAt = new Date().toISOString();

    logAudit({
      action: 'PASSWORD_RESET',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      details: 'User successfully updated password using verified OTP',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Password has been updated successfully. Please sign in with your new credentials.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating password.' });
  }
}

/**
 * 8. LOGOUT
 */
export function logout(req: AuthRequest, res: Response): void {
  if (req.user) {
    logAudit({
      action: 'USER_LOGOUT',
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      details: 'User signed out of session',
      ipAddress: req.ip,
    });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
}

/**
 * 9. PROVIDERS STATUS
 * Reports whether live email delivery and SMS gateways are configured
 */
export function getProvidersStatus(req: Request, res: Response): void {
  res.json({
    success: true,
    email: {
      configured: emailService.isConfigured(),
      provider: emailService.getActiveProviderName(),
    },
    sms: {
      configured: smsService.isConfigured(),
      provider: smsService.getActiveProvider()?.name || 'NONE',
      notice: 'SMS gateway integration interface is ready (Twilio/MSG91). Real SMS requires credentials in environment variables.',
    },
  });
}
