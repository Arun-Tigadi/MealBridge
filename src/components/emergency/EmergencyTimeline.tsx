import React from 'react';
import { EmergencyAlert } from '../../types.ts';
import {
  AlertTriangle,
  Building2,
  Truck,
  RotateCw,
  CheckCircle2,
  Camera,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

interface EmergencyTimelineProps {
  alert: EmergencyAlert;
}

export const EmergencyTimeline: React.FC<EmergencyTimelineProps> = ({ alert }) => {
  const steps = [
    {
      id: 'created',
      title: 'SOS Created',
      icon: AlertTriangle,
      color: 'red',
      done: true,
      time: alert.createdAt,
      actor: alert.reporterName || 'Public Citizen',
      detail: `${alert.foodType} (${alert.quantityNeeded}) reported at ${alert.address}. Urgency: "${alert.urgencyReason}"`,
    },
    {
      id: 'responded',
      title: 'NGO Responded',
      icon: Building2,
      color: 'blue',
      done: !!alert.respondedAt || ['RESPONDED', 'DISPATCHED', 'IN_PROGRESS', 'DELIVERED', 'PROOF_SUBMITTED', 'CLOSED'].includes(alert.status),
      time: alert.respondedAt,
      actor: alert.respondedByNgoName || 'Verified NGO Hub',
      detail: alert.responseNote ? `Response note: "${alert.responseNote}"` : 'Relief mission acknowledged and organized by local NGO.',
    },
    {
      id: 'dispatched',
      title: 'Dispatched',
      icon: Truck,
      color: 'sky',
      done: !!alert.dispatchedAt || ['DISPATCHED', 'IN_PROGRESS', 'DELIVERED', 'PROOF_SUBMITTED', 'CLOSED'].includes(alert.status),
      time: alert.dispatchedAt,
      actor: alert.assignedVolunteerName ? `${alert.assignedVolunteerName} (${alert.vehicleType || 'Relief Vehicle'})` : 'Field Driver',
      detail: alert.reliefQuantity
        ? `Dispatched ${alert.reliefQuantity} (${alert.reliefType || 'Food Rations'}). Note: ${alert.dispatchNote || 'En route.'}`
        : 'Emergency relief transport en route to incident location.',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: RotateCw,
      color: 'purple',
      done: !!alert.inProgressAt || ['IN_PROGRESS', 'DELIVERED', 'PROOF_SUBMITTED', 'CLOSED'].includes(alert.status),
      time: alert.inProgressAt,
      actor: alert.assignedVolunteerName || 'Field Operations Team',
      detail: 'Relief transport arrived on site; field coordination in progress.',
    },
    {
      id: 'delivered',
      title: 'Relief Delivered',
      icon: CheckCircle2,
      color: 'teal',
      done: !!alert.deliveredAt || ['DELIVERED', 'PROOF_SUBMITTED', 'CLOSED'].includes(alert.status),
      time: alert.deliveredAt,
      actor: alert.assignedVolunteerName || 'Field Driver',
      detail: alert.deliveryNotes
        ? `Handover notes: "${alert.deliveryNotes}" • Recipient: "${alert.recipientNotes || 'Recipient on site'}"`
        : 'Food distributed to impacted citizens.',
    },
    {
      id: 'proof_submitted',
      title: 'Proof Submitted',
      icon: Camera,
      color: 'teal',
      done: !!alert.proofSubmittedAt || ['DELIVERED', 'PROOF_SUBMITTED', 'CLOSED'].includes(alert.status),
      time: alert.proofSubmittedAt || alert.deliveredAt,
      actor: alert.assignedVolunteerName || 'Field Driver',
      detail: alert.proofPhotoUrl ? 'Photo proof of distribution uploaded and logged in audit record.' : 'Inspection proof registered.',
      proofPhotoUrl: alert.proofPhotoUrl,
    },
    {
      id: 'ngo_verified',
      title: 'NGO Verified',
      icon: ShieldCheck,
      color: 'emerald',
      done: !!alert.verifiedAt || alert.status === 'CLOSED',
      time: alert.verifiedAt,
      actor: alert.verifiedByUserName || alert.respondedByNgoName || 'NGO Verification Officer',
      detail: alert.verificationNotes ? `Sign-off note: "${alert.verificationNotes}"` : 'Handover inspected and approved compliant.',
    },
    {
      id: 'closed',
      title: 'CLOSED',
      icon: CheckCheck,
      color: 'emerald',
      done: alert.status === 'CLOSED',
      time: alert.closedAt || alert.verifiedAt,
      actor: alert.verifiedByUserName || 'Belagavi Relief Coordination',
      detail: 'Emergency incident permanently closed & archived in municipal relief history.',
    },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Complete Operational Lifecycle Timeline (8 Stages)
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">
          Status:{' '}
          <strong className="text-slate-900 uppercase">
            {alert.status.replace(/_/g, ' ')}
          </strong>
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent =
            step.done &&
            (idx === steps.length - 1 || !steps[idx + 1].done);

          let circleBg = 'bg-white border-2 border-slate-300 text-slate-400';
          if (step.done) {
            if (step.color === 'emerald') circleBg = 'bg-emerald-600 text-white border-emerald-600';
            else if (step.color === 'teal') circleBg = 'bg-teal-600 text-white border-teal-600';
            else if (step.color === 'purple') circleBg = 'bg-purple-600 text-white border-purple-600';
            else if (step.color === 'sky') circleBg = 'bg-sky-600 text-white border-sky-600';
            else if (step.color === 'blue') circleBg = 'bg-blue-600 text-white border-blue-600';
            else circleBg = 'bg-red-600 text-white border-red-600';
          }

          return (
            <div key={step.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-xs transition-all ${circleBg} ${
                  isCurrent ? 'ring-4 ring-blue-100' : ''
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Content */}
              <div
                className={`text-xs space-y-1 ${
                  step.done ? 'text-slate-900' : 'text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tracking-tight">
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">
                        Current Stage
                      </span>
                    )}
                  </div>
                  {step.time && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(step.time).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 font-medium">
                  Responsible: <strong className="text-slate-800">{step.actor}</strong>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {step.detail}
                </p>

                {step.proofPhotoUrl && (
                  <div className="pt-1">
                    <img
                      src={step.proofPhotoUrl}
                      alt="Relief delivery proof"
                      className="w-32 h-20 rounded-lg object-cover border border-slate-300 shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
