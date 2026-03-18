import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/chats?trainerId=xxx&studentId=xxx
// Check if a chat room exists for a trainer-student pair and return it.
// Used by the app to avoid creating duplicate chat rooms.
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
    const trainerId = searchParams.get('trainerId');
    const studentId = searchParams.get('studentId');

    if (!trainerId || !studentId) {
      return apiError('trainerId and studentId are required', 400, 'BAD_REQUEST');
    }

    // Only allow the trainer or student in the pair to query
    if (authResult.uid !== trainerId && authResult.uid !== studentId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
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
    return apiError('Failed to check chat room', 500, 'CHECK_CHAT_ROOM_ERROR', error);
  }
}
