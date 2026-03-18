import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { WorkoutFeedback, WorkoutFeedbackListResponse } from '@/types/workout';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/workouts/[id]/feedback - List feedbacks for a workout
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

    // Get feedback documents
    const feedbackSnapshot = await adminDb
      .collection('workout_feedback')
      .where('workoutId', '==', workoutId)
      .orderBy('createdAt', 'desc')
      .get();

    const feedbacks = feedbackSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        respondedAt: data.respondedAt?.toDate?.()?.toISOString() || undefined,
      };
    }) as WorkoutFeedback[];

    const response: WorkoutFeedbackListResponse = {
      feedbacks,
      total: feedbacks.length,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return apiError('Failed to list feedback', 500, 'LIST_FEEDBACK_ERROR', error);
  }
}

// POST /api/workouts/[id]/feedback - Trainer replies to feedback
export async function POST(
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
    const body = await request.json();

    const { feedbackId, response: trainerResponse } = body;

    if (!feedbackId || !trainerResponse) {
      return apiError('feedbackId and response are required', 400, 'INVALID_REQUEST');
    }

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

    // Verify feedback exists and belongs to this workout
    const feedbackDoc = await adminDb.collection('workout_feedback').doc(feedbackId).get();
    if (!feedbackDoc.exists) {
      return apiError('Feedback not found', 404, 'NOT_FOUND');
    }

    const feedbackData = feedbackDoc.data();
    if (feedbackData?.workoutId !== workoutId) {
      return apiError('Feedback does not belong to this workout', 400, 'INVALID_REQUEST');
    }

    // Update feedback with trainer response
    await feedbackDoc.ref.update({
      trainerResponse,
      respondedAt: FieldValue.serverTimestamp(),
    });

    // Get updated feedback
    const updatedDoc = await adminDb.collection('workout_feedback').doc(feedbackId).get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      id: feedbackId,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString(),
      respondedAt: updatedData?.respondedAt?.toDate?.()?.toISOString(),
    });
  } catch (error: any) {
    return apiError('Failed to reply to feedback', 500, 'REPLY_FEEDBACK_ERROR', error);
  }
}
