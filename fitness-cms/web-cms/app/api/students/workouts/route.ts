import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest, generateSignedUrl } from '@/lib/firebase-admin';
import { Workout, WorkoutListResponse } from '@/types/workout';

export const dynamic = 'force-dynamic';

// GET /api/students/workouts - List workouts for the authenticated student
export async function GET(request: NextRequest) {
  try {
    // Verify auth (any role, but we'll check for student)
    const authResult = await verifyAuthRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isAuthenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'This endpoint is for students only' },
        { status: 403 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Use verified uid as studentId — student can only see their own workouts
    const studentId = authResult.uid;

    let query = adminDb
      .collection('workouts')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const snapshot = await query.get();

    const workouts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const workout = { id: doc.id, ...doc.data() } as Workout;

        // Filter by status if provided
        if (status && workout.status !== status) {
          return null;
        }

        // Regenerate signed URL for each workout
        let pdfUrl = workout.pdfUrl;
        if (workout.pdfPath) {
          try {
            pdfUrl = await generateSignedUrl(workout.pdfPath);
          } catch {
            // Keep original URL if regeneration fails
          }
        }

        // Get progress for each workout
        const progressSnapshot = await adminDb!
          .collection('workout_progress')
          .where('workoutId', '==', doc.id)
          .limit(1)
          .get();

        const progress = progressSnapshot.empty
          ? undefined
          : { id: progressSnapshot.docs[0].id, ...progressSnapshot.docs[0].data() };

        // Get feedback count
        const feedbackSnapshot = await adminDb!
          .collection('workout_feedback')
          .where('workoutId', '==', doc.id)
          .count()
          .get();

        return {
          id: workout.id,
          trainerId: workout.trainerId,
          studentId: workout.studentId,
          title: workout.title,
          description: workout.description,
          pdfUrl,
          durationWeeks: workout.durationWeeks,
          totalDays: workout.totalDays,
          startDate: workout.startDate,
          status: workout.status,
          createdAt: workout.createdAt,
          progress,
          feedbackCount: feedbackSnapshot.data().count,
        };
      })
    );

    // Filter out nulls (status filtered items)
    const filteredWorkouts = workouts.filter((w) => w !== null);

    const response: WorkoutListResponse = {
      workouts: filteredWorkouts as any,
      total: filteredWorkouts.length,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error listing student workouts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list workouts' },
      { status: 500 }
    );
  }
}
