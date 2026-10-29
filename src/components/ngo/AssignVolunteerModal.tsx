import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  ShieldCheck,
  AlertTriangle,
  Send,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { Donation, Volunteer, User, NGO } from '../../types.ts';
import { api } from '../../services/api.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface RecommendedVolunteer extends Volunteer {
  user?: User;
  distanceKm?: number;
  recommendationScore?: number;
  transportSuitability?: string;
  recommendationReason?: string;
  isRecommended?: boolean;
}

interface AssignVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation;
  ngo?: NGO;
  isReassigning?: boolean;
  currentVolunteerName?: string;
  onSuccess: () => void;
}

export const AssignVolunteerModal: React.FC<AssignVolunteerModalProps> = ({
  isOpen,
  onClose,
  donation,
  ngo,
  isReassigning = false,
  currentVolunteerName,
  onSuccess,
}) => {
  const [volunteers, setVolunteers] = useState<RecommendedVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [instructions, setInstructions] = useState(
    'Keep insulated thermal containers closed. Verify food condition and aroma with donor upon collection.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpired = new Date(donation.expiryTime).getTime() <= Date.now();

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSelectedVolunteerId('');

    api
      .getRecommendedVolunteers({
        donationId: donation._id,
        pickupLat: donation.latitude,
        pickupLng: donation.longitude,
        quantity: donation.quantity,
        category: donation.category,
      })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.volunteers) {
          setVolunteers(res.volunteers);
          // Auto-select the top recommended available volunteer if available
          const topCandidate = res.volunteers.find(
            (v: RecommendedVolunteer) => v.available && v.currentTaskCount < v.maxTasks
          );
          if (topCandidate) {
            setSelectedVolunteerId(topCandidate._id);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load volunteer logistics network.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, donation]);

  if (!isOpen) return null;

  const handleConfirmAssignment = async () => {
    if (isExpired) {
      setError('This donation has expired and cannot receive a pickup assignment.');
      return;
    }

    if (!selectedVolunteerId) {
      setError('Please select a verified volunteer from the logistics list.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isReassigning) {
        await api.reassignVolunteer({
          donationId: donation._id,
          volunteerId: selectedVolunteerId,
          instructions,
        });
      } else {
        await api.assignVolunteer({
          donationId: donation._id,
          volunteerId: selectedVolunteerId,
          instructions,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign volunteer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'TWO_WHEELER':
        return '🏍️ Two-Wheeler';
      case 'FOUR_WHEELER':
        return '🚗 Four-Wheeler';
      case 'VAN':
        return '🚐 High-Capacity Van';
      default:
        return '🚶 Eco Courier';
    }
  };

  return (
    <div
      id="assign-volunteer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        id="assign-volunteer-modal-container"
        className="bg-white rounded-2xl border-2 border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                {isReassigning ? 'Reassign Belagavi Volunteer' : 'Assign Belagavi Volunteer Logistics'}
              </h2>
              <p className="text-xs text-slate-300">
                Dispatch verified neighborhood volunteers for secure surplus food transport
              </p>
            </div>
          </div>
          <button
            id="close-assign-volunteer-modal-btn"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Donation Summary Box */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{donation.foodName}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {donation.quantity} {donation.unit}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {donation.category}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Donor: <span className="font-semibold text-slate-900">{donation.donorName}</span> • Phone: {donation.donorPhone || donation.contactPhone || 'Provided upon dispatch'}
                </div>
              </div>
              <StatusBadge status={donation.status} size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">
                  <strong className="text-slate-900">Pickup:</strong> {donation.pickupAddress}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">
                  <strong className="text-slate-900">Delivery Hub:</strong>{' '}
                  {donation.acceptedDeliveryAddress || ngo?.address || 'Belagavi Shelter Hub'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 sm:col-span-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong className="text-slate-900">Expiry Cutoff:</strong>{' '}
                  {new Date(donation.expiryTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  ({new Date(donation.expiryTime).toLocaleDateString()})
                  {isExpired && (
                    <span className="ml-2 font-bold text-rose-600">⚠️ EXPIRED</span>
                  )}
                </span>
              </div>
            </div>

            {isReassigning && currentVolunteerName && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Current Assignment:</strong> {currentVolunteerName}. Selecting a new volunteer will update the active dispatch task.
              </div>
            )}
          </div>

          {/* Expired Warning Banner */}
          {isExpired && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Food Safety Protocol: Expiry Cutoff Passed</strong>
                This donation has expired and cannot be assigned to volunteers for community distribution.
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {/* Volunteer Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Select Verified Volunteer ({volunteers.length} active in Belagavi network)
              </label>
              <span className="text-[11px] text-slate-500">
                Ranked by proximity, load & vehicle capacity
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Analyzing volunteer locations and vehicle capacity...</p>
              </div>
            ) : volunteers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No active volunteers currently online in Belagavi.
              </div>
            ) : (
              <div className="space-y-2.5">
                {volunteers.map((vol) => {
                  const isSelected = selectedVolunteerId === vol._id;
                  const isBusy = !vol.available || vol.currentTaskCount >= vol.maxTasks;

                  return (
                    <div
                      key={vol._id}
                      id={`volunteer-option-${vol._id}`}
                      onClick={() => {
                        if (!isExpired) {
                          setSelectedVolunteerId(vol._id);
                        }
                      }}
                      className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-700 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      } ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Radio Button */}
                          <div className="pt-0.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-blue-700 bg-blue-700 text-white'
                                  : 'border-slate-400 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900">
                                {vol.user?.name || 'Verified Volunteer'}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {getTransportIcon(vol.transportType)} • {vol.vehicleNumber || 'KA-22'}
                              </span>
                              {vol.isRecommended && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {vol.recommendationScore}% Match
                                </span>
                              )}
                            </div>

                            {/* Volunteer Metrics Grid */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {vol.distanceKm ? `${vol.distanceKm.toFixed(1)} km from pickup` : 'In city hub'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                {vol.rating || 5.0}★ ({vol.completedDeliveries || 0} deliveries)
                              </span>
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isBusy ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                />
                                Load: {vol.currentTaskCount || 0}/{vol.maxTasks} tasks active
                              </span>
                            </div>

                            {/* Recommendation Reason */}
                            {vol.recommendationReason && (
                              <div className="text-[11px] text-blue-700 font-medium mt-1">
                                {vol.recommendationReason} • {vol.transportSuitability}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verified Badge */}
                        <div className="shrink-0 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dispatch Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Special Handling & Pickup Instructions
            </label>
            <textarea
              id="volunteer-assignment-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
              placeholder="e.g. Call coordinator upon arrival at Club Road entrance..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            id="cancel-assign-volunteer-btn"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            id="confirm-volunteer-assignment-btn"
            onClick={handleConfirmAssignment}
            disabled={submitting || isExpired || !selectedVolunteerId}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-2 transition-all ${
              submitting || isExpired || !selectedVolunteerId
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-500/25'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Confirming Dispatch...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isReassigning ? 'Confirm Reassignment' : 'Confirm Assignment'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AssignVolunteerModal;
