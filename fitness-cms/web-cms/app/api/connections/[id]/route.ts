import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { createNotification, NotificationType } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// PATCH /api/connections/[id]
// body: { action: 'accept' | 'reject' | 'cancel', reason?: string }
// accept/reject: Only the trainer that owns the connection can respond.
// cancel: Either the trainer or the student in the connection can cancel.
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

    const { id: connectionId } = await params;
    const userId = authResult.uid;

    const body = await request.json();
    const action: 'accept' | 'reject' | 'cancel' = body?.action;

    if (action !== 'accept' && action !== 'reject' && action !== 'cancel') {
      return NextResponse.json(
        { error: 'action must be "accept", "reject", or "cancel"', code: 'BAD_REQUEST' },
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
    const trainerId: string = connection.trainerId;
    const studentId: string = connection.studentId;

    // Handle cancel action — either party can cancel
    if (action === 'cancel') {
      if (userId !== trainerId && userId !== studentId) {
        return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
      }

      if (connection.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Connection is already cancelled', code: 'ALREADY_CANCELLED' },
          { status: 409 }
        );
      }

      const reason = typeof body?.reason === 'string' ? body.reason.trim().substring(0, 500) : null;
      const cancelledBy = userId === trainerId ? 'trainer' : 'student';

      const batch = adminDb.batch();

      // 1. Update connection status
      batch.update(connectionRef, {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy,
        cancellationReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2. If connection was active, clean up related records
      if (connection.status === 'active') {
        // Deactivate subscription
        const subsSnap = await adminDb
          .collection('subscriptions')
          .where('connectionId', '==', connectionId)
          .where('status', '==', 'active')
          .limit(1)
          .get();

        if (!subsSnap.empty) {
          batch.update(subsSnap.docs[0].ref, {
            status: 'canceled',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        // Remove trainerId from student
        batch.update(adminDb.collection('users').doc(studentId), {
          trainerId: null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Decrement trainer's student count
        batch.update(adminDb.collection('users').doc(trainerId), {
          'store.totalStudents': FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Deactivate chat room
        const chatSnap = await adminDb
          .collection('chats')
          .where('trainerId', '==', trainerId)
          .where('studentId', '==', studentId)
          .where('isActive', '==', true)
          .limit(1)
          .get();

        if (!chatSnap.empty) {
          batch.update(chatSnap.docs[0].ref, {
            isActive: false,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      await batch.commit();

      // Notify the other party with actor info
      const notifyUserId = userId === trainerId ? studentId : trainerId;
      const notifyRole = userId === trainerId ? 'student' : 'trainer';
      const actorDoc = await adminDb.collection('users').doc(userId).get();
      const actorData = actorDoc.data();

      await createNotification({
        type: 'connection_cancelled',
        userId: notifyUserId,
        userRole: notifyRole as 'trainer' | 'student',
        title: 'Conexão cancelada',
        body: reason
          ? `A conexão foi cancelada. Motivo: ${reason}`
          : 'A conexão foi cancelada.',
        actor: {
          id: userId,
          name: actorData?.displayName || 'Usuário',
          avatar: actorData?.photoURL || undefined,
        },
        action: {
          type: 'navigate',
          destination: notifyRole === 'trainer' ? '/cms/connections' : '/',
        },
        relatedEntityType: 'connection',
        relatedEntityId: connectionId,
      });

      return NextResponse.json({
        id: connectionId,
        status: 'cancelled',
        cancelledBy,
        reason,
      });
    }

    // For accept/reject, only the trainer can respond
    if (authResult.role !== 'trainer') {
      return NextResponse.json(
        { error: 'Only trainers can respond to connection requests', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (connection.trainerId !== userId) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    if (connection.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been responded to', code: 'ALREADY_RESPONDED' },
        { status: 409 }
      );
    }

    if (action === 'reject') {
      await connectionRef.update({
        status: 'rejected',
        respondedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Notify student of rejection with actor info
      const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
      const trainerData = trainerDoc.data();

      await createNotification({
        type: 'connection_rejected',
        userId: studentId,
        userRole: 'student',
        title: 'Solicitação não aceita',
        body: 'O personal não pôde aceitar sua solicitação no momento.',
        actor: {
          id: trainerId,
          name: trainerData?.displayName || 'Personal',
          avatar: trainerData?.photoURL || undefined,
        },
        action: { type: 'navigate', destination: '/' },
        relatedEntityType: 'connection',
        relatedEntityId: connectionId,
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

    // 5. Create chat room for trainer ↔ student communication (with dedup)
    const chatRoomId = await createChatRoom(trainerId, studentId);

    // 6. Notify student of acceptance with actor info
    const acceptTrainerDoc = await adminDb.collection('users').doc(trainerId).get();
    const acceptTrainerData = acceptTrainerDoc.data();

    await createNotification({
      type: 'connection_accepted',
      userId: studentId,
      userRole: 'student',
      title: 'Conexão aceita!',
      body: 'Seu personal aceitou sua solicitação. Você já pode começar!',
      actor: {
        id: trainerId,
        name: acceptTrainerData?.displayName || 'Personal',
        avatar: acceptTrainerData?.photoURL || undefined,
      },
      action: { type: 'navigate', destination: '/chat' },
      relatedEntityType: 'connection',
      relatedEntityId: connectionId,
    });

    return NextResponse.json({
      id: connectionId,
      status: 'active',
      subscriptionId: subscriptionRef.id,
      chatRoomId,
    });
  } catch (error: any) {
    console.error('Error responding to connection request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to respond to connection request' },
      { status: 500 }
    );
  }
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
