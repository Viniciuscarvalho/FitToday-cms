#!/usr/bin/env node

/**
 * upload-images.mjs
 *
 * Uploads exercise images to Firebase Storage.
 *
 * Image sources:
 *   - free-exercise-db: local files at ../../free-exercise-db/exercises/{Name}/0.jpg, 1.jpg, etc.
 *   - WGER: remote URLs stored in the catalog's media.images array
 *
 * Storage path: exercises/{exerciseId}/media/{index}.jpg
 *
 * Prerequisites:
 *   - Run build-catalog.mjs to produce exercise-catalog.json
 *   - Clone free-exercise-db into project root
 *   - Set FIREBASE_SERVICE_ACCOUNT_KEY env var or place serviceAccountKey.json
 *
 * Usage:
 *   node scripts/exercises/upload-images.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..', '..');
const FREE_DB_EXERCISES_DIR = join(__dirname, '..', 'free-exercise-db', 'exercises');
const CATALOG_PATH = join(__dirname, 'exercise-catalog.json');
const STORAGE_BUCKET = 'fittoday-2aaff.firebasestorage.app';

const CACHE_CONTROL = 'public, max-age=31536000'; // 1 year

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

  return { storage: getStorage(app) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine content type from file extension.
 */
function getContentType(filename) {
  const ext = extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'image/jpeg';
}

/**
 * Check if a file already exists in Storage.
 */
async function fileExistsInStorage(bucket, storagePath) {
  try {
    const [exists] = await bucket.file(storagePath).exists();
    return exists;
  } catch {
    return false;
  }
}

/**
 * Download a remote image and return the buffer.
 */
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Find local image files for a free-exercise-db exercise.
 * The directory name in free-exercise-db is the original exercise name (capitalized, with spaces).
 */
function findLocalImages(exerciseName) {
  // free-exercise-db stores images in folders named after the exercise
  // e.g., "exercises/Barbell Bench Press/0.jpg"
  const dirPath = join(FREE_DB_EXERCISES_DIR, exerciseName);

  if (!existsSync(dirPath)) {
    return [];
  }

  try {
    const files = readdirSync(dirPath)
      .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .sort() // Ensure consistent ordering: 0.jpg, 1.jpg, etc.
      .map((f) => join(dirPath, f));
    return files;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Exercise Image Uploader ===\n');

  // 1. Load catalog
  if (!existsSync(CATALOG_PATH)) {
    console.error(`ERROR: exercise-catalog.json not found at ${CATALOG_PATH}`);
    console.error('Run build-catalog.mjs first.');
    process.exit(1);
  }

  const exercises = JSON.parse(readFileSync(CATALOG_PATH, 'utf-8'));
  console.log(`Loaded ${exercises.length} exercises from catalog.\n`);

  // 2. Initialize Firebase
  const { storage } = initFirebase();
  const bucket = storage.bucket();

  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const exerciseId = exercise.id;

    // Gather image sources
    const imageSources = [];

    // A) Check free-exercise-db local images
    //    The original exercise name is used for directory lookup.
    //    We try the English name in its original form.
    const localImages = findLocalImages(exercise.name.en);
    for (const localPath of localImages) {
      imageSources.push({ type: 'local', path: localPath });
    }

    // B) Check WGER remote image URLs
    const remoteImages = (exercise.media?.images || []).filter(
      (url) => typeof url === 'string' && url.startsWith('http')
    );
    for (const url of remoteImages) {
      imageSources.push({ type: 'remote', url });
    }

    if (imageSources.length === 0) continue;

    // Upload each image
    for (let idx = 0; idx < imageSources.length; idx++) {
      const source = imageSources[idx];
      const ext = source.type === 'local'
        ? extname(source.path).toLowerCase() || '.jpg'
        : '.jpg';
      const storagePath = `exercises/${exerciseId}/media/${idx}${ext}`;

      try {
        // Skip if already exists
        const exists = await fileExistsInStorage(bucket, storagePath);
        if (exists) {
          totalSkipped++;
          continue;
        }

        let buffer;
        let contentType;

        if (source.type === 'local') {
          buffer = readFileSync(source.path);
          contentType = getContentType(source.path);
        } else {
          buffer = await downloadImage(source.url);
          contentType = getContentType(source.url);
          // Rate limit remote downloads
          await sleep(200);
        }

        const file = bucket.file(storagePath);
        await file.save(buffer, {
          metadata: {
            contentType,
            cacheControl: CACHE_CONTROL,
          },
        });

        totalUploaded++;
      } catch (err) {
        totalFailed++;
        console.error(`  FAIL [${exerciseId}] ${storagePath}: ${err.message}`);
      }
    }

    // Progress log
    if ((i + 1) % 100 === 0 || i === exercises.length - 1) {
      console.log(
        `  Progress: ${i + 1}/${exercises.length} exercises processed | ` +
        `uploaded=${totalUploaded} skipped=${totalSkipped} failed=${totalFailed}`
      );
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Total uploaded: ${totalUploaded}`);
  console.log(`  Total skipped (already exists): ${totalSkipped}`);
  console.log(`  Total failed: ${totalFailed}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
