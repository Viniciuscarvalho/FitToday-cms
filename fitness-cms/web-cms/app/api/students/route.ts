import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue, Firestore, Timestamp } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

/**
 * Recursively converts Firestore Timestamp objects to ISO date strings
 * so the iOS Swift Codable decoder receives plain strings instead of
 * {_seconds, _nanoseconds} dictionaries.
 */
function serializeFirestoreData(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = serializeFirestoreData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const dynamic = 'force-dynamic';

/**
 * Creates a subscription document linking a student to a trainer if one doesn't exist yet.
 * This enables the trainer to see the student in /cms/students.
 */
async function ensureSubscriptionLink(
  db: Firestore,
  studentId: string,
  trainerId: string
): Promise<void> {
  const existingSubscription = await db
    .collection('subscriptions')
    .where('studentId', '==', studentId)
    .where('trainerId', '==', trainerId)
    .limit(1)
    .get();

  if (existingSubscription.empty) {
    await db.collection('subscriptions').add({
      studentId,
      trainerId,
      status: 'active',
      source: 'app_connection',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

// POST /api/students - Register a student with Firebase UID
export async function POST(request: NextRequest) {
  try {
    // Verify auth (any role - the token proves the user's identity)
    const authResult = await verifyAuthRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const body = await request.json();
    const { displayName, email, photoURL, fcmToken, trainerId } = body;

    const uid = authResult.uid;

    // Check if user document already exists
    const existingDoc = await adminDb.collection('users').doc(uid).get();

    if (existingDoc.exists) {
      // User already exists - update FCM token, trainerId, and return existing data
      const updateData: Record<string, any> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (fcmToken) {
        updateData.fcmToken = fcmToken;
      }

      if (trainerId) {
        updateData.trainerId = trainerId;
      }

      await adminDb.collection('users').doc(uid).update(updateData);

      // Ensure subscription link exists when trainerId is provided
      if (trainerId) {
        await ensureSubscriptionLink(adminDb, uid, trainerId);
      }

      const updatedDoc = await adminDb.collection('users').doc(uid).get();
      return NextResponse.json({
        id: uid,
        ...serializeFirestoreData(updatedDoc.data() || {}),
        created: false,
      });
    }

    // Create new student document
    const studentData: Record<string, any> = {
      uid,
      email: email || authResult.uid,
      displayName: displayName || '',
      photoURL: photoURL || '',
      role: 'student',
      isActive: true,
      fcmToken: fcmToken || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (trainerId) {
      studentData.trainerId = trainerId;
    }

    await adminDb.collection('users').doc(uid).set(studentData);

    // Create subscription link so the trainer can see this student in /cms/students
    if (trainerId) {
      await ensureSubscriptionLink(adminDb, uid, trainerId);
    }

    // Re-fetch so Timestamp sentinels are resolved before serializing
    const createdDoc = await adminDb.collection('users').doc(uid).get();
    return NextResponse.json(
      { id: uid, ...serializeFirestoreData(createdDoc.data() || {}), created: true },
      { status: 201 }
    );
  } catch (error: any) {
    return apiError('Failed to register student', 500, 'REGISTER_STUDENT_ERROR', error);
  }
}
