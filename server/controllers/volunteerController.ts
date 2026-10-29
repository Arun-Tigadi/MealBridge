import { Response } from 'express';
import { store } from '../data/store.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { TaskStatus } from '../models/types.ts';
import { sendNotification } from '../services/notificationService.ts';
import { logAudit } from '../services/auditService.ts';

export function getMyTasks(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const vol = store.volunteers.find((v) => v.userId === req.user?._id);
  if (!vol) {
    res.status(404).json({ success: false, error: 'Volunteer record not found.' });
    return;
  }

  const tasks = store.tasks
    .filter((t) => t.volunteerId === vol._id)
    .map((t) => {
      const donation = store.donations.find((d) => d._id === t.donationId);
      const ngo = store.ngos.find((n) => n._id === t.ngoId);
      return { ...t, donation, ngo };
    });

  res.json({ success: true, count: tasks.length, tasks });
}

export function acceptTask(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const vol = store.volunteers.find((v) => v.userId === req.user?._id);
  if (!vol) {
    res.status(404).json({ success: false, error: 'Volunteer record not found.' });
    return;
  }

  const { taskId } = req.params;
  const task = store.tasks.find((t) => t._id === taskId && t.volunteerId === vol._id);

  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found or not assigned to you.' });
    return;
  }

  task.status = 'ACCEPTED';
  task.updatedAt = new Date().toISOString();

  // Notify NGO
  const ngo = store.ngos.find((n) => n._id === task.ngoId);
  if (ngo) {
    sendNotification({
      recipientId: ngo.userId,
      recipientRole: 'NGO',
      title: 'Volunteer Accepted Pickup Task',
      message: `${req.user.name} accepted task for donation delivery to ${task.deliveryAddress}.`,
      type: 'TASK_ACCEPTED',
      referenceId: task._id,
    });
  }

  res.json({ success: true, message: 'Task accepted.', task });
}

export function declineTask(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const vol = store.volunteers.find((v) => v.userId === req.user?._id);
  if (!vol) {
    res.status(404).json({ success: false, error: 'Volunteer record not found.' });
    return;
  }

  const { taskId } = req.params;
  const task = store.tasks.find((t) => t._id === taskId && t.volunteerId === vol._id);

  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found or not assigned to you.' });
    return;
  }

  task.volunteerId = undefined;
  task.status = 'ASSIGNED';
  task.updatedAt = new Date().toISOString();

  vol.currentTaskCount = Math.max(0, (vol.currentTaskCount || 1) - 1);

  // Notify NGO that volunteer declined
  const ngo = store.ngos.find((n) => n._id === task.ngoId);
  if (ngo) {
    sendNotification({
      recipientId: ngo.userId,
      recipientRole: 'NGO',
      title: 'Volunteer Declined Task',
      message: `${req.user.name} was unable to accept task ${task._id}. Please assign another volunteer.`,
      type: 'VOLUNTEER_ASSIGNMENT',
      referenceId: task._id,
    });
  }

  res.json({ success: true, message: 'Task declined and returned to NGO assignment pool.' });
}

export function updateTaskStatus(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { taskId } = req.params;
  const { status } = req.body as { status: TaskStatus };

  const task = store.tasks.find((t) => t._id === taskId);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found.' });
    return;
  }

  const donation = store.donations.find((d) => d._id === task.donationId);

  task.status = status;
  task.updatedAt = new Date().toISOString();

  if (status === 'PICKED_UP') {
    task.pickupTimestamp = new Date().toISOString();
    if (donation) {
      donation.status = 'PICKED_UP';
      donation.updatedAt = new Date().toISOString();
    }
  } else if (status === 'IN_TRANSIT') {
    if (donation) {
      donation.status = 'IN_TRANSIT';
      donation.updatedAt = new Date().toISOString();
    }
  } else if (status === 'DELIVERED') {
    task.deliveryTimestamp = new Date().toISOString();
    if (donation) {
      donation.status = 'DELIVERED';
      donation.updatedAt = new Date().toISOString();
    }
  } else if (status === 'COMPLETED') {
    if (donation) {
      donation.status = 'COMPLETED';
      donation.updatedAt = new Date().toISOString();
    }
    // Update volunteer stats
    if (task.volunteerId) {
      const vol = store.volunteers.find((v) => v._id === task.volunteerId);
      if (vol) {
        vol.completedDeliveries = (vol.completedDeliveries || 0) + 1;
        vol.currentTaskCount = Math.max(0, (vol.currentTaskCount || 1) - 1);
      }
    }
  }

  logAudit({
    action: 'TASK_STATUS_UPDATED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `Task ${task._id} updated to status ${status}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, task, donation });
}

export function submitProof(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { taskId } = req.params;
  const { proofImageUrl, proofNotes } = req.body;

  const task = store.tasks.find((t) => t._id === taskId);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found.' });
    return;
  }

  task.proofImageUrl = proofImageUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&auto=format&fit=crop&q=60';
  task.proofNotes = proofNotes || 'Delivered safely and inspected by recipient representative.';
  task.status = 'PROOF_SUBMITTED';
  task.updatedAt = new Date().toISOString();

  // Notify NGO to verify
  const ngo = store.ngos.find((n) => n._id === task.ngoId);
  if (ngo) {
    sendNotification({
      recipientId: ngo.userId,
      recipientRole: 'NGO',
      title: 'Delivery Proof Submitted for Verification',
      message: `Delivery proof submitted for task ${task._id}. Please review and finalize verification.`,
      type: 'PROOF_VERIFIED',
      referenceId: task._id,
    });
  }

  res.json({ success: true, message: 'Delivery proof submitted successfully.', task });
}

export function verifyProof(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const { taskId } = req.params;
  const task = store.tasks.find((t) => t._id === taskId);

  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found.' });
    return;
  }

  task.verifiedByNgo = true;
  task.verifiedAt = new Date().toISOString();
  task.status = 'COMPLETED';
  task.updatedAt = new Date().toISOString();

  const donation = store.donations.find((d) => d._id === task.donationId);
  if (donation) {
    donation.status = 'COMPLETED';
    donation.updatedAt = new Date().toISOString();
  }

  if (task.volunteerId) {
    const vol = store.volunteers.find((v) => v._id === task.volunteerId);
    if (vol) {
      vol.completedDeliveries = (vol.completedDeliveries || 0) + 1;
      vol.currentTaskCount = Math.max(0, (vol.currentTaskCount || 1) - 1);
    }
  }

  logAudit({
    action: 'PROOF_VERIFIED',
    userId: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    details: `NGO verified delivery proof for task ${task._id}. Workflow completed.`,
  });

  res.json({ success: true, message: 'Proof verified. Task marked as COMPLETED.', task });
}
