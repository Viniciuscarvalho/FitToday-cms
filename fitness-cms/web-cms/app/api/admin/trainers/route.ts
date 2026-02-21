import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';
import { PersonalTrainer, TrainerStatus } from '@/types';

export const dynamic = 'force-dynamic';

export interface TrainerListItem {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  status: TrainerStatus;
  createdAt: string;
  statusUpdatedAt?: string;
  profile?: {
    bio: string;
    specialties: string[];
    experience: number;
  };
  store?: {
    totalStudents: number;
    totalSales: number;
  };
}

export interface TrainerListResponse {
  trainers: TrainerListItem[];
  total: number;
  pending: number;
  active: number;
  suspended: number;
}

// GET /api/admin/trainers - List all trainers with filters
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const verification = await verifyAdminRequest(authHeader);

    if (!verification.isAdmin) {
      return NextResponse.json(
        { error: verification.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TrainerStatus | 'all' | null;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all trainers (single query — avoids composite index requirement)
    const allTrainersSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'trainer')
      .get();

    let pendingCount = 0;
    let activeCount = 0;
    let suspendedCount = 0;

    allTrainersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      switch (data.status) {
        case 'pending':
          pendingCount++;
          break;
        case 'active':
          activeCount++;
          break;
        case 'suspended':
          suspendedCount++;
          break;
      }
    });

    // Build trainer list from allTrainersSnapshot (avoids orderBy index issues)
    const trainers: TrainerListItem[] = allTrainersSnapshot.docs
      .map((doc) => {
        const data = doc.data() as PersonalTrainer;

        // Filter by status if specified
        if (status && status !== 'all' && data.status !== status) {
          return null;
        }

        // Filter by search term
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesName = data.displayName?.toLowerCase().includes(searchLower);
          const matchesEmail = data.email?.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesEmail) {
            return null;
          }
        }

        const item: TrainerListItem = {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          statusUpdatedAt: data.statusUpdatedAt?.toDate?.()?.toISOString(),
          profile: data.profile
            ? {
                bio: data.profile.bio,
                specialties: data.profile.specialties,
                experience: data.profile.experience,
              }
            : undefined,
          store: data.store
            ? {
                totalStudents: data.store.totalStudents,
                totalSales: data.store.totalSales,
              }
            : undefined,
        };

        return item;
      })
      .filter((t): t is TrainerListItem => t !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    const response: TrainerListResponse = {
      trainers,
      total: allTrainersSnapshot.size,
      pending: pendingCount,
      active: activeCount,
      suspended: suspendedCount,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error listing trainers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list trainers' },
      { status: 500 }
    );
  }
}
