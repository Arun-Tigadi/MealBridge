import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';

export function getMyNotifications(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const notifs = store.notifications.filter(
    (n) => n.recipientId === req.user?._id || (n.recipientRole && n.recipientRole === req.user?.role)
  );

  const unreadCount = notifs.filter((n) => !n.read).length;

  res.json({
    success: true,
    count: notifs.length,
    unreadCount,
    notifications: notifs,
  });
}

export function markNotificationRead(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const notif = store.notifications.find((n) => n._id === id);

  if (!notif) {
    res.status(404).json({ success: false, error: 'Notification not found.' });
    return;
  }

  notif.read = true;
  res.json({ success: true, notification: notif });
}

export function markAllNotificationsRead(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  for (const n of store.notifications) {
    if (n.recipientId === req.user._id || n.recipientRole === req.user.role) {
      n.read = true;
    }
  }

  res.json({ success: true, message: 'All notifications marked as read.' });
}
