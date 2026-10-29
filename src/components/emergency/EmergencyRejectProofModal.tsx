import React, { useState } from 'react';
import { EmergencyAlert } from '../../types.ts';
import { api } from '../../services/api.ts';
import { AlertCircle, X, XCircle } from 'lucide-react';

interface EmergencyRejectProofModalProps {
  alert: EmergencyAlert;
  onClose: () => void;
  onSuccess: (updatedAlert: EmergencyAlert) => void;
}

export const EmergencyRejectProofModal: React.FC<EmergencyRejectProofModalProps> = ({
  alert,
  onClose,
  onSuccess,
}) => {
  const [rejectionReason, setRejectionReason] = useState(
    'Proof photo is unclear or portion count does not match the required distribution. Please provide clear photographic evidence of handover.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!rejectionReason.trim()) {
      setError('A rejection reason is strictly required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.rejectEmergencyProof(alert._id, {
        rejectionReason,
      });

      if (res.success) {
        onSuccess(res.alert);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Reject Relief Delivery Proof
              </h3>
              <p className="text-xs text-slate-500">
                Notify dispatch driver to resubmit valid handover proof
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

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-900">Incident: {alert.foodType} at {alert.address}</p>
          <p className="text-slate-600">
            Driver: {alert.assignedVolunteerName || 'Field Driver'} ({alert.deliveredQuantity || alert.quantityNeeded})
          </p>
        </div>

        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              id="proof-rejection-reason-input"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State why the proof was rejected (e.g., blurry photo, count mismatch)..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
            />
          </div>

          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              The status will change to <strong>PROOF_REJECTED</strong>. The dispatch team will receive an urgent notification with your rejection reason and be asked to resubmit verified documentation.
            </p>
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
              id="confirm-reject-proof-btn"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{submitting ? 'Rejecting...' : 'Reject Proof'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
