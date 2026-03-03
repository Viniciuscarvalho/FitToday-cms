'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Edit,
  X,
  Dumbbell,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExerciseForm,
  ExerciseFormValues,
  exerciseToFormValues,
  formValuesToPayload,
} from '@/components/exercises/ExerciseForm';
import { apiRequest } from '@/lib/api-client';
import { Exercise, ExerciseCategory } from '@/types';

// ----------------------------------------------------------------
// Label maps
// ----------------------------------------------------------------

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: 'Peitoral',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  core: 'Core/Abdômen',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posterior de coxa',
  glutes: 'Glúteos',
  calves: 'Panturrilha',
  full_body: 'Corpo todo',
  cardio: 'Cardio',
  stretching: 'Alongamento',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halter',
  cable: 'Cabo/Polia',
  machine: 'Máquina',
  bodyweight: 'Peso corporal',
  kettlebell: 'Kettlebell',
  resistance_band: 'Elástico',
  'pull-up bar': 'Barra fixa',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const FORCE_LABELS: Record<string, string> = {
  push: 'Empurrar (Push)',
  pull: 'Puxar (Pull)',
  static: 'Estático',
};

const MECHANIC_LABELS: Record<string, string> = {
  compound: 'Composto (multi-articular)',
  isolation: 'Isolado (uni-articular)',
};

// ----------------------------------------------------------------
// Detail view component
// ----------------------------------------------------------------

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const [activeImage, setActiveImage] = useState<string | null>(
    exercise.media?.thumbnailURL || exercise.media?.gifURL || null
  );

  const allImages = [
    ...(exercise.media?.thumbnailURL ? [exercise.media.thumbnailURL] : []),
    ...(exercise.media?.gifURL ? [exercise.media.gifURL] : []),
    ...(exercise.media?.images ?? []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Media */}
      <div className="space-y-4">
        {/* Main image */}
        <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
          {activeImage ? (
            <img
              src={activeImage}
              alt={exercise.name.pt}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <ImageIcon className="h-12 w-12" />
              <span className="text-sm">Sem imagem</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  activeImage === img
                    ? 'border-primary-500'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={img}
                  alt={`Imagem ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Video link */}
        {exercise.media?.videoURL && (
          <a
            href={exercise.media.videoURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Ver vídeo demonstrativo
          </a>
        )}
      </div>

      {/* Right: Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700">
            {CATEGORY_LABELS[exercise.category] ?? exercise.category}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              LEVEL_COLORS[exercise.level] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {LEVEL_LABELS[exercise.level] ?? exercise.level}
          </span>
          {exercise.source === 'system' ? (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              Sistema
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
              Personal
            </span>
          )}
          {exercise.isActive ? (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Ativo
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-500">
              <XCircle className="h-3.5 w-3.5" />
              Inativo
            </span>
          )}
        </div>

        {/* Description */}
        {exercise.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Descrição
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{exercise.description}</p>
          </div>
        )}

        {/* Classification grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Equipamento</p>
            <p className="font-medium text-gray-900 text-sm">
              {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
            </p>
          </div>
          {exercise.force && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tipo de força</p>
              <p className="font-medium text-gray-900 text-sm">
                {FORCE_LABELS[exercise.force] ?? exercise.force}
              </p>
            </div>
          )}
          {exercise.mechanic && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mecânica</p>
              <p className="font-medium text-gray-900 text-sm">
                {MECHANIC_LABELS[exercise.mechanic] ?? exercise.mechanic}
              </p>
            </div>
          )}
        </div>

        {/* Muscle groups */}
        {(exercise.muscleGroups?.primary?.length > 0 ||
          exercise.muscleGroups?.secondary?.length > 0) && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Grupos musculares
            </h3>
            <div className="space-y-2">
              {exercise.muscleGroups.primary?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 font-medium self-center">Primário:</span>
                  {exercise.muscleGroups.primary.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-700 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {exercise.muscleGroups.secondary?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 font-medium self-center">
                    Secundário:
                  </span>
                  {exercise.muscleGroups.secondary.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aliases */}
        {exercise.aliases?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Variações / Apelidos
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {exercise.aliases.map((alias) => (
                <span
                  key={alias}
                  className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions PT */}
        {exercise.instructions?.pt?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Instruções (PT)
            </h3>
            <ol className="space-y-2">
              {exercise.instructions.pt.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Page component
// ----------------------------------------------------------------

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: exercise,
    isLoading,
    isError,
  } = useQuery<Exercise>({
    queryKey: ['exercise', params.id],
    queryFn: () => apiRequest<Exercise>(`/api/exercises/${params.id}`),
    enabled: !!params.id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: object) =>
      apiRequest(`/api/exercises/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise', params.id] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setIsEditing(false);
    },
  });

  const handleSubmit = async (values: ExerciseFormValues) => {
    const payload = formValuesToPayload(values);
    await updateMutation.mutateAsync(payload);
  };

  // ----------------------------------------------------------------
  // Loading
  // ----------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Error
  // ----------------------------------------------------------------
  if (isError || !exercise) {
    return (
      <div className="space-y-6">
        <Link
          href="/cms/exercises"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao catálogo
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Exercício não encontrado
          </h3>
          <p className="text-gray-500">
            O exercício solicitado não existe ou não pôde ser carregado.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Main render
  // ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cms/exercises"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exercise.name.pt}</h1>
            {exercise.name.en !== exercise.name.pt && (
              <p className="text-sm text-gray-500 mt-0.5">{exercise.name.en}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Content: detail view or edit form */}
      {isEditing ? (
        <ExerciseForm
          defaultValues={exerciseToFormValues(exercise)}
          onSubmit={handleSubmit}
          submitLabel={updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          isLoading={updateMutation.isPending}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <ExerciseDetail exercise={exercise} />
        </div>
      )}

      {/* Update error */}
      {updateMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Ocorreu um erro ao salvar as alterações. Por favor, tente novamente.
        </div>
      )}
    </div>
  );
}
