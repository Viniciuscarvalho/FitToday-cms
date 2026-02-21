import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET /api/trainers/count - Get total active trainer count (public)
export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const countSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'trainer')
      .where('status', '==', 'active')
      .count()
      .get();

    return NextResponse.json({ total: countSnapshot.data().count });
  } catch (error: any) {
    console.error('Error counting trainers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to count trainers' },
      { status: 500 }
    );
  }
}
