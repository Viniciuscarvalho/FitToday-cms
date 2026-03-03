#!/usr/bin/env node

/**
 * fetch-wger.mjs
 *
 * Fetches all exercises and exercise images from the WGER REST API (v2).
 * Outputs wger-exercises.json in the same directory.
 *
 * Usage:
 *   node scripts/exercises/fetch-wger.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://wger.de/api/v2';
const LANGUAGE_ID = 2; // English
const RATE_LIMIT_MS = 1000;
const OUTPUT_FILE = join(__dirname, 'wger-exercises.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches all pages of a paginated WGER endpoint.
 * Waits RATE_LIMIT_MS between each request.
 */
async function fetchAllPages(endpoint, params = {}) {
  const results = [];
  const query = new URLSearchParams({ limit: '100', ...params });
  let url = `${BASE_URL}${endpoint}?${query.toString()}`;
  let page = 1;

  while (url) {
    console.log(`  [page ${page}] GET ${url}`);
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${url}`);
      break;
    }

    const data = await res.json();
    results.push(...(data.results || []));
    url = data.next || null;
    page++;

    if (url) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  return results;
}

/**
 * Maps a WGER category ID to a human-readable string.
 * https://wger.de/api/v2/exercisecategory/
 */
const WGER_CATEGORY_MAP = {
  8: 'Arms',
  9: 'Legs',
  10: 'Abs',
  11: 'Chest',
  12: 'Back',
  13: 'Shoulders',
  14: 'Calves',
  15: 'Cardio',
  16: 'Stretching',
};

/**
 * Maps a WGER muscle ID to a human-readable name.
 * https://wger.de/api/v2/muscle/
 */
const WGER_MUSCLE_MAP = {
  1: 'Biceps brachii',
  2: 'Anterior deltoid',
  3: 'Serratus anterior',
  4: 'Pectoralis major',
  5: 'Triceps brachii',
  6: 'Rectus abdominis',
  7: 'Gastrocnemius',
  8: 'Gluteus maximus',
  9: 'Trapezius',
  10: 'Quadriceps femoris',
  11: 'Biceps femoris',
  12: 'Latissimus dorsi',
  13: 'Brachialis',
  14: 'Obliquus externus abdominis',
  15: 'Soleus',
  16: 'Infraspinatus',
  17: 'Erector spinae',
};

/**
 * Maps a WGER equipment ID to a human-readable name.
 * https://wger.de/api/v2/equipment/
 */
const WGER_EQUIPMENT_MAP = {
  1: 'Barbell',
  2: 'SZ-Bar',
  3: 'Dumbbell',
  4: 'Gym mat',
  5: 'Swiss Ball',
  6: 'Pull-up bar',
  7: 'none',
  8: 'Bench',
  9: 'Incline bench',
  10: 'Kettlebell',
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== WGER Exercise Fetcher ===\n');

  // 1. Fetch exercises with full info (language=2 for English)
  console.log('Fetching exercises (English)...');
  const rawExercises = await fetchAllPages('/exerciseinfo/', {
    language: String(LANGUAGE_ID),
    format: 'json',
  });
  console.log(`  Fetched ${rawExercises.length} exercises.\n`);

  // 2. Fetch exercise images separately (they carry exercise_base references)
  console.log('Fetching exercise images...');
  const rawImages = await fetchAllPages('/exerciseimage/', {
    format: 'json',
  });
  console.log(`  Fetched ${rawImages.length} images.\n`);

  // Index images by exercise base ID
  const imagesByBase = {};
  for (const img of rawImages) {
    const baseId = img.exercise_base ?? img.exercise;
    if (!baseId) continue;
    if (!imagesByBase[baseId]) imagesByBase[baseId] = [];
    imagesByBase[baseId].push(img.image);
  }

  // 3. Build normalized exercise objects
  const exercises = [];

  for (const ex of rawExercises) {
    // exerciseinfo returns translations; pick the English one
    const translation =
      ex.translations?.find((t) => t.language === LANGUAGE_ID) || {};

    const name = (translation.name || ex.name || '').trim();
    if (!name) continue; // Skip exercises with no English name

    const description = (translation.description || ex.description || '')
      .replace(/<[^>]*>/g, '')
      .trim();

    const categoryName = WGER_CATEGORY_MAP[ex.category?.id] || 'Other';

    // Map muscle IDs to names
    const muscles = (ex.muscles || []).map(
      (m) => WGER_MUSCLE_MAP[m.id] || `muscle_${m.id}`
    );
    const musclesSecondary = (ex.muscles_secondary || []).map(
      (m) => WGER_MUSCLE_MAP[m.id] || `muscle_${m.id}`
    );

    // Map equipment IDs to names
    const equipment = (ex.equipment || []).map(
      (e) => WGER_EQUIPMENT_MAP[e.id] || `equipment_${e.id}`
    );

    // Merge images from exerciseinfo and from the images endpoint
    const inlineImages = (ex.images || []).map((i) => i.image).filter(Boolean);
    const externalImages = imagesByBase[ex.id] || [];
    const allImages = [...new Set([...inlineImages, ...externalImages])];

    exercises.push({
      wgerId: ex.id,
      name,
      description,
      category: categoryName,
      muscles,
      muscles_secondary: musclesSecondary,
      equipment,
      images: allImages,
    });
  }

  // 4. Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(exercises, null, 2), 'utf-8');
  console.log(`Wrote ${exercises.length} exercises to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
