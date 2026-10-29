import React, { useState } from 'react';
import { EmergencyAlert } from '../../types.ts';
import { api } from '../../services/api.ts';
import { ShieldCheck, X, CheckCheck, Clock, MapPin, User, FileText } from 'lucide-react';

interface EmergencyVerificationModalProps {
  alert: EmergencyAlert;
  onClose: () => void;
  onSuccess: (updatedAlert: EmergencyAlert) => void;
}

export const EmergencyVerificationModal: React.FC<EmergencyVerificationModalProps> = ({
  alert,
  onClose,
  onSuccess,
}) => {
  const [verificationNotes, setVerificationNotes] = useState(
    'Relief handover inspected on site. Portion counts, recipient distress mitigation, and health hygiene protocols verified compliant. Incident officially resolved.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.verifyAndCloseEmergency(alert._id, {
        verificationNotes,
      });

      if (res.success) {
        onSuccess(res.alert);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify and close emergency.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Verify & Close Emergency SOS
              </h3>
              <p className="text-xs text-slate-500">
                Formal NGO verification & permanent archive sign-off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Handover Details Summary */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 text-sm">{alert.foodType}</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
              {alert.deliveredQuantity || alert.reliefQuantity || alert.quantityNeeded}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 font-bold block">Location:</span>
              <span className="font-medium text-slate-800">{alert.address}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block">Assigned Driver:</span>
              <span className="font-medium text-slate-800">{alert.assignedVolunteerName || 'Field Driver'} ({alert.vehicleType || 'Vehicle'})</span>
            </div>
          </div>

          {alert.deliveryNotes && (
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Driver Delivery Notes:
              </span>
              <p className="text-slate-700 italic">"{alert.deliveryNotes}"</p>
            </div>
          )}

          {alert.recipientNotes && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Recipient / Field Coordinator:
              </span>
              <p className="text-slate-700 font-medium">"{alert.recipientNotes}"</p>
            </div>
          )}

          {alert.proofPhotoUrl && (
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Handover Photo Proof:
              </span>
              <img
                src={alert.proofPhotoUrl}
                alt="Delivery proof"
                className="w-full h-32 rounded-lg object-cover border border-slate-200"
              />
            </div>
          )}
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              NGO Verification & Sign-off Notes *
            </label>
            <textarea
              required
              rows={3}
              id="verification-signoff-notes"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Permanent Audit Trail Event</p>
              <p className="text-[11px] text-emerald-800">
                Signing off will transition status to <strong>CLOSED</strong>, log a permanent immutable municipal audit record, notify the original distress reporter, and archive this incident in Belagavi emergency history.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              id="confirm-verify-close-btn"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Verifying & Closing...' : 'Verify & Close SOS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
