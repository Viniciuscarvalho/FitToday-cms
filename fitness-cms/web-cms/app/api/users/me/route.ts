import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/users/me - Get the authenticated user's profile
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const doc = await adminDb.collection('users').doc(authResult.uid).get();

    if (!doc.exists) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    const data = doc.data()!;
    return NextResponse.json({ uid: doc.id, ...data });
  } catch (error: any) {
    return apiError('Failed to fetch user profile', 500, 'FETCH_USER_ERROR', error);
  }
}

// POST /api/users/me - Create or update the authenticated user's profile (called post-signup)
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    let body: { role?: string; displayName?: string; photoURL?: string } = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine
    }

    const { role, displayName, photoURL } = body;

    // Validate role — only student role is accepted here (trainer onboarding has its own flow)
    if (role && role !== 'student') {
      return apiError('Invalid role. Only student role can be set via this endpoint.', 400, 'INVALID_ROLE');
    }

    const uid = authResult.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const existingDoc = await userRef.get();

    if (existingDoc.exists) {
      const existingData = existingDoc.data()!;

      // Never downgrade an existing role (e.g., trainer -> student)
      if (existingData.role && existingData.role !== role) {
        return NextResponse.json(
          { uid, role: existingData.role, message: 'Profile already exists with a different role' },
          { status: 200 }
        );
      }

      // Update only missing/requested fields
      const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
      if (!existingData.role && role) updates.role = role;
      if (displayName) updates.displayName = displayName;
      if (photoURL) updates.photoURL = photoURL;

      await userRef.update(updates);
      const updated = await userRef.get();
      return NextResponse.json({ uid, ...updated.data() });
    }

    // Create new profile
    const newProfile: Record<string, any> = {
      role: role || 'student',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (displayName) newProfile.displayName = displayName;
    if (photoURL) newProfile.photoURL = photoURL;

    await userRef.set(newProfile);
    return NextResponse.json({ uid, ...newProfile }, { status: 201 });
  } catch (error: any) {
    return apiError('Failed to update user profile', 500, 'UPDATE_USER_ERROR', error);
  }
}
