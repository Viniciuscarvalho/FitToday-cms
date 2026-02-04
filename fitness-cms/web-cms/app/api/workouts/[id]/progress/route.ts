import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { WorkoutProgressResponse } from '@/types/workout';

export const dynamic = 'force-dynamic';

// GET /api/workouts/[id]/progress - Get workout progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify workout exists
    const workoutDoc = await adminDb.collection('workouts').doc(workoutId).get();
    if (!workoutDoc.exists) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
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
    console.error('Error getting workout progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get workout progress' },
      { status: 500 }
    );
  }
}
