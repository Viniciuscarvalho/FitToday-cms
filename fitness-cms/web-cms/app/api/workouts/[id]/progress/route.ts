import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';
import { WorkoutProgressResponse } from '@/types/workout';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/workouts/[id]/progress - Get workout progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify trainer auth
    const authResult = await verifyTrainerRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isTrainer || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const workoutId = params.id;

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    // Verify workout exists and belongs to this trainer
    const workoutDoc = await adminDb.collection('workouts').doc(workoutId).get();
    if (!workoutDoc.exists) {
      return apiError('Workout not found', 404, 'NOT_FOUND');
    }

    const workoutData = workoutDoc.data();
    if (workoutData?.trainerId !== authResult.uid) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Get progress document
    const progressSnapshot = await adminDb
      .collection('workout_progress')
      .where('workoutId', '==', workoutId)
      .limit(1)
      .get();

    if (progressSnapshot.empty) {
      // Return default progress if none exists
      const workoutData = workoutDoc.data();
      const response: WorkoutProgressResponse = {
        workoutId,
        completedDays: [],
        totalDays: workoutData?.totalDays || 28,
        percentComplete: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
      return NextResponse.json(response);
    }

    const progressData = progressSnapshot.docs[0].data();

    const response: WorkoutProgressResponse = {
      workoutId,
      completedDays: progressData.completedDays || [],
      totalDays: progressData.totalDays || 28,
      percentComplete: progressData.percentComplete || 0,
      currentStreak: progressData.currentStreak || 0,
      longestStreak: progressData.longestStreak || 0,
      lastActivityAt: progressData.lastActivityAt?.toDate?.()?.toISOString() || undefined,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return apiError('Failed to get workout progress', 500, 'GET_PROGRESS_ERROR', error);
  }
}
