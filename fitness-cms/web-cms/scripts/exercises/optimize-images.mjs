#!/usr/bin/env node

/**
 * optimize-images.mjs
 *
 * Downloads exercise images from Firebase Storage, optimizes them with Sharp
 * (resize + compress), and re-uploads optimized versions.
 *
 * For each original image at exercises/{id}/media/{n}.jpg it produces:
 *   - exercises/{id}/media/{n}.jpg        → full-size (max 800px wide, quality 80)
 *   - exercises/{id}/thumbnail/{n}.webp   → thumbnail  (200px wide, quality 75, WebP)
 *
 * Prerequisites:
 *   - Run upload-images.mjs first to populate Firebase Storage
 *   - npm install sharp
 *   - Set FIREBASE_SERVICE_ACCOUNT_KEY env var or place serviceAccountKey.json
 *
 * Usage:
 *   node scripts/exercises/optimize-images.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_BUCKET = 'fittoday-2aaff.firebasestorage.app';
const COLLECTION_NAME = 'exercises';
const BATCH_SIZE = 500;
const CACHE_CONTROL = 'public, max-age=31536000';

// Optimization settings
const FULL_MAX_WIDTH = 800;
const FULL_QUALITY = 80;
const THUMB_WIDTH = 200;
const THUMB_QUALITY = 75;

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

function buildPublicUrl(bucketName, filePath) {
  const encodedPath = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
}

async function downloadFromStorage(bucket, filePath) {
  const file = bucket.file(filePath);
  const [buffer] = await file.download();
  return buffer;
}

async function uploadToStorage(bucket, filePath, buffer, contentType) {
  const file = bucket.file(filePath);
  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: CACHE_CONTROL,
    },
  });
}

async function listExerciseImages(bucket, exerciseId) {
  const prefix = `exercises/${exerciseId}/media/`;
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
  console.log('=== Exercise Image Optimizer ===\n');
  console.log(`Settings: full=${FULL_MAX_WIDTH}px@q${FULL_QUALITY}, thumb=${THUMB_WIDTH}px@q${THUMB_QUALITY} (WebP)\n`);

  const { db, storage } = initFirebase();
  const bucket = storage.bucket();
  const collectionRef = db.collection(COLLECTION_NAME);

  // Get all exercises from Firestore
  console.log('Fetching exercises from Firestore...');
  const snapshot = await collectionRef.get();
  const exercises = [];
  snapshot.forEach((doc) => exercises.push({ id: doc.id, ...doc.data() }));
  console.log(`  Found ${exercises.length} exercises.\n`);

  let totalOptimized = 0;
  let totalThumbnails = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalSavedBytes = 0;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const exerciseId = exercise.id;

    const imageFiles = await listExerciseImages(bucket, exerciseId);
    if (imageFiles.length === 0) continue;

    for (const filePath of imageFiles) {
      const fileName = filePath.split('/').pop();
      const baseName = fileName.replace(/\.[^.]+$/, '');
      const thumbPath = `exercises/${exerciseId}/thumbnail/${baseName}.webp`;

      try {
        // Check if thumbnail already exists (optimization already done)
        const thumbFile = bucket.file(thumbPath);
        const [thumbExists] = await thumbFile.exists();
        if (thumbExists) {
          totalSkipped++;
          continue;
        }

        // Download original
        const originalBuffer = await downloadFromStorage(bucket, filePath);
        const originalSize = originalBuffer.length;

        // Get image metadata
        const metadata = await sharp(originalBuffer).metadata();

        // Generate optimized full-size (only if wider than max)
        const fullBuffer = await sharp(originalBuffer)
          .resize({
            width: metadata.width > FULL_MAX_WIDTH ? FULL_MAX_WIDTH : undefined,
            withoutEnlargement: true,
          })
          .jpeg({ quality: FULL_QUALITY, mozjpeg: true })
          .toBuffer();

        // Generate thumbnail as WebP
        const thumbBuffer = await sharp(originalBuffer)
          .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
          .webp({ quality: THUMB_QUALITY })
          .toBuffer();

        // Upload optimized full-size (replace original)
        await uploadToStorage(bucket, filePath, fullBuffer, 'image/jpeg');
        totalOptimized++;

        // Upload thumbnail
        await uploadToStorage(bucket, thumbPath, thumbBuffer, 'image/webp');
        totalThumbnails++;

        const savedBytes = originalSize - fullBuffer.length;
        totalSavedBytes += savedBytes > 0 ? savedBytes : 0;
      } catch (err) {
        totalFailed++;
        console.error(`  FAIL [${exerciseId}] ${filePath}: ${err.message}`);
      }
    }

    // Progress log
    if ((i + 1) % 100 === 0 || i === exercises.length - 1) {
      console.log(
        `  Progress: ${i + 1}/${exercises.length} exercises | ` +
          `optimized=${totalOptimized} thumbnails=${totalThumbnails} ` +
          `skipped=${totalSkipped} failed=${totalFailed}`
      );
    }
  }

  // Update Firestore with thumbnail URLs
  console.log('\nUpdating Firestore with thumbnail URLs...');
  const updates = [];

  for (const exercise of exercises) {
    const thumbPrefix = `exercises/${exercise.id}/thumbnail/`;
    try {
      const [thumbFiles] = await bucket.getFiles({ prefix: thumbPrefix });
      const thumbs = thumbFiles
        .map((f) => f.name)
        .filter((name) => /\.(webp|jpg|jpeg|png)$/i.test(name))
        .sort();

      if (thumbs.length > 0) {
        updates.push({
          id: exercise.id,
          thumbnailURL: buildPublicUrl(STORAGE_BUCKET, thumbs[0]),
        });
      }
    } catch {
      // skip
    }
  }

  // Batch update
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const chunk = updates.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const update of chunk) {
      const docRef = collectionRef.doc(update.id);
      batch.update(docRef, {
        'media.thumbnailURL': update.thumbnailURL,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`  Batch: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length} docs updated`);
  }

  const savedMB = (totalSavedBytes / (1024 * 1024)).toFixed(2);
  console.log('\n=== Summary ===');
  console.log(`  Images optimized (full): ${totalOptimized}`);
  console.log(`  Thumbnails created (WebP): ${totalThumbnails}`);
  console.log(`  Skipped (already done): ${totalSkipped}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Space saved on full-size: ~${savedMB} MB`);
  console.log(`  Firestore docs updated with thumbnailURL: ${updates.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
