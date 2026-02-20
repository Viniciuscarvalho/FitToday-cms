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
import { doc, getDoc, setDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { PersonalTrainer, AdminUser, UserRole, TrainerStatus } from '@/types';
import { AUTH_COOKIES, setRoleCookies, clearAuthCookies } from '@/lib/auth-utils';
import { PLANS } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  trainer: PersonalTrainer | null;
  admin: AdminUser | null;
  userRole: UserRole | null;
  trainerStatus: TrainerStatus | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signUpAsTrainer: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [trainer, setTrainer] = useState<PersonalTrainer | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [trainerStatus, setTrainerStatus] = useState<TrainerStatus | null>(null);
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

  // Track if the user has explicitly signed out (vs transient null during rehydration)
  const [hasSignedOut, setHasSignedOut] = useState(false);

  // Helper to manage auth cookie for middleware
  const setAuthCookie = (token: string | null) => {
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    if (token) {
      document.cookie = `${AUTH_COOKIES.TOKEN}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secureFlag}`;
    } else {
      document.cookie = `${AUTH_COOKIES.TOKEN}=; path=/; max-age=0; path=/`;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && db) {
        setHasSignedOut(false);
        // Force refresh to ensure the token is valid
        const token = await firebaseUser.getIdToken(true);
        setAuthCookie(token);
        await fetchUserData(firebaseUser.uid);
      } else {
        // Only clear cookies if user explicitly signed out,
        // not during transient null state on page load
        if (hasSignedOut) {
          clearAuthCookies();
        }
        setTrainer(null);
        setAdmin(null);
        setUserRole(null);
        setTrainerStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  // Refresh the auth token every 30 minutes to keep the cookie fresh
  useEffect(() => {
    if (!auth || !user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const token = await user.getIdToken(true);
        setAuthCookie(token);
      } catch {
        // Token refresh failed — session likely expired
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(refreshInterval);
  }, [auth, user]);

  const fetchUserData = async (uid: string) => {
    if (!db) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = data.role as UserRole;
        setUserRole(role);

        if (role === 'trainer') {
          const trainerData = data as PersonalTrainer;
          setTrainer(trainerData);
          setTrainerStatus(trainerData.status || 'pending');
          setRoleCookies('trainer', trainerData.status || 'pending');
          setAdmin(null);
        } else if (role === 'admin') {
          const adminData = data as AdminUser;
          setAdmin(adminData);
          setRoleCookies('admin', null);
          setTrainer(null);
          setTrainerStatus(null);
        } else {
          // Student or other role
          setRoleCookies(role, null);
          setTrainer(null);
          setAdmin(null);
          setTrainerStatus(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    const result = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserData(result.user.uid);
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });

    // Create initial user document as student
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: name,
      photoURL: result.user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      role: 'student',
    });

    await fetchUserData(result.user.uid);
  };

  const signUpAsTrainer = async (email: string, password: string, name: string) => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });

    // Create trainer document with pending status
    const trainerData: Partial<PersonalTrainer> = {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: name,
      photoURL: result.user.photoURL || '',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isActive: true,
      role: 'trainer',
      status: 'pending',
      profile: {
        bio: '',
        specialties: [],
        certifications: [],
        experience: 0,
      },
      store: {
        slug: '',
        isVerified: false,
        rating: 0,
        totalReviews: 0,
        totalSales: 0,
        totalStudents: 0,
      },
      financial: {
        totalEarnings: 0,
        pendingBalance: 0,
        availableBalance: 0,
      },
      subscription: {
        plan: 'starter',
        status: 'active',
        features: PLANS.starter.features,
      },
    };

    await setDoc(doc(db, 'users', result.user.uid), trainerData);
    await fetchUserData(result.user.uid);
  };

  const signInWithGoogle = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Check if user exists, if not create as trainer with pending status
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      const trainerData: Partial<PersonalTrainer> = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        isActive: true,
        role: 'trainer',
        status: 'pending',
        profile: {
          bio: '',
          specialties: [],
          certifications: [],
          experience: 0,
        },
        store: {
          slug: '',
          isVerified: false,
          rating: 0,
          totalReviews: 0,
          totalSales: 0,
          totalStudents: 0,
        },
        financial: {
          totalEarnings: 0,
          pendingBalance: 0,
          availableBalance: 0,
        },
        subscription: {
          plan: 'starter',
          status: 'active',
          features: PLANS.starter.features,
        },
      };
      await setDoc(doc(db, 'users', result.user.uid), trainerData);
    }

    await fetchUserData(result.user.uid);
  };

  const signInWithApple = async () => {
    if (!auth || !db) throw new Error('Firebase not initialized');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const result = await signInWithPopup(auth, provider);

    // Check if user exists, if not create as trainer with pending status
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      const trainerData: Partial<PersonalTrainer> = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        isActive: true,
        role: 'trainer',
        status: 'pending',
        profile: {
          bio: '',
          specialties: [],
          certifications: [],
          experience: 0,
        },
        store: {
          slug: '',
          isVerified: false,
          rating: 0,
          totalReviews: 0,
          totalSales: 0,
          totalStudents: 0,
        },
        financial: {
          totalEarnings: 0,
          pendingBalance: 0,
          availableBalance: 0,
        },
        subscription: {
          plan: 'starter',
          status: 'active',
          features: PLANS.starter.features,
        },
      };
      await setDoc(doc(db, 'users', result.user.uid), trainerData);
    }

    await fetchUserData(result.user.uid);
  };

  const signOut = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    setHasSignedOut(true);
    clearAuthCookies();
    await firebaseSignOut(auth);
    setTrainer(null);
    setAdmin(null);
    setUserRole(null);
    setTrainerStatus(null);
  };

  const refreshUser = async () => {
    if (user) {
      await fetchUserData(user.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        trainer,
        admin,
        userRole,
        trainerStatus,
        loading,
        signIn,
        signUp,
        signUpAsTrainer,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshUser,
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
