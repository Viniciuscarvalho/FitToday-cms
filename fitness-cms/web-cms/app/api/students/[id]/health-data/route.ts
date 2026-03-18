import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { apiError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

interface WorkoutSession {
  exerciseName: string;
  category: 'strength' | 'resistance' | 'cardio';
  sets: number;
  reps: number;
  weight: number;
  duration: number;
}

interface HealthEntry {
  date: string;
  activeCalories: number;
  sessions: WorkoutSession[];
}

interface HealthDataBody {
  entries: HealthEntry[];
  trainerId?: string;
}

// POST /api/students/[id]/health-data - Receive batched health metrics from iOS app
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return apiError('Database not initialized', 500, 'DB_ERROR');
    }

    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id: studentId } = await params;

    // Verify the authenticated user is the student themselves
    if (authResult.uid !== studentId) {
      return apiError('Can only submit health data for yourself', 403, 'FORBIDDEN');
    }

    const body: HealthDataBody = await request.json();

    if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
      return apiError('entries array is required and must not be empty', 400, 'BAD_REQUEST');
    }

    if (body.entries.length > 90) {
      return apiError('Maximum 90 entries per batch', 400, 'BAD_REQUEST');
    }

    // Validate entries
    for (const entry of body.entries) {
      if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        return apiError(`Invalid date format: ${entry.date}. Use YYYY-MM-DD.`, 400, 'BAD_REQUEST');
      }
      if (typeof entry.activeCalories !== 'number' || entry.activeCalories < 0) {
        return apiError('activeCalories must be a non-negative number', 400, 'BAD_REQUEST');
      }
      if (entry.sessions && !Array.isArray(entry.sessions)) {
        return apiError('sessions must be an array', 400, 'BAD_REQUEST');
      }
    }

    // Resolve trainerId: use provided or look up from user's profile
    let trainerId = body.trainerId;
    if (!trainerId) {
      const studentDoc = await adminDb.collection('users').doc(studentId).get();
      trainerId = studentDoc.data()?.trainerId || null;
    }

    // Upsert each entry (dedup by studentId + date)
    const batch = adminDb.batch();
    let processedCount = 0;

    for (const entry of body.entries) {
      const docId = `${studentId}_${entry.date}`;
      const docRef = adminDb.collection('health_metrics').doc(docId);

      // Compute load totals
      const sessions = entry.sessions || [];
      let strengthLoadTotal = 0;
      let resistanceLoadTotal = 0;

      for (const s of sessions) {
        const load = (s.sets || 0) * (s.reps || 0) * (s.weight || 0);
        if (s.category === 'strength') {
          strengthLoadTotal += load;
        } else if (s.category === 'resistance') {
          resistanceLoadTotal += load;
        }
      }

      batch.set(docRef, {
        studentId,
        trainerId: trainerId || null,
        date: entry.date,
        activeCalories: entry.activeCalories,
        sessions,
        strengthLoadTotal,
        resistanceLoadTotal,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Set createdAt only on first write
      batch.set(docRef, {
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      processedCount++;
    }

    await batch.commit();

    return NextResponse.json(
      { success: true, entriesProcessed: processedCount },
      { status: 201 }
    );
  } catch (error: any) {
    return apiError('Failed to store health data', 500, 'STORE_HEALTH_DATA_ERROR', error);
  }
}
