import { Timestamp } from 'firebase-admin/firestore';

/**
 * Recursively converts Firestore Timestamp objects to ISO date strings.
 * Used at the service boundary so route handlers receive plain serialized data.
 */
export function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeTimestamp);
  }
  if (value !== null && typeof value === 'object') {
    return serializeFirestoreData(value as Record<string, unknown>);
  }
  return value;
}

export function serializeFirestoreData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = serializeTimestamp(value);
  }
  return result;
}

/**
 * Convert a Firestore document snapshot to a plain object with id.
 */
export function docToObject<T>(doc: FirebaseFirestore.DocumentSnapshot): (T & { id: string }) | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return { id: doc.id, ...serializeFirestoreData(data) } as T & { id: string };
}

/**
 * Convert a Firestore query snapshot to an array of plain objects with ids.
 */
export function queryToArray<T>(snapshot: FirebaseFirestore.QuerySnapshot): (T & { id: string })[] {
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...serializeFirestoreData(doc.data()),
  })) as (T & { id: string })[];
}
