import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { PersonalTrainer } from '@/types';

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
      return NextResponse.json(
        { error: verification.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get trainer document
    const trainerDoc = await adminDb.collection('users').doc(id).get();

    if (!trainerDoc.exists) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const trainerData = trainerDoc.data() as PersonalTrainer;

    if (trainerData.role !== 'trainer') {
      return NextResponse.json({ error: 'User is not a trainer' }, { status: 400 });
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
    console.error('Error getting trainer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get trainer' },
      { status: 500 }
    );
  }
}
