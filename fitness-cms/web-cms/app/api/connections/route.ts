import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET /api/connections?status=pending|active|rejected
// Returns connection requests for the authenticated trainer, enriched with student info.
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

    if (authResult.role !== 'trainer') {
      return NextResponse.json(
        { error: 'Only trainers can view connection requests', code: 'FORBIDDEN' },
        { status: 403 }
      );
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

    // Enrich with student data
    const connections = await Promise.all(
      snap.docs.map(async (doc) => {
        const data = doc.data();
        const studentDoc = await adminDb!.collection('users').doc(data.studentId).get();
        const student = studentDoc.exists ? studentDoc.data() : null;

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
          student: student
            ? {
                uid: student.uid,
                displayName: student.displayName || 'Aluno',
                email: student.email || '',
                photoURL: student.photoURL || null,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ connections, total: connections.length });
  } catch (error: any) {
    console.error('Error fetching connection requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connection requests' },
      { status: 500 }
    );
  }
}
