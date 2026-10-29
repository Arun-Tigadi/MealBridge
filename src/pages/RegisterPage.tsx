import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { UserRole } from '../types.ts';
import {
  HeartHandshake,
  Building2,
  Truck,
  Users,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Info,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  initialEmail?: string;
  initialStep?: 'form' | 'otp';
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  initialEmail = '',
  initialStep = 'form',
}) => {
  const { register, verifyEmailOtp, resendEmailOtp, isLoading } = useAuth();

  // Role definitions (ADMIN is strictly excluded from public self-registration)
  const allowedRoles: { role: UserRole; title: string; desc: string; icon: React.ElementType }[] = [
    {
      role: 'DONOR',
      title: 'Food Donor',
      desc: 'Hotels, caterers, halls with surplus food',
      icon: HeartHandshake,
    },
    {
      role: 'NGO',
      title: 'NGO / Food Bank',
      desc: 'Registered charities distributing to Belagavi communities',
      icon: Building2,
    },
    {
      role: 'VOLUNTEER',
      title: 'Volunteer Driver',
      desc: 'Two-wheeler / van pickup & delivery in Belagavi',
      icon: Truck,
    },
    {
      role: 'PUBLIC',
      title: 'Public Citizen',
      desc: 'Spot hunger points & community assistance',
      icon: Users,
    },
  ];

  // Provider status state
  const [providerStatus, setProviderStatus] = useState<{
    emailConfigured: boolean;
    emailProvider: string;
    smsConfigured: boolean;
    smsNotice: string;
  } | null>(null);

  useEffect(() => {
    api
      .getProvidersStatus()
      .then((res) => {
        if (res.success) {
          setProviderStatus({
            emailConfigured: res.email.configured,
            emailProvider: res.email.provider,
            smsConfigured: res.sms.configured,
            smsNotice: res.sms.notice,
          });
        }
      })
      .catch(() => {
        // Fallback info if API is not yet responding
        setProviderStatus({
          emailConfigured: false,
          emailProvider: 'NONE',
          smsConfigured: false,
          smsNotice: 'SMS gateway integration interface ready.',
        });
      });
  }, []);

  // Form State
  const [selectedRole, setSelectedRole] = useState<UserRole>('DONOR');
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail,
    phone: '',
    password: '',
    confirmPassword: '',
    address: 'Belagavi, Karnataka',
    latitude: 15.8497,
    longitude: 74.4977,
    // NGO specific
    orgName: '',
    registrationNumber: '',
    dailyCapacityKg: 100,
    // Volunteer specific
    transportType: 'TWO_WHEELER',
    vehicleNumber: '',
  });

  // Step state: 'form' -> 'otp'
  const [step, setStep] = useState<'form' | 'otp'>(initialStep);
  const [targetEmail, setTargetEmail] = useState<string>(initialEmail);
  const [emailDeliveryNotice, setEmailDeliveryNotice] = useState<string | null>(null);
  const [emailDelivered, setEmailDelivered] = useState<boolean>(false);

  // OTP Verification state
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // OTP Timers
  const [expirySeconds, setExpirySeconds] = useState<number>(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  // Expiry countdown timer
  useEffect(() => {
    if (step !== 'otp' || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (formData.name.trim().length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!formData.email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Password and confirmation password do not match.');
      return;
    }

    // Role guard: never allow ADMIN self-registration
    if (selectedRole === 'ADMIN') {
      setFormError('Administrative accounts cannot be self-registered.');
      return;
    }

    try {
      const res = await register({
        ...formData,
        role: selectedRole,
      });

      if (res.success) {
        setTargetEmail(formData.email.toLowerCase().trim());
        setEmailDelivered(res.emailDelivered);
        setEmailDeliveryNotice(res.dependencyNotice || null);
        setStep('otp');
        setExpirySeconds(300);
        setResendCooldown(60);
      }
    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please verify your details.');
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otpValue];
    // If pasting multiple digits
    if (val.length > 1) {
      const pasted = val.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtpValue(newOtp);
      const nextIdx = Math.min(pasted.length, 5);
      const nextInput = document.getElementById(`otp-input-${nextIdx}`);
      nextInput?.focus();
      return;
    }

    newOtp[index] = val;
    setOtpValue(newOtp);

    // Auto-advance focus to next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle OTP Verification Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpSuccess(null);

    const fullOtp = otpValue.join('');
    if (fullOtp.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      const res = await verifyEmailOtp({
        email: targetEmail,
        otp: fullOtp,
      });

      if (res.success) {
        setOtpSuccess(res.message);
        setTimeout(() => {
          if (selectedRole === 'DONOR') onNavigate('donor-dashboard');
          else if (selectedRole === 'NGO') onNavigate('ngo-dashboard');
          else if (selectedRole === 'VOLUNTEER') onNavigate('volunteer-dashboard');
          else onNavigate('landing');
        }, 1200);
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed. Check the code and try again.');
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError(null);

    try {
      const res = await resendEmailOtp(targetEmail);
      if (res.success) {
        setEmailDelivered(res.emailDelivered);
        setEmailDeliveryNotice(res.dependencyNotice || null);
        setExpirySeconds(300);
        setResendCooldown(60);
        setOtpValue(['', '', '', '', '', '']);
        if (res.emailDelivered) {
          setOtpSuccess('A new 6-digit verification code has been dispatched to your email.');
          setTimeout(() => setOtpSuccess(null), 4000);
        } else {
          setOtpError(
            res.dependencyNotice ||
              'Email delivery provider is unconfigured. Verification code could not be sent to your inbox.'
          );
        }
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10 px-4">
      {/* Top Navigation Links */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <button
          onClick={() => {
            if (step === 'otp') {
              setStep('form');
            } else {
              onNavigate('landing');
            }
          }}
          className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{step === 'otp' ? 'Back to Registration Form' : 'Back to Home'}</span>
        </button>
        <button
          onClick={() => onNavigate('login')}
          className="text-blue-600 hover:underline font-bold"
        >
          Already have an account? Sign In →
        </button>
      </div>

      {/* Provider Status Pill */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-700">Security & Gateway Status:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`px-2 py-0.5 rounded-full font-medium ${
              providerStatus?.emailConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            Email:{' '}
            {providerStatus?.emailConfigured
              ? `Live (${providerStatus.emailProvider})`
              : 'Dependency Unconfigured'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
            SMS: Gateway Ready (Twilio/MSG91)
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 sm:p-8 shadow-xs">
        {step === 'form' ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold mx-auto mb-3 shadow-xs">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Create MealBridge Account</h1>
              <p className="text-xs text-slate-500 mt-1">
                Belagavi Food Redistribution Network • Secure OTP Verification
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Your Operational Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allowedRoles.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedRole === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setSelectedRole(item.role)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 italic">
                  Note: Municipal administrator privileges require regional oversight approval and cannot be self-selected.
                </p>
              </div>

              {/* Core Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ramesh@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98450 12345"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (min 8 chars) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Password Confirmation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Belagavi Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Location in Belagavi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Tilakwadi 2nd Gate, Belagavi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* NGO Specific Fields */}
              {selectedRole === 'NGO' && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span>NGO Registration & Verification Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Organization / Trust Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.orgName}
                        onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                        placeholder="e.g. Belagavi Food Seva Foundation"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registration / 12A / 80G Number
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, registrationNumber: e.target.value })
                        }
                        placeholder="e.g. BLG-TR-2021-994"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Security Requirement: NGO accounts require Administrator verification before restricted donation dispatch and match acceptance features are unlocked.
                  </p>
                </div>
              )}

              {/* Volunteer Specific Fields */}
              {selectedRole === 'VOLUNTEER' && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-xs">
                    <Truck className="w-4 h-4 text-indigo-700" />
                    <span>Volunteer Transportation Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Transport Mode
                      </label>
                      <select
                        value={formData.transportType}
                        onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="TWO_WHEELER">Two-Wheeler (Motorcycle/Scooter)</option>
                        <option value="FOUR_WHEELER">Four-Wheeler (Car)</option>
                        <option value="VAN">Van / Commercial Vehicle</option>
                        <option value="FOOT">Foot (Neighborhood walk)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vehicle Number (KA-22 series)
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        placeholder="KA-22-EX-1234"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account & Generating OTP...</span>
                  </>
                ) : (
                  <span>Continue to Email OTP Verification →</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Already registered?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:underline font-bold"
              >
                Sign in
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: EMAIL OTP VERIFICATION SCREEN */
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mx-auto mb-3 shadow-xs">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Verify Your Email</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit verification code for:
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{targetEmail}</p>
            </div>

            {/* Email Provider Dependency Banner (Strict Compliance with Requirement 2) */}
            {emailDelivered ? (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Verification Code Dispatched</span>
                  <span>A 6-digit OTP has been sent via our email provider. Please check your inbox and spam folder.</span>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Notice: Email Delivery Unconfigured</span>
                  <span>
                    {emailDeliveryNotice ||
                      'Email delivery provider is not configured in the server environment (requires SMTP_HOST or RESEND_API_KEY).'}
                  </span>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Account is created in PENDING state. Server stores only a secure bcrypt hash of the OTP and verifies it upon submission.
                  </p>
                </div>
              </div>
            )}

            {otpError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6 Digit Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 text-center mb-3">
                  Enter 6-Digit One-Time Password (OTP)
                </label>
                <div className="flex justify-center items-center gap-1.5 sm:gap-2.5">
                  {otpValue.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 sm:w-11 h-11 sm:h-12 text-center text-base sm:text-lg font-extrabold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden bg-white text-slate-900 transition-all shadow-2xs"
                    />
                  ))}
                </div>
              </div>

              {/* Expiry and Cooldown Indicators */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                <div>
                  Code expires in:{' '}
                  <span
                    className={`font-bold ${
                      expirySeconds < 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'
                    }`}
                  >
                    {formatTimer(expirySeconds)}
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="text-blue-600 font-bold hover:underline disabled:text-slate-400 disabled:no-underline transition-colors flex items-center space-x-1"
                  >
                    {isResending ? (
                      <span>Resending...</span>
                    ) : resendCooldown > 0 ? (
                      <span>Resend code ({resendCooldown}s)</span>
                    ) : (
                      <span>Resend Code</span>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValue.join('').length !== 6 || expirySeconds <= 0}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP on Server...</span>
                  </>
                ) : (
                  <span>Verify OTP & Complete Registration</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => setStep('form')}
                className="text-slate-600 hover:text-slate-900 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit registration details</span>
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:underline font-bold"
              >
                Return to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
