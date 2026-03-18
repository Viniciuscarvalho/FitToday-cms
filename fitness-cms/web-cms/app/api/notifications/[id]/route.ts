import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// PATCH /api/notifications/[id] - Mark a single notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id: notificationId } = await params;

    const notifRef = adminDb
      .collection('users')
      .doc(authResult.uid)
      .collection('notifications')
      .doc(notificationId);

    const notifDoc = await notifRef.get();
    if (!notifDoc.exists) {
      return apiError('Notification not found', 404, 'NOT_FOUND');
    }

    await notifRef.update({ isRead: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError('Failed to mark notification as read', 500, 'MARK_NOTIFICATION_ERROR', error);
  }
}
