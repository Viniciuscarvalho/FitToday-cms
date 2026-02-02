'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { doc, getDoc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';

// Step Components
import { BasicInfoStep } from '@/components/program-builder/BasicInfoStep';
import { MediaStep } from '@/components/program-builder/MediaStep';
import { ScheduleStep } from '@/components/program-builder/ScheduleStep';
import { WorkoutsStep } from '@/components/program-builder/WorkoutsStep';
import { PricingStep } from '@/components/program-builder/PricingStep';
import { ProgramFormData } from '../../new/page';

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
  previewVideo: '',
  durationWeeks: 8,
  workoutsPerWeek: 4,
  averageWorkoutDuration: 60,
  weeks: [],
  price: 0,
  originalPrice: 0,
  currency: 'BRL',
};

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProgramFormData>(initialFormData);
  const [originalStatus, setOriginalStatus] = useState<string>('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load program data
  useEffect(() => {
    const loadProgram = async () => {
      if (!programId || !user) return;

      try {
        const { db } = await import('@/lib/firebase');
        if (!db) throw new Error('Firebase not configured');

        const programDoc = await getDoc(doc(db as Firestore, 'programs', programId));

        if (!programDoc.exists()) {
          alert('Programa não encontrado');
          router.push('/programs');
          return;
        }

        const data = programDoc.data();

        // Verify ownership
        if (data.trainerId !== user.uid) {
          alert('Você não tem permissão para editar este programa');
          router.push('/programs');
          return;
        }

        setOriginalStatus(data.status || 'draft');
        // Convert Firestore WorkoutProgram format to form data
        setFormData({
          name: data.title || data.name || '',
          description: data.description || '',
          category: data.category || '',
          difficulty: data.difficulty || 'intermediate',
          targetAudience: data.requirements?.prerequisites || data.targetAudience || '',
          goals: data.tags || data.goals || [],
          coverImage: data.coverImageURL || data.coverImage || '',
          previewVideo: data.previewVideoURL || data.previewVideo || '',
          durationWeeks: data.duration?.weeks || data.durationWeeks || 8,
          workoutsPerWeek: data.duration?.daysPerWeek || data.workoutsPerWeek || 4,
          averageWorkoutDuration: data.duration?.avgSessionMinutes || data.averageWorkoutDuration || 60,
          weeks: data.weeks || [],
          price: data.pricing?.price || data.price || 0,
          originalPrice: data.pricing?.originalPrice || data.originalPrice || 0,
          currency: data.pricing?.currency || data.currency || 'BRL',
        });
      } catch (error) {
        console.error('Error loading program:', error);
        alert('Erro ao carregar programa');
        router.push('/programs');
      } finally {
        setLoading(false);
      }
    };

    loadProgram();
  }, [programId, user, router]);

  const updateFormData = (data: Partial<ProgramFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    const newErrors = { ...errors };
    Object.keys(data).forEach((key) => delete newErrors[key]);
    setErrors(newErrors);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
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
      case 2:
        if (formData.durationWeeks < 1) {
          newErrors.durationWeeks = 'Duração deve ser pelo menos 1 semana';
        }
        if (formData.workoutsPerWeek < 1 || formData.workoutsPerWeek > 7) {
          newErrors.workoutsPerWeek = 'Treinos por semana deve ser entre 1 e 7';
        }
        break;
      case 4:
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

  // Convert form data to Firestore WorkoutProgram format
  const formToFirestore = (status: string) => ({
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
      currency: formData.currency as 'BRL' | 'USD',
      originalPrice: formData.originalPrice || undefined,
    },
    weeks: formData.weeks,
    status,
    updatedAt: new Date(),
    ...(status === 'published' && originalStatus !== 'published'
      ? { publishedAt: new Date() }
      : {}),
  });

  const handleSave = async (newStatus?: string) => {
    if (!user || !programId) return;

    try {
      setSaving(true);
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase not configured');

      await updateDoc(
        doc(db as Firestore, 'programs', programId),
        formToFirestore(newStatus || originalStatus)
      );

      router.push('/programs');
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Erro ao salvar programa');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    const newStatus = originalStatus === 'published' ? 'draft' : 'published';

    if (newStatus === 'published') {
      // Validate all steps before publishing
      for (let i = 0; i <= 4; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i);
          return;
        }
      }
    }

    await handleSave(newStatus);
  };

  const handleDelete = async () => {
    if (!user || !programId) return;

    try {
      setDeleting(true);
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase not configured');

      await deleteDoc(doc(db as Firestore, 'programs', programId));
      router.push('/programs');
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Erro ao excluir programa');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-gray-500">Carregando programa...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Programa</h1>
            <p className="text-gray-500 mt-1">
              Atualize as informações do seu programa de treino
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                originalStatus === 'published'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {originalStatus === 'published' ? 'Publicado' : 'Rascunho'}
            </span>
          </div>
        </div>
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
                  onClick={() => setCurrentStep(index)}
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
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </button>

          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
              originalStatus === 'published'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : originalStatus === 'published' ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {originalStatus === 'published' ? 'Despublicar' : 'Publicar'}
          </button>

          {currentStep < steps.length - 1 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Excluir programa?
            </h3>
            <p className="text-gray-500 mb-6">
              Esta ação não pode ser desfeita. Todos os dados do programa serão
              permanentemente removidos.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
