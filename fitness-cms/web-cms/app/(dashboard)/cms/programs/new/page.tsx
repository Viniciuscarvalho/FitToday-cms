'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Image,
  Calendar,
  Dumbbell,
  DollarSign,
  Save,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/api-client';

// Step Components
import { BasicInfoStep } from '@/components/program-builder/BasicInfoStep';
import { MediaStep } from '@/components/program-builder/MediaStep';
import { ScheduleStep } from '@/components/program-builder/ScheduleStep';
import { WorkoutsStep } from '@/components/program-builder/WorkoutsStep';
import { PricingStep } from '@/components/program-builder/PricingStep';

export interface ProgramFormData {
  // Basic Info
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: string;
  goals: string[];

  // Media
  coverImage: string;
  coverImageFile: File | null;
  previewVideo: string;
  previewVideoFile: File | null;
  workoutPdfUrl: string;
  workoutPdfFile: File | null;

  // Schedule
  durationWeeks: number;
  workoutsPerWeek: number;
  averageWorkoutDuration: number;

  // Workouts (simplified for now)
  weeks: {
    weekNumber: number;
    name: string;
    workouts: {
      dayOfWeek: number;
      name: string;
      exercises: {
        exerciseId: string;
        exerciseName: string;
        sets: number;
        reps: string;
        rest: number;
        notes: string;
      }[];
    }[];
  }[];

  // Pricing
  price: number;
  originalPrice: number;
  currency: string;
}

const steps = [
  { id: 'basic', name: 'Informações Básicas', icon: FileText },
  { id: 'media', name: 'Mídia', icon: Image },
  { id: 'schedule', name: 'Cronograma', icon: Calendar },
  { id: 'workouts', name: 'Treinos', icon: Dumbbell },
  { id: 'pricing', name: 'Preço', icon: DollarSign },
];

const initialFormData: ProgramFormData = {
  name: '',
  description: '',
  category: '',
  difficulty: 'intermediate',
  targetAudience: '',
  goals: [],
  coverImage: '',
  coverImageFile: null,
  previewVideo: '',
  previewVideoFile: null,
  workoutPdfUrl: '',
  workoutPdfFile: null,
  durationWeeks: 8,
  workoutsPerWeek: 4,
  averageWorkoutDuration: 60,
  weeks: [],
  price: 0,
  originalPrice: 0,
  currency: 'BRL',
};

export default function NewProgramPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProgramFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (data: Partial<ProgramFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear errors for updated fields
    const newErrors = { ...errors };
    Object.keys(data).forEach((key) => delete newErrors[key]);
    setErrors(newErrors);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = 'Nome do programa é obrigatório';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Descrição é obrigatória';
        }
        if (!formData.category) {
          newErrors.category = 'Categoria é obrigatória';
        }
        break;
      case 1: // Media
        // Media is optional
        break;
      case 2: // Schedule
        if (formData.durationWeeks < 1) {
          newErrors.durationWeeks = 'Duração deve ser pelo menos 1 semana';
        }
        if (formData.workoutsPerWeek < 1 || formData.workoutsPerWeek > 7) {
          newErrors.workoutsPerWeek = 'Treinos por semana deve ser entre 1 e 7';
        }
        break;
      case 3: // Workouts
        // Workouts validation can be more complex
        break;
      case 4: // Pricing
        if (formData.price < 0) {
          newErrors.price = 'Preço não pode ser negativo';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Convert form data to API request body
  const formToApiBody = (status: 'draft' | 'published') => ({
    title: formData.name,
    description: formData.description,
    coverImageURL: formData.coverImage,
    previewVideoURL: formData.previewVideo,
    category: formData.category,
    tags: formData.goals,
    difficulty: formData.difficulty,
    duration: {
      weeks: formData.durationWeeks,
      daysPerWeek: formData.workoutsPerWeek,
      avgSessionMinutes: formData.averageWorkoutDuration,
    },
    requirements: {
      equipment: [],
      fitnessLevel: formData.difficulty,
      prerequisites: formData.targetAudience,
    },
    content: {
      totalWorkouts: formData.weeks.reduce((acc, w) => acc + w.workouts.length, 0),
      totalExercises: formData.weeks.reduce(
        (acc, w) => acc + w.workouts.reduce((a, wo) => a + wo.exercises.length, 0),
        0
      ),
      includesNutrition: false,
      includesSupplements: false,
      hasVideoGuides: !!formData.previewVideo,
    },
    pricing: {
      type: 'one_time' as const,
      price: formData.price,
      currency: formData.currency,
      ...(formData.originalPrice ? { originalPrice: formData.originalPrice } : {}),
    },
    weeks: formData.weeks,
    status,
    visibility: 'public',
  });

  const saveProgram = async (status: 'draft' | 'published') => {
    if (!user) return;

    try {
      setSaving(true);

      const body = formToApiBody(status);
      const hasFiles = formData.coverImageFile || formData.workoutPdfFile || formData.previewVideoFile;

      if (hasFiles) {
        const fd = new FormData();
        fd.append('data', JSON.stringify(body));
        if (formData.coverImageFile) fd.append('cover', formData.coverImageFile);
        if (formData.workoutPdfFile) fd.append('pdf', formData.workoutPdfFile);
        if (formData.previewVideoFile) fd.append('video', formData.previewVideoFile);

        await apiRequest('/api/programs', {
          method: 'POST',
          body: fd,
        });
      } else {
        await apiRequest('/api/programs', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      router.push('/cms/programs');
    } catch (error: any) {
      console.error('Error saving program:', error);
      alert(error.message || 'Erro ao salvar programa');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    await saveProgram('draft');
  };

  const handlePublish = async () => {
    if (!user) return;

    // Validate all steps
    for (let i = 0; i <= currentStep; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    await saveProgram('published');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            data={formData}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 1:
        return (
          <MediaStep
            data={formData}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <ScheduleStep
            data={formData}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <WorkoutsStep
            data={formData}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <PricingStep
            data={formData}
            onChange={updateFormData}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Criar Novo Programa</h1>
        <p className="text-gray-500 mt-1">
          Preencha as informações para criar seu programa de treino
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 ${index !== steps.length - 1 ? 'pr-4' : ''}`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    index < currentStep
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : index === currentStep
                        ? 'border-primary-600 text-primary-600'
                        : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </button>
                {index !== steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ml-4 ${
                      index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <p
                className={`mt-2 text-xs font-medium ${
                  index <= currentStep ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {step.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Rascunho
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Publicar Programa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
