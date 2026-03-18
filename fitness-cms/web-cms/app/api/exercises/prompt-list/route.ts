import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

// GET /api/exercises/prompt-list?equipment=barbell,dumbbell&category=chest
// Returns a compact text format for OpenAI prompts:
// id|name_pt|category|equipment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentParam = searchParams.get('equipment');
    const category = searchParams.get('category');

    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    // Only fetch active exercises
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      adminDb.collection('exercises').where('isActive', '==', true);

    if (category) {
      query = query.where('category', '==', category);
    }

    // Firestore 'in' queries support up to 30 values
    // If equipment is provided as comma-separated, use 'in' filter when single value,
    // or fetch and filter in-memory for multiple values
    const equipmentList = equipmentParam
      ? equipmentParam.split(',').map((e) => e.trim()).filter(Boolean)
      : [];

    if (equipmentList.length === 1) {
      query = query.where('equipment', '==', equipmentList[0]);
    } else if (equipmentList.length > 1 && equipmentList.length <= 30) {
      query = query.where('equipment', 'in', equipmentList);
    }

    query = query.orderBy('name.pt', 'asc');

    const snapshot = await query.get();

    let docs = snapshot.docs;

    // If equipment list exceeds 30 items, filter in-memory (edge case)
    if (equipmentList.length > 30) {
      const equipmentSet = new Set(equipmentList);
      docs = docs.filter((doc) => equipmentSet.has(doc.data().equipment));
    }

    // Build compact text output: id|name_pt|category|equipment
    const lines = docs.map((doc) => {
      const data = doc.data();
      const namePt = (data.name?.pt || '').replace(/\|/g, '-');
      const cat = (data.category || '').replace(/\|/g, '-');
      const equip = (data.equipment || '').replace(/\|/g, '-');
      return `${doc.id}|${namePt}|${cat}|${equip}`;
    });

    const body = lines.join('\n');

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return apiError('Failed to generate prompt list', 500, 'PROMPT_LIST_ERROR', error);
  }
}
