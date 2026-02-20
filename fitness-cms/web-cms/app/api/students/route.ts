import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// POST /api/students - Register a student with Firebase UID
export async function POST(request: NextRequest) {
  try {
    // Verify auth (any role - the token proves the user's identity)
    const authResult = await verifyAuthRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isAuthenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { displayName, email, photoURL, fcmToken } = body;

    const uid = authResult.uid;

    // Check if user document already exists
    const existingDoc = await adminDb.collection('users').doc(uid).get();

    if (existingDoc.exists) {
      // User already exists - update FCM token and return existing data
      const updateData: Record<string, any> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (fcmToken) {
        updateData.fcmToken = fcmToken;
      }

      await adminDb.collection('users').doc(uid).update(updateData);

      const updatedDoc = await adminDb.collection('users').doc(uid).get();
      return NextResponse.json({
        id: uid,
        ...updatedDoc.data(),
        created: false,
      });
    }

    // Create new student document
    const studentData = {
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

    await adminDb.collection('users').doc(uid).set(studentData);

    return NextResponse.json(
      { id: uid, ...studentData, created: true },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering student:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register student' },
      { status: 500 }
    );
  }
}
