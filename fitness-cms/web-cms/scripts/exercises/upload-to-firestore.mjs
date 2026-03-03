#!/usr/bin/env node

/**
 * upload-to-firestore.mjs
 *
 * Batch uploads exercise-catalog.json to Firestore collection "exercises".
 * Uses batch writes with a maximum of 500 documents per batch (Firestore limit).
 *
 * Prerequisites:
 *   - Run build-catalog.mjs to produce exercise-catalog.json
 *   - Set FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string) or place
 *     serviceAccountKey.json in the web-cms root
 *
 * Usage:
 *   node scripts/exercises/upload-to-firestore.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATALOG_PATH = join(__dirname, 'exercise-catalog.json');
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
    storageBucket: 'fittoday-2aaff.firebasestorage.app',
  });

  return { db: getFirestore(app) };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Firestore Exercise Uploader ===\n');

  // 1. Load catalog
  if (!existsSync(CATALOG_PATH)) {
    console.error(`ERROR: exercise-catalog.json not found at ${CATALOG_PATH}`);
    console.error('Run build-catalog.mjs first.');
    process.exit(1);
  }

  const allExercises = JSON.parse(readFileSync(CATALOG_PATH, 'utf-8'));
  const exercises = allExercises.filter((ex) => ex.id && ex.id.trim() !== '');
  console.log(`Loaded ${allExercises.length} exercises from catalog (${allExercises.length - exercises.length} skipped — empty ID).\n`);

  // 2. Initialize Firebase
  const { db } = initFirebase();
  const collectionRef = db.collection(COLLECTION_NAME);

  // 3. Batch write
  let totalWritten = 0;
  let batchCount = 0;

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const chunk = exercises.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const exercise of chunk) {
      const docRef = collectionRef.doc(exercise.id);

      // Replace string timestamps with Firestore server timestamps
      const docData = {
        ...exercise,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(docRef, docData, { merge: true });
    }

    await batch.commit();
    batchCount++;
    totalWritten += chunk.length;

    if (totalWritten % 100 === 0 || totalWritten === exercises.length) {
      console.log(
        `  Progress: ${totalWritten}/${exercises.length} exercises written (batch ${batchCount})`
      );
    }
  }

  console.log(`\nDone. Uploaded ${totalWritten} exercises to "${COLLECTION_NAME}" collection.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
