import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export interface MobileAuthResult {
  isAuthenticated: boolean;
  uid: string;
  role: 'student' | 'trainer' | 'admin';
  platform?: string;
  appVersion?: string;
  locale?: string;
  error?: string;
}

const UNAUTHENTICATED: MobileAuthResult = {
  isAuthenticated: false,
  uid: '',
  role: 'student',
};

export async function verifyMobileAuth(request: NextRequest): Promise<MobileAuthResult> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ...UNAUTHENTICATED, error: 'Missing or invalid authorization header' };
  }

  if (!adminAuth || !adminDb) {
    return { ...UNAUTHENTICATED, error: 'Firebase Admin not initialized' };
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      return { ...UNAUTHENTICATED, uid: decoded.uid, error: 'User not found' };
    }

    const userData = userDoc.data();
    const role = (userData?.role ?? 'student') as MobileAuthResult['role'];

    // Extract mobile-specific headers
    const platform = request.headers.get('x-platform') ?? undefined;
    const appVersion = request.headers.get('x-app-version') ?? undefined;
    const locale = request.headers.get('accept-language')?.split(',')[0] ?? undefined;

    return {
      isAuthenticated: true,
      uid: decoded.uid,
      role,
      platform,
      appVersion,
      locale,
    };
  } catch {
    return { ...UNAUTHENTICATED, error: 'Invalid or expired token' };
  }
}
