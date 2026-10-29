import { store } from '../data/store.ts';
import { UserRole } from '../models/types.ts';

export function logAudit(params: {
  action: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  ipAddress?: string;
}) {
  const newLog = {
    _id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: params.action,
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    details: params.details,
    ipAddress: params.ipAddress || '127.0.0.1',
    timestamp: new Date().toISOString(),
  };

  store.auditLogs.unshift(newLog);
  // Keep audit log reasonable size in memory
  if (store.auditLogs.length > 500) {
    store.auditLogs.pop();
  }
}
