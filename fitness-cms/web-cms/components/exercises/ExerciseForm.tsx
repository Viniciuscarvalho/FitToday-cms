'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Exercise, ExerciseCategory } from '@/types';

// ----------------------------------------------------------------
// Validation schema
// ----------------------------------------------------------------

const exerciseSchema = z.object({
  namePt: z.string().min(1, 'Nome em português é obrigatório'),
  nameEn: z.string().min(1, 'Nome em inglês é obrigatório'),
  aliases: z.string().optional(),
  description: z.string().optional(),
  category: z.enum([
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'core', 'quadriceps', 'hamstrings', 'glutes', 'calves',
    'full_body', 'cardio', 'stretching',
  ] as const),
  equipment: z.string().min(1, 'Equipamento é obrigatório'),
  level: z.enum(['beginner', 'intermediate', 'advanced'] as const),
  force: z.enum(['push', 'pull', 'static', '']).optional(),
  mechanic: z.enum(['compound', 'isolation', '']).optional(),
  instructionsPt: z.string().optional(),
  instructionsEn: z.string().optional(),
});

export type ExerciseFormValues = z.infer<typeof exerciseSchema>;

// ----------------------------------------------------------------
// Helpers to convert Exercise -> form values and back
// ----------------------------------------------------------------

export function exerciseToFormValues(exercise: Exercise): ExerciseFormValues {
  return {
    namePt: exercise.name.pt,
    nameEn: exercise.name.en,
    aliases: exercise.aliases?.join(', ') ?? '',
    description: exercise.description ?? '',
    category: exercise.category,
    equipment: exercise.equipment,
    level: exercise.level,
    force: exercise.force ?? '',
    mechanic: exercise.mechanic ?? '',
    instructionsPt: exercise.instructions?.pt?.join('\n') ?? '',
    instructionsEn: exercise.instructions?.en?.join('\n') ?? '',
  };
}

export function formValuesToPayload(values: ExerciseFormValues) {
  return {
    name: { pt: values.namePt, en: values.nameEn },
    aliases: values.aliases
      ? values.aliases.split(',').map((a) => a.trim()).filter(Boolean)
      : [],
    description: values.description || undefined,
    category: values.category,
    equipment: values.equipment,
    level: values.level,
    force: values.force || undefined,
    mechanic: values.mechanic || undefined,
    instructions: {
      pt: values.instructionsPt
        ? values.instructionsPt.split('\n').map((l) => l.trim()).filter(Boolean)
        : [],
      en: values.instructionsEn
        ? values.instructionsEn.split('\n').map((l) => l.trim()).filter(Boolean)
        : [],
    },
  };
}

// ----------------------------------------------------------------
// Option lists
// ----------------------------------------------------------------

const CATEGORY_OPTIONS: { value: ExerciseCategory; label: string }[] = [
  { value: 'chest', label: 'Peitoral' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'forearms', label: 'Antebraços' },
  { value: 'core', label: 'Core/Abdômen' },
  { value: 'quadriceps', label: 'Quadríceps' },
  { value: 'hamstrings', label: 'Posterior de coxa' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'calves', label: 'Panturrilha' },
  { value: 'full_body', label: 'Corpo todo' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'stretching', label: 'Alongamento' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barra' },
  { value: 'dumbbell', label: 'Halter' },
  { value: 'cable', label: 'Cabo/Polia' },
  { value: 'machine', label: 'Máquina' },
  { value: 'bodyweight', label: 'Peso corporal' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_band', label: 'Elástico' },
  { value: 'pull-up bar', label: 'Barra fixa' },
];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

interface ExerciseFormProps {
  defaultValues?: Partial<ExerciseFormValues>;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm';

const selectClass =
  'w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm bg-white';

const textareaClass =
  'w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm resize-none';

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

const errorClass = 'mt-1 text-xs text-red-600';

export function ExerciseForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Salvar',
  isLoading = false,
}: ExerciseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      namePt: '',
      nameEn: '',
      aliases: '',
      description: '',
      category: 'chest',
      equipment: 'barbell',
      level: 'beginner',
      force: '',
      mechanic: '',
      instructionsPt: '',
      instructionsEn: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Names */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Identificação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Nome em Português <span className="text-red-500">*</span>
            </label>
            <input
              {...register('namePt')}
              type="text"
              placeholder="Ex: Supino reto com barra"
              className={inputClass}
            />
            {errors.namePt && (
              <p className={errorClass}>{errors.namePt.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Nome em Inglês <span className="text-red-500">*</span>
            </label>
            <input
              {...register('nameEn')}
              type="text"
              placeholder="Ex: Barbell Bench Press"
              className={inputClass}
            />
            {errors.nameEn && (
              <p className={errorClass}>{errors.nameEn.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>
              Apelidos / Variações{' '}
              <span className="text-xs text-gray-400 font-normal">
                (separados por vírgula)
              </span>
            </label>
            <input
              {...register('aliases')}
              type="text"
              placeholder="Ex: Supino plano, Bench press"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Descrição</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Descreva brevemente o exercício..."
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* Classification */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Classificação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              Categoria <span className="text-red-500">*</span>
            </label>
            <select {...register('category')} className={selectClass}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className={errorClass}>{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Equipamento <span className="text-red-500">*</span>
            </label>
            <select {...register('equipment')} className={selectClass}>
              {EQUIPMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.equipment && (
              <p className={errorClass}>{errors.equipment.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Nível</label>
            <select {...register('level')} className={selectClass}>
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tipo de força</label>
            <select {...register('force')} className={selectClass}>
              <option value="">Não especificado</option>
              <option value="push">Empurrar (Push)</option>
              <option value="pull">Puxar (Pull)</option>
              <option value="static">Estático</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Mecânica</label>
            <select {...register('mechanic')} className={selectClass}>
              <option value="">Não especificado</option>
              <option value="compound">Composto (multi-articular)</option>
              <option value="isolation">Isolado (uni-articular)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Instruções de execução
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Uma instrução por linha. Cada linha será um passo numerado.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Instruções em Português</label>
            <textarea
              {...register('instructionsPt')}
              rows={8}
              placeholder={`Deite-se no banco plano\nSegure a barra na largura dos ombros\nDesça a barra até o peito controladamente\nEmpurre de volta à posição inicial`}
              className={textareaClass}
            />
          </div>
          <div>
            <label className={labelClass}>Instruções em Inglês</label>
            <textarea
              {...register('instructionsEn')}
              rows={8}
              placeholder={`Lie flat on a bench\nGrip the bar at shoulder width\nLower the bar to your chest in a controlled manner\nPress back to the starting position`}
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
