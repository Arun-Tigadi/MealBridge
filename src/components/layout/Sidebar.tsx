import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  MapPin,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertTriangle,
  FolderTree,
  FileText,
  Settings,
  Bell,
  Navigation,
  Compass,
  Building2,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role || 'PUBLIC';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'DONOR':
        return [
          { id: 'donor-dashboard', label: 'Donor Dashboard', icon: LayoutDashboard },
          { id: 'create-donation', label: 'Donate Food', icon: PlusCircle, badge: 'New' },
          { id: 'donations-list', label: 'My Donations', icon: Package },
          { id: 'belagavi-map', label: 'Belagavi Food Map', icon: MapPin },
        ];
      case 'NGO':
        return [
          { id: 'ngo-dashboard', label: 'NGO Operations', icon: LayoutDashboard },
          { id: 'available-donations', label: '10 KM Matches', icon: Compass, badge: 'Active' },
          { id: 'tasks-management', label: 'Delivery Tasks', icon: Navigation },
          { id: 'belagavi-map', label: 'Operational Map', icon: MapPin },
        ];
      case 'VOLUNTEER':
        return [
          { id: 'volunteer-dashboard', label: 'My Tasks', icon: LayoutDashboard },
          { id: 'belagavi-map', label: 'Route Map', icon: Navigation },
        ];
      case 'ADMIN':
        return [
          { id: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'admin-ngos', label: 'NGO Approvals', icon: ShieldCheck, badge: 'Review' },
          { id: 'admin-users', label: 'User Directory', icon: Users },
          { id: 'admin-categories', label: 'Food Categories', icon: FolderTree },
          { id: 'admin-audits', label: 'Security Audits', icon: FileText },
          { id: 'admin-settings', label: 'System Settings', icon: Settings },
          { id: 'belagavi-map', label: 'Zone Map', icon: MapPin },
        ];
      case 'PUBLIC':
      default:
        return [
          { id: 'landing', label: 'Belagavi Hub', icon: Compass },
          { id: 'hunger', label: 'Spot Hunger', icon: MapPin },
          { id: 'emergency', label: 'Emergency Alerts', icon: AlertTriangle },
          { id: 'belagavi-map', label: 'Community Map', icon: Navigation },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-900/10 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* User Role Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Operational Scope
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Belagavi City
            </span>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="truncate">{user ? user.name : 'Public Citizen'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 capitalize">
            Role: <strong className="text-slate-800">{role.toLowerCase()}</strong>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <div className="px-2 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Operational Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Features */}
        <div className="pt-3 border-t border-slate-200/80 space-y-1">
          <div className="px-2 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Public Services
          </div>
          <button
            onClick={() => onNavigate('emergency')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
              currentPage === 'emergency'
                ? 'bg-red-50 text-red-700 font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Emergency SOS (15KM)</span>
            </div>
          </button>
          <button
            onClick={() => onNavigate('hunger')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
              currentPage === 'hunger'
                ? 'bg-amber-50 text-amber-800 font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Spot Hunger (48h)</span>
            </div>
          </button>
        </div>

        {!isAuthenticated && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <div className="px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Account Registration
            </div>
            <button
              id="sidebar-register-btn"
              onClick={() => onNavigate('register')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                currentPage === 'register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Register New Account</span>
              </div>
            </button>
            <button
              id="sidebar-login-btn"
              onClick={() => onNavigate('login')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                currentPage === 'login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Safety & Jurisdiction Notice */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
        <span className="font-semibold text-slate-700 block mb-0.5">Belagavi Relief Desk</span>
        Operational zone: Belagavi City, Tilakwadi, Camp, Shahapur, Udyambag.
      </div>
    </aside>
  );
};
