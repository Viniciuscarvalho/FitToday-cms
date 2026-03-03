'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExerciseForm,
  ExerciseFormValues,
  formValuesToPayload,
} from '@/components/exercises/ExerciseForm';
import { apiRequest } from '@/lib/api-client';

export default function NewExercisePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: object) =>
      apiRequest('/api/exercises', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      router.push('/cms/exercises');
    },
  });

  const handleSubmit = async (values: ExerciseFormValues) => {
    const payload = formValuesToPayload(values);
    await createMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/cms/exercises"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Exercício</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Adicione um exercício ao catálogo do seu personal
          </p>
        </div>
      </div>

      {/* Form */}
      <ExerciseForm
        onSubmit={handleSubmit}
        submitLabel={createMutation.isPending ? 'Salvando...' : 'Criar Exercício'}
        isLoading={createMutation.isPending}
      />

      {/* Error feedback */}
      {createMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Ocorreu um erro ao criar o exercício. Verifique os dados e tente novamente.
        </div>
      )}
    </div>
  );
}
