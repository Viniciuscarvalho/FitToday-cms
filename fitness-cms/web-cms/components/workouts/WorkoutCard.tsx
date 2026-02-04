'use client';

import { useState } from 'react';
import {
  FileText,
  Calendar,
  Eye,
  MoreVertical,
  Archive,
  Trash2,
  ExternalLink,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { WorkoutWithProgress } from '@/types/workout';

interface WorkoutCardProps {
  workout: WorkoutWithProgress;
  onView: (workoutId: string) => void;
  onArchive: (workoutId: string) => void;
  onDelete: (workoutId: string) => void;
}

export function WorkoutCard({ workout, onView, onArchive, onDelete }: WorkoutCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    switch (workout.status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Ativo
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Concluído
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            Arquivado
          </span>
        );
      default:
        return null;
    }
  };

  const progressPercent = workout.progress?.percentComplete || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <FileText className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {workout.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(workout.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        window.open(workout.pdfUrl, '_blank');
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir PDF
                    </button>
                    {workout.status !== 'archived' && (
                      <button
                        onClick={() => {
                          onArchive(workout.id);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Archive className="h-4 w-4" />
                        Arquivar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(workout.id);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {workout.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {workout.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium text-gray-900">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {workout.progress && (
            <>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>
                  {workout.progress.completedDays?.length || 0}/{workout.progress.totalDays || 0} dias
                </span>
              </div>
              {workout.progress.currentStreak > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-orange-500">🔥</span>
                  <span>{workout.progress.currentStreak} dias seguidos</span>
                </div>
              )}
            </>
          )}
          {workout.feedbackCount !== undefined && workout.feedbackCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{workout.feedbackCount} feedback{workout.feedbackCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {workout.viewedAt && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Visualizado</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <button
          onClick={() => onView(workout.id)}
          className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}
