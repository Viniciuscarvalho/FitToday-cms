import { NextRequest, NextResponse } from 'next/server';
import { adminDb, uploadWorkoutPDF, sendWorkoutNotification } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Workout, WorkoutProgress, CreateWorkoutResponse, WorkoutListResponse } from '@/types/workout';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

// POST /api/workouts - Create a new workout
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract fields
    const file = formData.get('file') as File | null;
    const trainerId = formData.get('trainerId') as string;
    const studentId = formData.get('studentId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const durationWeeks = formData.get('durationWeeks') as string | null;
    const totalDays = formData.get('totalDays') as string | null;
    const startDate = formData.get('startDate') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
    }

    if (!trainerId || !studentId || !title) {
      return NextResponse.json(
        { error: 'trainerId, studentId, and title are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Generate workout ID
    const workoutRef = adminDb.collection('workouts').doc();
    const workoutId = workoutRef.id;

    // Upload PDF to Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { path: pdfPath, url: pdfUrl } = await uploadWorkoutPDF(
      trainerId,
      workoutId,
      fileBuffer,
      file.type
    );

    // Calculate total days (default to durationWeeks * 7 if not provided)
    const parsedDurationWeeks = durationWeeks ? parseInt(durationWeeks) : undefined;
    const parsedTotalDays = totalDays
      ? parseInt(totalDays)
      : parsedDurationWeeks
      ? parsedDurationWeeks * 7
      : 28; // Default to 4 weeks

    // Create workout document
    const workoutData: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'> & {
      createdAt: FirebaseFirestore.FieldValue;
      updatedAt: FirebaseFirestore.FieldValue;
    } = {
      trainerId,
      studentId,
      title,
      description: description || undefined,
      pdfUrl,
      pdfPath,
      durationWeeks: parsedDurationWeeks,
      totalDays: parsedTotalDays,
      startDate: startDate ? new Date(startDate) as any : undefined,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await workoutRef.set(workoutData);

    // Create initial progress document
    const progressRef = adminDb.collection('workout_progress').doc();
    const progressData: Omit<WorkoutProgress, 'id' | 'createdAt' | 'updatedAt'> & {
      createdAt: FirebaseFirestore.FieldValue;
      updatedAt: FirebaseFirestore.FieldValue;
    } = {
      workoutId,
      studentId,
      completedDays: [],
      totalDays: parsedTotalDays,
      percentComplete: 0,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await progressRef.set(progressData);

    // Send push notification to student
    try {
      // Get student's FCM token
      const studentDoc = await adminDb.collection('users').doc(studentId).get();
      const studentData = studentDoc.data();
      const fcmToken = studentData?.fcmToken;

      // Get trainer's name
      const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
      const trainerData = trainerDoc.data();
      const trainerName = trainerData?.displayName || 'Seu Personal';

      if (fcmToken) {
        await sendWorkoutNotification(fcmToken, workoutId, title, trainerName);
      }
    } catch (notificationError) {
      // Log but don't fail the request if notification fails
      console.error('Failed to send push notification:', notificationError);
    }

    const response: CreateWorkoutResponse = {
      id: workoutId,
      pdfUrl,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workout' },
      { status: 500 }
    );
  }
}

// GET /api/workouts - List workouts for a trainer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!trainerId) {
      return NextResponse.json({ error: 'trainerId is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Build query
    let query = adminDb
      .collection('workouts')
      .where('trainerId', '==', trainerId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (studentId) {
      query = adminDb
        .collection('workouts')
        .where('trainerId', '==', trainerId)
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .limit(limit);
    }

    const snapshot = await query.get();

    const workouts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const workout = { id: doc.id, ...doc.data() } as Workout;

        // Optionally filter by status
        if (status && workout.status !== status) {
          return null;
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
          ...workout,
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
    console.error('Error listing workouts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list workouts' },
      { status: 500 }
    );
  }
}
