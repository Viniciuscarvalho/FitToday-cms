#!/usr/bin/env node

/**
 * build-catalog.mjs
 *
 * Merges free-exercise-db exercises with WGER data to produce:
 *   - exercise-catalog.json   (full Firestore-ready documents)
 *   - exercise-prompt-list.json (compact id|name_pt|category|equipment)
 *
 * Prerequisites:
 *   - Clone free-exercise-db into project root:
 *       git clone https://github.com/yuhonas/free-exercise-db.git
 *   - Run fetch-wger.mjs to produce wger-exercises.json
 *
 * Usage:
 *   node scripts/exercises/build-catalog.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PT_BR_NAMES, ALIASES, MUSCLE_TO_CATEGORY } from './pt-br-names.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..', '..');
const FREE_DB_PATH = join(__dirname, '..', 'free-exercise-db', 'dist', 'exercises.json');
const WGER_PATH = join(__dirname, 'wger-exercises.json');
const CATALOG_OUTPUT = join(__dirname, 'exercise-catalog.json');
const PROMPT_OUTPUT = join(__dirname, 'exercise-prompt-list.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts an exercise name to a slug ID.
 * Lowercase, replace non-alphanumeric chars with underscore, collapse multiples.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Strip HTML tags from a string.
 */
function stripHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '').trim();
}

/**
 * Normalize muscle name from free-exercise-db to a consistent lowercase key.
 */
function normalizeMuscle(muscle) {
  return (muscle || '').toLowerCase().trim();
}

/**
 * Infer ExerciseCategory from a list of primary muscles using MUSCLE_TO_CATEGORY.
 */
function inferCategory(primaryMuscles) {
  for (const muscle of primaryMuscles) {
    const normalized = normalizeMuscle(muscle);
    if (MUSCLE_TO_CATEGORY[normalized]) {
      return MUSCLE_TO_CATEGORY[normalized];
    }
  }
  return 'full_body';
}

/**
 * Map free-exercise-db equipment strings to a single normalized equipment value.
 */
function normalizeEquipment(equipment) {
  if (!equipment) return 'body only';
  const eq = equipment.toLowerCase().trim();
  if (eq === 'body only' || eq === 'body weight' || eq === 'none') return 'body only';
  if (eq === 'other') return 'other';
  // Return as-is for barbell, dumbbell, cable, machine, etc.
  return eq;
}

/**
 * Map WGER category strings to ExerciseCategory enum values.
 */
function mapWgerCategory(wgerCategory) {
  const map = {
    arms: 'biceps', // Will be refined by muscle groups
    legs: 'quadriceps',
    abs: 'core',
    chest: 'chest',
    back: 'back',
    shoulders: 'shoulders',
    calves: 'calves',
    cardio: 'cardio',
    stretching: 'stretching',
  };
  return map[(wgerCategory || '').toLowerCase()] || 'full_body';
}

/**
 * Map WGER muscle names to our MuscleGroup values.
 */
function mapWgerMuscle(muscleName) {
  const map = {
    'biceps brachii': 'biceps',
    brachialis: 'biceps',
    'triceps brachii': 'triceps',
    'anterior deltoid': 'shoulders',
    'pectoralis major': 'chest',
    'serratus anterior': 'chest',
    'rectus abdominis': 'abs',
    'obliquus externus abdominis': 'obliques',
    gastrocnemius: 'calves',
    soleus: 'calves',
    'gluteus maximus': 'glutes',
    trapezius: 'traps',
    'quadriceps femoris': 'quadriceps',
    'biceps femoris': 'hamstrings',
    'latissimus dorsi': 'lats',
    infraspinatus: 'back',
    'erector spinae': 'lower_back',
  };
  return map[(muscleName || '').toLowerCase()] || null;
}

/**
 * Get the PT-BR name for a slug, or return null.
 */
function getPtName(slug) {
  return PT_BR_NAMES[slug] || null;
}

/**
 * Get aliases for a slug.
 */
function getAliases(slug) {
  return ALIASES[slug] || [];
}

// ---------------------------------------------------------------------------
// Build from free-exercise-db
// ---------------------------------------------------------------------------

