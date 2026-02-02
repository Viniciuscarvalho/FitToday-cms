'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  Auth,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { PersonalTrainer } from '@/types';

interface AuthContextType {
  user: User | null;
  trainer: PersonalTrainer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshTrainer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [trainer, setTrainer] = useState<PersonalTrainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);

  // Initialize Firebase lazily on client side
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const { auth: firebaseAuth, db: firebaseDb } = await import('@/lib/firebase');
        if (firebaseAuth && firebaseDb) {
          setAuth(firebaseAuth);
          setDb(firebaseDb);
        } else {
          console.warn('Firebase not configured - running in demo mode');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setLoading(false);
      }
    };
    initFirebase();
  }, []);

  // Helper to manage auth cookie for middleware
  const setAuthCookie = (token: string | null) => {
    if (token) {
      document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      document.cookie = 'auth-token=; path=/; max-age=0';
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && db) {
        // Set auth cookie for middleware
        const token = await firebaseUser.getIdToken();
        setAuthCookie(token);
        await fetchTrainerData(firebaseUser.uid);
      } else {
        setAuthCookie(null);
        setTrainer(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const fetchTrainerData = async (uid: string) => {
    if (!db) return;
    try {
      const trainerDoc = await getDoc(doc(db, 'users', uid));
      if (trainerDoc.exists()) {
        const data = trainerDoc.data() as PersonalTrainer;
        if (data.role === 'trainer') {
          setTrainer(data);
        }
      }
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    const result = await signInWithEmailAndPassword(auth, email, password);
    await fetchTrainerData(result.user.uid);
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });

    // Create initial user document
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: name,
      photoURL: result.user.photoURL || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      role: 'student', // Will be upgraded to trainer later
    });
  };

  const signInWithGoogle = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Check if user exists, if not create document
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        role: 'student',
      });
    }

    await fetchTrainerData(result.user.uid);
  };

  const signInWithApple = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const result = await signInWithPopup(auth, provider);

    // Check if user exists, if not create document
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        role: 'student',
      });
    }

    await fetchTrainerData(result.user.uid);
  };

  const signOut = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    setAuthCookie(null);
    await firebaseSignOut(auth);
    setTrainer(null);
  };

  const refreshTrainer = async () => {
    if (user) {
      await fetchTrainerData(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        trainer,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshTrainer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
