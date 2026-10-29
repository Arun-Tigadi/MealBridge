import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';
import {
  HeartHandshake,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  KeyRound,
  CheckCircle2,
  X,
  Info,
  UserPlus,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, quickSwitchRole, forgotPassword, resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetOtp, setResetOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotDependencyNotice, setForgotDependencyNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);

    try {
      const res = await login({ email, password });
      if (res && res.requiresVerification) {
        setUnverifiedEmail(res.email || email);
        setError('Your email has not been verified yet. Please enter the 6-digit OTP code sent to your email.');
        return;
      }
      onNavigate('landing');
    } catch (err: any) {
      if (err.message && err.message.includes('not verified')) {
        setUnverifiedEmail(email);
      }
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setError(null);
    try {
      await quickSwitchRole(role);
      if (role === 'DONOR') onNavigate('donor-dashboard');
      else if (role === 'NGO') onNavigate('ngo-dashboard');
      else if (role === 'VOLUNTEER') onNavigate('volunteer-dashboard');
      else if (role === 'ADMIN') onNavigate('admin-dashboard');
      else onNavigate('landing');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    }
  };

  // Forgot Password Step 1: Request OTP
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    try {
      const res = await forgotPassword(forgotEmail);
      if (res.success) {
        setForgotDependencyNotice(res.dependencyNotice || null);
        if (res.emailDelivered) {
          setForgotSuccess(res.message);
        } else {
          setForgotError(
            res.dependencyNotice ||
              'Email delivery provider is unconfigured. Reset code could not be dispatched to your inbox.'
          );
        }
        setForgotStep('reset');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Error sending password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Password and confirmation password do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword({
        email: forgotEmail,
        otp: resetOtp,
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      if (res.success) {
        setForgotSuccess('Password updated successfully! You can now log in with your new password.');
        setTimeout(() => {
          setShowForgotModal(false);
          setPassword('');
          setEmail(forgotEmail);
        }, 1800);
      }
    } catch (err: any) {
      setForgotError(err.message || 'Password reset failed. Check your OTP and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-10 px-4">
      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold mx-auto mb-3 shadow-xs">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Sign in to MealBridge</h1>
          <p className="text-xs text-slate-500 mt-1">Belagavi Food Redistribution Network</p>
          <div className="mt-2 text-xs text-slate-600">
            New user?{' '}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="text-blue-600 font-bold hover:underline"
            >
              Register with Email OTP →
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {unverifiedEmail && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[11px] inline-flex items-center space-x-1"
                  >
                    <span>Verify with OTP Code Now →</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep('request');
                  setForgotError(null);
                  setForgotSuccess(null);
                  setShowForgotModal(true);
                }}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <span>Sign In with Verified Account</span>
            )}
          </button>
        </form>

        {/* Prominent Register / Sign Up Button */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-xl border border-blue-200/80 text-center shadow-2xs">
            <span className="text-xs font-bold text-slate-800 block mb-0.5">
              Don't have an account yet?
            </span>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Sign up as a Food Donor, verified NGO, Volunteer driver, or Citizen.
            </p>
            <button
              id="login-register-btn"
              type="button"
              onClick={() => onNavigate('register')}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs ring-2 ring-emerald-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account / Sign Up with Email OTP</span>
            </button>
          </div>
        </div>

        {/* Demo Personas for Development Testing */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Development Test Personas
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Dev Only
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
            Pre-verified demo accounts for instant local interface evaluation. Production authentication strictly enforces bcrypt hashes and OTP validation.
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              id="demo-login-donor"
              type="button"
              onClick={() => handleDemoLogin('DONOR')}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">Patil Grand Banquet Hall</span>
                <span className="text-[11px] text-slate-500">DONOR • donor@mealbridge.org</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                DONOR
              </span>
            </button>

            <button
              id="demo-login-ngo"
              type="button"
              onClick={() => handleDemoLogin('NGO')}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">Belagavi Annapurna Seva Trust</span>
                <span className="text-[11px] text-slate-500">NGO • ngo@mealbridge.org</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                NGO
              </span>
            </button>

            <button
              id="demo-login-volunteer"
              type="button"
              onClick={() => handleDemoLogin('VOLUNTEER')}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">Suresh Volunteer Driver</span>
                <span className="text-[11px] text-slate-500">VOLUNTEER • volunteer@mealbridge.org</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                VOLUNTEER
              </span>
            </button>

            <button
              id="demo-login-admin"
              type="button"
              onClick={() => handleDemoLogin('ADMIN')}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-all text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">Belagavi DC Officer</span>
                <span className="text-[11px] text-slate-500">ADMIN • admin@mealbridge.org</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                ADMIN
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <KeyRound className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">Reset Account Password</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter your verified email to receive a time-limited 6-digit reset OTP.
            </p>

            {forgotDependencyNotice && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{forgotDependencyNotice}</span>
              </div>
            )}

            {forgotError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestResetOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <span>Dispatch Reset Code →</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 590001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-center tracking-widest font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    ← Re-enter email
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || resetOtp.length !== 6}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
