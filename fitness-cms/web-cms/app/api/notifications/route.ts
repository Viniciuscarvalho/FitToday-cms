import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/notifications - List notifications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let query: FirebaseFirestore.Query = adminDb
      .collection('users')
      .doc(authResult.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(limitParam);

    if (unreadOnly) {
      query = adminDb
        .collection('users')
        .doc(authResult.uid)
        .collection('notifications')
        .where('isRead', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limitParam);
    }

    const snap = await query.get();

    const notifications = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error: any) {
    return apiError('Failed to fetch notifications', 500, 'FETCH_NOTIFICATIONS_ERROR', error);
  }
}

// PATCH /api/notifications - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    if (body.action !== 'markAllRead') {
      return apiError('Invalid action. Use { action: "markAllRead" }', 400, 'INVALID_ACTION');
    }

    const unreadSnap = await adminDb
      .collection('users')
      .doc(authResult.uid)
      .collection('notifications')
      .where('isRead', '==', false)
      .get();

    if (unreadSnap.empty) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    const batch = adminDb.batch();
    unreadSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();

    return NextResponse.json({ success: true, updated: unreadSnap.size });
  } catch (error: any) {
    return apiError('Failed to mark notifications as read', 500, 'MARK_NOTIFICATIONS_ERROR', error);
  }
}
