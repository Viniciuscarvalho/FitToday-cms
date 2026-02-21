import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyAuthRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { TrainerReviewListResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/trainers/[id]/reviews - List reviews for a trainer (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { id: trainerId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify trainer exists and is active
    const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
    if (!trainerDoc.exists || trainerDoc.data()?.role !== 'trainer' || trainerDoc.data()?.status !== 'active') {
      return NextResponse.json(
        { error: 'Trainer not found', code: 'TRAINER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const baseQuery = adminDb
      .collection('reviews')
      .where('trainerId', '==', trainerId);

    // Get total count
    const countSnapshot = await baseQuery.count().get();
    const total = countSnapshot.data().count;

    // Get paginated reviews
    const snapshot = await baseQuery
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    const reviews = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        studentName: data.studentName || '',
        studentPhotoURL: data.studentPhotoURL || undefined,
        rating: data.rating,
        comment: data.comment || undefined,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Get average rating from trainer's denormalized store data
    const trainerData = trainerDoc.data()!;
    const averageRating = trainerData.store?.rating || 0;

    const response: TrainerReviewListResponse = {
      reviews: reviews as any,
      total,
      averageRating,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error listing reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list reviews' },
      { status: 500 }
    );
  }
}

// POST /api/trainers/[id]/reviews - Submit a review (authenticated students only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Verify authentication
    const authResult = await verifyAuthRequest(request.headers.get('authorization'));
    if (!authResult.isAuthenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Only students can submit reviews
    if (authResult.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit reviews', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { id: trainerId } = await params;

    // Prevent self-review
    if (authResult.uid === trainerId) {
      return NextResponse.json(
        { error: 'Cannot review yourself', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate rating
    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5', code: 'INVALID_RATING' },
        { status: 400 }
      );
    }

    // Validate comment length
    if (body.comment && body.comment.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be 500 characters or less', code: 'COMMENT_TOO_LONG' },
        { status: 400 }
      );
    }

    // Verify trainer exists and is active
    const trainerDoc = await adminDb.collection('users').doc(trainerId).get();
    if (!trainerDoc.exists || trainerDoc.data()?.role !== 'trainer' || trainerDoc.data()?.status !== 'active') {
      return NextResponse.json(
        { error: 'Trainer not found', code: 'TRAINER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify student has/had a workout relationship with this trainer
    const workoutRelation = await adminDb
      .collection('workouts')
      .where('trainerId', '==', trainerId)
      .where('studentId', '==', authResult.uid)
      .limit(1)
      .get();

    if (workoutRelation.empty) {
      return NextResponse.json(
        { error: 'You must be a student of this trainer to leave a review', code: 'NOT_ENROLLED' },
        { status: 403 }
      );
    }

    // Verify student profile exists
    const studentDoc = await adminDb.collection('users').doc(authResult.uid).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Student profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }
    const studentData = studentDoc.data()!;

    // Check for existing review (upsert)
    const existingReview = await adminDb
      .collection('reviews')
      .where('trainerId', '==', trainerId)
      .where('studentId', '==', authResult.uid)
      .limit(1)
      .get();

    const isUpdate = !existingReview.empty;

    // Use transaction for atomic review write + aggregate recalculation
    const reviewId = await adminDb.runTransaction(async (tx) => {
      let rid: string;

      if (isUpdate) {
        rid = existingReview.docs[0].id;
        tx.update(adminDb!.collection('reviews').doc(rid), {
          rating,
          comment: body.comment?.trim() || '',
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        const reviewRef = adminDb!.collection('reviews').doc();
        rid = reviewRef.id;
        tx.set(reviewRef, {
          trainerId,
          studentId: authResult.uid,
          studentName: studentData.displayName || '',
          studentPhotoURL: studentData.photoURL || '',
          rating,
          comment: body.comment?.trim() || '',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // Recalculate aggregate inside the transaction
      const allReviews = await tx.get(
        adminDb!.collection('reviews').where('trainerId', '==', trainerId)
      );

      // Build ratings array accounting for the current write
      const ratings: number[] = [];
      for (const doc of allReviews.docs) {
        if (isUpdate && doc.id === rid) {
          ratings.push(rating); // use new rating
        } else {
          ratings.push(doc.data().rating);
        }
      }
      if (!isUpdate) {
        ratings.push(rating); // new review not yet in snapshot
      }

      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

      tx.update(adminDb!.collection('users').doc(trainerId), {
        'store.rating': avgRating,
        'store.totalReviews': ratings.length,
      });

      return rid;
    });

    return NextResponse.json(
      { id: reviewId, createdAt: new Date().toISOString() },
      { status: isUpdate ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
