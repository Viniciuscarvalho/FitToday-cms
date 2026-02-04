import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { WorkoutFeedback, WorkoutFeedbackListResponse } from '@/types/workout';

export const dynamic = 'force-dynamic';

// GET /api/workouts/[id]/feedback - List feedbacks for a workout
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
    console.error('Error listing workout feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list feedback' },
      { status: 500 }
    );
  }
}

// POST /api/workouts/[id]/feedback - Trainer replies to feedback
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;
    const body = await request.json();

    const { feedbackId, response: trainerResponse } = body;

    if (!feedbackId || !trainerResponse) {
      return NextResponse.json(
        { error: 'feedbackId and response are required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify workout exists
    const workoutDoc = await adminDb.collection('workouts').doc(workoutId).get();
    if (!workoutDoc.exists) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Verify feedback exists and belongs to this workout
    const feedbackDoc = await adminDb.collection('workout_feedback').doc(feedbackId).get();
    if (!feedbackDoc.exists) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const feedbackData = feedbackDoc.data();
    if (feedbackData?.workoutId !== workoutId) {
      return NextResponse.json(
        { error: 'Feedback does not belong to this workout' },
        { status: 400 }
      );
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
    console.error('Error replying to feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reply to feedback' },
      { status: 500 }
    );
  }
}
