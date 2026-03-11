import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET /api/notifications - List notifications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
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
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (body.action !== 'markAllRead') {
      return NextResponse.json(
        { error: 'Invalid action. Use { action: "markAllRead" }', code: 'INVALID_ACTION' },
        { status: 400 }
      );
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
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
