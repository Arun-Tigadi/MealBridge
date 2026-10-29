import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  AlertCircle,
  FileText,
  ShieldCheck,
  RotateCw,
  Navigation,
  Check,
} from 'lucide-react';
import { Task, Donation, NGO } from '../../types.ts';
import { api } from '../../services/api.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  donation?: Donation;
  ngo?: NGO;
  onReassignRequest?: (donation: Donation) => void;
  onStatusUpdated?: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  taskId,
  donation: propDonation,
  ngo: propNgo,
  onReassignRequest,
  onStatusUpdated,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const activeTaskId = taskId || propDonation?.assignedTaskId;

    if (activeTaskId) {
      api
        .getTaskById(activeTaskId)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.task) {
            setTask(res.task);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message || 'Failed to load task details.');
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, taskId, propDonation]);

  if (!isOpen) return null;

  const handleVerifyDelivery = async () => {
    if (!task) return;
    try {
      setVerifying(true);
      await api.verifyProof(task._id);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to verify delivery.');
    } finally {
      setVerifying(false);
    }
  };

  const currentDonation = task?.donation || propDonation;
  const currentNgo = task?.ngo || propNgo;

  // Step progression calculation
  const steps = [
    { key: 'ACCEPTED', label: 'Match Accepted' },
    { key: 'ASSIGNED', label: 'Volunteer Assigned' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'DELIVERED', label: 'Delivered at Hub' },
    { key: 'COMPLETED', label: 'Verified & Closed' },
  ];

  const getStepIndex = (status?: string) => {
    switch (status) {
      case 'PENDING_ASSIGNMENT':
      case 'PICKUP_ASSIGNMENT_PENDING':
        return 0;
      case 'ASSIGNED':
      case 'ACCEPTED':
        return 1;
      case 'PICKED_UP':
        return 2;
      case 'IN_TRANSIT':
        return 3;
      case 'DELIVERED':
      case 'PROOF_SUBMITTED':
        return 4;
      case 'COMPLETED':
      case 'VERIFIED':
        return 5;
      default:
        return 1;
    }
  };

  const activeStepIdx = getStepIndex(task?.status || currentDonation?.status);

  return (
    <div
      id="task-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !verifying) onClose();
      }}
    >
      <div
        id="task-details-modal-container"
        className="bg-white rounded-2xl border-2 border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Pickup & Logistics Task
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {task?._id || 'Task Tracker'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                End-to-end audit trail and live dispatch status for Belagavi NGO hub
              </p>
            </div>
          </div>
          <button
            id="close-task-details-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Retrieving task audit record...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* Status Header & Badges */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Current Logistics Status</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {task?.status === 'DECLINED'
                      ? 'Volunteer Declined • Reassignment Required'
                      : task?.status || currentDonation?.status}
                  </div>
                </div>
                <StatusBadge status={task?.status || currentDonation?.status || 'PENDING'} size="md" />
              </div>

              {/* Progress Stepper */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Lifecycle Audit Trail
                </div>
                <div className="grid grid-cols-6 gap-1 pt-2">
                  {steps.map((step, idx) => {
                    const isCompleted = idx < activeStepIdx;
                    const isCurrent = idx === activeStepIdx;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] leading-tight ${
                            isCurrent
                              ? 'font-bold text-blue-700'
                              : isCompleted
                              ? 'font-semibold text-emerald-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volunteer Declined Alert */}
              {task?.status === 'DECLINED' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Volunteer Declined Pickup
                  </div>
                  <p>
                    Reason: <em>"{task.declineReason || 'Driver unavailable'}"</em>
                  </p>
                  {task.declinedAt && (
                    <p className="text-[11px] text-rose-700">
                      Logged at: {new Date(task.declinedAt).toLocaleString()}
                    </p>
                  )}
                  {onReassignRequest && currentDonation && (
                    <button
                      id="reassign-declined-volunteer-btn"
                      onClick={() => {
                        onClose();
                        onReassignRequest(currentDonation);
                      }}
                      className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Reassign to Available Volunteer
                    </button>
                  )}
                </div>
              )}

              {/* Delivery Proof Rejected Notice */}
              {task?.status === 'PROOF_REJECTED' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Delivery Proof Rejected — Resubmission Pending
                  </div>
                  <p>
                    Rejection Reason: <em>"{task.proofRejectionReason || 'Pending clearer proof'}"</em>
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Assigned driver {task.assignedVolunteerName || 'Volunteer'} has been prompted to upload fresh proof.
                  </p>
                </div>
              )}

              {/* Food Details */}
              {currentDonation && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Food Item Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Food Name & Portion</span>
                      <strong className="text-slate-900 text-sm">
                        {currentDonation.foodName} ({currentDonation.quantity} {currentDonation.unit})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Category</span>
                      <span className="font-semibold text-slate-800">{currentDonation.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Preparation Time</span>
                      <span className="text-slate-700">
                        {new Date(currentDonation.preparationTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({new Date(currentDonation.preparationTime).toLocaleDateString()})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Safe Expiry Cutoff</span>
                      <span className="text-slate-900 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {new Date(currentDonation.expiryTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({new Date(currentDonation.expiryTime).toLocaleDateString()})
                      </span>
                    </div>
                  </div>
                  {currentDonation.description && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong>Donor Notes:</strong> {currentDonation.description}
                    </div>
                  )}
                </div>
              )}

              {/* Route & Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pickup Location */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    Donor Pickup Origin
                  </div>
                  <div className="text-slate-800 font-medium">{task?.pickupAddress}</div>
                  <div className="text-slate-600 pt-1 border-t border-slate-200 space-y-1">
                    <div>
                      <strong>Donor:</strong> {currentDonation?.donorName || 'Donor Partner'}
                    </div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {currentDonation?.donorPhone || currentDonation?.contactPhone || '+91 98451 22334'}
                    </div>
                  </div>
                </div>

                {/* Delivery Hub Destination */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    NGO Delivery Destination
                  </div>
                  <div className="text-slate-800 font-medium">
                    {task?.deliveryAddress || currentDonation?.acceptedDeliveryAddress || currentNgo?.address}
                  </div>
                  <div className="text-slate-600 pt-1 border-t border-slate-200 space-y-1">
                    <div>
                      <strong>Distribution Hub:</strong> {currentNgo?.orgName || 'Annapurna Seva Trust'}
                    </div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {currentNgo?.phone || '+91 83124 55901'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Volunteer Dispatch Details */}
              <div className="p-4 rounded-xl border border-slate-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    Assigned Delivery Volunteer
                  </h3>
                  {onReassignRequest &&
                    currentDonation &&
                    task?.status !== 'COMPLETED' &&
                    task?.status !== 'DELIVERED' && (
                      <button
                        id="open-reassign-modal-btn"
                        onClick={() => {
                          onClose();
                          onReassignRequest(currentDonation);
                        }}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        Reassign Volunteer
                      </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Volunteer Name</span>
                    <strong className="text-slate-900 text-sm">
                      {task?.assignedVolunteerName ||
                        task?.volunteer?.user?.name ||
                        currentDonation?.assignedVolunteerName ||
                        'Pending Assignment'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Vehicle / Transport</span>
                    <span className="text-slate-800 font-medium">
                      {task?.volunteerVehicle || task?.volunteer?.vehicleNumber
                        ? `${task.volunteer?.transportType || 'Vehicle'} • ${
                            task.volunteerVehicle || task.volunteer?.vehicleNumber
                          }`
                        : 'Belagavi Two-Wheeler Network'}
                    </span>
                  </div>
                  {task?.volunteerPhone && (
                    <div>
                      <span className="text-slate-500 block">Driver Contact</span>
                      <span className="text-slate-800">{task.volunteerPhone}</span>
                    </div>
                  )}
                  {task?.assignedAt && (
                    <div>
                      <span className="text-slate-500 block">Dispatched Timestamp</span>
                      <span className="text-slate-800">
                        {new Date(task.assignedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {task?.instructions && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong>Special Instructions:</strong> {task.instructions}
                  </div>
                )}
              </div>

              {/* Delivery Proof (if submitted) */}
              {task?.proofImageUrl && (
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Volunteer Handover Proof
                  </div>
                  {task.proofNotes && (
                    <p className="text-xs text-teal-800">
                      <strong>Volunteer Notes:</strong> {task.proofNotes}
                    </p>
                  )}
                  <div className="mt-2 rounded-lg overflow-hidden border border-teal-300 max-h-48">
                    <img
                      src={task.proofImageUrl}
                      alt="Delivery Handover Proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>

          {(task?.status === 'PROOF_SUBMITTED' || task?.status === 'DELIVERED') && (
            <button
              type="button"
              id="ngo-verify-delivery-btn"
              onClick={handleVerifyDelivery}
              disabled={verifying}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              {verifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Handover...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Delivery & Close Task</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default TaskDetailsModal;
