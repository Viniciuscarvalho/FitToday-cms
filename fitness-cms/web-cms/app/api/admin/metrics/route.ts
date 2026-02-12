import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAdminRequest } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export interface PlatformMetrics {
  trainers: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    rejected: number;
  };
  students: {
    total: number;
  };
  programs: {
    total: number;
    published: number;
    draft: number;
  };
  workouts: {
    total: number;
  };
  financial: {
    totalRevenue: number;
    pendingPayouts: number;
  };
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }[];
}

// GET /api/admin/metrics - Get platform metrics
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

    // Get trainer counts by status
    const trainersSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'trainer')
      .get();

    let pendingTrainers = 0;
    let activeTrainers = 0;
    let suspendedTrainers = 0;
    let rejectedTrainers = 0;

    trainersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      switch (data.status) {
        case 'pending':
          pendingTrainers++;
          break;
        case 'active':
          activeTrainers++;
          break;
        case 'suspended':
          suspendedTrainers++;
          break;
        case 'rejected':
          rejectedTrainers++;
          break;
        default:
          pendingTrainers++; // Default to pending for legacy data
      }
    });

    // Get student count
    const studentsSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'student')
      .count()
      .get();

    // Get program counts
    const allProgramsSnapshot = await adminDb.collection('programs').get();
    let publishedPrograms = 0;
    let draftPrograms = 0;

    allProgramsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'published') {
        publishedPrograms++;
      } else {
        draftPrograms++;
      }
    });

    // Get workout count
    const workoutsSnapshot = await adminDb.collection('workouts').count().get();

    // Calculate financial metrics
    let totalRevenue = 0;
    let pendingPayouts = 0;

    trainersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.financial) {
        totalRevenue += data.financial.totalEarnings || 0;
        pendingPayouts += data.financial.pendingBalance || 0;
      }
    });

    // Get recent activity (pending trainers + recent sign ups)
    const recentTrainersSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'trainer')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentActivity = recentTrainersSnapshot.docs.map((doc) => {
      const data = doc.data();
      const status = data.status || 'pending';

      let type = 'trainer_signup';
      let description = `${data.displayName || data.email} se cadastrou`;

      if (status === 'pending') {
        type = 'pending_approval';
        description = `${data.displayName || data.email} aguarda aprovação`;
      }

      return {
        type,
        description,
        timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        userId: doc.id,
      };
    });

    const response: PlatformMetrics = {
      trainers: {
        total: trainersSnapshot.size,
        pending: pendingTrainers,
        active: activeTrainers,
        suspended: suspendedTrainers,
        rejected: rejectedTrainers,
      },
      students: {
        total: studentsSnapshot.data().count,
      },
      programs: {
        total: allProgramsSnapshot.size,
        published: publishedPrograms,
        draft: draftPrograms,
      },
      workouts: {
        total: workoutsSnapshot.data().count,
      },
      financial: {
        totalRevenue,
        pendingPayouts,
      },
      recentActivity,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting platform metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
