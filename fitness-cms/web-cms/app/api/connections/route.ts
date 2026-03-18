import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/connections?status=pending|active|rejected|cancelled
// Returns connection requests for the authenticated trainer, enriched with student info.
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (authResult.role !== 'trainer') {
      return apiError('Only trainers can view connection requests', 403, 'FORBIDDEN');
    }

    const trainerId = authResult.uid;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    let query = adminDb
      .collection('trainerStudents')
      .where('trainerId', '==', trainerId)
      .where('status', '==', status)
      .orderBy('createdAt', 'desc');

    const snap = await query.get();

    if (snap.empty) {
      return NextResponse.json({ connections: [], total: 0 });
    }

    // Batch fetch all student docs in one round trip (eliminates N+1)
    const studentRefs = snap.docs.map((doc) =>
      adminDb!.collection('users').doc(doc.data().studentId)
    );
    const studentDocs = await adminDb.getAll(...studentRefs);
    const studentMap = new Map(
      studentDocs.map((d) => [d.id, d.exists ? d.data() : null])
    );

    const connections = snap.docs.map((doc) => {
      const data = doc.data();
      const student = studentMap.get(data.studentId) ?? null;

      return {
        id: doc.id,
        trainerId: data.trainerId,
        studentId: data.studentId,
        status: data.status,
        source: data.source,
        message: data.message ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        respondedAt: data.respondedAt ?? null,
        canceledAt: data.canceledAt ?? data.cancelledAt ?? null,
        canceledBy: data.canceledBy ?? data.cancelledBy ?? null,
        cancellationReason: data.cancellationReason ?? null,
        student: student
          ? {
              uid: student.uid,
              displayName: student.displayName || 'Aluno',
              email: student.email || '',
              photoURL: student.photoURL || null,
            }
          : null,
      };
    });

    return NextResponse.json({ connections, total: connections.length });
  } catch (error: any) {
    return apiError('Failed to fetch connection requests', 500, 'FETCH_CONNECTIONS_ERROR', error);
  }
}
