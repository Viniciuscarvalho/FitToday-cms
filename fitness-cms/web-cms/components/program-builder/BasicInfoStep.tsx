'use client';

import { ProgramFormData } from '@/app/(dashboard)/cms/programs/new/page';

interface BasicInfoStepProps {
  data: ProgramFormData;
  onChange: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
}

const categories = [
  { value: 'hypertrophy', label: 'Hipertrofia' },
  { value: 'strength', label: 'Força' },
  { value: 'weight_loss', label: 'Emagrecimento' },
  { value: 'conditioning', label: 'Condicionamento' },
  { value: 'functional', label: 'Funcional' },
  { value: 'sports', label: 'Esportivo' },
  { value: 'rehabilitation', label: 'Reabilitação' },
  { value: 'mobility', label: 'Mobilidade' },
];

const difficulties = [
  { value: 'beginner', label: 'Iniciante', description: 'Para quem está começando' },
  { value: 'intermediate', label: 'Intermediário', description: 'Experiência moderada' },
  { value: 'advanced', label: 'Avançado', description: 'Alta experiência' },
];

const commonGoals = [
  'Ganho de massa muscular',
  'Perda de gordura',
  'Aumento de força',
  'Melhora do condicionamento',
  'Definição muscular',
  'Flexibilidade',
  'Saúde geral',
  'Performance esportiva',
];

export function BasicInfoStep({ data, onChange, errors }: BasicInfoStepProps) {
  const toggleGoal = (goal: string) => {
    const newGoals = data.goals.includes(goal)
      ? data.goals.filter((g) => g !== goal)
      : [...data.goals, goal];
    onChange({ goals: newGoals });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Informações Básicas
        </h2>
        <p className="text-gray-500 mb-6">
          Defina as informações essenciais do seu programa de treino
        </p>
      </div>

      {/* Program Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Programa <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex: Treino de Hipertrofia 12 Semanas"
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all`}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Descreva o que o aluno vai aprender e os resultados esperados..."
          rows={4}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none`}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {data.description.length}/500 caracteres
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria <span className="text-red-500">*</span>
        </label>
        <select
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all`}
        >
          <option value="">Selecione uma categoria</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category}</p>
        )}
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nível de Dificuldade
        </label>
        <div className="grid grid-cols-3 gap-4">
          {difficulties.map((diff) => (
            <button
              key={diff.value}
              type="button"
              onClick={() =>
                onChange({
                  difficulty: diff.value as 'beginner' | 'intermediate' | 'advanced',
                })
              }
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                data.difficulty === diff.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">{diff.label}</p>
              <p className="text-xs text-gray-500 mt-1">{diff.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Público Alvo
        </label>
        <input
          type="text"
          value={data.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          placeholder="Ex: Homens e mulheres que querem ganhar massa muscular"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
      </div>

      {/* Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objetivos do Programa
        </label>
        <div className="flex flex-wrap gap-2">
          {commonGoals.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                data.goals.includes(goal)
                  ? 'bg-primary-100 text-primary-700 border-primary-300 border'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
