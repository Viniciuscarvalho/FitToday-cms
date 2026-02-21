import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { UserRole, AdminUser } from '@/types';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;
let adminStorage: Storage | undefined;
let adminMessaging: Messaging | undefined;

// Initialize Firebase Admin only if service account is configured
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (serviceAccount && getApps().length === 0) {
  try {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
    adminMessaging = getMessaging(adminApp);
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export { adminAuth, adminDb, adminStorage, adminMessaging };

// ============================================================
// ADMIN VERIFICATION UTILITIES
// ============================================================

export interface AdminVerificationResult {
  isAdmin: boolean;
  admin: AdminUser | null;
  uid: string | null;
  error?: string;
}

/**
 * Verify if the request is from an admin user
 * Extracts token from Authorization header and verifies admin role
 */
export async function verifyAdminRequest(
  authHeader: string | null
): Promise<AdminVerificationResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, admin: null, uid: null, error: 'Missing or invalid authorization header' };
  }

  if (!adminAuth || !adminDb) {
    return { isAdmin: false, admin: null, uid: null, error: 'Firebase Admin not initialized' };
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user document and verify admin role
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { isAdmin: false, admin: null, uid, error: 'User not found' };
    }

    const userData = userDoc.data();

    if (userData?.role !== 'admin') {
      return { isAdmin: false, admin: null, uid, error: 'User is not an admin' };
    }

    return {
      isAdmin: true,
      admin: { ...userData, uid } as AdminUser,
      uid,
    };
  } catch (error: any) {
    return {
      isAdmin: false,
      admin: null,
      uid: null,
      error: error.message || 'Failed to verify token',
    };
  }
}

// ============================================================
// GENERIC AUTH VERIFICATION (any role)
// ============================================================

export interface AuthVerificationResult {
  isAuthenticated: boolean;
  uid: string | null;
  role: string | null;
  error?: string;
}

/**
 * Verify if the request is from any authenticated user (any role).
 * Use this for endpoints that need auth but aren't role-specific.
 */
export async function verifyAuthRequest(
  authHeader: string | null
): Promise<AuthVerificationResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuthenticated: false, uid: null, role: null, error: 'Missing or invalid authorization header' };
  }

  if (!adminAuth || !adminDb) {
    return { isAuthenticated: false, uid: null, role: null, error: 'Firebase Admin not initialized' };
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { isAuthenticated: false, uid, role: null, error: 'User not found' };
    }

    const userData = userDoc.data();
    return { isAuthenticated: true, uid, role: userData?.role || null };
  } catch (error: any) {
    return {
      isAuthenticated: false,
      uid: null,
      role: null,
      error: error.message || 'Failed to verify token',
    };
  }
}

// ============================================================
// TRAINER VERIFICATION UTILITIES
// ============================================================

export interface TrainerVerificationResult {
  isTrainer: boolean;
  uid: string | null;
  error?: string;
}

/**
 * Verify if the request is from an authenticated trainer
 * Extracts token from Authorization header and verifies trainer role
 */
export async function verifyTrainerRequest(
  authHeader: string | null
): Promise<TrainerVerificationResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isTrainer: false, uid: null, error: 'Missing or invalid authorization header' };
  }

  if (!adminAuth || !adminDb) {
    return { isTrainer: false, uid: null, error: 'Firebase Admin not initialized' };
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return { isTrainer: false, uid, error: 'User not found' };
    }

    const userData = userDoc.data();

    if (userData?.role !== 'trainer') {
      return { isTrainer: false, uid, error: 'User is not a trainer' };
    }

    return { isTrainer: true, uid };
  } catch (error: any) {
    return {
      isTrainer: false,
      uid: null,
      error: error.message || 'Failed to verify token',
    };
  }
}

// ============================================================
// PROGRAM COVER IMAGE UTILITIES
// ============================================================

/**
 * Upload a program cover image to Firebase Storage
 */
export async function uploadProgramCover(
  programId: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  if (!adminStorage) {
    throw new Error('Firebase Storage not initialized');
  }

  const ext = contentType.split('/')[1] || 'jpg';
  const bucket = adminStorage.bucket();
  const filePath = `programs/${programId}/cover/cover.${ext}`;
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        programId,
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  // Make cover publicly readable
  await file.makePublic();
  const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  return { path: filePath, url };
}

