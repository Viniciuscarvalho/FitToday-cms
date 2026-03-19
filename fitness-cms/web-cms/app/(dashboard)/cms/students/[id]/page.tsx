'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Target,
  Activity,
  Clock,
  MessageCircle,
  Dumbbell,
  Flame,
  Award,
  ChevronRight,
  Loader2,
  Plus,
  Camera,
  Scale,
  Ruler,
  User,
  CreditCard,
  FileText,
  BarChart3,
  ImageIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { WorkoutsList } from '@/components/workouts/WorkoutsList';
import { MetricsBarChart, GroupedBarChart } from '@/components/charts';
import { useAuth } from '@/providers/AuthProvider';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Firestore,
  Timestamp,
} from 'firebase/firestore';

// ============================================================
// TYPES
// ============================================================

type TabId = 'overview' | 'progress' | 'workouts' | 'financial';

interface StudentData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt?: Timestamp;
  fitnessProfile?: {
    height?: number;
    weight?: number;
    birthDate?: Timestamp;
    gender?: string;
    fitnessLevel?: string;
    goals?: string[];
  };
  plan?: {
    monthlyFee: number;
    billingDay: number;
    paymentMethod: string;
    status: string;
  };
}

interface SubscriptionData {
  id: string;
  programId: string;
  programTitle: string;
  status: string;
  startDate: Timestamp;
  currentPeriodEnd: Timestamp;
}

interface ProgressData {
  programId: string;
  programTitle: string;
  currentWeek: number;
  totalWeeks: number;
  completionPercentage: number;
  currentStreak: number;
  longestStreak: number;
  totalWorkoutsCompleted: number;
  totalTimeSpent: number;
}

interface WorkoutHistoryItem {
  id: string;
  workoutName: string;
  programTitle: string;
  completedAt: Timestamp;
  duration: number;
  exercisesCompleted: number;
}

interface ProgressEntry {
  id: string;
  date: string;
  measurements: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    rightArm?: number;
    leftArm?: number;
    rightThigh?: number;
    leftThigh?: number;
    rightCalf?: number;
    leftCalf?: number;
  };
  photos?: {
    front?: string;
    side?: string;
    back?: string;
  };
  notes?: string;
  createdAt: string;
}

interface HealthSummaryYear {
  strengthLoad: number;
  enduranceLoad: number;
  dailyCalories: number;
  completionRate: number;
  monthlyStrength: { label: string; value: number }[];
}

interface HealthSummaryWeek {
  weeklyStrengthVsEndurance: { label: string; strength: number; endurance: number }[];
  weeklyCalories: { label: string; value: number }[];
}

interface HealthSummary {
  year: HealthSummaryYear | null;
  week: HealthSummaryWeek | null;
  loadingYear: boolean;
  loadingWeek: boolean;
}

// ============================================================
// TAB DEFINITIONS
// ============================================================

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Visão Geral', icon: User },
  { id: 'progress', label: 'Evolução', icon: TrendingUp },
  { id: 'workouts', label: 'Treinos', icon: Dumbbell },
  { id: 'financial', label: 'Financeiro', icon: CreditCard },
];

// ============================================================
// HELPERS
// ============================================================

