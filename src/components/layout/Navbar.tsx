import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useSocket } from '../../context/SocketContext.tsx';
import { api } from '../../services/api.ts';
import { resetStore } from '../../services/demoStore.ts';
import { NotificationItem, UserRole } from '../../types.ts';
import {
  Bell,
  AlertTriangle,
  MapPin,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Layers,
  HeartHandshake,
  Database,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, logout, quickSwitchRole, isAuthenticated } = useAuth();
  const { isConnected, latestNotification } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const fetchNotifs = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (latestNotification) {
      setNotifications((prev) => [latestNotification, ...prev]);
    }
  }, [latestNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notifId: string) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      // Ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-900/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-2.5 text-left focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-lg text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                MEALBRIDGE
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Belagavi
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Food Redistribution Network</span>
            </div>
          </button>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center space-x-3">
          {/* Demo Mode Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] text-slate-700 border border-slate-200"
            title="Frontend Demo Mode with full localStorage state persistence"
          >
            <Database className="w-3 h-3 text-blue-600" />
            <span className="font-semibold">Demo (localStorage)</span>
            <button
              onClick={() => {
                if (confirm('Reset Belagavi demo data to initial seed state?')) {
                  resetStore();
                  window.location.reload();
                }
              }}
              title="Reset Demo Data to Initial State"
              className="p-0.5 hover:text-red-600 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Real-time connection indicator */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium"
            title={isConnected ? 'Connected to live Belagavi operational hub' : 'Operational node'}
          >
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`}
            />
            <span>Belagavi Mesh</span>
          </div>

          {/* Quick Emergency SOS CTA */}
          <button
            id="nav-sos-button"
            onClick={() => onNavigate('emergency')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS 15KM</span>
          </button>

          {/* Hunger Spotting CTA */}
          <button
            id="nav-hunger-button"
            onClick={() => onNavigate('hunger')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Spot Hunger</span>
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  id="nav-notification-bell"
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Notifications ({notifications.length})
                      </span>
                      <button
                        onClick={async () => {
                          await api.markAllNotificationsRead();
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        }}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No notifications yet. You will be alerted for matches and delivery updates.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n._id)}
                            className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.read ? 'bg-blue-50/40 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900 leading-tight">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Quick-Switch Dropdown (High-craft demo selector) */}
              <div className="relative">
                <button
                  id="role-switch-button"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-900/15 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors"
                >
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-600 text-white font-bold tracking-wide">
                    {user.role}
                  </span>
                  <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Status: {user.status}
                      </div>
                    </div>

                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Switch Role (Demo Mode)
                    </div>

                    {(['DONOR', 'NGO', 'VOLUNTEER', 'ADMIN', 'PUBLIC'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={async () => {
                          setShowRoleMenu(false);
                          await quickSwitchRole(r);
                          if (r === 'DONOR') onNavigate('donor-dashboard');
                          else if (r === 'NGO') onNavigate('ngo-dashboard');
                          else if (r === 'VOLUNTEER') onNavigate('volunteer-dashboard');
                          else if (r === 'ADMIN') onNavigate('admin-dashboard');
                          else onNavigate('landing');
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          user.role === r ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span>{r} View</span>
                        {user.role === r && <span className="text-xs">✓</span>}
                      </button>
                    ))}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          onNavigate('profile');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Profile & Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          logout();
                          onNavigate('login');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                id="nav-login-btn"
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </button>
              <button
                id="nav-register-btn"
                onClick={() => onNavigate('register')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
