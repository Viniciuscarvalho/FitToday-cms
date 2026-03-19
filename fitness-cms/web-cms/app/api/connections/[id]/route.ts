import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { createNotification, NotificationType } from '@/lib/notifications';
import { apiError } from '@/lib/api-errors';
import { createChatRoom } from '@/lib/chat-utils';

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
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id: connectionId } = await params;
    const userId = authResult.uid;

    const body = await request.json();
    const action: 'accept' | 'reject' | 'cancel' = body?.action;

    if (action !== 'accept' && action !== 'reject' && action !== 'cancel') {
      return apiError('action must be "accept", "reject", or "cancel"', 400, 'BAD_REQUEST');
    }

    // Fetch the connection doc
    const connectionRef = adminDb.collection('trainerStudents').doc(connectionId);
    const connectionDoc = await connectionRef.get();

    if (!connectionDoc.exists) {
      return apiError('Connection request not found', 404, 'NOT_FOUND');
    }

    const connection = connectionDoc.data()!;
    const trainerId: string = connection.trainerId;
    const studentId: string = connection.studentId;

    // Handle cancel action — either party can cancel
    if (action === 'cancel') {
      if (userId !== trainerId && userId !== studentId) {
        return apiError('Forbidden', 403, 'FORBIDDEN');
      }

      if (connection.status === 'canceled') {
        return apiError('Connection is already canceled', 409, 'ALREADY_CANCELED');
      }

      const reason = typeof body?.reason === 'string' ? body.reason.trim().substring(0, 500) : null;
      const canceledBy = userId === trainerId ? 'trainer' : 'student';

      if (connection.status === 'active') {
        // Use transaction for active connections to safely guard the student counter
        await adminDb.runTransaction(async (tx) => {
          const trainerRef = adminDb!.collection('users').doc(trainerId);
          const trainerSnap = await tx.get(trainerRef);
          const currentCount = trainerSnap.data()?.store?.totalStudents ?? 0;

          const subsSnap = await tx.get(
            adminDb!.collection('subscriptions')
              .where('connectionId', '==', connectionId)
              .where('status', '==', 'active')
              .limit(1)
          );

          const chatSnap = await tx.get(
            adminDb!.collection('chats')
              .where('trainerId', '==', trainerId)
              .where('studentId', '==', studentId)
              .where('isActive', '==', true)
              .limit(1)
          );

          tx.update(connectionRef, {
            status: 'canceled',
            canceledAt: FieldValue.serverTimestamp(),
            canceledBy,
            cancellationReason: reason,
            updatedAt: FieldValue.serverTimestamp(),
          });

          if (!subsSnap.empty) {
            tx.update(subsSnap.docs[0].ref, {
              status: 'canceled',
              updatedAt: FieldValue.serverTimestamp(),
            });
          }

          tx.update(adminDb!.collection('users').doc(studentId), {
            trainerId: null,
            updatedAt: FieldValue.serverTimestamp(),
          });

          tx.update(trainerRef, {
            'store.totalStudents': Math.max(0, currentCount - 1),
            updatedAt: FieldValue.serverTimestamp(),
          });

          if (!chatSnap.empty) {
            tx.update(chatSnap.docs[0].ref, {
              isActive: false,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        });
      } else {
        // Pending/rejected connections: simple single-doc update
        await connectionRef.update({
          status: 'canceled',
          canceledAt: FieldValue.serverTimestamp(),
          canceledBy,
          cancellationReason: reason,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

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
        status: 'canceled',
        canceledBy,
        reason,
      });
    }

    // For accept/reject, only the trainer can respond
    if (authResult.role !== 'trainer') {
      return apiError('Only trainers can respond to connection requests', 403, 'FORBIDDEN');
    }

    if (connection.trainerId !== userId) {
      return apiError('Forbidden', 403, 'FORBIDDEN');
    }

    if (connection.status !== 'pending') {
      return apiError('This request has already been responded to', 409, 'ALREADY_RESPONDED');
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
    const chatRoomId = await createChatRoom(
      trainerId,
      studentId,
      null,
      'Olá! Conexão estabelecida. Este é o seu canal direto com seu personal. Qualquer dúvida é só mandar mensagem!'
    );

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
    return apiError('Failed to respond to connection request', 500, 'CONNECTION_RESPONSE_ERROR', error);
  }
}
