import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// POST /api/trainers/[id]/connect - Student requests connection with a trainer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify the student is authenticated
    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Only students can request connections
    if (authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can connect to a trainer', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { id: trainerId } = await params;
    const studentId = authResult.uid;

    // Prevent self-connection
    if (studentId === trainerId) {
      return NextResponse.json(
        { error: 'Cannot connect to yourself', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Verify trainer exists and is active
    const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
    if (!trainerDoc.exists || trainerDoc.data()?.role !== 'trainer' || trainerDoc.data()?.status !== 'active') {
      return NextResponse.json(
        { error: 'Trainer not found', code: 'TRAINER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if connection already exists
    const existing = await adminDb
      .collection('trainerStudents')
      .where('trainerId', '==', trainerId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Already connected — return the existing record
      const doc = existing.docs[0];
      return NextResponse.json({ id: doc.id, ...doc.data(), alreadyConnected: true });
    }

    // Create the connection document in trainerStudents
    const connectionRef = adminDb.collection('trainerStudents').doc();
    await connectionRef.set({
      trainerId,
      studentId,
      status: 'active',
      source: 'app_request',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Also ensure a subscriptions link exists (used by CMS to show the student)
    const existingSubscription = await adminDb
      .collection('subscriptions')
      .where('trainerId', '==', trainerId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (existingSubscription.empty) {
      await adminDb.collection('subscriptions').add({
        trainerId,
        studentId,
        status: 'active',
        source: 'app_request',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Update the student's user document with the trainerId
    await adminDb.collection('users').doc(studentId).update({
      trainerId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { id: connectionRef.id, trainerId, studentId, status: 'active' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating trainer connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to trainer' },
      { status: 500 }
    );
  }
}

// GET /api/trainers/[id]/connect - Check if current student is connected to this trainer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id: trainerId } = await params;
    const studentId = authResult.uid;

    const [trainerStudentsSnap, subscriptionsSnap] = await Promise.all([
      adminDb
        .collection('trainerStudents')
        .where('trainerId', '==', trainerId)
        .where('studentId', '==', studentId)
        .limit(1)
        .get(),
      adminDb
        .collection('subscriptions')
        .where('trainerId', '==', trainerId)
        .where('studentId', '==', studentId)
        .limit(1)
        .get(),
    ]);

    const isConnected = !trainerStudentsSnap.empty || !subscriptionsSnap.empty;

    return NextResponse.json({ isConnected, trainerId, studentId });
  } catch (error: any) {
    console.error('Error checking trainer connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check connection' },
      { status: 500 }
    );
  }
}
