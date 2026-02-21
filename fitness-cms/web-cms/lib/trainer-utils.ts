import { PublicTrainerProfile } from '@/types';

export function toPublicProfile(
  id: string,
  data: FirebaseFirestore.DocumentData
): PublicTrainerProfile {
  return {
    id,
    displayName: data.displayName || '',
    photoURL: data.photoURL || undefined,
    profile: {
      bio: data.profile?.bio || '',
      specialties: data.profile?.specialties || [],
      certifications: (data.profile?.certifications || []).map((c: any) => ({
        name: c.name,
        institution: c.institution,
        year: c.year,
      })),
      experience: data.profile?.experience || 0,
      socialMedia: data.profile?.socialMedia || undefined,
      coverPhotoURL: data.profile?.coverPhotoURL || undefined,
      location: data.profile?.location || undefined,
    },
    stats: {
      rating: data.store?.rating || 0,
      totalReviews: data.store?.totalReviews || 0,
      totalStudents: data.store?.totalStudents || 0,
    },
  };
}
