'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Calendar,
  ExternalLink,
  Loader2,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  User,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  WorkoutWithProgress,
  WorkoutFeedback,
  WorkoutProgressResponse,
} from '@/types/workout';

export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const workoutId = params.workoutId as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<WorkoutWithProgress | null>(null);
  const [progress, setProgress] = useState<WorkoutProgressResponse | null>(null);
  const [feedbacks, setFeedbacks] = useState<WorkoutFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reply form state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    loadWorkoutData();
  }, [workoutId, user]);

  const loadWorkoutData = async () => {
    if (!workoutId || !user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch workout details
      const workoutRes = await fetch(`/api/workouts/${workoutId}`);
      const workoutData = await workoutRes.json();

      if (!workoutRes.ok) {
        throw new Error(workoutData.error || 'Erro ao carregar treino');
      }

      setWorkout(workoutData);

      // Fetch progress and feedback in parallel
      const [progressRes, feedbackRes] = await Promise.all([
        fetch(`/api/workouts/${workoutId}/progress`),
        fetch(`/api/workouts/${workoutId}/feedback`),
      ]);

      const progressData = await progressRes.json();
      const feedbackData = await feedbackRes.json();

      if (progressRes.ok) {
        setProgress(progressData);
      }

      if (feedbackRes.ok) {
        setFeedbacks(feedbackData.feedbacks || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);

      const response = await fetch(`/api/workouts/${workoutId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          response: replyText.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar resposta');
      }

      // Update local state
      const updatedFeedback = await response.json();
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? updatedFeedback : f))
      );

      setReplyingTo(null);
      setReplyText('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: any) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      archived: 'bg-gray-100 text-gray-600',
    };
    const labels: Record<string, string> = {
      active: 'Ativo',
      completed: 'Concluído',
      archived: 'Arquivado',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.archived}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-gray-500">Carregando detalhes do treino...</p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{error || 'Treino não encontrado'}</p>
        <Link
          href={`/cms/students/${studentId}`}
          className="text-primary-600 hover:underline"
        >
          Voltar para o aluno
        </Link>
      </div>
    );
  }

  const progressPercent = progress?.percentComplete || 0;
  const completedDays = progress?.completedDays?.length || 0;
  const totalDays = progress?.totalDays || workout.totalDays || 28;

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workout.title}</h1>
            <p className="text-gray-500 mt-1">
              Enviado em {formatDate(workout.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(workout.status)}
          <a
            href={workout.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <ExternalLink className="h-5 w-5" />
            Abrir PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workout Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <FileText className="h-8 w-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Informações do Treino
                </h2>
                {workout.description && (
                  <p className="text-gray-600 mb-4">{workout.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {workout.durationWeeks && (
                    <div>
                      <p className="text-sm text-gray-500">Duração</p>
                      <p className="font-medium text-gray-900">
                        {workout.durationWeeks} semanas
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Total de dias</p>
                    <p className="font-medium text-gray-900">{totalDays} dias</p>
                  </div>
                  {workout.startDate && (
                    <div>
                      <p className="text-sm text-gray-500">Início</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(workout.startDate)}
                      </p>
                    </div>
                  )}
                  {workout.viewedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Visualizado</p>
                      <p className="font-medium text-green-600">
                        {formatDateTime(workout.viewedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Feedbacks do Aluno
              </h2>
              <span className="text-sm text-gray-500">
                {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
              </span>
            </div>

            {feedbacks.length > 0 ? (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="border border-gray-100 rounded-lg p-4"
                  >
                    {/* Student feedback */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">Aluno</p>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(feedback.createdAt)}
                          </span>
                        </div>
                        {feedback.dayNumber && (
                          <p className="text-sm text-gray-500 mb-1">
                            Dia {feedback.dayNumber}
                            {feedback.rating && (
                              <span className="ml-2">
                                {'⭐'.repeat(feedback.rating)}
                              </span>
                            )}
                          </p>
                        )}
                        <p className="text-gray-700 mt-1">{feedback.message}</p>
                      </div>
                    </div>

                    {/* Trainer response */}
                    {feedback.trainerResponse ? (
                      <div className="mt-4 ml-8 pl-4 border-l-2 border-primary-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary-100 rounded-full">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">Você</p>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(feedback.respondedAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 mt-1">
                              {feedback.trainerResponse}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 ml-8">
                        {replyingTo === feedback.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Digite sua resposta..."
                              rows={3}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleReply(feedback.id)}
                                disabled={submittingReply || !replyText.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                              >
                                {submittingReply ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                Enviar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingTo(feedback.id)}
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Responder
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p>Nenhum feedback enviado ainda</p>
                <p className="text-sm mt-1">
                  O aluno pode enviar feedbacks pelo aplicativo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Progress */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Progresso
            </h2>

            {/* Circular Progress */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#7C3AED"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercent * 3.52} 352`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">Dias concluídos</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {completedDays}/{totalDays}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-gray-600">Sequência atual</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {progress?.currentStreak || 0} dias
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-600">Maior sequência</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {progress?.longestStreak || 0} dias
                </span>
              </div>

              {progress?.lastActivityAt && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <span className="text-gray-600">Última atividade</span>
                  </div>
                  <span className="font-medium text-gray-900 text-sm">
                    {formatDateTime(progress.lastActivityAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Completed Days Calendar-like */}
          {progress?.completedDays && progress.completedDays.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Dias Concluídos
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                  const isCompleted = progress.completedDays.includes(day);
                  return (
                    <div
                      key={day}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
