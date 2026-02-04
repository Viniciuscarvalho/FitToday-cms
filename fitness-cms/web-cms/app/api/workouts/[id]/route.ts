import { NextRequest, NextResponse } from 'next/server';
import { adminDb, deleteWorkoutPDF, generateSignedUrl } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Workout, WorkoutWithProgress } from '@/types/workout';

export const dynamic = 'force-dynamic';

// GET /api/workouts/[id] - Get workout details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get workout document
    const workoutDoc = await adminDb.collection('workouts').doc(workoutId).get();

    if (!workoutDoc.exists) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const workout = { id: workoutDoc.id, ...workoutDoc.data() } as Workout;

    // Regenerate signed URL if needed (URL might have expired)
    let pdfUrl = workout.pdfUrl;
    if (workout.pdfPath) {
      try {
        pdfUrl = await generateSignedUrl(workout.pdfPath);
      } catch (error) {
        console.error('Failed to regenerate signed URL:', error);
      }
    }

    // Get progress
    const progressSnapshot = await adminDb
      .collection('workout_progress')
      .where('workoutId', '==', workoutId)
      .limit(1)
      .get();

    const progress = progressSnapshot.empty
      ? undefined
      : { id: progressSnapshot.docs[0].id, ...progressSnapshot.docs[0].data() };

    // Get feedback count
    const feedbackSnapshot = await adminDb
      .collection('workout_feedback')
      .where('workoutId', '==', workoutId)
      .count()
      .get();

    const response: WorkoutWithProgress = {
      ...workout,
      pdfUrl, // Updated signed URL
      progress: progress as any,
      feedbackCount: feedbackSnapshot.data().count,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting workout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get workout' },
      { status: 500 }
    );
  }
}

// PATCH /api/workouts/[id] - Update workout
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;
    const body = await request.json();

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get workout document to verify it exists
    const workoutDoc = await adminDb.collection('workouts').doc(workoutId).get();

    if (!workoutDoc.exists) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Allowed fields to update
    const allowedFields = ['title', 'description', 'status', 'durationWeeks', 'totalDays', 'startDate'];
    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'startDate' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    await adminDb.collection('workouts').doc(workoutId).update(updateData);

    // If totalDays was updated, also update the progress document
    if (body.totalDays !== undefined) {
      const progressSnapshot = await adminDb
        .collection('workout_progress')
        .where('workoutId', '==', workoutId)
        .limit(1)
        .get();

      if (!progressSnapshot.empty) {
        const progressDoc = progressSnapshot.docs[0];
        const progressData = progressDoc.data();
        const completedDays = progressData.completedDays || [];
        const percentComplete = body.totalDays > 0
          ? Math.round((completedDays.length / body.totalDays) * 100)
          : 0;

        await progressDoc.ref.update({
          totalDays: body.totalDays,
          percentComplete,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Get updated document
    const updatedDoc = await adminDb.collection('workouts').doc(workoutId).get();
    const updatedWorkout = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json(updatedWorkout);
  } catch (error: any) {
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update workout' },
      { status: 500 }
    );
  }
}

// DELETE /api/workouts/[id] - Archive workout (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get workout document
    const workoutDoc = await adminDb.collection('workouts').doc(workoutId).get();

    if (!workoutDoc.exists) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    const workout = workoutDoc.data() as Workout;

    if (hardDelete) {
      // Hard delete: remove PDF from Storage and document from Firestore
      if (workout.pdfPath) {
        await deleteWorkoutPDF(workout.pdfPath);
      }

      // Delete progress documents
      const progressSnapshot = await adminDb
        .collection('workout_progress')
        .where('workoutId', '==', workoutId)
        .get();

      const batch = adminDb.batch();

      progressSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete feedback documents
      const feedbackSnapshot = await adminDb
        .collection('workout_feedback')
        .where('workoutId', '==', workoutId)
        .get();

      feedbackSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete workout document
      batch.delete(workoutDoc.ref);

      await batch.commit();

      return NextResponse.json({ message: 'Workout permanently deleted' });
    } else {
      // Soft delete: just update status to archived
      await adminDb.collection('workouts').doc(workoutId).update({
        status: 'archived',
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ message: 'Workout archived' });
    }
  } catch (error: any) {
    console.error('Error deleting workout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workout' },
      { status: 500 }
    );
  }
}
