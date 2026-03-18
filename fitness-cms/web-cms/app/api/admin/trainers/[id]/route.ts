import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { PersonalTrainer } from '@/types';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/admin/trainers/[id] - Get trainer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const verification = await verifyAdminRequest(authHeader);

    if (!verification.isAdmin) {
      return apiError(verification.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    // Get trainer document
    const trainerDoc = await adminDb.collection('users').doc(id).get();

    if (!trainerDoc.exists) {
      return apiError('Trainer not found', 404, 'NOT_FOUND');
    }

    const trainerData = trainerDoc.data() as PersonalTrainer;

    if (trainerData.role !== 'trainer') {
      return apiError('User is not a trainer', 400, 'INVALID_REQUEST');
    }

    // Get trainer's students count
    const studentsSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'student')
      .where('trainerId', '==', id)
      .count()
      .get();

    // Get trainer's programs count
    const programsSnapshot = await adminDb
      .collection('programs')
      .where('trainerId', '==', id)
      .count()
      .get();

    // Get trainer's workouts count
    const workoutsSnapshot = await adminDb
      .collection('workouts')
      .where('trainerId', '==', id)
      .count()
      .get();

    const response = {
      ...trainerData,
      uid: id,
      createdAt: trainerData.createdAt?.toDate?.()?.toISOString(),
      updatedAt: trainerData.updatedAt?.toDate?.()?.toISOString(),
      statusUpdatedAt: trainerData.statusUpdatedAt?.toDate?.()?.toISOString(),
      stats: {
        studentsCount: studentsSnapshot.data().count,
        programsCount: programsSnapshot.data().count,
        workoutsCount: workoutsSnapshot.data().count,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return apiError('Failed to get trainer', 500, 'GET_TRAINER_ERROR', error);
  }
}
