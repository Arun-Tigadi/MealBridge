import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Task, TaskStatus } from '../types.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { BelagaviMap, MapMarker } from '../components/maps/BelagaviMap.tsx';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Camera,
  Navigation,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Proof Modal
  const [proofTask, setProofTask] = useState<Task | null>(null);
  const [proofUrl, setProofUrl] = useState(
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60'
  );
  const [proofNotes, setProofNotes] = useState(
    'Handed over 25 meals in clean condition to shelter in-charge.'
  );
  const [submittingProof, setSubmittingProof] = useState(false);

  // Decline Modal
  const [decliningTask, setDecliningTask] = useState<Task | null>(null);
  const [declineReason, setDeclineReason] = useState('Volunteer vehicle breakdown or scheduling clash');
  const [decliningLoading, setDecliningLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getMyTasks();
      if (res.success) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.warn('Error loading volunteer tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    const handleStoreUpdated = () => {
      loadTasks();
    };

    window.addEventListener('mealbridge_demo_store_updated', handleStoreUpdated);
    window.addEventListener('storage', handleStoreUpdated);

    return () => {
      window.removeEventListener('mealbridge_demo_store_updated', handleStoreUpdated);
      window.removeEventListener('storage', handleStoreUpdated);
    };
  }, []);

  const handleAccept = async (taskId: string) => {
    try {
      await api.acceptTask(taskId);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to accept task');
    }
  };

  const handleConfirmDecline = async () => {
    if (!decliningTask) return;
    setDecliningLoading(true);
    try {
      await api.declineTask(decliningTask._id, declineReason);
      setDecliningTask(null);
      loadTasks();
      alert('Task declined. The donation has returned to the NGO dispatch pool for reassignment.');
    } catch (err: any) {
      alert(err.message || 'Failed to decline task');
    } finally {
      setDecliningLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    try {
      await api.updateTaskStatus(taskId, nextStatus);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleSubmitProof = async () => {
    if (!proofTask) return;
    setSubmittingProof(true);
    try {
      const res = await api.submitProof(proofTask._id, {
        proofImageUrl: proofUrl,
        proofNotes,
      });
      if (res.success) {
        setProofTask(null);
        loadTasks();
        alert('Delivery proof submitted! NGO will review and finalize verification.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit proof');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Map markers for all active tasks
  const markers: MapMarker[] = [];
  tasks.forEach((t) => {
    markers.push({
      id: `pickup-${t._id}`,
      lat: t.pickupLat,
      lng: t.pickupLng,
      title: `Pickup: ${t.donation?.foodName || 'Food'}`,
      type: 'DONATION',
      description: t.pickupAddress,
    });
    markers.push({
      id: `drop-${t._id}`,
      lat: t.deliveryLat,
      lng: t.deliveryLng,
      title: `Delivery Destination`,
      type: 'NGO',
      description: t.deliveryAddress,
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-900/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Volunteer Logistics Portal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Belagavi Two-Wheeler & Van Rapid Transit Delivery Operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Active Driver Status: READY</span>
          </span>
        </div>
      </div>

      {/* Route Map */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Belagavi Task & Delivery Routes
        </h2>
        <BelagaviMap markers={markers} height="280px" showRadiusKm={10} />
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Assigned Delivery Tasks</h2>
          <span className="text-xs text-slate-500">{tasks.length} tasks</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading delivery tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No delivery tasks assigned to you currently. NGOs in Belagavi will assign you as surplus matches are accepted.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const don = task.donation;
              return (
                <div key={task._id} className="p-5 hover:bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {don?.foodName || 'Surplus Food Batch'}
                      </h3>
                      <StatusBadge status={task.status} />
                    </div>
                    <span className="text-xs text-slate-500">
                      Task ID: <code className="font-mono text-[11px]">{task._id}</code>
                    </span>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        📍 1. Pickup From Donor
                      </span>
                      <p className="font-semibold text-slate-900">{task.pickupAddress}</p>
                      <p className="text-slate-600 text-[11px]">
                        Contact: {don?.contactName} ({don?.contactPhone})
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 space-y-1">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                        🏢 2. Deliver To NGO Hub
                      </span>
                      <p className="font-semibold text-slate-900">{task.deliveryAddress}</p>
                      <p className="text-slate-600 text-[11px]">
                        Coordinator: {task.ngo?.contactPerson || 'Field Supervisor'} (
                        {task.ngo?.phone})
                      </p>
                    </div>
                  </div>

                  {/* Actions depending on sequential status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      Current Stage: <strong className="text-slate-800">{task.status}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status === 'ASSIGNED' && (
                        <>
                          <button
                            id={`volunteer-decline-task-btn-${task._id}`}
                            onClick={() => {
                              setDecliningTask(task);
                              setDeclineReason('Vehicle issue or scheduling clash');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold text-slate-700 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            id={`volunteer-accept-task-btn-${task._id}`}
                            onClick={() => handleAccept(task._id)}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                          >
                            Accept Task
                          </button>
                        </>
                      )}

                      {task.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleStatusChange(task._id, 'PICKUP_STARTED')}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                          Start Pickup Transit
                        </button>
                      )}

                      {task.status === 'PICKUP_STARTED' && (
                        <button
                          onClick={() => handleStatusChange(task._id, 'PICKED_UP')}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                        >
                          Confirm Picked Up
                        </button>
                      )}

                      {task.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleStatusChange(task._id, 'IN_TRANSIT')}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                        >
                          Mark In Transit
                        </button>
                      )}

                      {task.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleStatusChange(task._id, 'DELIVERED')}
                          className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                        >
                          Confirm Arrived at NGO
                        </button>
                      )}

                      {task.status === 'DELIVERED' && (
                        <button
                          onClick={() => setProofTask(task)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Submit Delivery Proof</span>
                        </button>
                      )}

                      {task.status === 'PROOF_SUBMITTED' && (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Proof Submitted • Awaiting NGO Sign-off</span>
                        </span>
                      )}

                      {task.status === 'PROOF_REJECTED' && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              Proof Rejected: <em>"{task.proofRejectionReason || 'Resubmission requested'}"</em>
                            </span>
                          </span>
                          <button
                            id={`volunteer-resubmit-proof-btn-${task._id}`}
                            onClick={() => {
                              setProofTask(task);
                              setProofNotes('Resubmitted handover proof with clear verification.');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Resubmit Proof</span>
                          </button>
                        </div>
                      )}

                      {task.status === 'COMPLETED' && (
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Delivery Verified & Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Submission Modal */}
      {proofTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Submit Delivery Proof</h3>
            <p className="text-xs text-slate-600">
              Upload or provide photo verification and receiver notes for handover verification.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proof Photo URL
              </label>
              <input
                type="text"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Handover Notes / Inspection Notes
              </label>
              <textarea
                rows={3}
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProofTask(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingProof}
                onClick={handleSubmitProof}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {submittingProof ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Task Modal */}
      {decliningTask && (
        <div
          id="volunteer-decline-task-modal"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Decline Pickup Task</span>
            </h3>
            <p className="text-xs text-slate-600">
              Declining this task will notify the NGO coordinator and return the surplus donation to{' '}
              <strong>"PICKUP ASSIGNMENT PENDING"</strong> so another Belagavi volunteer can be dispatched.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-800">
                Reason for Declining
              </label>

              {/* Quick Options */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Vehicle breakdown / flat tyre',
                  'Emergency schedule clash',
                  'Outside current transit zone',
                  'Capacity / cargo volume limit',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDeclineReason(reason)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                      declineReason === reason
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Specify reason..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 mt-2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecliningTask(null)}
                disabled={decliningLoading}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-volunteer-decline-btn"
                disabled={decliningLoading}
                onClick={handleConfirmDecline}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                {decliningLoading ? 'Declining...' : 'Confirm Decline & Re-pool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
