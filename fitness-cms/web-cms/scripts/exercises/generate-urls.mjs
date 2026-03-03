#!/usr/bin/env node

/**
 * generate-urls.mjs
 *
 * Lists uploaded images in Firebase Storage for each exercise and generates
 * public URLs. Updates Firestore documents with:
 *   - media.thumbnailURL  (first image)
 *   - media.images[]      (all images)
 *
 * Prerequisites:
 *   - Run upload-images.mjs to populate Firebase Storage
 *   - Set FIREBASE_SERVICE_ACCOUNT_KEY env var or place serviceAccountKey.json
 *
 * Usage:
 *   node scripts/exercises/generate-urls.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_BUCKET = 'fittoday-2aaff.firebasestorage.app';
const COLLECTION_NAME = 'exercises';
const BATCH_SIZE = 500;

// ---------------------------------------------------------------------------
// Firebase initialization
// ---------------------------------------------------------------------------

function initFirebase() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let credential;

  if (serviceAccountJson) {
    credential = cert(JSON.parse(serviceAccountJson));
  } else {
    const keyPath = join(__dirname, '..', '..', 'serviceAccountKey.json');
    if (!existsSync(keyPath)) {
      console.error(
        'ERROR: No FIREBASE_SERVICE_ACCOUNT_KEY env var and no serviceAccountKey.json found.'
      );
      console.error(`  Expected at: ${keyPath}`);
      process.exit(1);
    }
    credential = cert(JSON.parse(readFileSync(keyPath, 'utf-8')));
  }

  const app = initializeApp({
    credential,
    storageBucket: STORAGE_BUCKET,
  });

  return {
    db: getFirestore(app),
    storage: getStorage(app),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a public Firebase Storage URL from a file path.
 * Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
 */
function buildPublicUrl(bucketName, filePath) {
  const encodedPath = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
}

/**
 * List all files under a given Storage prefix.
 */
async function listFiles(bucket, prefix) {
  try {
    const [files] = await bucket.getFiles({ prefix });
    return files
      .map((f) => f.name)
      .filter((name) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name))
      .sort();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Exercise URL Generator ===\n');

  // 1. Initialize Firebase
  const { db, storage } = initFirebase();
  const bucket = storage.bucket();
  const collectionRef = db.collection(COLLECTION_NAME);

  // 2. Get all exercise documents from Firestore
  console.log('Fetching exercise documents from Firestore...');
  const snapshot = await collectionRef.get();
  const exercises = [];
  snapshot.forEach((doc) => {
    exercises.push({ id: doc.id, ...doc.data() });
  });
  console.log(`  Found ${exercises.length} exercises in Firestore.\n`);

  if (exercises.length === 0) {
    console.log('No exercises found. Run upload-to-firestore.mjs first.');
    process.exit(0);
  }

  // 3. For each exercise, list Storage files and generate URLs
  let totalUpdated = 0;
  let totalNoImages = 0;
  const updates = []; // Collect { id, thumbnailURL, images[] }

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const prefix = `exercises/${exercise.id}/media/`;

    const files = await listFiles(bucket, prefix);

    if (files.length === 0) {
      totalNoImages++;
      continue;
    }

    const imageUrls = files.map((filePath) =>
      buildPublicUrl(STORAGE_BUCKET, filePath)
    );

    updates.push({
      id: exercise.id,
      thumbnailURL: imageUrls[0],
      images: imageUrls,
    });

    // Progress log
    if ((i + 1) % 100 === 0 || i === exercises.length - 1) {
      console.log(
        `  Scanned: ${i + 1}/${exercises.length} exercises | ` +
        `with images: ${updates.length} | no images: ${totalNoImages}`
      );
    }
  }

  // 4. Batch update Firestore documents
  console.log(`\nUpdating ${updates.length} exercise documents in Firestore...`);

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const update of chunk) {
      const docRef = collectionRef.doc(update.id);
      batch.update(docRef, {
        'media.thumbnailURL': update.thumbnailURL,
        'media.images': update.images,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    totalUpdated += chunk.length;

    console.log(
      `  Batch committed: ${totalUpdated}/${updates.length} documents updated`
    );
  }

  console.log('\n=== Summary ===');
  console.log(`  Exercises scanned: ${exercises.length}`);
  console.log(`  Exercises with images: ${updates.length}`);
  console.log(`  Exercises without images: ${totalNoImages}`);
  console.log(`  Firestore documents updated: ${totalUpdated}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
