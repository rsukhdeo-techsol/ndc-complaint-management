import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  getCountFromServer,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import {
  Notification,
  CreateNotificationInput,
  NotificationType,
} from '@/types';

// ============================================
// NOTIFICATION CRUD OPERATIONS
// ============================================

/**
 * Create a new notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const now = Timestamp.now();

  const notificationData: Omit<Notification, 'id'> = {
    recipientId: input.recipientId,
    type: input.type,
    title: input.title,
    message: input.message,
    isRead: false,
    createdAt: now,
  };

  // Add optional fields
  if (input.complaintId) notificationData.complaintId = input.complaintId;
  if (input.complaintRef) notificationData.complaintRef = input.complaintRef;
  if (input.actorId) notificationData.actorId = input.actorId;
  if (input.actorName) notificationData.actorName = input.actorName;

  const docRef = await addDoc(notificationsRef, notificationData);

  return {
    id: docRef.id,
    ...notificationData,
  } as Notification;
}

/**
 * Get a notification by ID
 */
export async function getNotification(
  notificationId: string
): Promise<Notification | null> {
  const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Notification;
}

/**
 * Get notifications for a user
 */
export async function getNotifications(options?: {
  recipientId?: string;
  isRead?: boolean;
  type?: NotificationType;
  limitCount?: number;
}): Promise<Notification[]> {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const constraints = [];

  if (options?.recipientId) {
    constraints.push(where('recipientId', '==', options.recipientId));
  }

  if (options?.isRead !== undefined) {
    constraints.push(where('isRead', '==', options.isRead));
  }

  if (options?.type) {
    constraints.push(where('type', '==', options.type));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const q = query(notificationsRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  recipientId?: string
): Promise<number> {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const constraints = [where('isRead', '==', false)];

  if (recipientId) {
    constraints.push(where('recipientId', '==', recipientId));
  }

  const q = query(notificationsRef, ...constraints);
  const snapshot = await getCountFromServer(q);

  return snapshot.data().count;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);

  await updateDoc(docRef, {
    isRead: true,
    readAt: Timestamp.now(),
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  recipientId?: string
): Promise<void> {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const constraints = [where('isRead', '==', false)];

  if (recipientId) {
    constraints.push(where('recipientId', '==', recipientId));
  }

  const q = query(notificationsRef, ...constraints);
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);
  const now = Timestamp.now();

  snapshot.docs.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, {
      isRead: true,
      readAt: now,
    });
  });

  await batch.commit();
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await deleteDoc(docRef);
}

/**
 * Delete all notifications for a user
 */
export async function clearAllNotifications(
  recipientId?: string
): Promise<void> {
  const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  const constraints = [];

  if (recipientId) {
    constraints.push(where('recipientId', '==', recipientId));
  }

  const q = query(notificationsRef, ...constraints);
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  await batch.commit();
}

// ============================================
// NOTIFICATION HELPER FUNCTIONS
// ============================================

/**
 * Create notification for new complaint
 */
export async function notifyNewComplaint(
  complaintId: string,
  complaintRef: string,
  complainantName: string,
  creatorId: string,
  creatorName: string
): Promise<void> {
  // In a real app, you'd notify admins/overseers
  // For now, we'll create a notification for a placeholder user
  await createNotification({
    recipientId: 'overseer',
    type: 'new_complaint',
    title: 'New Complaint Submitted',
    message: `${complainantName} submitted a new complaint`,
    complaintId,
    complaintRef,
    actorId: creatorId,
    actorName: creatorName,
  });
}

/**
 * Create notification for assignment
 */
export async function notifyAssignment(
  complaintId: string,
  complaintRef: string,
  assigneeId: string,
  assignerId: string,
  assignerName: string
): Promise<void> {
  await createNotification({
    recipientId: assigneeId,
    type: 'assignment',
    title: 'Complaint Assigned to You',
    message: `${assignerName} assigned complaint ${complaintRef} to you`,
    complaintId,
    complaintRef,
    actorId: assignerId,
    actorName: assignerName,
  });
}

/**
 * Create notification for new comment
 */
export async function notifyComment(
  complaintId: string,
  complaintRef: string,
  recipientId: string,
  commenterId: string,
  commenterName: string,
  commentPreview: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'comment',
    title: 'New Comment',
    message: `${commenterName}: "${commentPreview.slice(0, 50)}${commentPreview.length > 50 ? '...' : ''}"`,
    complaintId,
    complaintRef,
    actorId: commenterId,
    actorName: commenterName,
  });
}

/**
 * Create notification for status change
 */
export async function notifyStatusChange(
  complaintId: string,
  complaintRef: string,
  recipientId: string,
  newStatus: string,
  changerId: string,
  changerName: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'status_change',
    title: 'Status Updated',
    message: `${changerName} changed status of ${complaintRef} to ${newStatus}`,
    complaintId,
    complaintRef,
    actorId: changerId,
    actorName: changerName,
  });
}

/**
 * Create notification for due date reminder
 */
export async function notifyDueDateReminder(
  complaintId: string,
  complaintRef: string,
  recipientId: string,
  dueIn: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'due_date_reminder',
    title: 'Due Date Approaching',
    message: `Complaint ${complaintRef} is due ${dueIn}`,
    complaintId,
    complaintRef,
  });
}

/**
 * Create notification for overdue complaint
 */
export async function notifyOverdue(
  complaintId: string,
  complaintRef: string,
  recipientId: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'overdue_alert',
    title: 'Complaint Overdue',
    message: `Complaint ${complaintRef} is overdue and requires attention`,
    complaintId,
    complaintRef,
  });
}

/**
 * Create notification for mention
 */
export async function notifyMention(
  complaintId: string,
  complaintRef: string,
  recipientId: string,
  mentionerId: string,
  mentionerName: string,
  context: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'mention',
    title: 'You were mentioned',
    message: `${mentionerName} mentioned you in ${complaintRef}: "${context.slice(0, 50)}${context.length > 50 ? '...' : ''}"`,
    complaintId,
    complaintRef,
    actorId: mentionerId,
    actorName: mentionerName,
  });
}
