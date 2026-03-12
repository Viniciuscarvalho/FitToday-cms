import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Standard notification types
export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_rejected'
  | 'connection_cancelled'
  | 'new_workout'
  | 'workout_completed'
  | 'message'
  | 'payment'
  | 'profile_update';

export interface NotificationActor {
  id: string;
  name: string;
  avatar?: string;
}

export interface CreateNotificationParams {
  type: NotificationType;
  userId: string;
  userRole: 'trainer' | 'student';
  title: string;
  body: string;
  actor?: NotificationActor;
  action?: {
    type: 'navigate';
    destination: string;
  };
  relatedEntityType?: string;
  relatedEntityId?: string;
  groupId?: string;
  groupType?: 'trainers' | 'followers';
  payload?: Record<string, unknown>;
}

/**
 * Create a standardized in-app notification.
 * All notification creation should go through this function
 * to ensure schema compliance.
 */
export async function createNotification(params: CreateNotificationParams): Promise<string> {
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  const notificationRef = adminDb
    .collection('users')
    .doc(params.userId)
    .collection('notifications')
    .doc();

  const notification: Record<string, unknown> = {
    id: notificationRef.id,
    type: params.type,
    userId: params.userId,
    userRole: params.userRole,
    title: params.title,
    body: params.body,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (params.actor) {
    notification.actor = params.actor;
  }

  if (params.action) {
    notification.action = params.action;
  }

  if (params.relatedEntityType) {
    notification.relatedEntityType = params.relatedEntityType;
  }

  if (params.relatedEntityId) {
    notification.relatedEntityId = params.relatedEntityId;
  }

  if (params.groupId) {
    notification.groupId = params.groupId;
  }

  if (params.groupType) {
    notification.groupType = params.groupType;
  }

  if (params.payload) {
    notification.payload = params.payload;
  }

  await notificationRef.set(notification);

  return notificationRef.id;
}
