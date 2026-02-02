'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Dumbbell,
} from 'lucide-react';
import { ProgramFormData } from '@/app/(dashboard)/programs/new/page';

interface WorkoutsStepProps {
  data: ProgramFormData;
  onChange: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
}

const dayNames = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

// Sample exercises for demo
const sampleExercises = [
  { id: '1', name: 'Supino Reto', muscleGroup: 'Peito' },
  { id: '2', name: 'Agachamento Livre', muscleGroup: 'Pernas' },
  { id: '3', name: 'Levantamento Terra', muscleGroup: 'Costas' },
  { id: '4', name: 'Desenvolvimento', muscleGroup: 'Ombros' },
  { id: '5', name: 'Rosca Direta', muscleGroup: 'Bíceps' },
  { id: '6', name: 'Tríceps Pulley', muscleGroup: 'Tríceps' },
  { id: '7', name: 'Leg Press', muscleGroup: 'Pernas' },
  { id: '8', name: 'Remada Curvada', muscleGroup: 'Costas' },
  { id: '9', name: 'Crucifixo', muscleGroup: 'Peito' },
  { id: '10', name: 'Elevação Lateral', muscleGroup: 'Ombros' },
];

export function WorkoutsStep({ data, onChange, errors }: WorkoutsStepProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([0]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<string[]>([]);

  // Initialize weeks structure when component mounts or schedule changes
  useEffect(() => {
    if (data.weeks.length !== data.durationWeeks) {
      const newWeeks = Array.from({ length: data.durationWeeks }, (_, i) => {
        // Preserve existing week data if available
        const existingWeek = data.weeks[i];
        if (existingWeek) return existingWeek;

        return {
          weekNumber: i + 1,
          name: `Semana ${i + 1}`,
          workouts: Array.from(
            { length: data.workoutsPerWeek },
            (_, j) => ({
              dayOfWeek: j,
              name: `Treino ${String.fromCharCode(65 + j)}`,
              exercises: [],
            })
          ),
        };
      });
      onChange({ weeks: newWeeks });
    }
  }, [data.durationWeeks, data.workoutsPerWeek]);

  const toggleWeek = (weekIndex: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(weekIndex)
        ? prev.filter((i) => i !== weekIndex)
        : [...prev, weekIndex]
    );
  };

  const toggleWorkout = (workoutKey: string) => {
    setExpandedWorkouts((prev) =>
      prev.includes(workoutKey)
        ? prev.filter((k) => k !== workoutKey)
        : [...prev, workoutKey]
    );
  };

  const updateWorkoutName = (
    weekIndex: number,
    workoutIndex: number,
    name: string
  ) => {
    const newWeeks = [...data.weeks];
    newWeeks[weekIndex].workouts[workoutIndex].name = name;
    onChange({ weeks: newWeeks });
  };

  const addExercise = (weekIndex: number, workoutIndex: number) => {
    const newWeeks = [...data.weeks];
    newWeeks[weekIndex].workouts[workoutIndex].exercises.push({
      exerciseId: '',
      exerciseName: '',
      sets: 3,
      reps: '10-12',
      rest: 60,
      notes: '',
    });
    onChange({ weeks: newWeeks });
  };

  const updateExercise = (
    weekIndex: number,
    workoutIndex: number,
    exerciseIndex: number,
    field: string,
    value: string | number
  ) => {
    const newWeeks = [...data.weeks];
    const exercise =
      newWeeks[weekIndex].workouts[workoutIndex].exercises[exerciseIndex];
    (exercise as Record<string, string | number>)[field] = value;

    // If exerciseId is updated, also update exerciseName
    if (field === 'exerciseId') {
      const selectedExercise = sampleExercises.find((e) => e.id === value);
      exercise.exerciseName = selectedExercise?.name || '';
    }

    onChange({ weeks: newWeeks });
  };

  const removeExercise = (
    weekIndex: number,
    workoutIndex: number,
    exerciseIndex: number
  ) => {
    const newWeeks = [...data.weeks];
    newWeeks[weekIndex].workouts[workoutIndex].exercises.splice(
      exerciseIndex,
      1
    );
    onChange({ weeks: newWeeks });
  };

  const copyWeek = (fromWeekIndex: number) => {
    const weekToCopy = data.weeks[fromWeekIndex];
    const targetWeekIndex = fromWeekIndex + 1;

    if (targetWeekIndex < data.weeks.length) {
      const newWeeks = [...data.weeks];
      newWeeks[targetWeekIndex] = {
        ...JSON.parse(JSON.stringify(weekToCopy)),
        weekNumber: targetWeekIndex + 1,
        name: `Semana ${targetWeekIndex + 1}`,
      };
      onChange({ weeks: newWeeks });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Estrutura dos Treinos
        </h2>
        <p className="text-gray-500 mb-6">
          Monte a estrutura de exercícios para cada semana do programa
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setExpandedWeeks(data.weeks.map((_, i) => i))}
          className="text-primary-600 hover:text-primary-700"
        >
          Expandir todas
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={() => setExpandedWeeks([])}
          className="text-primary-600 hover:text-primary-700"
        >
          Recolher todas
        </button>
      </div>

      {/* Weeks */}
      <div className="space-y-4">
        {data.weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Week Header */}
            <button
              type="button"
              onClick={() => toggleWeek(weekIndex)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedWeeks.includes(weekIndex) ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">{week.name}</span>
                <span className="text-sm text-gray-500">
                  ({week.workouts.length} treinos)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {weekIndex < data.weeks.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyWeek(weekIndex);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50"
                  >
                    Copiar para próxima
                  </button>
                )}
              </div>
            </button>

            {/* Week Content */}
            {expandedWeeks.includes(weekIndex) && (
              <div className="p-4 space-y-4">
                {week.workouts.map((workout, workoutIndex) => {
                  const workoutKey = `${weekIndex}-${workoutIndex}`;
                  return (
                    <div
                      key={workoutIndex}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Workout Header */}
                      <button
                        type="button"
                        onClick={() => toggleWorkout(workoutKey)}
                        className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          {expandedWorkouts.includes(workoutKey) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <input
                            type="text"
                            value={workout.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              updateWorkoutName(
                                weekIndex,
                                workoutIndex,
                                e.target.value
                              )
                            }
                            className="font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {workout.exercises.length} exercícios
                        </span>
                      </button>

                      {/* Workout Content */}
                      {expandedWorkouts.includes(workoutKey) && (
                        <div className="p-3 pt-0 space-y-3">
                          {workout.exercises.map((exercise, exerciseIndex) => (
                            <div
                              key={exerciseIndex}
                              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1 grid grid-cols-12 gap-3">
                                {/* Exercise Select */}
                                <div className="col-span-4">
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Exercício
                                  </label>
                                  <select
                                    value={exercise.exerciseId}
                                    onChange={(e) =>
                                      updateExercise(
                                        weekIndex,
                                        workoutIndex,
                                        exerciseIndex,
                                        'exerciseId',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary-500 outline-none"
                                  >
                                    <option value="">Selecione...</option>
                                    {sampleExercises.map((ex) => (
                                      <option key={ex.id} value={ex.id}>
                                        {ex.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Sets */}
                                <div className="col-span-2">
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Séries
                                  </label>
                                  <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) =>
                                      updateExercise(
                                        weekIndex,
                                        workoutIndex,
                                        exerciseIndex,
                                        'sets',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary-500 outline-none"
                                  />
                                </div>

                                {/* Reps */}
                                <div className="col-span-2">
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Reps
                                  </label>
                                  <input
                                    type="text"
                                    value={exercise.reps}
                                    onChange={(e) =>
                                      updateExercise(
                                        weekIndex,
                                        workoutIndex,
                                        exerciseIndex,
                                        'reps',
                                        e.target.value
                                      )
                                    }
                                    placeholder="10-12"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary-500 outline-none"
                                  />
                                </div>

                                {/* Rest */}
                                <div className="col-span-2">
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Descanso
                                  </label>
                                  <input
                                    type="number"
                                    value={exercise.rest}
                                    onChange={(e) =>
                                      updateExercise(
                                        weekIndex,
                                        workoutIndex,
                                        exerciseIndex,
                                        'rest',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    placeholder="60s"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary-500 outline-none"
                                  />
                                </div>

                                {/* Notes */}
                                <div className="col-span-2">
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Notas
                                  </label>
                                  <input
                                    type="text"
                                    value={exercise.notes}
                                    onChange={(e) =>
                                      updateExercise(
                                        weekIndex,
                                        workoutIndex,
                                        exerciseIndex,
                                        'notes',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Opcional"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-primary-500 outline-none"
                                  />
                                </div>
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  removeExercise(
                                    weekIndex,
                                    workoutIndex,
                                    exerciseIndex
                                  )
                                }
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}

                          {/* Add Exercise Button */}
                          <button
                            type="button"
                            onClick={() => addExercise(weekIndex, workoutIndex)}
                            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar Exercício
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {data.weeks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Configure o cronograma na etapa anterior para estruturar os treinos
          </p>
        </div>
      )}
    </div>
  );
}
