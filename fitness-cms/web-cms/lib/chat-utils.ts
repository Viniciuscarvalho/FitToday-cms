import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Creates a chat room between a trainer and student using a deterministic ID.
 * Idempotent — returns immediately if the room already exists.
 */
export async function createChatRoom(
  trainerId: string,
  studentId: string,
  programId: string | null,
  welcomeText?: string
): Promise<string> {
  if (!adminDb) return `chat_${trainerId}_${studentId}`;

  const chatId = `chat_${trainerId}_${studentId}`;
  const chatRef = adminDb.collection('chats').doc(chatId);

  const existing = await chatRef.get();
  if (existing.exists) return chatId;

  const message = welcomeText ?? 'Conexão estabelecida. Este é o seu canal direto de comunicação.';

  await chatRef.set({
    id: chatId,
    trainerId,
    studentId,
    programId,
    isActive: true,
    lastMessage: message,
    unreadCountTrainer: 0,
    unreadCountStudent: 1,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await chatRef.collection('messages').add({
    roomId: chatId,
    senderId: 'system',
    senderRole: 'system',
    type: 'text',
    content: message,
    status: 'sent',
    createdAt: FieldValue.serverTimestamp(),
  });

  return chatId;
}