/**
 * Delete a program cover image from Storage
 */
export async function deleteProgramCover(programId: string): Promise<void> {
  if (!adminStorage) {
    throw new Error('Firebase Storage not initialized');
  }

  const bucket = adminStorage.bucket();
  const prefix = `programs/${programId}/cover/`;

  try {
    const [files] = await bucket.getFiles({ prefix });
    await Promise.all(files.map((file) => file.delete()));
  } catch (error: any) {
    if (error.code !== 404) {
      throw error;
    }
  }
}

// ============================================================
// STORAGE UTILITIES
// ============================================================

const WORKOUT_PDF_FOLDER = 'workout-pdfs';
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
const SIGNED_URL_EXPIRATION_DAYS = 7;

export interface UploadResult {
  path: string;
  url: string;
}

/**
 * Upload a PDF file to Firebase Storage
 */
export async function uploadWorkoutPDF(
  trainerId: string,
  workoutId: string,
  fileBuffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<UploadResult> {
  if (!adminStorage) {
    throw new Error('Firebase Storage not initialized');
  }

  if (fileBuffer.length > MAX_PDF_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_PDF_SIZE / (1024 * 1024)}MB`);
  }

  const bucket = adminStorage.bucket();
  const filePath = `${WORKOUT_PDF_FOLDER}/${trainerId}/${workoutId}/workout.pdf`;
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        trainerId,
        workoutId,
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  // Generate signed URL
  const url = await generateSignedUrl(filePath);

  return { path: filePath, url };
}

/**
 * Generate a signed URL for a file in Storage
 */
export async function generateSignedUrl(filePath: string): Promise<string> {
  if (!adminStorage) {
    throw new Error('Firebase Storage not initialized');
  }

  const bucket = adminStorage.bucket();
  const file = bucket.file(filePath);

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + SIGNED_URL_EXPIRATION_DAYS);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: expirationDate,
  });

  return url;
}

/**
 * Delete a PDF file from Storage
 */
export async function deleteWorkoutPDF(filePath: string): Promise<void> {
  if (!adminStorage) {
    throw new Error('Firebase Storage not initialized');
  }

  const bucket = adminStorage.bucket();
  const file = bucket.file(filePath);

  try {
    await file.delete();
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error.code !== 404) {
      throw error;
    }
  }
}

// ============================================================
// MESSAGING UTILITIES
// ============================================================

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
}

/**
 * Send a push notification to a specific device
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<string> {
  if (!adminMessaging) {
    throw new Error('Firebase Messaging not initialized');
  }

  const message = {
    token: payload.token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
    apns: {
      payload: {
        aps: {
          badge: payload.badge ?? 1,
          sound: 'default',
        },
      },
    },
  };

  const response = await adminMessaging.send(message);
  return response;
}

/**
 * Upload a progress photo to Storage
 */
export async function uploadProgressPhoto(
  trainerId: string,
  studentId: string,
  position: 'front' | 'side' | 'back',
  fileBuffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  if (!adminStorage) {
    throw new Error('Firebase Storage not initialized');
  }

  const ext = contentType.split('/')[1] || 'jpg';
  const bucket = adminStorage.bucket();
  const timestamp = Date.now();
  const filePath = `trainers/${trainerId}/students/${studentId}/progress-photos/${position}_${timestamp}.${ext}`;
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: { trainerId, studentId, position, uploadedAt: new Date().toISOString() },
    },
  });

  await file.makePublic();
  const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  return { path: filePath, url };
}

/**
 * Send workout notification to student
 */
export async function sendWorkoutNotification(
  fcmToken: string,
  workoutId: string,
  workoutTitle: string,
  trainerName: string
): Promise<string | null> {
  if (!fcmToken) {
    console.warn('No FCM token provided for workout notification');
    return null;
  }

  try {
    return await sendPushNotification({
      token: fcmToken,
      title: 'Novo treino recebido!',
      body: `${trainerName} enviou: ${workoutTitle}`,
      data: {
        type: 'new_workout',
        workoutId,
      },
      badge: 1,
    });
  } catch (error: any) {
    // Handle invalid token gracefully
    if (error.code === 'messaging/registration-token-not-registered') {
      console.warn('FCM token is no longer valid:', fcmToken);
      return null;
    }
    throw error;
  }
}
