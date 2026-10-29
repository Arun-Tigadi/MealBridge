import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { HungerReport } from '../types.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { BelagaviMap, MapMarker } from '../components/maps/BelagaviMap.tsx';
import {
  MapPin,
  Users,
  Clock,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const HungerSpottingPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<HungerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    address: 'Near Belagavi Central Bus Stand, CBT Area',
    latitude: 15.861,
    longitude: 74.512,
    description: 'Group of 12 unhoused daily wage laborers without work seeking evening food.',
    approximatePeople: 12,
    urgency: 'HIGH' as const,
    photoUrl: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getHungerReports();
      if (res.success) {
        setReports(res.reports);
      }
    } catch (err) {
      console.warn('Error loading hunger reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.createHungerReport(formData);
      if (res.success) {
        setShowForm(false);
        loadReports();
        alert('Hunger spot reported! Verified NGOs in Belagavi have been alerted.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: string, status: string) => {
    try {
      await api.verifyHungerReport(id, { status, verificationNotes: 'Verified by field team.' });
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to update report status');
    }
  };

  const markers: MapMarker[] = reports.map((r) => ({
    id: r._id,
    lat: r.latitude,
    lng: r.longitude,
    title: `Hunger Spot: ~${r.approximatePeople} people`,
    type: 'HUNGER',
    status: r.status,
    description: r.description,
    info: r.address,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-900/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-1">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>48-Hour Sensitive Data Retention Policy</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Belagavi Hunger Spotting Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Public citizen reporting tool to direct surplus food dispatches to vulnerable pockets.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Report Hunger Spot'}</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Privacy & Dignity Protection:</strong> In accordance with hunger reporting standards, all public reports are kept for a maximum of 48 hours and then purged. Exact identities of vulnerable individuals are shielded from public view.
        </p>
      </div>

      {/* Map */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Reported Locations in Belagavi
        </h2>
        <BelagaviMap markers={markers} height="280px" showRadiusKm={10} />
      </div>

      {/* Report Form */}
      {showForm && (
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Spot a Hunger Location in Belagavi
          </h2>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Belagavi Location / Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Near CBT bus stand, Belagavi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Approx. People *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.approximatePeople}
                    onChange={(e) =>
                      setFormData({ ...formData, approximatePeople: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Situation Description *
              </label>
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Briefly describe what assistance is needed (e.g. cooked meals, dry ration)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Hunger Spot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Hunger Spots (Under 48h Retention)</h2>
          <span className="text-xs text-slate-500">{reports.length} locations</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading hunger spots...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active hunger spots currently reported.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report._id} className="p-4 hover:bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={report.status} />
                    <span className="text-xs font-bold text-slate-900">
                      ~{report.approximatePeople} People Reported
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        report.urgency === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.urgency} Urgency
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Expires: {new Date(report.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-700">{report.description}</p>

                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {report.address}
                  </span>

                  {(user?.role === 'NGO' || user?.role === 'ADMIN') && report.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerify(report._id, 'VERIFIED')}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                      >
                        Verify Spot
                      </button>
                      <button
                        onClick={() => handleVerify(report._id, 'REJECTED')}
                        className="px-2.5 py-1 rounded border border-slate-300 text-slate-600 text-[11px]"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
