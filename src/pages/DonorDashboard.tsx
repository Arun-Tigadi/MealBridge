import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Donation } from '../types.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { PlusCircle, Package, Clock, MapPin, AlertCircle, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

interface DonorDashboardProps {
  onNavigate: (page: string) => void;
  onSelectDonation?: (id: string) => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ onNavigate, onSelectDonation }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [donationsRes, statsRes] = await Promise.all([
        api.getDonations({ mineOnly: true }),
        api.getDonorStats(),
      ]);

      if (donationsRes.success) {
        setDonations(donationsRes.donations);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.warn('Error loading donor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this surplus donation?')) return;
    try {
      await api.cancelDonation(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel donation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-900/10 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Donor Operations Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage surplus food listings, view automated 10 km NGO matches, and track volunteer pickups.
          </p>
        </div>
        <button
          id="donor-create-btn"
          onClick={() => onNavigate('create-donation')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Food Donation</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/90">
          <span className="text-xs text-slate-500 font-medium">Total Listings</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {stats?.totalDonations ?? donations.length}
          </div>
          <span className="text-[11px] text-slate-400">Belagavi region</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90">
          <span className="text-xs text-slate-500 font-medium">Active In Pipeline</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {stats?.activeDonations ?? donations.filter((d) => ['ACTIVE', 'MATCHED', 'CLAIMED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Pending pickup</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90">
          <span className="text-xs text-slate-500 font-medium">Completed Handovers</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats?.completedDonations ?? donations.filter((d) => d.status === 'COMPLETED' || d.status === 'DELIVERED').length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Verified by NGOs</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90">
          <span className="text-xs text-slate-500 font-medium">Food Delivered (kg)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {stats?.totalFoodKg ?? 420} <span className="text-xs font-semibold text-slate-500">kg</span>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium">~1,260 meals served</span>
        </div>
      </div>

      {/* Donations List */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Your Food Donations</h2>
          <span className="text-xs text-slate-500">{donations.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading your donations...</div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No food donations posted yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              When you have prepared surplus or unopened ingredients, list them here to automatically match with verified Belagavi NGOs.
            </p>
            <button
              onClick={() => onNavigate('create-donation')}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
            >
              Post First Donation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {donations.map((d) => (
              <div
                key={d._id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{d.foodName}</h3>
                    <StatusBadge status={d.status} />
                    {d.isVegetarian && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        VEG
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Quantity: <strong>{d.quantity} {d.unit}</strong>
                    </span>
                    <span>Category: {d.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Expires: {new Date(d.expiryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{d.pickupAddress}</span>
                  </div>

                  {d.shelfLifeEstimateHours && (
                    <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1 pt-0.5">
                      <span>Estimated Safe Window: {d.shelfLifeEstimateHours} hrs</span>
                      <span className="text-slate-400">•</span>
                      <span>Risk: {d.riskLevel}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {['ACTIVE', 'MATCHED'].includes(d.status) && (
                    <button
                      onClick={() => handleCancel(d._id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-red-50 hover:text-red-700 text-xs text-slate-600 transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onSelectDonation) onSelectDonation(d._id);
                      onNavigate('donation-details');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
