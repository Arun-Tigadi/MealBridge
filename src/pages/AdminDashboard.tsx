import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { User, FoodCategory, AuditLog, SystemSettings } from '../types.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import {
  ShieldCheck,
  Users,
  Building2,
  FolderTree,
  FileText,
  Settings,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ngos' | 'users' | 'categories' | 'audits' | 'settings'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [ngos, setNgos] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, ngosRes, usersRes, catsRes, auditsRes, settingsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminNGOs(),
        api.getAdminUsers(),
        api.getCategories(),
        api.getAuditLogs(),
        api.getSystemSettings(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (ngosRes.success) setNgos(ngosRes.ngos);
      if (usersRes.success) setUsers(usersRes.users);
      if (catsRes.success) setCategories(catsRes.categories);
      if (auditsRes.success) setAuditLogs(auditsRes.logs);
      if (settingsRes.success) setSettings(settingsRes.settings);
    } catch (err) {
      console.warn('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleVerifyNGO = async (id: string, verified: boolean) => {
    let reason = '';
    if (!verified) {
      const input = prompt('Enter rejection reason:');
      if (input === null) return;
      reason = input || 'Registration credentials incomplete';
    }

    try {
      await api.verifyNGO(id, verified, reason);
      loadAll();
      alert(`NGO ${verified ? 'verified and authorized' : 'rejected'}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update NGO');
    }
  };

  const handleUpdateUserStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;
    try {
      await api.updateUserStatus(id, newStatus);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSystemSettings(settings);
      alert('System settings updated successfully.');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-900/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">Belagavi Administration Hub</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              SYSTEM ROOT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational governance, NGO verification, RBAC management, and security audit log.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'System Overview', icon: ShieldCheck },
          { id: 'ngos', label: `NGO Verifications (${ngos.filter((n) => !n.verified).length})`, icon: Building2 },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'categories', label: 'Food Categories', icon: FolderTree },
          { id: 'audits', label: 'Security Audits', icon: FileText },
          { id: 'settings', label: 'Radius & Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: System Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200/90">
              <span className="text-xs text-slate-500 font-medium">Total Registered Users</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats?.totalUsers || users.length}
              </div>
              <span className="text-[11px] text-slate-400">All 5 roles</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/90">
              <span className="text-xs text-slate-500 font-medium">Pending NGO Approvals</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {stats?.pendingNgoVerifications ?? ngos.filter((n) => !n.verified).length}
              </div>
              <span className="text-[11px] text-amber-600 font-medium">Awaiting document check</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/90">
              <span className="text-xs text-slate-500 font-medium">Active Donations</span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {stats?.activeDonations ?? 0}
              </div>
              <span className="text-[11px] text-blue-600 font-medium">In 10 KM pipeline</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/90">
              <span className="text-xs text-slate-500 font-medium">Active SOS Incidents</span>
              <div className="text-2xl font-black text-red-600 mt-1">
                {stats?.activeSOSAlerts ?? 0}
              </div>
              <span className="text-[11px] text-red-600 font-medium">Within 15 KM mesh</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200/90 space-y-3">
              <h2 className="text-sm font-bold text-slate-900">User Distribution by Role</h2>
              <div className="space-y-2 text-xs">
                {stats?.usersByRole &&
                  Object.entries(stats.usersByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-700">{role}</span>
                      <span className="font-bold text-slate-900">{count as number}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200/90 space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Operational Boundary Parameters</h2>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Surplus Matching Radius:</span>
                  <span className="font-bold text-blue-700">{settings?.matchingRadiusKm || 10} KM</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Emergency SOS Broadcast Radius:</span>
                  <span className="font-bold text-red-700">{settings?.emergencyRadiusKm || 15} KM</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Hunger Spotting Privacy Retention:</span>
                  <span className="font-bold text-slate-800">{settings?.hungerReportExpiryHours || 48} Hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: NGO Approvals */}
      {activeTab === 'ngos' && (
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">NGO Organization Review Queue</h2>
            <span className="text-xs text-slate-500">{ngos.length} organizations</span>
          </div>

          <div className="divide-y divide-slate-100">
            {ngos.map((ngo) => (
              <div key={ngo._id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{ngo.orgName}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ngo.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ngo.verified ? 'VERIFIED' : 'PENDING APPROVAL'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-x-3">
                    <span>Reg No: <strong>{ngo.registrationNumber}</strong></span>
                    <span>Capacity: <strong>{ngo.dailyCapacityKg} kg/day</strong></span>
                    <span>Radius: <strong>{ngo.serviceRadiusKm} km</strong></span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Address: {ngo.address} • Contact: {ngo.contactPerson} ({ngo.phone})
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!ngo.verified ? (
                    <>
                      <button
                        onClick={() => handleVerifyNGO(ngo._id, false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-red-50 hover:text-red-700 font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleVerifyNGO(ngo._id, true)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Approve NGO
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorized</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">User Directory & Governance</h2>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-48"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="DONOR">DONOR</option>
                <option value="NGO">NGO</option>
                <option value="VOLUNTEER">VOLUNTEER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="PUBLIC">PUBLIC</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Belagavi Address</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <StatusBadge status={u.status} size="sm" />
                    </td>
                    <td className="p-2.5 text-slate-600">{u.address || 'Belagavi, Karnataka'}</td>
                    <td className="p-2.5 text-right">
                      {u.role !== 'ADMIN' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleUpdateUserStatus(u._id, 'SUSPENDED')}
                              className="px-2 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px]"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u._id, 'ACTIVE')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Food Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Food Categories & Safety Rules</h2>
            <span className="text-xs text-slate-500">{categories.length} categories</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {cat.urgencyClassification}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{cat.description}</p>
                <div className="text-xs pt-1 border-t border-slate-200 space-y-1">
                  <div>
                    <span className="text-slate-500">Shelf-Life Guidance:</span>{' '}
                    <span className="text-slate-800 font-medium">{cat.shelfLifeGuidance}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Handling Protocol:</span>{' '}
                    <span className="text-slate-800 font-medium">{cat.foodHandlingTips}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Security Audits */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">System Security Audit Trail</h2>
            <span className="text-xs text-slate-500">{auditLogs.length} logged events</span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-3 hover:bg-slate-50/50 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{log.action}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 font-semibold">
                      {log.userRole}
                    </span>
                  </div>
                  <p className="text-slate-700">{log.details}</p>
                  <div className="text-[10px] text-slate-400">
                    By: {log.userName} • IP: {log.ipAddress || '127.0.0.1'}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: System Settings */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 max-w-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Belagavi Operational Parameters</h2>
          <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Food Surplus Recommendation Radius (KM)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.matchingRadiusKm}
                onChange={(e) =>
                  setSettings({ ...settings, matchingRadiusKm: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard: 10 KM for Belagavi city and peri-urban hubs.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Emergency SOS Broadcast Radius (KM)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={settings.emergencyRadiusKm}
                onChange={(e) =>
                  setSettings({ ...settings, emergencyRadiusKm: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard: 15 KM for critical distress alerts.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hunger Spotting Data Retention Window (Hours)
              </label>
              <input
                type="number"
                min="6"
                max="168"
                value={settings.hungerReportExpiryHours}
                onChange={(e) =>
                  setSettings({ ...settings, hungerReportExpiryHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard: 48 Hours privacy retention policy.
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save Parameters
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
