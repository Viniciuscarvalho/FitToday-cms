import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
    if (!authResult.isTrainer || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const { id: studentId } = await params;

    // Fetch workout completions to get performance data (weight lifted over time)
    const completionsSnapshot = await adminDb
      .collection('workout_completions')
      .where('trainerId', '==', authResult.uid)
      .where('studentId', '==', studentId)
      .orderBy('completedAt', 'asc')
      .get();

    const workoutData = completionsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Extract exercises and their weights
      const exercises = data.exercises || [];
      const intensity = data.intensity || (data.duration > 45 ? 'high' : data.duration > 20 ? 'medium' : 'low');
      
      return {
        date: data.completedAt?.toDate?.()?.toISOString() || null,
        workoutName: data.workoutName,
        duration: data.duration,
        intensity,
        exercises: exercises.map((ex: any) => ({
          name: ex.name,
          weight: ex.weight || 0,
          sets: ex.sets || 0,
          reps: ex.reps || 0
        }))
      };
    });

    return NextResponse.json({ workoutData });
  } catch (error: any) {
    return apiError('Failed to fetch student analytics', 500, 'FETCH_ANALYTICS_ERROR', error);
  }
}