const formatDate = (timestamp: Timestamp | string | undefined) => {
  if (!timestamp) return '-';
  const date =
    typeof timestamp === 'string'
      ? new Date(timestamp)
      : (timestamp as Timestamp).toDate
        ? (timestamp as Timestamp).toDate()
        : new Date(timestamp as unknown as string);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    canceled: 'bg-red-100 text-red-700',
    past_due: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    active: 'Ativo',
    canceled: 'Cancelado',
    past_due: 'Pendente',
    expired: 'Expirado',
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.expired}`}
    >
      {labels[status] || status}
    </span>
  );
};

const MEASUREMENT_LABELS: Record<string, string> = {
  weight: 'Peso (kg)',
  bodyFat: 'Gordura (%)',
  muscleMass: 'Massa Muscular (kg)',
  chest: 'Peito (cm)',
  waist: 'Cintura (cm)',
  hips: 'Quadril (cm)',
  rightArm: 'Braço Dir. (cm)',
  leftArm: 'Braço Esq. (cm)',
  rightThigh: 'Coxa Dir. (cm)',
  leftThigh: 'Coxa Esq. (cm)',
  rightCalf: 'Panturrilha Dir. (cm)',
  leftCalf: 'Panturrilha Esq. (cm)',
};

const CHART_COLORS = ['#0d9488', '#f59e0b', '#6366f1', '#ef4444', '#22c55e', '#8b5cf6'];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);

  // Health summary state
  const [healthSummary, setHealthSummary] = useState<HealthSummary>({
    year: null,
    week: null,
    loadingYear: false,
    loadingWeek: false,
  });

  // Progress tab state
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [selectedChartMetrics, setSelectedChartMetrics] = useState<string[]>(['weight']);
  const [photoCompareIdx, setPhotoCompareIdx] = useState<[number, number]>([0, 0]);

  // New progress form
  const [newProgress, setNewProgress] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    muscleMass: '',
    chest: '',
    waist: '',
    hips: '',
    rightArm: '',
    leftArm: '',
    rightThigh: '',
    leftThigh: '',
    rightCalf: '',
    leftCalf: '',
    notes: '',
  });
  const [progressPhotos, setProgressPhotos] = useState<{
    front?: File;
    side?: File;
    back?: File;
  }>({});

  // ============================================================
  // DATA FETCHING
  // ============================================================

  useEffect(() => {
    async function fetchStudentData() {
      if (!studentId || !user) {
        setLoading(false);
        return;
      }

      try {
        const { db } = await import('@/lib/firebase');
        if (!db) {
          console.warn('Firebase not configured');
          setLoading(false);
          return;
        }

        // Verify this student has a subscription with this trainer
        const subsQuery = query(
          collection(db as Firestore, 'subscriptions'),
          where('trainerId', '==', user.uid),
          where('studentId', '==', studentId)
        );
        const subsSnapshot = await getDocs(subsQuery);

        if (subsSnapshot.empty) {
          alert('Aluno não encontrado ou não autorizado');
          router.push('/cms/students');
          return;
        }

        // Fetch student data
        const usersQuery = query(
          collection(db as Firestore, 'users'),
          where('uid', '==', studentId)
        );
        const userSnapshot = await getDocs(usersQuery);
        const userData = userSnapshot.docs[0]?.data() as StudentData | undefined;

        if (userData) {
          setStudent(userData);
        }

        // Get programs for titles
        const programsQuery = query(
          collection(db as Firestore, 'programs'),
          where('trainerId', '==', user.uid)
        );
        const programsSnapshot = await getDocs(programsQuery);
        const programsMap = new Map(
          programsSnapshot.docs.map((doc) => [
            doc.id,
            doc.data().title || doc.data().name || 'Programa',
          ])
        );

        // Process subscriptions
        const subsData = subsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            programId: data.programId,
            programTitle: programsMap.get(data.programId) || 'Programa',
            status: data.status,
            startDate: data.startDate,
            currentPeriodEnd: data.currentPeriodEnd,
          };
        });
        setSubscriptions(subsData);

        // Fetch progress for each program
        const progressData: ProgressData[] = [];
        for (const sub of subsData) {
          const progressQuery = query(
            collection(db as Firestore, 'progress'),
            where('studentId', '==', studentId),
            where('programId', '==', sub.programId)
          );
          const progressSnapshot = await getDocs(progressQuery);
          const prog = progressSnapshot.docs[0]?.data();

          if (prog) {
            progressData.push({
              programId: sub.programId,
              programTitle: sub.programTitle,
              currentWeek: prog.currentWeek || 1,
              totalWeeks: prog.totalWeeks || 8,
              completionPercentage: prog.completionPercentage || 0,
              currentStreak: prog.metrics?.currentStreak || 0,
              longestStreak: prog.metrics?.longestStreak || 0,
              totalWorkoutsCompleted: prog.metrics?.totalWorkoutsCompleted || 0,
              totalTimeSpent: prog.metrics?.totalTimeSpent || 0,
            });
          }
        }
        setProgress(progressData);

        // Fetch workout history (last 10)
        const historyQuery = query(
          collection(db as Firestore, 'workout_completions'),
          where('studentId', '==', studentId),
          where('trainerId', '==', user.uid),
          orderBy('completedAt', 'desc'),
          limit(10)
        );
        const historySnapshot = await getDocs(historyQuery);
        const historyData = historySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            workoutName: data.workoutName || 'Treino',
            programTitle: programsMap.get(data.programId) || 'Programa',
            completedAt: data.completedAt,
            duration: data.duration || 0,
            exercisesCompleted: data.exercisesCompleted || 0,
          };
        });
        setWorkoutHistory(historyData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [studentId, user, router]);

  // Fetch health summary data
  useEffect(() => {
    async function fetchHealthSummary() {
      if (!studentId || !user) return;

      setHealthSummary((prev) => ({ ...prev, loadingYear: true, loadingWeek: true }));

      try {
        const token = await user.getIdToken();

        const [yearRes, weekRes] = await Promise.allSettled([
          fetch(`/api/students/${studentId}/health-summary?period=year`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/students/${studentId}/health-summary?period=week`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let yearData: HealthSummaryYear | null = null;
        let weekData: HealthSummaryWeek | null = null;

        if (yearRes.status === 'fulfilled' && yearRes.value.ok) {
          const json = await yearRes.value.json();
          yearData = json.summary ?? json ?? null;
        }

        if (weekRes.status === 'fulfilled' && weekRes.value.ok) {
          const json = await weekRes.value.json();
          weekData = json.summary ?? json ?? null;
        }

        setHealthSummary({ year: yearData, week: weekData, loadingYear: false, loadingWeek: false });
      } catch (err) {
        console.error('Error fetching health summary:', err);
        setHealthSummary((prev) => ({ ...prev, loadingYear: false, loadingWeek: false }));
      }
    }

    fetchHealthSummary();
  }, [studentId, user]);

  // Fetch progress entries when tab changes to 'progress'
  const fetchProgressEntries = useCallback(async () => {
    if (!user || !studentId) return;
    setLoadingProgress(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/students/${studentId}/progress?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProgressEntries(data.entries || []);
        // Set photo compare indices to first and last if available
        const entriesWithPhotos = (data.entries || []).filter(
          (e: ProgressEntry) => e.photos && (e.photos.front || e.photos.side || e.photos.back)
        );
        if (entriesWithPhotos.length >= 2) {
          setPhotoCompareIdx([entriesWithPhotos.length - 1, 0]);
        }
      }
    } catch (err) {
      console.error('Error fetching progress entries:', err);
    } finally {
      setLoadingProgress(false);
    }
  }, [user, studentId]);

  useEffect(() => {
    if (activeTab === 'progress') {
      fetchProgressEntries();
    }
  }, [activeTab, fetchProgressEntries]);

  // ============================================================
  // PROGRESS ENTRY SUBMISSION
  // ============================================================

  const handleSaveProgress = async () => {
    if (!user) return;
    setSavingProgress(true);

    try {
      const token = await user!.getIdToken();
      const formData = new FormData();

      const measurements: Record<string, number> = {};
      const measurementKeys = [
        'weight', 'bodyFat', 'muscleMass', 'chest', 'waist', 'hips',
        'rightArm', 'leftArm', 'rightThigh', 'leftThigh', 'rightCalf', 'leftCalf',
      ];

      for (const key of measurementKeys) {
        const val = newProgress[key as keyof typeof newProgress];
        if (val !== '' && !isNaN(Number(val))) {
          measurements[key] = Number(val);
        }
      }

      formData.append(
        'data',
        JSON.stringify({
          date: newProgress.date,
          measurements,
          notes: newProgress.notes,
        })
      );

      if (progressPhotos.front) formData.append('photo_front', progressPhotos.front);
      if (progressPhotos.side) formData.append('photo_side', progressPhotos.side);
      if (progressPhotos.back) formData.append('photo_back', progressPhotos.back);

      const res = await fetch(`/api/students/${studentId}/progress`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar avaliação');
      }

      // Reset form and refresh
      setNewProgress({
        date: new Date().toISOString().split('T')[0],
        weight: '', bodyFat: '', muscleMass: '', chest: '', waist: '', hips: '',
        rightArm: '', leftArm: '', rightThigh: '', leftThigh: '', rightCalf: '', leftCalf: '',
        notes: '',
      });
      setProgressPhotos({});
      setShowAddProgress(false);
      fetchProgressEntries();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProgress(false);
    }
  };

  // ============================================================
  // CHART DATA
  // ============================================================

  const chartData = progressEntries
    .slice()
    .reverse()
    .map((entry) => ({
      date: formatDateShort(entry.date),
      ...entry.measurements,
    }));

  const availableMetrics = Object.keys(MEASUREMENT_LABELS).filter((key) =>
    progressEntries.some(
      (e) => e.measurements[key as keyof typeof e.measurements] != null
    )
  );

  const entriesWithPhotos = progressEntries.filter(
    (e) => e.photos && (e.photos.front || e.photos.side || e.photos.back)
  );

  // ============================================================
  // COMPUTED
  // ============================================================

  const totalProgress =
    progress.length > 0
      ? Math.round(progress.reduce((acc, p) => acc + p.completionPercentage, 0) / progress.length)
      : 0;
  const totalWorkouts = progress.reduce((acc, p) => acc + p.totalWorkoutsCompleted, 0);
  const totalTime = progress.reduce((acc, p) => acc + p.totalTimeSpent, 0);
  const maxStreak = Math.max(...progress.map((p) => p.currentStreak), 0);

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-gray-500">Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aluno não encontrado</p>
        <Link href="/cms/students" className="text-primary-600 hover:underline mt-2 inline-block">
          Voltar para lista de alunos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            {student.photoURL ? (
              <img
                src={student.photoURL}
                alt={student.displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-semibold text-primary-700">
                  {getInitials(student.displayName)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.displayName}</h1>
              <div className="flex items-center gap-4 text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {student.email}
                </span>
                {student.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {student.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <MessageCircle className="h-5 w-5" />
          Enviar Mensagem
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          student={student}
          subscriptions={subscriptions}
          progress={progress}
          workoutHistory={workoutHistory}
          totalProgress={totalProgress}
          totalWorkouts={totalWorkouts}
          totalTime={totalTime}
          maxStreak={maxStreak}
          healthSummary={healthSummary}
          formatDate={formatDate}
          formatDuration={formatDuration}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressTab
          loadingProgress={loadingProgress}
          progressEntries={progressEntries}
          chartData={chartData}
          availableMetrics={availableMetrics}
          selectedChartMetrics={selectedChartMetrics}
          setSelectedChartMetrics={setSelectedChartMetrics}
          entriesWithPhotos={entriesWithPhotos}
          photoCompareIdx={photoCompareIdx}
          setPhotoCompareIdx={setPhotoCompareIdx}
          showAddProgress={showAddProgress}
          setShowAddProgress={setShowAddProgress}
          savingProgress={savingProgress}
          newProgress={newProgress}
          setNewProgress={setNewProgress}
          progressPhotos={progressPhotos}
          setProgressPhotos={setProgressPhotos}
          handleSaveProgress={handleSaveProgress}
        />
      )}

      {activeTab === 'workouts' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <WorkoutsList
            trainerId={user?.uid || ''}
            student={{
              id: studentId,
              displayName: student.displayName,
              email: student.email,
            }}
          />
        </div>
      )}

      {activeTab === 'financial' && (
        <FinancialTab
          student={student}
          subscriptions={subscriptions}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================

function OverviewTab({
  student,
  subscriptions,
  progress,
  workoutHistory,
  totalProgress,
  totalWorkouts,
  totalTime,
  maxStreak,
  healthSummary,
  formatDate,
  formatDuration,
  getStatusBadge,
}: {
  student: StudentData;
  subscriptions: SubscriptionData[];
  progress: ProgressData[];
  workoutHistory: WorkoutHistoryItem[];
  totalProgress: number;
  totalWorkouts: number;
  totalTime: number;
  maxStreak: number;
  healthSummary: HealthSummary;
  formatDate: (ts: any) => string;
  formatDuration: (m: number) => string;
  getStatusBadge: (s: string) => React.ReactNode;
}) {
  // Compute performance insights from health data
  const insights: { icon: React.ElementType; label: string; value: string; color: string }[] = [];
  if (healthSummary.year) {
    const yr = healthSummary.year;
    if (yr.completionRate >= 80) {
      insights.push({
        icon: Award,
        label: 'Alta consistência',
        value: `${yr.completionRate}% de conclusão`,
        color: 'text-green-600',
      });
    } else if (yr.completionRate < 60) {
      insights.push({
        icon: Activity,
        label: 'Consistência a melhorar',
        value: `${yr.completionRate}% de conclusão`,
        color: 'text-orange-500',
      });
    }
    if (yr.strengthLoad > yr.enduranceLoad * 1.5) {
      insights.push({
        icon: Dumbbell,
        label: 'Foco em força',
        value: `Carga de força ${yr.strengthLoad.toFixed(0)} kg`,
        color: 'text-primary-600',
      });
    } else if (yr.enduranceLoad > yr.strengthLoad * 1.5) {
      insights.push({
        icon: TrendingUp,
        label: 'Foco em resistência',
        value: `Carga de resistência ${yr.enduranceLoad.toFixed(0)} u`,
        color: 'text-blue-600',
      });
    } else {
      insights.push({
        icon: Target,
        label: 'Treino equilibrado',
        value: 'Força e resistência balanceadas',
        color: 'text-indigo-600',
      });
    }
    if (yr.dailyCalories > 0) {
      insights.push({
        icon: Flame,
        label: 'Meta calórica',
        value: `${yr.dailyCalories} kcal/dia`,
        color: 'text-orange-500',
      });
    }
  }
  const displayedInsights = insights.slice(0, 3);
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalProgress}%</p>
              <p className="text-sm text-gray-500">Progresso total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Dumbbell className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalWorkouts}</p>
              <p className="text-sm text-gray-500">Treinos concluídos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalTime)}</p>
              <p className="text-sm text-gray-500">Tempo total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{maxStreak}</p>
              <p className="text-sm text-gray-500">Dias seguidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          Métricas de Saúde
        </h2>

        {/* Health Stat Cards */}
        {(healthSummary.loadingYear || healthSummary.year) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthSummary.loadingYear ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
                >
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                  <div className="h-7 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            ) : healthSummary.year ? (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <Dumbbell className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {healthSummary.year.strengthLoad.toFixed(0)}
                        <span className="text-sm font-normal text-gray-400 ml-1">kg</span>
                      </p>
                      <p className="text-xs text-gray-500">Carga de força</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {healthSummary.year.enduranceLoad.toFixed(0)}
                        <span className="text-sm font-normal text-gray-400 ml-1">u</span>
                      </p>
                      <p className="text-xs text-gray-500">Carga de resistência</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {healthSummary.year.dailyCalories}
                        <span className="text-sm font-normal text-gray-400 ml-1">kcal</span>
                      </p>
                      <p className="text-xs text-gray-500">Calorias diárias</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {healthSummary.year.completionRate}
                        <span className="text-sm font-normal text-gray-400 ml-1">%</span>
                      </p>
                      <p className="text-xs text-gray-500">Taxa de conclusão</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 12-month Strength Evolution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Evolução de Força (12 meses)
            </h3>
            {healthSummary.loadingYear ? (
              <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
            ) : healthSummary.year?.monthlyStrength && healthSummary.year.monthlyStrength.length > 0 ? (
              <MetricsBarChart
                data={healthSummary.year.monthlyStrength}
                color="#0d9488"
                height={192}
                formatValue={(v) => `${v.toFixed(0)} kg`}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>

          {/* Weekly Strength vs Endurance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Força vs Resistência (semana)
            </h3>
            {healthSummary.loadingWeek ? (
              <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
            ) : healthSummary.week?.weeklyStrengthVsEndurance &&
              healthSummary.week.weeklyStrengthVsEndurance.length > 0 ? (
              <GroupedBarChart
                data={healthSummary.week.weeklyStrengthVsEndurance}
                bars={[
                  { dataKey: 'strength', color: '#0d9488', name: 'Força' },
                  { dataKey: 'endurance', color: '#6366f1', name: 'Resistência' },
                ]}
                height={192}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>

        {/* Calories + Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Calories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Calorias na semana (kcal)
            </h3>
            {healthSummary.loadingWeek ? (
              <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
            ) : healthSummary.week?.weeklyCalories && healthSummary.week.weeklyCalories.length > 0 ? (
              <MetricsBarChart
                data={healthSummary.week.weeklyCalories}
                color="#f59e0b"
                height={192}
                formatValue={(v) => `${v} kcal`}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Insights de performance</h3>
            {healthSummary.loadingYear ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : displayedInsights.length > 0 ? (
              <div className="space-y-3">
                {displayedInsights.map((insight, idx) => {
                  const Icon = insight.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${insight.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{insight.label}</p>
                        <p className="text-xs text-gray-500">{insight.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-gray-400">
                <BarChart3 className="h-8 w-8" />
                <p className="text-sm">Sem insights disponíveis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Programs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Treinos Atribuídos</h2>
            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((sub) => {
                  const prog = progress.find((p) => p.programId === sub.programId);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg">
                          <Dumbbell className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sub.programTitle}</p>
                          <p className="text-sm text-gray-500">
                            Iniciado em {formatDate(sub.startDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {prog && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Semana {prog.currentWeek} de {prog.totalWeeks}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 bg-primary-600 rounded-full"
                                  style={{ width: `${prog.completionPercentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {prog.completionPercentage}%
                              </span>
                            </div>
                          </div>
                        )}
                        {getStatusBadge(sub.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum treino atribuído</p>
            )}
          </div>

          {/* Workout History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico Recente</h2>
            {workoutHistory.length > 0 ? (
              <div className="space-y-3">
                {workoutHistory.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{workout.workoutName}</p>
                        <p className="text-sm text-gray-500">{workout.programTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{formatDuration(workout.duration)}</p>
                      <p className="text-xs text-gray-500">{formatDate(workout.completedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum treino concluído ainda</p>
            )}
          </div>
        </div>

        {/* Right Column - Profile Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Perfil</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Membro desde</p>
                <p className="font-medium text-gray-900">{formatDate(student.createdAt)}</p>
              </div>
              {student.fitnessProfile && (
                <>
                  {student.fitnessProfile.height && (
                    <div>
                      <p className="text-sm text-gray-500">Altura</p>
                      <p className="font-medium text-gray-900">
                        {student.fitnessProfile.height} cm
                      </p>
                    </div>
                  )}
                  {student.fitnessProfile.weight && (
                    <div>
                      <p className="text-sm text-gray-500">Peso</p>
                      <p className="font-medium text-gray-900">
                        {student.fitnessProfile.weight} kg
                      </p>
                    </div>
                  )}
                  {student.fitnessProfile.fitnessLevel && (
                    <div>
                      <p className="text-sm text-gray-500">Nível de condicionamento</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {student.fitnessProfile.fitnessLevel === 'beginner'
                          ? 'Iniciante'
                          : student.fitnessProfile.fitnessLevel === 'intermediate'
                            ? 'Intermediário'
                            : 'Avançado'}
                      </p>
                    </div>
                  )}
                  {student.fitnessProfile.goals && student.fitnessProfile.goals.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Objetivos</p>
                      <div className="flex flex-wrap gap-2">
                        {student.fitnessProfile.goals.map((goal, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <span className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Enviar mensagem</span>
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <span className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Ver check-ins</span>
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <span className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">Ajustar treino</span>
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// PROGRESS TAB
// ============================================================

function ProgressTab({
  loadingProgress,
  progressEntries,
  chartData,
  availableMetrics,
  selectedChartMetrics,
  setSelectedChartMetrics,
  entriesWithPhotos,
  photoCompareIdx,
  setPhotoCompareIdx,
  showAddProgress,
  setShowAddProgress,
  savingProgress,
  newProgress,
  setNewProgress,
  progressPhotos,
  setProgressPhotos,
  handleSaveProgress,
}: {
  loadingProgress: boolean;
  progressEntries: ProgressEntry[];
  chartData: any[];
  availableMetrics: string[];
  selectedChartMetrics: string[];
  setSelectedChartMetrics: (v: string[]) => void;
  entriesWithPhotos: ProgressEntry[];
  photoCompareIdx: [number, number];
  setPhotoCompareIdx: (v: [number, number]) => void;
  showAddProgress: boolean;
  setShowAddProgress: (v: boolean) => void;
  savingProgress: boolean;
  newProgress: any;
  setNewProgress: (v: any) => void;
  progressPhotos: { front?: File; side?: File; back?: File };
  setProgressPhotos: (v: any) => void;
  handleSaveProgress: () => void;
}) {
  if (loadingProgress) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Evolução Física</h2>
          <p className="text-sm text-gray-500">
            {progressEntries.length} avaliação{progressEntries.length !== 1 ? 'ões' : ''} registrada
            {progressEntries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddProgress(!showAddProgress)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5" />
          Nova Avaliação
        </button>
      </div>

      {/* Add Progress Form */}
      {showAddProgress && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Registrar Avaliação</h3>

          <div className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                value={newProgress.date}
                onChange={(e) => setNewProgress({ ...newProgress, date: e.target.value })}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              />
            </div>

            {/* Measurements Grid */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Medidas
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(MEASUREMENT_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newProgress[key as keyof typeof newProgress] || ''}
                      onChange={(e) =>
                        setNewProgress({ ...newProgress, [key]: e.target.value })
                      }
                      placeholder="-"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Fotos de Avaliação
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {(['front', 'side', 'back'] as const).map((position) => {
                  const labels = { front: 'Frente', side: 'Lateral', back: 'Costas' };
                  const file = progressPhotos[position];
                  return (
                    <div key={position}>
                      <label className="block text-xs text-gray-500 mb-1 text-center">
                        {labels[position]}
                      </label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
                        {file ? (
                          <div className="text-center">
                            <ImageIcon className="h-6 w-6 text-primary-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-600 truncate max-w-[120px]">
                              {file.name}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-400">Adicionar</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setProgressPhotos({ ...progressPhotos, [position]: f });
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={newProgress.notes}
                onChange={(e) => setNewProgress({ ...newProgress, notes: e.target.value })}
                rows={3}
                placeholder="Observações sobre a avaliação..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveProgress}
                disabled={savingProgress}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {savingProgress && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar Avaliação
              </button>
              <button
                onClick={() => setShowAddProgress(false)}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {progressEntries.length >= 2 && availableMetrics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              Gráfico de Evolução
            </h3>
          </div>

          {/* Metric Toggles */}
          <div className="flex flex-wrap gap-2 mb-4">
            {availableMetrics.map((metric) => {
              const isSelected = selectedChartMetrics.includes(metric);
              return (
                <button
                  key={metric}
                  onClick={() => {
                    if (isSelected) {
                      if (selectedChartMetrics.length > 1) {
                        setSelectedChartMetrics(selectedChartMetrics.filter((m) => m !== metric));
                      }
                    } else {
                      setSelectedChartMetrics([...selectedChartMetrics, metric]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {MEASUREMENT_LABELS[metric]}
                </button>
              );
            })}
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend />
                {selectedChartMetrics.map((metric, idx) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={MEASUREMENT_LABELS[metric]}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Photo Comparison */}
      {entriesWithPhotos.length >= 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-600" />
            Comparação de Fotos
          </h3>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Antes</label>
              <select
                value={photoCompareIdx[0]}
                onChange={(e) =>
                  setPhotoCompareIdx([Number(e.target.value), photoCompareIdx[1]])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {entriesWithPhotos.map((entry, idx) => (
                  <option key={entry.id} value={idx}>
                    {formatDate(entry.date)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Depois</label>
              <select
                value={photoCompareIdx[1]}
                onChange={(e) =>
                  setPhotoCompareIdx([photoCompareIdx[0], Number(e.target.value)])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {entriesWithPhotos.map((entry, idx) => (
                  <option key={entry.id} value={idx}>
                    {formatDate(entry.date)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(['front', 'side', 'back'] as const).map((position) => {
              const beforeEntry = entriesWithPhotos[photoCompareIdx[0]];
              const afterEntry = entriesWithPhotos[photoCompareIdx[1]];
              const beforePhoto = beforeEntry?.photos?.[position];
              const afterPhoto = afterEntry?.photos?.[position];

              if (!beforePhoto && !afterPhoto) return null;

              return (
                <div key={position} className="col-span-2 md:col-span-1">
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center capitalize">
                    {{ front: 'Frente', side: 'Lateral', back: 'Costas' }[position]}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      {beforePhoto ? (
                        <img
                          src={beforePhoto}
                          alt={`Antes - ${position}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                        Antes
                      </span>
                    </div>
                    <div className="relative">
                      {afterPhoto ? (
                        <img
                          src={afterPhoto}
                          alt={`Depois - ${position}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded">
                        Depois
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress History Table */}
      {progressEntries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Histórico de Avaliações</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Data</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Peso</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Gordura</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Massa M.</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Cintura</th>
                  <th className="text-center py-3 px-2 text-gray-500 font-medium">Fotos</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {progressEntries.map((entry, idx) => {
                  const prev = progressEntries[idx + 1];
                  const weightDiff =
                    entry.measurements.weight && prev?.measurements.weight
                      ? entry.measurements.weight - prev.measurements.weight
                      : null;

                  return (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {entry.measurements.weight != null ? (
                          <span>
                            {entry.measurements.weight} kg
                            {weightDiff != null && (
                              <span
                                className={`ml-1 text-xs ${
                                  weightDiff > 0 ? 'text-red-500' : weightDiff < 0 ? 'text-green-500' : 'text-gray-400'
                                }`}
                              >
                                {weightDiff > 0 ? '+' : ''}
                                {weightDiff.toFixed(1)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {entry.measurements.bodyFat != null
                          ? `${entry.measurements.bodyFat}%`
                          : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {entry.measurements.muscleMass != null
                          ? `${entry.measurements.muscleMass} kg`
                          : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {entry.measurements.waist != null
                          ? `${entry.measurements.waist} cm`
                          : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {entry.photos &&
                        (entry.photos.front || entry.photos.side || entry.photos.back) ? (
                          <Camera className="h-4 w-4 text-primary-600 mx-auto" />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-gray-600 max-w-[150px] truncate">
                        {entry.notes || <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {progressEntries.length === 0 && !showAddProgress && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Scale className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação registrada</h3>
          <p className="text-gray-500 mb-4">
            Registre a primeira avaliação para acompanhar a evolução do aluno
          </p>
          <button
            onClick={() => setShowAddProgress(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Registrar Avaliação
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FINANCIAL TAB
// ============================================================

function FinancialTab({
  student,
  subscriptions,
  formatDate,
  getStatusBadge,
}: {
  student: StudentData;
  subscriptions: SubscriptionData[];
  formatDate: (ts: any) => string;
  getStatusBadge: (s: string) => React.ReactNode;
}) {
  const paymentMethodLabels: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto',
  };

  return (
    <div className="space-y-6">
      {/* Plan Info */}
      {student.plan && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-600" />
            Plano do Aluno
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Mensalidade</p>
              <p className="text-xl font-bold text-gray-900">
                R$ {student.plan.monthlyFee.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dia de Cobrança</p>
              <p className="text-xl font-bold text-gray-900">Dia {student.plan.billingDay}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Forma de Pagamento</p>
              <p className="text-xl font-bold text-gray-900">
                {paymentMethodLabels[student.plan.paymentMethod] || student.plan.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1">{getStatusBadge(student.plan.status)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Assinaturas</h3>
        {subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Dumbbell className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sub.programTitle}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(sub.startDate)} — {formatDate(sub.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(sub.status)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhuma assinatura encontrada</p>
        )}
      </div>

      {/* No plan info */}
      {!student.plan && subscriptions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sem informações financeiras</h3>
          <p className="text-gray-500">
            Este aluno ainda não possui um plano ou assinatura ativa
          </p>
        </div>
      )}
    </div>
  );
}
