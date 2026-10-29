import React, { useState } from 'react';
import { EmergencyAlert } from '../../types.ts';
import { api } from '../../services/api.ts';
import { Camera, CheckCircle2, X, MapPin, Upload } from 'lucide-react';

interface ReliefDeliveryModalProps {
  alert: EmergencyAlert;
  onClose: () => void;
  onSuccess: (updatedAlert: EmergencyAlert) => void;
}

export const ReliefDeliveryModal: React.FC<ReliefDeliveryModalProps> = ({
  alert,
  onClose,
  onSuccess,
}) => {
  const [deliveredQuantity, setDeliveredQuantity] = useState(
    alert.reliefQuantity || alert.quantityNeeded || '30 Kits'
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    'Relief supplies delivered directly on site; distributed in orderly queues with water.'
  );
  const [recipientNotes, setRecipientNotes] = useState(
    'Received by community coordinator on site; family head acknowledged handover.'
  );
  const [proofPhotoUrl, setProofPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60'
  );
  const [deliveryTimestamp, setDeliveryTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePhotos = [
    {
      title: 'Packaged Meal Handover',
      url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60',
    },
    {
      title: 'Dry Ration Kits Distribution',
      url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&auto=format&fit=crop&q=60',
    },
    {
      title: 'Thermal Meal Dispensers',
      url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!deliveredQuantity.trim()) {
      setError('Please provide the delivered quantity.');
      return;
    }
    if (!deliveryNotes.trim()) {
      setError('Please provide delivery notes regarding the field handover.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitEmergencyReliefDelivery(alert._id, {
        deliveredQuantity,
        deliveryNotes,
        recipientNotes,
        proofPhotoUrl,
        deliveryTimestamp: new Date(deliveryTimestamp).toISOString(),
      });

      if (res.success) {
        onSuccess(res.alert);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit delivery proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Submit Emergency Relief Proof
              </h3>
              <p className="text-xs text-slate-500">
                Document handover verification for NGO sign-off
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
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Location: {alert.address}</span>
            <span className="text-teal-700">Driver: {alert.assignedVolunteerName || 'Field Driver'}</span>
          </div>
          <p className="text-slate-600 line-clamp-1">
            Expected: {alert.reliefQuantity || alert.quantityNeeded}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivered Quantity *
              </label>
              <input
                type="text"
                required
                id="delivery-quantity-input"
                value={deliveredQuantity}
                onChange={(e) => setDeliveredQuantity(e.target.value)}
                placeholder="e.g. 50 Meals or 30 Kits"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Timestamp *
              </label>
              <input
                type="datetime-local"
                required
                id="delivery-timestamp-input"
                value={deliveryTimestamp}
                onChange={(e) => setDeliveryTimestamp(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Field Delivery Notes *
            </label>
            <textarea
              required
              rows={2}
              id="delivery-notes-input"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Describe distribution on site, hygiene standards, orderliness..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient / Field Acknowledgement
            </label>
            <textarea
              rows={2}
              id="recipient-notes-input"
              value={recipientNotes}
              onChange={(e) => setRecipientNotes(e.target.value)}
              placeholder="Name of local coordinator or elder who acknowledged receipt..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Handover Proof Photo URL (Optional)
            </label>
            <input
              type="url"
              id="delivery-proof-url-input"
              value={proofPhotoUrl}
              onChange={(e) => setProofPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden mb-2"
            />

            {/* Quick Sample Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {samplePhotos.map((item) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => setProofPhotoUrl(item.url)}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] whitespace-nowrap transition-all ${
                    proofPhotoUrl === item.url
                      ? 'border-teal-500 bg-teal-50 text-teal-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <img src={item.url} alt={item.title} className="w-5 h-5 rounded object-cover" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>

            {proofPhotoUrl && (
              <div className="mt-2 w-full h-28 rounded-lg overflow-hidden border border-slate-200 bg-black">
                <img
                  src={proofPhotoUrl}
                  alt="Proof preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
              id="submit-relief-proof-btn"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Submitting Proof...' : 'Submit Relief Proof'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
