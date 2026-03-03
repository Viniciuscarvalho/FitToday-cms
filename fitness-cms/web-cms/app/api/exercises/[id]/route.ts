import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// GET /api/exercises/[id] - Get a single exercise
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = params.id;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const exerciseDoc = await adminDb.collection('exercises').doc(exerciseId).get();

    if (!exerciseDoc.exists) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const data = exerciseDoc.data()!;

    return NextResponse.json({
      id: exerciseDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Error getting exercise:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get exercise' },
      { status: 500 }
    );
  }
}

// PATCH /api/exercises/[id] - Update an exercise
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = params.id;

    // Verify trainer auth
    const authResult = await verifyTrainerRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isTrainer || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify exercise exists
    const exerciseDoc = await adminDb.collection('exercises').doc(exerciseId).get();

    if (!exerciseDoc.exists) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const existingData = exerciseDoc.data()!;

    // Only allow update if trainer owns the exercise or exercise is system-level
    if (existingData.source === 'trainer' && existingData.trainerId !== authResult.uid) {
      return NextResponse.json(
        { error: 'Not authorized to edit this exercise' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Build update data - only include fields that were provided
    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.name !== undefined) {
      updateData.name = {
        en: body.name.en?.trim() ?? existingData.name?.en ?? '',
        pt: body.name.pt?.trim() ?? existingData.name?.pt ?? '',
      };
    }
    if (body.aliases !== undefined) updateData.aliases = body.aliases;
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.muscleGroups !== undefined) updateData.muscleGroups = body.muscleGroups;
    if (body.equipment !== undefined) updateData.equipment = body.equipment;
    if (body.force !== undefined) updateData.force = body.force;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.mechanic !== undefined) updateData.mechanic = body.mechanic;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.media !== undefined) updateData.media = body.media;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isApproved !== undefined) updateData.isApproved = body.isApproved;

    await adminDb.collection('exercises').doc(exerciseId).update(updateData);

    // Fetch the updated document to return full data
    const updatedDoc = await adminDb.collection('exercises').doc(exerciseId).get();
    const updatedData = updatedDoc.data()!;

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

// DELETE /api/exercises/[id] - Soft delete (set isActive: false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = params.id;

    // Verify trainer auth
    const authResult = await verifyTrainerRequest(
      request.headers.get('authorization')
    );

    if (!authResult.isTrainer || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify exercise exists
    const exerciseDoc = await adminDb.collection('exercises').doc(exerciseId).get();

    if (!exerciseDoc.exists) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const existingData = exerciseDoc.data()!;

    // Only allow soft delete if trainer owns the exercise
    if (existingData.trainerId !== authResult.uid) {
      return NextResponse.json(
        { error: 'Not authorized to delete this exercise' },
        { status: 403 }
      );
    }

    await adminDb.collection('exercises').doc(exerciseId).update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}
