import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET /api/chats?trainerId=xxx&studentId=xxx
// Check if a chat room exists for a trainer-student pair and return it.
// Used by the app to avoid creating duplicate chat rooms.
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
    const trainerId = searchParams.get('trainerId');
    const studentId = searchParams.get('studentId');

    if (!trainerId || !studentId) {
      return NextResponse.json(
        { error: 'trainerId and studentId are required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Only allow the trainer or student in the pair to query
    if (authResult.uid !== trainerId && authResult.uid !== studentId) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const snap = await adminDb
      .collection('chats')
      .where('trainerId', '==', trainerId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ exists: false, chatRoom: null });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    return NextResponse.json({
      exists: true,
      chatRoom: {
        id: doc.id,
        trainerId: data.trainerId,
        studentId: data.studentId,
        isActive: data.isActive,
        lastMessage: data.lastMessage,
        createdAt: data.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error checking chat room:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check chat room' },
      { status: 500 }
    );
  }
}
