import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Clock,
  Phone,
  User,
  ShieldCheck,
  Navigation,
  Check,
  AlertTriangle,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Task, NGO, Donation } from '../../types.ts';
import { api } from '../../services/api.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface ReviewDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  ngo?: NGO;
  onSuccess: (message: string) => void;
}

export const ReviewDeliveryModal: React.FC<ReviewDeliveryModalProps> = ({
  isOpen,
  onClose,
  task,
  ngo,
  onSuccess,
}) => {
  const [verificationNotes, setVerificationNotes] = useState(
    'Food inspected on arrival at hub: temperature safe, container seals intact, full portion count verified.'
  );
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmVerifyOpen, setConfirmVerifyOpen] = useState(false);
  const [fullImagePreview, setFullImagePreview] = useState(false);

  if (!isOpen || !task) return null;

  const donation = task.donation;
  const isCompleted = task.status === 'COMPLETED' || task.status === 'VERIFIED';
  const isRejected = task.status === 'PROOF_REJECTED';

  // Lifecycle steps audit trail
  const lifecycleSteps = [
    { key: 'ACTIVE', label: 'Donation Listed', timestamp: donation?.createdAt, done: true },
    { key: 'MATCHED', label: '10KM Match Accepted', timestamp: task.acceptedAt || donation?.acceptedAt, done: true },
    { key: 'PICKUP_ASSIGNED', label: 'Volunteer Assigned', timestamp: task.assignedAt, done: true },
    { key: 'PICKED_UP', label: 'Picked Up by Driver', timestamp: task.pickupTimestamp, done: true },
    { key: 'IN_TRANSIT', label: 'In Transit', timestamp: task.pickupTimestamp, done: true },
    { key: 'DELIVERED', label: 'Arrived at Hub', timestamp: task.deliveryTimestamp, done: true },
    { key: 'PROOF_SUBMITTED', label: 'Proof Submitted', timestamp: task.deliveryTimestamp || task.updatedAt, done: true },
    {
      key: 'COMPLETED',
      label: isCompleted ? 'Verified & Completed' : 'Awaiting NGO Sign-off',
      timestamp: task.verifiedAt,
      done: isCompleted,
    },
  ];

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyDelivery(task._id, {
        verificationNotes,
      });

      if (res.success) {
        setConfirmVerifyOpen(false);
        onSuccess(
          `Delivery verified and completed! "${donation?.foodName || 'Donation'}" closed with full audit sign-off.`
        );
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify delivery.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejecting the delivery proof.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.rejectProof(task._id, {
        rejectionReason: rejectionReason.trim(),
      });

      if (res.success) {
        setIsRejecting(false);
        onSuccess(
          `Proof rejected. Task kept open and assigned volunteer has been notified to resubmit.`
        );
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject proof.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="review-delivery-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        id="review-delivery-modal-container"
        className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl max-w-3xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  NGO Delivery Verification & Handover Sign-Off
                </h2>
                <StatusBadge status={task.status} size="sm" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Review volunteer proof, verify food safety, and sign off handover completion
              </p>
            </div>
          </div>
          <button
            id="close-review-delivery-modal-btn"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification Status Banner */}
          {isCompleted ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <strong className="block text-sm font-bold">Delivery Already Verified & Completed</strong>
                <span>
                  Signed off by {task.verifiedByUserName || ngo?.orgName || 'NGO'} on{' '}
                  {task.verifiedAt ? new Date(task.verifiedAt).toLocaleString() : 'Record'}. Notes: "
                  {task.verificationNotes || 'Verified'}".
                </span>
              </div>
            </div>
          ) : isRejected ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs">
                <strong className="block text-sm font-bold">Proof Rejected — Resubmission Pending</strong>
                <span>
                  Rejection reason: <em>"{task.proofRejectionReason || 'Pending clearer proof'}"</em>. Assigned volunteer has been notified to resubmit.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Awaiting NGO Sign-off:</strong> Volunteer has arrived at your Belagavi hub and uploaded delivery proof.
                </span>
              </div>
              <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                Task ID: {task._id}
              </span>
            </div>
          )}

          {/* Proof Photo & Handover Notes (Highlight Section) */}
          <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Volunteer Delivery Proof & Handover Report
                </h3>
              </div>
              {task.deliveryTimestamp && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Delivered:{' '}
                  <strong>{new Date(task.deliveryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proof Photo */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">Proof of Handover Photo</span>
                {task.proofImageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border-2 border-slate-300 bg-black aspect-video flex items-center justify-center">
                    <img
                      src={task.proofImageUrl}
                      alt="Delivery Handover Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFullImagePreview(true)}
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/75 hover:bg-black text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 backdrop-blur-xs transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Expand
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-100 rounded-xl border border-dashed border-slate-300">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* Handover Inspection Notes */}
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Volunteer Handover & Inspection Notes
                  </span>
                  <div className="p-3.5 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 leading-relaxed shadow-2xs">
                    {task.proofNotes || (
                      <em className="text-slate-400">No additional notes submitted by driver.</em>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Belagavi Food Safety Protocol
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    Verify hot dishes maintain {'>'}60°C or clean cold containers prior to final verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Food Details Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Food Donation Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Food Name</span>
                <strong className="text-slate-900 text-sm font-bold block mt-0.5">
                  {donation?.foodName || 'Surplus Food'}
                </strong>
                <span className="text-blue-700 font-semibold text-[11px]">
                  {donation?.quantity} {donation?.unit}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Category & Type</span>
                <strong className="text-slate-900 block mt-0.5">{donation?.category}</strong>
                <span className="text-emerald-700 font-medium text-[11px]">
                  {donation?.isVegetarian ? '🌱 Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Expiry Cutoff</span>
                <strong className="text-slate-900 block mt-0.5">
                  {donation?.expiryTime ? new Date(donation.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </strong>
                <span className="text-amber-700 text-[11px]">
                  Prepared: {donation?.preparationTime ? new Date(donation.preparationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                </span>
              </div>
            </div>
          </div>

          {/* Stakeholders & Locations: Donor, Volunteer, NGO Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Donor Information */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Donor Partner
              </span>
              <div className="font-bold text-slate-900">
                {donation?.donorName || 'Maratha Mandir Caterers & Banquet'}
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{donation?.donorPhone || donation?.contactPhone || '+91 98451 22334'}</span>
              </div>
              <div className="flex items-start gap-1 text-slate-600 pt-1 border-t border-slate-200">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                <span className="truncate">{task.pickupAddress}</span>
              </div>
            </div>

            {/* Volunteer Information */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Assigned Logistics Volunteer
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{task.assignedVolunteerName || task.volunteer?.user?.name || 'Suresh Patil'}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{task.volunteerPhone || '+91 94481 99012'}</span>
              </div>
              <div className="text-slate-600 pt-1 border-t border-slate-200 flex items-center gap-1">
                <Truck className="w-3 h-3 text-indigo-600" />
                <span>{task.volunteerVehicle || 'KA-22-EX-4401 (Two-Wheeler)'}</span>
              </div>
            </div>

            {/* NGO Hub Destination */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                NGO Delivery Hub
              </span>
              <div className="font-bold text-slate-900">
                {ngo?.orgName || 'Annapurna Seva Trust (Belagavi)'}
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{ngo?.phone || '+91 83124 55901'}</span>
              </div>
              <div className="flex items-start gap-1 text-slate-600 pt-1 border-t border-slate-200">
                <Navigation className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                <span className="truncate">{task.deliveryAddress}</span>
              </div>
            </div>
          </div>

          {/* Lifecycle & Audit Stepper */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Complete Lifecycle & Audit Trail
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {lifecycleSteps.map((step) => (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                    step.done
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px]">{step.label}</span>
                    {step.done ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                  {step.timestamp && (
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Notes Input (when not completed) */}
          {!isCompleted && !isRejecting && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-900">
                NGO Verification & Quality Sign-Off Notes
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Enter handover inspection observations..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          )}

          {/* Rejection Form (when triggered) */}
          {isRejecting && (
            <div
              id="rejection-reason-panel"
              className="p-4 rounded-xl border-2 border-rose-400 bg-rose-50/50 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-rose-600" />
                Specify Reason for Proof Rejection
              </div>
              <p className="text-xs text-slate-600">
                Rejecting proof keeps this task open and prompts volunteer{' '}
                <strong>{task.assignedVolunteerName || 'Suresh Patil'}</strong> to resubmit a valid photo or notes.
              </p>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Photo blurry / container contents not visible',
                  'Missing recipient handover signature / receipt',
                  'Portion quantity mismatch during count',
                  'Delivered to incorrect wing / room',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                      rejectionReason === preset
                        ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                id="rejection-reason-input"
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter mandatory rejection reason..."
                className="w-full text-xs p-2.5 rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  id="confirm-reject-proof-btn"
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Submitting Rejection...' : 'Confirm Rejection & Notify Driver'}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Verify Dialog (when user clicks Verify) */}
          {confirmVerifyOpen && (
            <div className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50/60 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Confirm Final Verification & Close Task
              </div>
              <p className="text-xs text-slate-700">
                Are you sure you want to verify and complete the handover for{' '}
                <strong>{donation?.foodName}</strong> ({donation?.quantity} {donation?.unit})? This will:
              </p>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                <li>Change task and donation status to <strong>COMPLETED</strong></li>
                <li>Record your NGO as verified receiver with timestamp</li>
                <li>Close the volunteer's active task load</li>
                <li>Dispatch confirmation notifications to Donor and Driver</li>
                <li>Write permanent audit trail entry</li>
              </ul>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmVerifyOpen(false)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="final-verify-complete-btn"
                  onClick={handleVerify}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  {loading ? 'Verifying...' : 'Yes, Verify & Complete Delivery'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>

          {!isCompleted && !isRejecting && !confirmVerifyOpen && (
            <div className="flex items-center gap-2">
              {/* Reject Proof Button */}
              <button
                type="button"
                id="reject-proof-btn"
                onClick={() => {
                  setIsRejecting(true);
                  setError(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-rose-700 hover:text-rose-800 border border-rose-300 bg-white hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Reject Proof</span>
              </button>

              {/* Verify & Complete Delivery Button */}
              <button
                type="button"
                id="verify-and-complete-btn"
                onClick={() => setConfirmVerifyOpen(true)}
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Complete Delivery</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full Image Lightbox */}
      {fullImagePreview && task.proofImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullImagePreview(false)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img
              src={task.proofImageUrl}
              alt="Handover Full Proof"
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl object-contain mx-auto"
            />
            <p className="text-white text-center text-xs mt-2 font-mono">
              Click anywhere to close full photo
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
