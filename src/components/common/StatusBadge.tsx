import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', id }) => {
  const normalized = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';

  switch (normalized) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'VERIFIED':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      break;
    case 'MATCHED':
    case 'PICKUP_ASSIGNED':
    case 'ACCEPTED':
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-300 font-medium';
      break;
    case 'PICKUP_ASSIGNMENT_PENDING':
    case 'PENDING_ASSIGNMENT':
      colorClasses = 'bg-amber-50 text-amber-900 border-amber-300 font-semibold';
      break;
    case 'PICKED_UP':
    case 'IN_TRANSIT':
    case 'RESPONDED':
      colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-300';
      break;
    case 'DISPATCHED':
      colorClasses = 'bg-sky-50 text-sky-800 border-sky-300 font-semibold';
      break;
    case 'IN_PROGRESS':
      colorClasses = 'bg-purple-50 text-purple-800 border-purple-300 font-semibold';
      break;
    case 'CLOSED':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      break;
    case 'DELIVERED':
    case 'PROOF_SUBMITTED':
      colorClasses = 'bg-teal-50 text-teal-800 border-teal-300';
      break;
    case 'PENDING':
    case 'RECOMMENDED':
    case 'DRAFT':
    case 'VIEWED':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'DECLINED':
    case 'PROOF_REJECTED':
    case 'EXPIRED':
    case 'CANCELLED':
    case 'REJECTED':
    case 'SUSPENDED':
    case 'BLOCKED':
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
      break;
    case 'CRITICAL':
      colorClasses = 'bg-red-100 text-red-900 border-red-400 font-bold';
      break;
    case 'HIGH':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300';
      break;
    case 'MEDIUM':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'LOW':
    case 'STANDARD':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    default:
      colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3 py-1 text-sm font-semibold'
      : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      id={id}
      className={`inline-flex items-center rounded-full border whitespace-nowrap tracking-wide ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
