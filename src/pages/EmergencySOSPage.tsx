import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { EmergencyAlert } from '../types.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { BelagaviMap, MapMarker } from '../components/maps/BelagaviMap.tsx';
import { StartDispatchModal } from '../components/emergency/StartDispatchModal.tsx';
import { ReliefDeliveryModal } from '../components/emergency/ReliefDeliveryModal.tsx';
import { EmergencyVerificationModal } from '../components/emergency/EmergencyVerificationModal.tsx';
import { EmergencyRejectProofModal } from '../components/emergency/EmergencyRejectProofModal.tsx';
import { EmergencyTimeline } from '../components/emergency/EmergencyTimeline.tsx';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Send,
  Building2,
  CheckCircle2,
  Phone,
  ShieldAlert,
  Truck,
  RotateCw,
  Camera,
  ShieldCheck,
  CheckCheck,
  XCircle,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const EmergencySOSPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'all'>('active');
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  // Broadcast Form
  const [formData, setFormData] = useState({
    foodType: 'Prepared Cooked Meals',
    category: 'Prepared Meals',
    quantityNeeded: '50 Meals & Water',
    address: 'Near Belagavi Railway Station, Station Road',
    latitude: 15.859,
    longitude: 74.509,
    urgencyReason: 'Stranded migrant worker group with families without food since morning.',
    durationHours: 4,
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedAlertForResponse, setSelectedAlertForResponse] = useState<EmergencyAlert | null>(null);
  const [responseNote, setResponseNote] = useState('Our rapid relief team is mobilizing with 60 meal packets and water.');
  const [selectedAlertForDispatch, setSelectedAlertForDispatch] = useState<EmergencyAlert | null>(null);
  const [selectedAlertForDelivery, setSelectedAlertForDelivery] = useState<EmergencyAlert | null>(null);
  const [selectedAlertForVerify, setSelectedAlertForVerify] = useState<EmergencyAlert | null>(null);
  const [selectedAlertForReject, setSelectedAlertForReject] = useState<EmergencyAlert | null>(null);

  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getEmergencyAlerts();
      if (res.success) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      console.warn('Error fetching emergency alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    const handleStoreUpdated = () => {
      loadAlerts();
    };

    window.addEventListener('mealbridge_demo_store_updated', handleStoreUpdated);
    window.addEventListener('storage', handleStoreUpdated);

    return () => {
      window.removeEventListener('mealbridge_demo_store_updated', handleStoreUpdated);
      window.removeEventListener('storage', handleStoreUpdated);
    };
  }, [loadAlerts]);

  const toggleTimeline = (id: string) => {
    setExpandedTimelines((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBroadcasting(true);
    try {
      const res = await api.createEmergencySOS(formData);
      if (res.success) {
        setShowBroadcastForm(false);
        await loadAlerts();
        setActionFeedback({
          type: 'success',
          message: `🚨 SOS Broadcasted! Alerted ${res.notifiedNgos} verified NGOs within 15 KM radius in Belagavi.`,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to broadcast SOS');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedAlertForResponse) return;
    try {
      const res = await api.respondToEmergency(selectedAlertForResponse._id, {
        responseNote,
        reliefType: 'Prepared Cooked Meals & Water',
        reliefQuantity: selectedAlertForResponse.quantityNeeded,
      });
      if (res.success) {
        setSelectedAlertForResponse(null);
        await loadAlerts();
        setActionFeedback({
          type: 'success',
          message: 'Emergency response confirmed! Status moved to RESPONDED. You can now Start Dispatch.',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to respond to emergency');
    }
  };

  const handleMarkInProgress = async (alertId: string) => {
    try {
      const res = await api.markEmergencyInProgress(alertId);
      if (res.success) {
        await loadAlerts();
        setActionFeedback({
          type: 'success',
          message: 'Relief mission marked IN PROGRESS. Live operational state active.',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark in progress');
    }
  };

  // Filtered alerts
  const awaitingVerificationAlerts = alerts.filter(
    (a) => a.status === 'DELIVERED' || a.status === 'PROOF_SUBMITTED'
  );
  const activeAlerts = alerts.filter((a) => a.status !== 'CLOSED' && a.status !== 'CANCELLED');
  const closedAlerts = alerts.filter((a) => a.status === 'CLOSED');

  const displayedAlerts =
    activeTab === 'active'
      ? activeAlerts
      : activeTab === 'history'
      ? closedAlerts
      : alerts;

  const markers: MapMarker[] = alerts.map((a) => ({
    id: a._id,
    lat: a.latitude,
    lng: a.longitude,
    title: `SOS: ${a.foodType}`,
    type: 'EMERGENCY',
    status: a.status,
    description: `${a.quantityNeeded} • ${a.status}`,
    info: a.address,
  }));

  const isNgo = user?.role === 'NGO' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Belagavi 15 KM Rapid Emergency Mesh</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Emergency Food SOS Operations</h1>
          <p className="text-xs text-rose-100 mt-1 max-w-xl leading-relaxed">
            Full operational lifecycle from citizen distress broadcast to NGO dispatch, live field transit, delivery verification, and official sign-off.
          </p>
        </div>

        <button
          id="trigger-sos-btn"
          onClick={() => setShowBroadcastForm(!showBroadcastForm)}
          className="px-4 py-2.5 rounded-xl bg-white text-red-700 font-bold text-xs hover:bg-rose-50 shadow-md transition-all self-start sm:self-auto shrink-0 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{showBroadcastForm ? 'Close SOS Form' : 'Broadcast New SOS'}</span>
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
            <span className="font-semibold">{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-500 hover:text-slate-800 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION: EMERGENCY RELIEF AWAITING VERIFICATION (Requirement 6) */}
      {awaitingVerificationAlerts.length > 0 && (
        <div
          id="emergency-relief-awaiting-verification-card"
          className="bg-white rounded-2xl border-2 border-slate-900 p-5 space-y-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-300 flex items-center justify-center text-teal-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Emergency Relief Awaiting Verification
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                    NGO Sign-Off Pending
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Relief has been delivered on site. Review driver handover notes & photo proof to sign off and close the incident.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-300 self-start sm:self-auto">
              {awaitingVerificationAlerts.length} Awaiting Verification
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {awaitingVerificationAlerts.map((item) => (
              <div
                key={item._id}
                id={`awaiting-verify-item-${item._id}`}
                className="p-4 rounded-xl border border-teal-300 bg-teal-50/20 hover:bg-teal-50/40 transition-colors space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                      <h3 className="text-base font-extrabold text-slate-900">
                        {item.foodType}
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                        {item.deliveredQuantity || item.reliefQuantity || item.quantityNeeded} Delivered
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <p className="text-xs text-slate-600">
                      Destination: <strong className="text-slate-900">{item.address}</strong> • Driver:{' '}
                      <strong className="text-slate-900">{item.assignedVolunteerName || 'Field Volunteer'}</strong> ({item.vehicleType || 'Relief Vehicle'})
                    </p>
                  </div>

                  {/* NGO Verification Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      id={`reject-proof-btn-${item._id}`}
                      onClick={() => setSelectedAlertForReject(item)}
                      className="px-3.5 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Proof</span>
                    </button>

                    <button
                      id={`verify-close-sos-btn-${item._id}`}
                      onClick={() => setSelectedAlertForVerify(item)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Close SOS</span>
                    </button>
                  </div>
                </div>

                {/* Handover & Photo Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-teal-200/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 block">
                      Handover Timestamp
                    </span>
                    <p className="font-semibold text-slate-800">
                      {item.deliveredAt ? new Date(item.deliveredAt).toLocaleString() : 'Just now'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 block">
                      Field / Recipient Notes
                    </span>
                    <p className="font-medium text-slate-700 italic">
                      "{item.recipientNotes || 'Handover received on site.'}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 block">
                      Driver Delivery Report
                    </span>
                    <p className="font-medium text-slate-700 italic">
                      "{item.deliveryNotes || 'Distributed to beneficiaries in orderly manner.'}"
                    </p>
                  </div>
                </div>

                {item.proofPhotoUrl && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={item.proofPhotoUrl}
                      alt="Delivery proof"
                      className="w-24 h-16 rounded-lg object-cover border border-slate-300 bg-black cursor-pointer hover:opacity-90"
                      onClick={() => setSelectedAlertForVerify(item)}
                    />
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-800 block">Photo Proof Attached</span>
                      <span className="text-[11px] text-slate-500">Click photo or 'Verify & Close SOS' to review full audit documentation.</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map with 15 KM Emergency Circle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Emergency Incidents (15 KM Radius)
          </h2>
          <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            15 KM Belagavi Coverage
          </span>
        </div>
        <BelagaviMap
          markers={markers}
          showRadiusKm={15}
          radiusType="EMERGENCY"
          height="320px"
        />
      </div>

      {/* Broadcast Form */}
      {showBroadcastForm && (
        <div className="bg-white border-2 border-red-300 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Create Emergency Food SOS Broadcast
            </h2>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Type Needed *
                </label>
                <input
                  type="text"
                  required
                  value={formData.foodType}
                  onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                  placeholder="e.g. Prepared Meals, Baby Food, Bread"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Required *
                </label>
                <input
                  type="text"
                  required
                  value={formData.quantityNeeded}
                  onChange={(e) => setFormData({ ...formData, quantityNeeded: e.target.value })}
                  placeholder="e.g. 50 Meals or 20 kg"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Distress Reason & Urgency Detail *
              </label>
              <textarea
                required
                rows={2}
                value={formData.urgencyReason}
                onChange={(e) => setFormData({ ...formData, urgencyReason: e.target.value })}
                placeholder="Explain the urgent situation and who needs immediate assistance..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Belagavi Location / Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Rate-limiting active: Users may submit 1 active SOS per 15 minutes.
              </span>
              <button
                type="submit"
                disabled={broadcasting}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {broadcasting ? 'Broadcasting...' : 'Broadcast to All 15KM NGOs'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs: Active Incidents vs Closed History */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Active Incidents & Operations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-800">
              {activeAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Emergency History (Closed)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
              {closedAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({alerts.length})
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">
            {activeTab === 'active'
              ? 'Active Emergency Incidents Mesh'
              : activeTab === 'history'
              ? 'Archived Emergency Relief History'
              : 'Complete Emergency SOS Feed'}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {displayedAlerts.length} incidents shown
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Loading emergency feed...</div>
        ) : displayedAlerts.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <p className="font-semibold text-slate-700">No emergency incidents found in this view.</p>
            <p>
              {activeTab === 'history'
                ? 'When emergency incidents are verified and closed, they will appear here.'
                : 'No active distress calls in Belagavi at this time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedAlerts.map((alert) => {
              const isTimelineExpanded = !!expandedTimelines[alert._id];

              return (
                <div
                  key={alert._id}
                  id={`sos-card-${alert._id}`}
                  className="p-5 hover:bg-slate-50/50 space-y-3 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          alert.status === 'ACTIVE'
                            ? 'bg-red-600 animate-pulse'
                            : alert.status === 'CLOSED'
                            ? 'bg-emerald-600'
                            : 'bg-blue-600'
                        }`}
                      />
                      <h3 className="text-base font-extrabold text-slate-900">{alert.foodType}</h3>
                      <StatusBadge status={alert.status} />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {alert.quantityNeeded} needed
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      Logged:{' '}
                      {new Date(alert.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Distress Description */}
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                    "{alert.urgencyReason}"
                  </p>

                  {/* Meta details */}
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Destination:</strong> {alert.address}
                    </span>
                    <span>
                      <strong>Reporter:</strong> {alert.reporterName} ({alert.reporterPhone})
                    </span>
                  </div>

                  {/* 1. RESPONDED STATE DISPLAY (Requirement 1) */}
                  {alert.status === 'RESPONDED' && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Building2 className="w-4 h-4 text-amber-700" />
                          <span>Responding NGO: {alert.respondedByNgoName || 'Verified Belagavi NGO'}</span>
                        </div>
                        {alert.respondedAt && (
                          <span className="text-[11px] text-amber-800 font-mono">
                            {new Date(alert.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <p className="italic text-slate-700">"{alert.responseNote}"</p>

                      <div className="text-[11px] text-slate-600">
                        Relief scheduled for dispatch: <strong>{alert.reliefQuantity || alert.quantityNeeded}</strong> ({alert.reliefType || 'Prepared Cooked Meals & Water'})
                      </div>

                      {/* Button: Start Dispatch */}
                      <div className="pt-1 flex justify-end">
                        <button
                          id={`start-dispatch-btn-${alert._id}`}
                          onClick={() => setSelectedAlertForDispatch(alert)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Start Dispatch</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. DISPATCHED STATE DISPLAY (Requirement 3) */}
                  {alert.status === 'DISPATCHED' && (
                    <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-sky-950">
                          <Truck className="w-4 h-4 text-sky-700" />
                          <span>Dispatched by {alert.respondedByNgoName || 'Verified NGO'}</span>
                        </div>
                        {alert.dispatchedAt && (
                          <span className="text-[11px] text-sky-800 font-mono">
                            Dispatched: {new Date(alert.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-medium">Assigned Driver:</span>{' '}
                          <strong className="text-slate-900">{alert.assignedVolunteerName || 'Field Volunteer'}</strong> ({alert.vehicleType || 'Vehicle'})
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Relief Quantity:</span>{' '}
                          <strong className="text-slate-900">{alert.reliefQuantity || alert.quantityNeeded}</strong> ({alert.reliefType || 'Prepared Food'})
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Destination:</span>{' '}
                          <span className="text-slate-800">{alert.address}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Driver Phone:</span>{' '}
                          <span className="text-slate-800">{alert.volunteerPhone || 'Available on dispatch'}</span>
                        </div>
                      </div>

                      {alert.dispatchNote && (
                        <p className="text-[11px] text-slate-600 italic">Note: "{alert.dispatchNote}"</p>
                      )}

                      {/* Button: Mark In Progress */}
                      <div className="pt-1 flex justify-end">
                        <button
                          id={`mark-in-progress-btn-${alert._id}`}
                          onClick={() => handleMarkInProgress(alert._id)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-600/20 flex items-center gap-1.5 transition-all"
                        >
                          <RotateCw className="w-4 h-4" />
                          <span>Mark In Progress</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. IN PROGRESS STATE DISPLAY (Requirement 4) */}
                  {alert.status === 'IN_PROGRESS' && (
                    <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
                          <span className="font-bold text-purple-950">Live Operational State: Field Team On Site</span>
                        </div>
                        {alert.inProgressAt && (
                          <span className="text-[11px] text-purple-800 font-mono">
                            Since {new Date(alert.inProgressAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Active Driver:</span>{' '}
                          <strong className="text-slate-900">{alert.assignedVolunteerName || 'Field Volunteer'}</strong> ({alert.vehicleType || 'Vehicle'})
                        </div>
                        <div>
                          <span className="text-slate-500">Relief:</span>{' '}
                          <strong className="text-slate-900">{alert.reliefQuantity || alert.quantityNeeded}</strong>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500">Destination:</span>{' '}
                          <span className="text-slate-800">{alert.address}</span>
                        </div>
                      </div>

                      {/* Button: Mark Relief Delivered */}
                      <div className="pt-1 flex justify-end">
                        <button
                          id={`mark-relief-delivered-btn-${alert._id}`}
                          onClick={() => setSelectedAlertForDelivery(alert)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Relief Delivered</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. DELIVERED / PROOF SUBMITTED (Requirement 5) */}
                  {(alert.status === 'DELIVERED' || alert.status === 'PROOF_SUBMITTED') && (
                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-teal-950">
                          <CheckCircle2 className="w-4 h-4 text-teal-700" />
                          <span>Relief Delivered — Awaiting NGO Verification</span>
                        </div>
                        {alert.deliveredAt && (
                          <span className="text-[11px] text-teal-800 font-mono">
                            Delivered: {new Date(alert.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Delivered Quantity:</span>{' '}
                          <strong className="text-slate-900">{alert.deliveredQuantity || alert.reliefQuantity || alert.quantityNeeded}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Recipient:</span>{' '}
                          <span className="text-slate-800">{alert.recipientNotes || 'On-site coordinator'}</span>
                        </div>
                      </div>

                      {alert.deliveryNotes && (
                        <p className="text-[11px] text-slate-600 italic">Notes: "{alert.deliveryNotes}"</p>
                      )}

                      {alert.proofPhotoUrl && (
                        <div className="pt-1">
                          <img
                            src={alert.proofPhotoUrl}
                            alt="Handover proof"
                            className="w-28 h-18 rounded-lg object-cover border border-slate-300"
                          />
                        </div>
                      )}

                      {/* Verification actions */}
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-teal-200/60">
                        <button
                          id={`card-reject-proof-btn-${alert._id}`}
                          onClick={() => setSelectedAlertForReject(alert)}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                        >
                          Reject Proof
                        </button>
                        <button
                          id={`card-verify-close-btn-${alert._id}`}
                          onClick={() => setSelectedAlertForVerify(alert)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Verify & Close SOS
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PROOF REJECTED STATE */}
                  {alert.status === 'PROOF_REJECTED' && (
                    <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs text-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Proof Rejected — Resubmission Required</span>
                      </div>
                      <p className="text-slate-700">
                        <strong>Reason:</strong> "{alert.proofRejectionReason}"
                      </p>
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => setSelectedAlertForDelivery(alert)}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                        >
                          Resubmit Delivery Proof
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 7. CLOSED INCIDENT DISPLAY (Requirement 7) */}
                  {alert.status === 'CLOSED' && (
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-700" />
                          <div>
                            <span className="font-extrabold text-emerald-950 text-sm">
                              Officially Verified & Permanently Closed
                            </span>
                            <span className="text-[11px] text-emerald-800 block">
                              Verified by: <strong>{alert.verifiedByUserName || alert.respondedByNgoName || 'Verified NGO'}</strong>
                            </span>
                          </div>
                        </div>
                        <StatusBadge status="CLOSED" size="lg" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-white p-3 rounded-lg border border-emerald-200/80">
                        <div>
                          <span className="text-slate-500 block">Responding NGO:</span>
                          <strong className="text-slate-900">{alert.respondedByNgoName || 'Annapurna Seva Trust'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Relief Provided:</span>
                          <strong className="text-slate-900">{alert.deliveredQuantity || alert.reliefQuantity || alert.quantityNeeded}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Verification Time:</span>
                          <strong className="text-slate-900">
                            {alert.verifiedAt ? new Date(alert.verifiedAt).toLocaleString() : 'Logged in audit'}
                          </strong>
                        </div>
                      </div>

                      {alert.verificationNotes && (
                        <p className="text-[11px] text-slate-700 italic">
                          Verification Sign-off Notes: "{alert.verificationNotes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* ACTIVE Incident Action */}
                  {alert.status === 'ACTIVE' && isNgo && (
                    <div className="pt-2 flex justify-end">
                      <button
                        id={`respond-sos-btn-${alert._id}`}
                        onClick={() => setSelectedAlertForResponse(alert)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-red-600/20"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Respond as NGO</span>
                      </button>
                    </div>
                  )}

                  {/* Lifecycle Timeline Toggle */}
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
                    <button
                      id={`toggle-timeline-btn-${alert._id}`}
                      onClick={() => toggleTimeline(alert._id)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-1"
                    >
                      <span>{isTimelineExpanded ? 'Hide' : 'View'} Complete Operational Lifecycle Timeline</span>
                      {isTimelineExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-[11px] text-slate-400">
                      ID: {alert._id}
                    </span>
                  </div>

                  {/* Embedded Lifecycle Timeline */}
                  {isTimelineExpanded && (
                    <div className="pt-2 animate-in fade-in">
                      <EmergencyTimeline alert={alert} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: NGO Respond Modal */}
      {selectedAlertForResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Respond to Emergency Food SOS
            </h3>
            <p className="text-xs text-slate-600">
              Dispatching relief to <strong>{selectedAlertForResponse.address}</strong> (
              {selectedAlertForResponse.quantityNeeded} needed).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch / Relief Commitment Note
              </label>
              <textarea
                rows={3}
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAlertForResponse(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-ngo-response-btn"
                onClick={handleRespond}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirm NGO Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Start Dispatch Modal (Requirement 2) */}
      {selectedAlertForDispatch && (
        <StartDispatchModal
          alert={selectedAlertForDispatch}
          onClose={() => setSelectedAlertForDispatch(null)}
          onSuccess={async (updated) => {
            setSelectedAlertForDispatch(null);
            await loadAlerts();
            setActionFeedback({
              type: 'success',
              message: `Relief dispatched to ${updated.address} with driver ${updated.assignedVolunteerName}.`,
            });
          }}
        />
      )}

      {/* MODAL 3: Submit Relief Delivery Modal (Requirement 5) */}
      {selectedAlertForDelivery && (
        <ReliefDeliveryModal
          alert={selectedAlertForDelivery}
          onClose={() => setSelectedAlertForDelivery(null)}
          onSuccess={async (updated) => {
            setSelectedAlertForDelivery(null);
            await loadAlerts();
            setActionFeedback({
              type: 'success',
              message: 'Delivery proof submitted! Incident is now awaiting NGO verification sign-off.',
            });
          }}
        />
      )}

      {/* MODAL 4: Verify & Close Modal (Requirement 6) */}
      {selectedAlertForVerify && (
        <EmergencyVerificationModal
          alert={selectedAlertForVerify}
          onClose={() => setSelectedAlertForVerify(null)}
          onSuccess={async (updated) => {
            setSelectedAlertForVerify(null);
            await loadAlerts();
            setActionFeedback({
              type: 'success',
              message: `Emergency SOS officially verified and CLOSED! Archived in emergency history.`,
            });
          }}
        />
      )}

      {/* MODAL 5: Reject Proof Modal (Requirement 4/6) */}
      {selectedAlertForReject && (
        <EmergencyRejectProofModal
          alert={selectedAlertForReject}
          onClose={() => setSelectedAlertForReject(null)}
          onSuccess={async (updated) => {
            setSelectedAlertForReject(null);
            await loadAlerts();
            setActionFeedback({
              type: 'success',
              message: 'Relief proof rejected. Driver has been notified to resubmit.',
            });
          }}
        />
      )}
    </div>
  );
};
