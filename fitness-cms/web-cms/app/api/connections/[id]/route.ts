import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// PATCH /api/connections/[id]
// body: { action: 'accept' | 'reject' }
// Only the trainer that owns the connection can respond.
export async function PATCH(
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

    if (authResult.role !== 'trainer') {
      return NextResponse.json(
        { error: 'Only trainers can respond to connection requests', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { id: connectionId } = await params;
    const trainerId = authResult.uid;

    const body = await request.json();
    const action: 'accept' | 'reject' = body?.action;

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: 'action must be "accept" or "reject"', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Fetch the connection doc
    const connectionRef = adminDb.collection('trainerStudents').doc(connectionId);
    const connectionDoc = await connectionRef.get();

    if (!connectionDoc.exists) {
      return NextResponse.json({ error: 'Connection request not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const connection = connectionDoc.data()!;

    if (connection.trainerId !== trainerId) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    if (connection.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been responded to', code: 'ALREADY_RESPONDED' },
        { status: 409 }
      );
    }

    const studentId: string = connection.studentId;

    if (action === 'reject') {
      await connectionRef.update({
        status: 'rejected',
        respondedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Notify student of rejection
      await sendInAppNotification(trainerId, studentId, 'student', {
        type: 'connection_rejected',
        title: 'Solicitação não aceita',
        body: 'O personal não pôde aceitar sua solicitação no momento.',
        relatedEntityType: 'connection',
        relatedEntityId: connectionId,
        destination: '/',
      });

      return NextResponse.json({ id: connectionId, status: 'rejected' });
    }

    // --- ACCEPT ---
    const batch = adminDb.batch();

    // 1. Update connection to active
    batch.update(connectionRef, {
      status: 'active',
      respondedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Create subscription record (free, app-based connection)
    const lifetimeEnd = Timestamp.fromDate(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000));
    const subscriptionRef = adminDb.collection('subscriptions').doc();
    batch.set(subscriptionRef, {
      trainerId,
      studentId,
      programId: null,
      status: 'active',
      source: 'app_request',
      connectionId,
      startDate: FieldValue.serverTimestamp(),
      currentPeriodStart: FieldValue.serverTimestamp(),
      currentPeriodEnd: lifetimeEnd,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Link student to trainer in the user doc
    batch.update(adminDb.collection('users').doc(studentId), {
      trainerId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4. Update trainer's student count
    batch.update(adminDb.collection('users').doc(trainerId), {
      'store.totalStudents': FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // 5. Create chat room for trainer ↔ student communication
    await createChatRoom(trainerId, studentId);

    // 6. Notify student of acceptance
    await sendInAppNotification(trainerId, studentId, 'student', {
      type: 'connection_accepted',
      title: 'Conexão aceita!',
      body: 'Seu personal aceitou sua solicitação. Você já pode começar!',
      relatedEntityType: 'connection',
      relatedEntityId: connectionId,
      destination: '/chat',
    });

    return NextResponse.json({
      id: connectionId,
      status: 'active',
      subscriptionId: subscriptionRef.id,
    });
  } catch (error: any) {
    console.error('Error responding to connection request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to respond to connection request' },
      { status: 500 }
    );
  }
}

async function sendInAppNotification(
  _fromId: string,
  toUserId: string,
  userRole: 'trainer' | 'student',
  data: {
    type: string;
    title: string;
    body: string;
    relatedEntityType: string;
    relatedEntityId: string;
    destination: string;
  }
) {
  const notificationRef = adminDb!
    .collection('users')
    .doc(toUserId)
    .collection('notifications')
    .doc();

  await notificationRef.set({
    id: notificationRef.id,
    userId: toUserId,
    userRole,
    type: data.type,
    title: data.title,
    body: data.body,
    action: {
      type: 'navigate',
      destination: data.destination,
    },
    relatedEntityType: data.relatedEntityType,
    relatedEntityId: data.relatedEntityId,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function createChatRoom(trainerId: string, studentId: string) {
  // Avoid duplicate chat rooms
  const existing = await adminDb!
    .collection('chats')
    .where('trainerId', '==', trainerId)
    .where('studentId', '==', studentId)
    .limit(1)
    .get();

  if (!existing.empty) return existing.docs[0].id;

  const welcomeText =
    'Olá! Conexão estabelecida. Este é o seu canal direto com seu personal. Qualquer dúvida é só mandar mensagem!';

  const chatRef = adminDb!.collection('chats').doc();
  await chatRef.set({
    id: chatRef.id,
    trainerId,
    studentId,
    programId: null,
    isActive: true,
    lastMessage: welcomeText,
    unreadCountTrainer: 0,
    unreadCountStudent: 1,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await chatRef.collection('messages').add({
    roomId: chatRef.id,
    senderId: 'system',
    senderRole: 'system',
    type: 'text',
    content: welcomeText,
    status: 'sent',
    createdAt: FieldValue.serverTimestamp(),
  });

  return chatRef.id;
}
