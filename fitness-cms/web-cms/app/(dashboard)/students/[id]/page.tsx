'use client';

import { useEffect, useState } from 'react';
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
  MoreVertical,
  Dumbbell,
  Flame,
  Award,
  ChevronRight,
  Loader2,
} from 'lucide-react';
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

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);

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
          router.push('/students');
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

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
    const styles = {
      active: 'bg-green-100 text-green-700',
      canceled: 'bg-red-100 text-red-700',
      past_due: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-gray-100 text-gray-600',
    };
    const labels = {
      active: 'Ativo',
      canceled: 'Cancelado',
      past_due: 'Pendente',
      expired: 'Expirado',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.expired}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

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
        <Link href="/students" className="text-primary-600 hover:underline mt-2 inline-block">
          Voltar para lista de alunos
        </Link>
      </div>
    );
  }

  const totalProgress = progress.length > 0
    ? Math.round(progress.reduce((acc, p) => acc + p.completionPercentage, 0) / progress.length)
    : 0;

  const totalWorkouts = progress.reduce((acc, p) => acc + p.totalWorkoutsCompleted, 0);
  const totalTime = progress.reduce((acc, p) => acc + p.totalTimeSpent, 0);
  const maxStreak = Math.max(...progress.map((p) => p.currentStreak), 0);

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
              <h1 className="text-2xl font-bold text-gray-900">
                {student.displayName}
              </h1>
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
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(totalTime)}
              </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Subscriptions & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Programs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Programas Inscritos
            </h2>
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
                          <p className="font-medium text-gray-900">
                            {sub.programTitle}
                          </p>
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
                                  style={{
                                    width: `${prog.completionPercentage}%`,
                                  }}
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
              <p className="text-gray-500 text-center py-4">
                Nenhum programa inscrito
              </p>
            )}
          </div>

          {/* Workout History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Histórico de Treinos
              </h2>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                Ver todos
              </button>
            </div>
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
                        <p className="font-medium text-gray-900">
                          {workout.workoutName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {workout.programTitle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatDuration(workout.duration)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(workout.completedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhum treino concluído ainda
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Profile Info */}
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informações do Perfil
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Membro desde</p>
                <p className="font-medium text-gray-900">
                  {formatDate(student.createdAt)}
                </p>
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
                  {student.fitnessProfile.goals &&
                    student.fitnessProfile.goals.length > 0 && (
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ações Rápidas
            </h2>
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
                  <span className="text-gray-700">Ajustar programa</span>
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
