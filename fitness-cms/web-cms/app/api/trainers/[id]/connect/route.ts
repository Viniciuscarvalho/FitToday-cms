import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createNotification } from '@/lib/notifications';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// POST /api/trainers/[id]/connect - Student requests connection with a trainer (pending approval)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (authResult.role !== 'student' && authResult.role !== 'admin') {
      return apiError('Only students can connect to a trainer', 403, 'FORBIDDEN');
    }

    const { id: trainerId } = await params;
    const studentId = authResult.uid;

    if (studentId === trainerId) {
      return apiError('Cannot connect to yourself', 403, 'FORBIDDEN');
    }

    // Verify trainer exists and is active
    const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
    if (
      !trainerDoc.exists ||
      trainerDoc.data()?.role !== 'trainer' ||
      trainerDoc.data()?.status !== 'active'
    ) {
      return apiError('Trainer not found', 404, 'TRAINER_NOT_FOUND');
    }

    // Check if a connection already exists (any status)
    const existing = await adminDb
      .collection('trainerStudents')
      .where('trainerId', '==', trainerId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      const data = doc.data();

      if (data.status === 'active') {
        return NextResponse.json({ id: doc.id, ...data, alreadyConnected: true });
      }

      if (data.status === 'pending') {
        return NextResponse.json(
          { id: doc.id, ...data, alreadyPending: true },
          { status: 200 }
        );
      }

      // If previously rejected or cancelled, delete old doc and create a new one
      // so that the Firebase Function onCreate trigger fires again (FCM push)
      if (data.status === 'rejected' || data.status === 'cancelled') {
        let message: string | undefined;
        try {
          const body = await request.json();
          message = body?.message?.trim()?.substring(0, 500) || undefined;
        } catch {
          // no body is fine
        }

        // Delete old doc, create new one to trigger onCreate
        await doc.ref.delete();

        const newRef = adminDb.collection('trainerStudents').doc();
        await newRef.set({
          trainerId,
          studentId,
          status: 'pending',
          source: 'app_request',
          message: message ?? null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          respondedAt: null,
        });

        // Send in-app notification to trainer
        const studentDoc = await adminDb.collection('users').doc(studentId).get();
        const studentData = studentDoc.data();
        const studentName = studentData?.displayName || 'Um aluno';

        await createNotification({
          type: 'connection_request',
          userId: trainerId,
          userRole: 'trainer',
          title: 'Nova solicitação de conexão',
          body: `${studentName} quer se conectar com você.`,
          actor: {
            id: studentId,
            name: studentName,
            avatar: studentData?.photoURL || undefined,
          },
          action: {
            type: 'navigate',
            destination: '/cms/connections',
          },
          relatedEntityType: 'connection',
          relatedEntityId: newRef.id,
        });

        return NextResponse.json(
          { id: newRef.id, trainerId, studentId, status: 'pending' },
          { status: 201 }
        );
      }

      // Unknown status — return current state
      return NextResponse.json({ id: doc.id, ...data });
    }

    // Get optional message from student
    let message: string | undefined;
    try {
      const body = await request.json();
      message = body?.message?.trim()?.substring(0, 500) || undefined;
    } catch {
      // no body is fine
    }

    // Create the connection request as pending
    const connectionRef = adminDb.collection('trainerStudents').doc();
    await connectionRef.set({
      trainerId,
      studentId,
      status: 'pending',
      source: 'app_request',
      message: message ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      respondedAt: null,
    });

    // Send in-app notification to trainer using standardized schema
    const studentDoc = await adminDb.collection('users').doc(studentId).get();
    const studentData = studentDoc.data();
    const studentName = studentData?.displayName || 'Um aluno';

    await createNotification({
      type: 'connection_request',
      userId: trainerId,
      userRole: 'trainer',
      title: 'Nova solicitação de conexão',
      body: `${studentName} quer se conectar com você.`,
      actor: {
        id: studentId,
        name: studentName,
        avatar: studentData?.photoURL || undefined,
      },
      action: {
        type: 'navigate',
        destination: '/cms/connections',
      },
      relatedEntityType: 'connection',
      relatedEntityId: connectionRef.id,
    });

    return NextResponse.json(
      { id: connectionRef.id, trainerId, studentId, status: 'pending' },
      { status: 201 }
    );
  } catch (error: any) {
    return apiError('Failed to connect to trainer', 500, 'CONNECT_TRAINER_ERROR', error);
  }
}

// GET /api/trainers/[id]/connect - Check connection status for the current student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id: trainerId } = await params;
    const studentId = authResult.uid;

    const snap = await adminDb
      .collection('trainerStudents')
      .where('trainerId', '==', trainerId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ isConnected: false, status: null, trainerId, studentId });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    return NextResponse.json({
      isConnected: data.status === 'active',
      status: data.status,
      connectionId: doc.id,
      trainerId,
      studentId,
    });
  } catch (error: any) {
    return apiError('Failed to check connection', 500, 'CHECK_CONNECTION_ERROR', error);
  }
}
