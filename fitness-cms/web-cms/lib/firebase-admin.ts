import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let adminApp: App | undefined;
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
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
    adminMessaging = getMessaging(adminApp);
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export { adminDb, adminStorage, adminMessaging };

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
