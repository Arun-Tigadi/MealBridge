import { store } from '../data/store.ts';
import { INotification, UserRole } from '../models/types.ts';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketServer(io: SocketIOServer) {
  ioInstance = io;
}

export function sendNotification(params: {
  recipientId: string;
  recipientRole?: UserRole;
  title: string;
  message: string;
  type: INotification['type'];
  referenceId?: string;
}): INotification {
  const notif: INotification = {
    _id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipientId: params.recipientId,
    recipientRole: params.recipientRole,
    title: params.title,
    message: params.message,
    type: params.type,
    referenceId: params.referenceId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  store.notifications.unshift(notif);

  // Broadcast via Socket.IO if available
  if (ioInstance) {
    // Send to specific user room and role room
    ioInstance.to(`user:${params.recipientId}`).emit('notification', notif);
    if (params.recipientRole) {
      ioInstance.to(`role:${params.recipientRole}`).emit('notification', notif);
    }
    ioInstance.emit('new_activity', { type: notif.type, title: notif.title });
  }

  return notif;
}
