import React, { useState, useEffect } from 'react';
import { EmergencyAlert } from '../../types.ts';
import { api } from '../../services/api.ts';
import { Truck, X, User, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

interface StartDispatchModalProps {
  alert: EmergencyAlert;
  onClose: () => void;
  onSuccess: (updatedAlert: EmergencyAlert) => void;
}

export const StartDispatchModal: React.FC<StartDispatchModalProps> = ({
  alert,
  onClose,
  onSuccess,
}) => {
  const [reliefQuantity, setReliefQuantity] = useState(
    alert.reliefQuantity || alert.quantityNeeded || '30 Kits'
  );
  const [reliefType, setReliefType] = useState(
    alert.reliefType || 'Prepared Cooked Meals & Water'
  );
  const [assignedVolunteerName, setAssignedVolunteerName] = useState('Suresh Patil');
  const [volunteerPhone, setVolunteerPhone] = useState('+91 94481 99012');
  const [vehicleType, setVehicleType] = useState('Two-Wheeler Logistics');
  const [vehicleNumber, setVehicleNumber] = useState('KA-22-EM-1080');
  const [dispatchNote, setDispatchNote] = useState(
    'Rapid relief unit dispatched with hot thermal containers and sealed mineral water.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const volunteerPresets = [
    {
      name: 'Suresh Patil',
      phone: '+91 94481 99012',
      vehicle: 'Two-Wheeler Logistics',
      plate: 'KA-22-EM-1080',
    },
    {
      name: 'Irfan Nadaf',
      phone: '+91 98860 33412',
      vehicle: 'Heavy Relief Van',
      plate: 'KA-22-EA-9081',
    },
    {
      name: 'Deepa Kulkarni',
      phone: '+91 99014 77209',
      vehicle: 'Four-Wheeler Express',
      plate: 'KA-22-MD-4432',
    },
    {
      name: 'Sunil Belgaonkar',
      phone: '+91 94482 11099',
      vehicle: 'Two-Wheeler Rapid Courier',
      plate: 'KA-22-JH-6612',
    },
  ];

  const handleSelectVolunteer = (preset: typeof volunteerPresets[0]) => {
    setAssignedVolunteerName(preset.name);
    setVolunteerPhone(preset.phone);
    setVehicleType(preset.vehicle);
    setVehicleNumber(preset.plate);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reliefQuantity.trim()) {
      setError('Please specify the relief quantity being dispatched.');
      return;
    }
    if (!assignedVolunteerName.trim()) {
      setError('Please assign a volunteer or driver.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.startEmergencyDispatch(alert._id, {
        reliefQuantity,
        reliefType,
        assignedVolunteerName,
        volunteerPhone,
        vehicleType,
        vehicleNumber,
        dispatchNote,
      });

      if (res.success) {
        onSuccess(res.alert);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start dispatch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Start Emergency Relief Dispatch
              </h3>
              <p className="text-xs text-slate-500">
                Deploy driver, vehicle & relief supplies to emergency coordinates
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
            <span>Destination: {alert.address}</span>
            <span className="text-red-700">{alert.quantityNeeded} needed</span>
          </div>
          <p className="text-slate-600 line-clamp-1">
            Distress: "{alert.urgencyReason}"
          </p>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Relief Quantity *
              </label>
              <input
                type="text"
                required
                id="dispatch-relief-quantity-input"
                value={reliefQuantity}
                onChange={(e) => setReliefQuantity(e.target.value)}
                placeholder="e.g. 50 Meals or 30 Kits"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Relief Type *
              </label>
              <select
                id="dispatch-relief-type-select"
                value={reliefType}
                onChange={(e) => setReliefType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                <option value="Prepared Cooked Meals & Water">Prepared Cooked Meals & Water</option>
                <option value="Dry Ration Food Kits">Dry Ration Food Kits</option>
                <option value="Packed Sandwiches & Fruits">Packed Sandwiches & Fruits</option>
                <option value="Infant Milk & Nutrition Kits">Infant Milk & Nutrition Kits</option>
                <option value="Emergency Food & Tarpaulins">Emergency Food & Tarpaulins</option>
              </select>
            </div>
          </div>

          {/* Volunteer quick select presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assign Verified Belagavi Driver / Volunteer *
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {volunteerPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleSelectVolunteer(preset)}
                  className={`p-2 rounded-lg text-left text-xs border transition-all ${
                    assignedVolunteerName === preset.name
                      ? 'border-sky-500 bg-sky-50/70 font-bold text-sky-900 ring-1 ring-sky-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-[10px] text-slate-500">{preset.vehicle}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                id="dispatch-driver-name-input"
                value={assignedVolunteerName}
                onChange={(e) => setAssignedVolunteerName(e.target.value)}
                placeholder="Driver Name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={volunteerPhone}
                onChange={(e) => setVolunteerPhone(e.target.value)}
                placeholder="Driver Phone Number"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle / Transport
              </label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g. Relief Van, Two-Wheeler"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Reg. Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="KA-22-EM-1080"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dispatch Operational Note
            </label>
            <textarea
              rows={2}
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              placeholder="Instructions for driver, temperature guidance, contact person..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
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
              id="confirm-dispatch-btn"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>{submitting ? 'Starting Dispatch...' : 'Confirm Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
