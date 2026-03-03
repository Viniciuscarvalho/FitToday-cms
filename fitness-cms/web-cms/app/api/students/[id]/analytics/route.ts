import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
    if (!authResult.isTrainer || !authResult.uid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { id: studentId } = await params;

    // Fetch workout completions to get performance data (weight lifted over time)
    const completionsSnapshot = await adminDb
      .collection('workout_completions')
      .where('trainerId', '==', authResult.uid)
      .where('studentId', '==', studentId)
      .orderBy('completedAt', 'asc')
      .get();

    const workoutData = completionsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Extract exercises and their weights
      const exercises = data.exercises || [];
      const intensity = data.intensity || (data.duration > 45 ? 'high' : data.duration > 20 ? 'medium' : 'low');
      
      return {
        date: data.completedAt?.toDate?.()?.toISOString() || null,
        workoutName: data.workoutName,
        duration: data.duration,
        intensity,
        exercises: exercises.map((ex: any) => ({
          name: ex.name,
          weight: ex.weight || 0,
          sets: ex.sets || 0,
          reps: ex.reps || 0
        }))
      };
    });

    return NextResponse.json({ workoutData });
  } catch (error: any) {
    console.error('Error fetching student analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch student analytics' },
      { status: 500 }
    );
  }
}
