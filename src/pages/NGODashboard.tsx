import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { Match, Task, NGO, Donation, EmergencyAlert } from '../types.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { AssignVolunteerModal } from '../components/ngo/AssignVolunteerModal.tsx';
import { TaskDetailsModal } from '../components/ngo/TaskDetailsModal.tsx';
import { ReviewDeliveryModal } from '../components/ngo/ReviewDeliveryModal.tsx';
import {
  Compass,
  Navigation,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  MapPin,
  AlertCircle,
  UserCheck,
  RotateCw,
  Eye,
  ShieldCheck,
  AlertTriangle,
  User,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface NGODashboardProps {
  onNavigate: (page: string) => void;
  onSelectDonation?: (id: string) => void;
}

export const NGODashboard: React.FC<NGODashboardProps> = ({ onNavigate, onSelectDonation }) => {
  const [ngoProfile, setNgoProfile] = useState<NGO | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [acceptedDonations, setAcceptedDonations] = useState<any[]>([]);
  const [availableVolunteers, setAvailableVolunteers] = useState<any[]>([]);
  const [awaitingVerificationTasks, setAwaitingVerificationTasks] = useState<Task[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Delivery Modal state
  const [reviewModalTask, setReviewModalTask] = useState<Task | null>(null);

  // Volunteer Assignment Modal state
  const [assignModalDonation, setAssignModalDonation] = useState<Donation | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  // Task Details Modal state
  const [detailsModalTaskId, setDetailsModalTaskId] = useState<string | undefined>(undefined);
  const [detailsModalDonation, setDetailsModalDonation] = useState<Donation | undefined>(undefined);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);

  // Accept Match Modal state
  const [acceptingMatch, setAcceptingMatch] = useState<Match | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Belagavi Annapurna Shelter Hub, Tilakwadi 2nd Gate'
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, matchesRes, volunteersRes, acceptedRes, verificationRes, emergencyRes] = await Promise.all([
        api.getNGOProfile(),
        api.getRecommendedMatches(),
        api.getRecommendedVolunteers(),
        api.getNGOAcceptedDonations(),
        api.getDeliveriesAwaitingVerification(),
        api.getEmergencyAlerts(),
      ]);

      if (profileRes.success) setNgoProfile(profileRes.ngo);
      if (matchesRes.success) setMatches(matchesRes.matches);
      if (volunteersRes.success) setAvailableVolunteers(volunteersRes.volunteers);
      if (acceptedRes.success) setAcceptedDonations(acceptedRes.donations);
      if (verificationRes?.success) setAwaitingVerificationTasks(verificationRes.tasks);
      if (emergencyRes?.success) setEmergencyAlerts(emergencyRes.alerts);
    } catch (err) {
      console.warn('Error loading NGO dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to localStorage update events across components
    const handleStoreUpdated = () => {
      loadData();
    };

    window.addEventListener('mealbridge_demo_store_updated', handleStoreUpdated);
    window.addEventListener('storage', handleStoreUpdated);

    return () => {
      window.removeEventListener('mealbridge_demo_store_updated', handleStoreUpdated);
      window.removeEventListener('storage', handleStoreUpdated);
    };
  }, [loadData]);

  const handleAcceptMatch = async () => {
    if (!acceptingMatch) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await api.acceptMatch({
        matchId: acceptingMatch._id,
        deliveryAddress,
      });

      if (res.success) {
        setAcceptingMatch(null);
        await loadData();
        setActionFeedback({
          type: 'success',
          message:
            'Match accepted! Donation moved to "PICKUP ASSIGNMENT PENDING". You can now assign a verified Belagavi volunteer below.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to accept match',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    const reason = prompt('Please enter a brief reason for declining this match:');
    if (reason === null) return;

    try {
      await api.rejectMatch({ matchId, rejectionReason: reason || 'Capacity reached' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to decline match');
    }
  };

  const openAssignModal = (donation: Donation, reassign = false) => {
    setAssignModalDonation(donation);
    setIsReassigning(reassign);
  };

  const openTaskDetails = (donation: Donation) => {
    setDetailsModalTaskId(donation.assignedTaskId);
    setDetailsModalDonation(donation);
    setIsTaskDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-900/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">
              {ngoProfile?.orgName || 'NGO Operations Control'}
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                ngoProfile?.verified
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {ngoProfile?.verified ? '✓ VERIFIED NGO' : 'PENDING ADMIN APPROVAL'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational Hub: {ngoProfile?.address || 'Tilakwadi, Belagavi'} • 10 KM Recommendation
            Engine
          </p>
        </div>

        <button
          onClick={() => onNavigate('belagavi-map')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>View 10KM Map</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-500 hover:text-slate-800 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Emergency Mesh Callout */}
      {emergencyAlerts.some((a) => a.status !== 'CLOSED' && a.status !== 'CANCELLED') && (
        <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-950 uppercase tracking-tight">
                  Belagavi Emergency 15 KM Mesh Active
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-900">
                  {emergencyAlerts.filter((a) => a.status !== 'CLOSED' && a.status !== 'CANCELLED').length} Live SOS
                </span>
              </div>
              <p className="text-xs text-red-800">
                Critical distress incidents require rapid NGO response, relief dispatch, or verification sign-off.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('emergency')}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Emergency SOS Control</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/90">
          <span className="text-xs text-slate-500 font-medium">10 KM Match Queue</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {matches.filter((m) => m.status === 'RECOMMENDED').length}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Ready for acceptance</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90">
          <span className="text-xs text-slate-500 font-medium">Pending Dispatch</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {
              acceptedDonations.filter(
                (d) =>
                  d.status === 'PICKUP_ASSIGNMENT_PENDING' ||
                  d.task?.status === 'DECLINED' ||
                  !d.assignedVolunteerId
              ).length
            }
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting driver</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90">
          <span className="text-xs text-slate-500 font-medium">Active In-Transit</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {
              acceptedDonations.filter((d) =>
                ['PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
              ).length
            }
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">En route to hub</span>
        </div>

        <div className="p-4 bg-white rounded-xl border-2 border-teal-500/80 bg-teal-50/20 shadow-xs">
          <span className="text-xs text-teal-800 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Awaiting Verification
          </span>
          <div className="text-2xl font-black text-teal-700 mt-1">
            {awaitingVerificationTasks.length}
          </div>
          <span className="text-[11px] text-teal-700 font-bold">Ready for sign-off</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Available Logistics</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {availableVolunteers.filter((v) => v.available && v.currentTaskCount < v.maxTasks).length}
          </div>
          <span className="text-[11px] text-slate-500">Verified Belagavi drivers</span>
        </div>
      </div>

      {/* SECTION: Deliveries Awaiting Verification */}
      <div
        id="deliveries-awaiting-verification-section"
        className="bg-white rounded-xl border-2 border-slate-900 p-5 space-y-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-300 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Deliveries Awaiting Verification
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                  NGO Sign-Off Stage
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inspect volunteer handover report, review proof photo, and sign off completion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-300">
              {awaitingVerificationTasks.length} Tasks Pending Sign-Off
            </span>
          </div>
        </div>

        {awaitingVerificationTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <p className="font-semibold text-slate-700">All delivered tasks have been verified and signed off.</p>
            <p>When volunteer drivers deliver surplus food to your hub and submit proof, tasks will appear here for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {awaitingVerificationTasks.map((t) => {
              const don = t.donation;
              return (
                <div
                  key={t._id}
                  id={`verification-task-card-${t._id}`}
                  className="p-4 rounded-xl border-2 border-teal-400 bg-teal-50/20 hover:bg-teal-50/40 transition-colors space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {don?.foodName || 'Surplus Food Batch'}
                        </h3>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {don?.quantity} {don?.unit}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {don?.category}
                        </span>
                        <StatusBadge status={t.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600">
                        Donor: <strong className="text-slate-800">{don?.donorName || 'Partner Donor'}</strong> • Assigned Volunteer: <strong className="text-slate-800">{t.assignedVolunteerName || t.volunteer?.user?.name || 'Volunteer Driver'}</strong> ({t.volunteerVehicle || 'Two-Wheeler'})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      <button
                        id={`review-delivery-btn-${t._id}`}
                        onClick={() => setReviewModalTask(t)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Review Delivery</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-teal-200/60 text-xs text-slate-700">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold uppercase">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Pickup Location
                      </div>
                      <p className="font-semibold text-slate-900 truncate">{t.pickupAddress}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold uppercase">
                        <Navigation className="w-3.5 h-3.5 text-blue-600" /> NGO Destination
                      </div>
                      <p className="font-semibold text-slate-900 truncate">{t.deliveryAddress}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold uppercase">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Delivery Handover Time
                      </div>
                      <p className="font-semibold text-slate-900">
                        {t.deliveryTimestamp ? new Date(t.deliveryTimestamp).toLocaleString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {/* Proof photo thumbnail & handover inspection notes preview */}
                  <div className="p-3 bg-white rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center gap-3">
                    {t.proofImageUrl && (
                      <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-300 bg-black cursor-pointer" onClick={() => setReviewModalTask(t)}>
                        <img
                          src={t.proofImageUrl}
                          alt="Proof preview"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="text-xs space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                        Volunteer Handover Notes
                      </span>
                      <p className="text-slate-800 italic line-clamp-2">
                        "{t.proofNotes || 'Handover completed in good condition.'}"
                      </p>
                    </div>
                    <button
                      type="button"
                      id={`inspect-proof-link-${t._id}`}
                      onClick={() => setReviewModalTask(t)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 self-end sm:self-center"
                    >
                      Inspect Full Proof →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 10 KM Matches Recommendation Queue */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Recommended Surplus Food Matches (10 KM Radius)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {matches.filter((m) => m.status === 'RECOMMENDED').length} pending review
          </span>
        </div>

        {matches.filter((m) => m.status === 'RECOMMENDED').length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No pending surplus matches right now. You will be alerted in real time when local
            Belagavi donors list food.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {matches
              .filter((m) => m.status === 'RECOMMENDED')
              .map((m) => {
                const don = m.donation;
                if (!don) return null;
                const isExpired = new Date(don.expiryTime).getTime() <= Date.now();

                return (
                  <div
                    key={m._id}
                    id={`match-row-${m._id}`}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{don.foodName}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {m.recommendationScore}% Match Score
                        </span>
                        {don.isVegetarian && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            VEG
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            EXPIRED
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Quantity:{' '}
                          <strong>
                            {don.quantity} {don.unit}
                          </strong>
                        </span>
                        <span>Category: {don.category}</span>
                        <span className="text-blue-700 font-semibold">
                          Distance: {m.distanceKm} km from NGO
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Expiry:{' '}
                          {new Date(don.expiryTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Pickup: {don.pickupAddress}</span>
                        <span className="text-slate-400">• Donor: {don.donorName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleRejectMatch(m._id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-red-50 hover:text-red-700 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        id={`accept-match-${m._id}`}
                        onClick={() => setAcceptingMatch(m)}
                        disabled={isExpired}
                        className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-colors flex items-center gap-1 ${
                          isExpired
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Food</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Available Belagavi Volunteer Logistics & Accepted Donations Section */}
      <div
        id="available-belagavi-volunteer-logistics-section"
        className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Available Belagavi Volunteer Logistics
              </h2>
              <p className="text-xs text-slate-500">
                Manage surplus pickups, dispatch verified drivers & monitor transit across Belagavi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {availableVolunteers.length} Verified Drivers
            </span>
          </div>
        </div>

        {/* Accepted Food Donations Requiring Volunteer Logistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Accepted Food Donations Requiring Pickup Logistics ({acceptedDonations.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Step 2 of NGO Workflow: Select and dispatch volunteer
            </span>
          </div>

          {acceptedDonations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No accepted surplus food donations currently pending logistics. Accept a recommended
              match above to initiate pickup assignment.
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedDonations.map((don) => {
                const isAssignmentPending =
                  don.status === 'PICKUP_ASSIGNMENT_PENDING' ||
                  don.task?.status === 'DECLINED' ||
                  !don.assignedVolunteerId;
                const isDeclined = don.task?.status === 'DECLINED';
                const isExpired = don.isExpired;

                return (
                  <div
                    key={don._id}
                    id={`accepted-donation-card-${don._id}`}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isDeclined
                        ? 'border-rose-300 bg-rose-50/40'
                        : isAssignmentPending
                        ? 'border-blue-400 bg-blue-50/30 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Donation Info */}
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{don.foodName}</h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            {don.quantity} {don.unit}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {don.category}
                          </span>
                          <StatusBadge status={don.status} size="sm" />
                          {isExpired && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              EXPIRED
                            </span>
                          )}
                        </div>

                        {/* Location Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-medium">Donor:</span>
                            <strong className="text-slate-800">{don.donorName}</strong>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              Cutoff:{' '}
                              <strong>
                                {new Date(don.expiryTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </strong>{' '}
                              ({don.remainingHours}h remaining)
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5 sm:col-span-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-slate-800">Pickup:</strong> {don.pickupAddress}
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5 sm:col-span-2">
                            <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-slate-800">NGO Destination:</strong>{' '}
                              {don.acceptedDeliveryAddress ||
                                ngoProfile?.address ||
                                'Belagavi Shelter Hub, Tilakwadi'}
                            </span>
                          </div>
                        </div>

                        {/* Assigned Volunteer or Declined Notice */}
                        {isDeclined ? (
                          <div className="p-2.5 rounded-lg bg-rose-100 border border-rose-300 text-xs text-rose-900 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>
                                <strong>Volunteer Declined:</strong> {don.task?.declineReason || 'Unavailable'}. Please reassign to an available driver.
                              </span>
                            </div>
                          </div>
                        ) : don.assignedVolunteer ? (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              <span>
                                Assigned Volunteer:{' '}
                                <strong className="text-slate-900">
                                  {don.assignedVolunteer.user?.name || don.assignedVolunteerName}
                                </strong>{' '}
                                ({don.assignedVolunteer.transportType})
                              </span>
                              {don.assignmentTimestamp && (
                                <span className="text-[11px] text-slate-500">
                                  • {new Date(don.assignmentTimestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              Task Status: {don.task?.status || 'ASSIGNED'}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        {/* 1. Assign Volunteer Button */}
                        {isAssignmentPending && (
                          <button
                            id={`assign-volunteer-btn-${don._id}`}
                            onClick={() => openAssignModal(don, false)}
                            disabled={isExpired}
                            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all ${
                              isExpired
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-500/20'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Assign Volunteer</span>
                          </button>
                        )}

                        {/* 2. Reassign Volunteer Button (if already assigned or declined) */}
                        {!isAssignmentPending &&
                          !isExpired &&
                          don.status !== 'COMPLETED' &&
                          don.status !== 'DELIVERED' && (
                            <button
                              id={`reassign-volunteer-btn-${don._id}`}
                              onClick={() => openAssignModal(don, true)}
                              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                            >
                              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                              <span>Reassign</span>
                            </button>
                          )}

                        {/* 3. Review Delivery Button if Proof Submitted */}
                        {don.task?.status === 'PROOF_SUBMITTED' && (
                          <button
                            id={`review-delivery-action-btn-${don._id}`}
                            onClick={() => setReviewModalTask(don.task)}
                            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-teal-500/20"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review Delivery</span>
                          </button>
                        )}

                        {/* 4. View Task Button */}
                        {(don.assignedTaskId || don.task) && (
                          <button
                            id={`view-task-btn-${don._id}`}
                            onClick={() => openTaskDetails(don)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Task</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Belagavi Active Volunteer Drivers Grid */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Belagavi Volunteers ({availableVolunteers.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableVolunteers.map((vol) => (
              <div
                key={vol._id}
                id={`volunteer-card-${vol._id}`}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900">
                      {vol.user?.name || 'Verified Volunteer'}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        vol.available && vol.currentTaskCount < vol.maxTasks
                          ? 'bg-emerald-500 ring-2 ring-emerald-100'
                          : 'bg-amber-500'
                      }`}
                      title={
                        vol.available && vol.currentTaskCount < vol.maxTasks
                          ? 'Available for dispatch'
                          : 'At current task capacity'
                      }
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {vol.transportType} • {vol.vehicleNumber || 'KA-22'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] flex items-center justify-between text-slate-600">
                  <span>
                    Load: <strong>{vol.currentTaskCount || 0}/{vol.maxTasks}</strong>
                  </span>
                  <span className="font-semibold text-amber-700">★ {vol.rating || 5.0}</span>
                  <span className="text-slate-500">{vol.completedDeliveries || 0} done</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accept Match Modal */}
      {acceptingMatch && (
        <div
          id="accept-match-modal"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Food Acceptance & Hub Destination
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Accepting <strong>{acceptingMatch.donation?.foodName}</strong> (
              {acceptingMatch.donation?.quantity} {acceptingMatch.donation?.unit}) from{' '}
              {acceptingMatch.donation?.donorName}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NGO Delivery Hub / Shelter in Belagavi
              </label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900">
              <strong>Workflow Note:</strong> Upon acceptance, this donation will move to{' '}
              <strong>"PICKUP ASSIGNMENT PENDING"</strong>. You can then select a volunteer driver
              for dispatch.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAcceptingMatch(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-accept-match-btn"
                disabled={actionLoading}
                onClick={handleAcceptMatch}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                {actionLoading ? 'Processing...' : 'Confirm Acceptance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Volunteer Modal */}
      {assignModalDonation && (
        <AssignVolunteerModal
          isOpen={!!assignModalDonation}
          onClose={() => setAssignModalDonation(null)}
          donation={assignModalDonation}
          ngo={ngoProfile || undefined}
          isReassigning={isReassigning}
          currentVolunteerName={assignModalDonation.assignedVolunteerName}
          onSuccess={() => {
            loadData();
            setActionFeedback({
              type: 'success',
              message: `Volunteer successfully ${
                isReassigning ? 'reassigned' : 'assigned'
              }! Status moved to "PICKUP ASSIGNED".`,
            });
          }}
        />
      )}

      {/* Task Details Modal */}
      {isTaskDetailsOpen && (
        <TaskDetailsModal
          isOpen={isTaskDetailsOpen}
          onClose={() => setIsTaskDetailsOpen(false)}
          taskId={detailsModalTaskId}
          donation={detailsModalDonation}
          ngo={ngoProfile || undefined}
          onReassignRequest={(donation) => {
            openAssignModal(donation, true);
          }}
          onStatusUpdated={() => {
            loadData();
          }}
        />
      )}

      {/* Review Delivery Modal */}
      {reviewModalTask && (
        <ReviewDeliveryModal
          isOpen={!!reviewModalTask}
          onClose={() => setReviewModalTask(null)}
          task={reviewModalTask}
          ngo={ngoProfile || undefined}
          onSuccess={(msg) => {
            loadData();
            setActionFeedback({
              type: 'success',
              message: msg,
            });
          }}
        />
      )}
    </div>
  );
};

export default NGODashboard;