function processFreeExerciseDb(rawExercises) {
  const exercises = [];

  for (const ex of rawExercises) {
    const name = (ex.name || '').trim();
    if (!name) continue;

    const slug = slugify(name);
    const primaryMuscles = (ex.primaryMuscles || []).map(normalizeMuscle);
    const secondaryMuscles = (ex.secondaryMuscles || []).map(normalizeMuscle);
    const category = inferCategory(primaryMuscles) || 'full_body';
    const equipment = normalizeEquipment(
      Array.isArray(ex.equipment) ? ex.equipment[0] : ex.equipment
    );

    const ptName = getPtName(slug) || name;
    const aliases = getAliases(slug);

    const instructions_en = Array.isArray(ex.instructions)
      ? ex.instructions
      : typeof ex.instructions === 'string'
        ? ex.instructions.split('\n').filter(Boolean)
        : [];

    exercises.push({
      id: slug,
      name: { en: name, pt: ptName },
      aliases,
      description: '',
      category,
      muscleGroups: {
        primary: primaryMuscles,
        secondary: secondaryMuscles,
      },
      equipment,
      force: ex.force || null,
      level: ex.level || 'beginner',
      mechanic: ex.mechanic || null,
      instructions: {
        en: instructions_en,
        pt: [],
      },
      media: {
        thumbnailURL: '',
        images: [],
        gifURL: null,
        videoURL: null,
      },
      source: 'system',
      isActive: true,
      isApproved: true,
      wgerBaseId: null,
      _origin: 'free-exercise-db',
      _originalName: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return exercises;
}

// ---------------------------------------------------------------------------
// Build from WGER
// ---------------------------------------------------------------------------

function processWgerExercises(rawExercises) {
  const exercises = [];

  for (const ex of rawExercises) {
    const name = (ex.name || '').trim();
    if (!name) continue;

    const slug = slugify(name);

    const primaryMuscles = (ex.muscles || [])
      .map(mapWgerMuscle)
      .filter(Boolean);
    const secondaryMuscles = (ex.muscles_secondary || [])
      .map(mapWgerMuscle)
      .filter(Boolean);

    // Infer category from muscles first, fallback to WGER category
    let category = inferCategory(primaryMuscles);
    if (category === 'full_body') {
      category = mapWgerCategory(ex.category);
    }

    const equipment = normalizeEquipment(
      Array.isArray(ex.equipment) ? ex.equipment[0] : ex.equipment
    );

    const ptName = getPtName(slug) || name;
    const aliases = getAliases(slug);
    const description = stripHtml(ex.description || '');

    // WGER images are full URLs
    const images = (ex.images || []).filter(
      (url) => typeof url === 'string' && url.startsWith('http')
    );

    exercises.push({
      id: slug,
      name: { en: name, pt: ptName },
      aliases,
      description,
      category,
      muscleGroups: {
        primary: primaryMuscles,
        secondary: secondaryMuscles,
      },
      equipment,
      force: null,
      level: 'beginner',
      mechanic: null,
      instructions: {
        en: [],
        pt: [],
      },
      media: {
        thumbnailURL: '',
        images,
        gifURL: null,
        videoURL: null,
      },
      source: 'system',
      isActive: true,
      isApproved: true,
      wgerBaseId: ex.wgerId || null,
      _origin: 'wger',
      _originalName: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return exercises;
}

// ---------------------------------------------------------------------------
// Merge and deduplicate
// ---------------------------------------------------------------------------

function mergeExercises(freeDbExercises, wgerExercises) {
  const catalog = new Map();

  // free-exercise-db takes priority (usually richer metadata)
  for (const ex of freeDbExercises) {
    catalog.set(ex.id, ex);
  }

  // WGER fills gaps and enriches existing entries
  for (const ex of wgerExercises) {
    if (catalog.has(ex.id)) {
      const existing = catalog.get(ex.id);

      // Enrich: add wgerBaseId if missing
      if (!existing.wgerBaseId && ex.wgerBaseId) {
        existing.wgerBaseId = ex.wgerBaseId;
      }

      // Enrich: add description if missing
      if (!existing.description && ex.description) {
        existing.description = ex.description;
      }

      // Enrich: add WGER image URLs to the images list
      if (ex.media.images.length > 0) {
        const existingUrls = new Set(existing.media.images);
        for (const url of ex.media.images) {
          if (!existingUrls.has(url)) {
            existing.media.images.push(url);
          }
        }
      }

      catalog.set(ex.id, existing);
    } else {
      catalog.set(ex.id, ex);
    }
  }

  return Array.from(catalog.values());
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('=== Exercise Catalog Builder ===\n');

  // 1. Load free-exercise-db
  let freeDbExercises = [];
  if (existsSync(FREE_DB_PATH)) {
    console.log(`Loading free-exercise-db from ${FREE_DB_PATH}`);
    const rawFreeDb = JSON.parse(readFileSync(FREE_DB_PATH, 'utf-8'));
    freeDbExercises = processFreeExerciseDb(rawFreeDb);
    console.log(`  Processed ${freeDbExercises.length} exercises from free-exercise-db.\n`);
  } else {
    console.warn(`  WARNING: free-exercise-db not found at ${FREE_DB_PATH}`);
    console.warn(`  Clone it: git clone https://github.com/yuhonas/free-exercise-db.git\n`);
  }

  // 2. Load WGER exercises
  let wgerExercises = [];
  if (existsSync(WGER_PATH)) {
    console.log(`Loading WGER data from ${WGER_PATH}`);
    const rawWger = JSON.parse(readFileSync(WGER_PATH, 'utf-8'));
    wgerExercises = processWgerExercises(rawWger);
    console.log(`  Processed ${wgerExercises.length} exercises from WGER.\n`);
  } else {
    console.warn(`  WARNING: wger-exercises.json not found at ${WGER_PATH}`);
    console.warn(`  Run fetch-wger.mjs first.\n`);
  }

  if (freeDbExercises.length === 0 && wgerExercises.length === 0) {
    console.error('No exercise data found. Exiting.');
    process.exit(1);
  }

  // 3. Merge and deduplicate
  console.log('Merging and deduplicating...');
  const catalog = mergeExercises(freeDbExercises, wgerExercises);
  console.log(`  Final catalog: ${catalog.length} unique exercises.\n`);

  // 4. Clean internal fields before writing
  const cleanCatalog = catalog.map((ex) => {
    const { _origin, _originalName, ...rest } = ex;
    return rest;
  });

  // 5. Write full catalog
  writeFileSync(CATALOG_OUTPUT, JSON.stringify(cleanCatalog, null, 2), 'utf-8');
  console.log(`Wrote exercise-catalog.json (${cleanCatalog.length} exercises)`);

  // 6. Write compact prompt list (id|name_pt|category|equipment)
  const promptList = cleanCatalog.map(
    (ex) => `${ex.id}|${ex.name.pt}|${ex.category}|${ex.equipment}`
  );
  writeFileSync(PROMPT_OUTPUT, JSON.stringify(promptList, null, 2), 'utf-8');
  console.log(`Wrote exercise-prompt-list.json (${promptList.length} entries)`);

  // 7. Stats
  console.log('\n=== Stats ===');
  const categories = {};
  const sources = { 'free-exercise-db': 0, wger: 0, both: 0 };
  let withPtName = 0;
  let withImages = 0;

  for (const ex of catalog) {
    categories[ex.category] = (categories[ex.category] || 0) + 1;
    if (ex.name.pt && ex.name.pt !== ex.name.en) withPtName++;
    if (ex.media.images.length > 0) withImages++;

    // Track source
    if (ex._origin === 'free-exercise-db' && ex.wgerBaseId) {
      sources.both++;
    } else if (ex._origin === 'free-exercise-db') {
      sources['free-exercise-db']++;
    } else {
      sources.wger++;
    }
  }

  console.log(`  Total exercises: ${catalog.length}`);
  console.log(`  With PT-BR names: ${withPtName}`);
  console.log(`  With images: ${withImages}`);
  console.log(`  Sources: free-db=${sources['free-exercise-db']}, wger=${sources.wger}, both=${sources.both}`);
  console.log('  Categories:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat}: ${count}`);
  }
}

main();
