import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Donation, Match, Task } from '../types.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { BelagaviMap, MapMarker } from '../components/maps/BelagaviMap.tsx';
import {
  HeartHandshake,
  Clock,
  MapPin,
  Building2,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface DonationDetailsPageProps {
  donationId: string;
  onNavigate: (page: string) => void;
}

export const DonationDetailsPage: React.FC<DonationDetailsPageProps> = ({
  donationId,
  onNavigate,
}) => {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await api.getDonationById(donationId);
        if (res.success && res.donation) {
          setDonation(res.donation);
          setMatches(res.matches || []);
          setTask(res.task || null);
        } else {
          setError('Donation not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching donation');
      } finally {
        setLoading(false);
      }
    };

    if (donationId) {
      loadDetails();
    }
  }, [donationId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading donation records and NGO matches...
      </div>
    );
  }

  if (!donation || error) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">Donation Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={() => onNavigate('donor-dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const markers: MapMarker[] = [
    {
      id: donation._id,
      lat: donation.latitude,
      lng: donation.longitude,
      title: `Pickup: ${donation.foodName}`,
      type: 'DONATION',
      status: donation.status,
      description: donation.pickupAddress,
    },
  ];

  if (task) {
    markers.push({
      id: task._id,
      lat: task.deliveryLat,
      lng: task.deliveryLng,
      title: `Delivery: ${task.deliveryAddress}`,
      type: 'NGO',
      description: 'NGO Distribution Hub',
    });
  }

  const pipelineSteps = [
    'ACTIVE',
    'MATCHED',
    'PICKUP_ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED',
  ];

  const currentStepIndex = pipelineSteps.indexOf(donation.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => onNavigate('donor-dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Donor Dashboard</span>
      </button>

      {/* Main Details Card */}
      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{donation.foodName}</h1>
              <StatusBadge status={donation.status} size="lg" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Listed by <strong>{donation.donorName}</strong> on{' '}
              {new Date(donation.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-slate-900">
              {donation.quantity} <span className="text-sm font-semibold text-slate-500">{donation.unit}</span>
            </span>
            <div className="text-xs font-medium text-blue-600">{donation.category}</div>
          </div>
        </div>

        {/* Visual Lifecycle Progress Bar */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Operational Lifecycle Status
          </span>
          <div className="grid grid-cols-7 gap-1 text-center">
            {pipelineSteps.map((step, idx) => {
              const isDone = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;
              return (
                <div key={step} className="space-y-1.5">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isDone
                        ? isCurrent
                          ? 'bg-blue-600 ring-2 ring-blue-400'
                          : 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[9px] uppercase font-bold tracking-tight block ${
                      isCurrent ? 'text-blue-700' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Food Specifications
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-100">
              <div>
                <span className="text-slate-500">Storage Information:</span>
                <p className="font-semibold text-slate-800">{donation.storageInformation}</p>
              </div>
              <div>
                <span className="text-slate-500">Dietary:</span>
                <p className="font-semibold text-slate-800">
                  {donation.isVegetarian ? '100% Pure Vegetarian' : 'Non-Vegetarian'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Preparation Time:</span>
                <p className="font-semibold text-slate-800">
                  {new Date(donation.preparationTime).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Safe Expiry / Cutoff:</span>
                <p className="font-semibold text-slate-800 text-rose-700">
                  {new Date(donation.expiryTime).toLocaleString()}
                </p>
              </div>
              {donation.shelfLifeEstimateHours && (
                <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-blue-800">
                  <span>AI Estimated Safe Window:</span>
                  <span className="font-bold">{donation.shelfLifeEstimateHours} hours</span>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Safety Note:</strong> Physical organoleptic test (smell, visual check) must be completed by the volunteer and NGO before feeding beneficiaries.
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Belagavi Logistics & Matching
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-100">
              <div>
                <span className="text-slate-500">Pickup Address:</span>
                <p className="font-semibold text-slate-800">{donation.pickupAddress}</p>
              </div>
              <div>
                <span className="text-slate-500">Contact Person:</span>
                <p className="font-semibold text-slate-800">
                  {donation.contactName} ({donation.contactPhone})
                </p>
              </div>
              {task && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Delivery Destination:</span>
                  <p className="font-semibold text-slate-800">{task.deliveryAddress}</p>
                </div>
              )}
            </div>

            {/* Interactive Map */}
            <BelagaviMap markers={markers} height="190px" showRadiusKm={10} />
          </div>
        </div>

        {/* Recommended Matches Section */}
        {matches.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Recommended NGO Matches (Within 10 KM Belagavi Radius)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matches.map((m) => (
                <div
                  key={m._id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      {m.ngo?.orgName || 'Verified Belagavi Food Bank'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Distance: <strong>{m.distanceKm} km</strong> • Match Score:{' '}
                      <strong>{m.recommendationScore}%</strong>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      Status: {m.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      10 KM Radius
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Proof (If Submitted) */}
        {task?.proofImageUrl && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Delivery Proof Verification</span>
            </h3>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-4">
              <img
                src={task.proofImageUrl}
                alt="Delivery proof"
                className="w-20 h-20 object-cover rounded-lg border border-emerald-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Volunteer Handover Completed</span>
                <p className="text-slate-600 mt-0.5">{task.proofNotes}</p>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  {task.verifiedByNgo ? '✓ Verified by NGO Field Supervisor' : 'Awaiting NGO sign-off'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
