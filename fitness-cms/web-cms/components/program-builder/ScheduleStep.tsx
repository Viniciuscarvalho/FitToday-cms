'use client';

import { ProgramFormData } from '@/app/(dashboard)/programs/new/page';
import { Calendar, Clock, Repeat } from 'lucide-react';

interface ScheduleStepProps {
  data: ProgramFormData;
  onChange: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
}

export function ScheduleStep({ data, onChange, errors }: ScheduleStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cronograma do Programa
        </h2>
        <p className="text-gray-500 mb-6">
          Defina a estrutura de duração e frequência dos treinos
        </p>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          Duração do Programa (semanas)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="24"
            value={data.durationWeeks}
            onChange={(e) =>
              onChange({ durationWeeks: parseInt(e.target.value) })
            }
            className="flex-1 accent-primary-600"
          />
          <div className="w-20 text-center">
            <span className="text-2xl font-bold text-primary-600">
              {data.durationWeeks}
            </span>
            <span className="text-gray-500 text-sm ml-1">sem.</span>
          </div>
        </div>
        {errors.durationWeeks && (
          <p className="text-sm text-red-500 mt-1">{errors.durationWeeks}</p>
        )}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 semana</span>
          <span>24 semanas</span>
        </div>
      </div>

      {/* Workouts per Week */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Repeat className="inline h-4 w-4 mr-1" />
          Treinos por Semana
        </label>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange({ workoutsPerWeek: num })}
              className={`p-4 rounded-lg border-2 font-medium transition-all ${
                data.workoutsPerWeek === num
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {num}x
            </button>
          ))}
        </div>
        {errors.workoutsPerWeek && (
          <p className="text-sm text-red-500 mt-1">{errors.workoutsPerWeek}</p>
        )}
      </div>

      {/* Average Workout Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="inline h-4 w-4 mr-1" />
          Duração Média do Treino (minutos)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[30, 45, 60, 75, 90].map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => onChange({ averageWorkoutDuration: duration })}
              className={`p-4 rounded-lg border-2 font-medium transition-all ${
                data.averageWorkoutDuration === duration
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {duration} min
            </button>
          ))}
        </div>
        <input
          type="number"
          value={data.averageWorkoutDuration}
          onChange={(e) =>
            onChange({ averageWorkoutDuration: parseInt(e.target.value) || 60 })
          }
          placeholder="Ou digite um valor personalizado"
          className="mt-3 w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
        />
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6">
        <h4 className="font-semibold text-primary-900 mb-4">
          Resumo do Programa
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-700">
              {data.durationWeeks}
            </div>
            <div className="text-sm text-primary-600">semanas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-700">
              {data.durationWeeks * data.workoutsPerWeek}
            </div>
            <div className="text-sm text-primary-600">treinos total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-700">
              {Math.round(
                (data.durationWeeks *
                  data.workoutsPerWeek *
                  data.averageWorkoutDuration) /
                  60
              )}
            </div>
            <div className="text-sm text-primary-600">horas total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
