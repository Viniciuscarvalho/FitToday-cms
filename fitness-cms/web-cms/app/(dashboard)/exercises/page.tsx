'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Dumbbell,
  Play,
  Edit2,
  Trash2,
  X,
  Upload,
  Save,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Firestore,
} from 'firebase/firestore';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  category: string;
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  imageUrl?: string;
  instructions: string[];
  tips: string[];
  trainerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const muscleGroups = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Core',
  'Quadríceps',
  'Posteriores',
  'Glúteos',
  'Panturrilha',
  'Corpo Inteiro',
];

const categories = [
  'Força',
  'Hipertrofia',
  'Resistência',
  'Cardio',
  'Flexibilidade',
  'Funcional',
  'Pliometria',
  'Isometria',
];

const equipmentOptions = [
  'Peso Corporal',
  'Halteres',
  'Barra',
  'Kettlebell',
  'Máquina',
  'Cabo',
  'Elástico',
  'Bola',
  'TRX',
  'Anilha',
  'Banco',
  'Barra Fixa',
];

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    muscleGroup: '',
    category: '',
    equipment: [] as string[],
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    videoUrl: '',
    imageUrl: '',
    instructions: [''],
    tips: [''],
    isPublic: false,
  });

  useEffect(() => {
    loadExercises();
  }, [user]);

  const loadExercises = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      // Get trainer's own exercises and public exercises
      const exercisesRef = collection(db as Firestore, 'exercises');
      const q = query(
        exercisesRef,
        where('trainerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const exerciseList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Exercise[];

      setExercises(exerciseList);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscleGroup =
      !selectedMuscleGroup || exercise.muscleGroup === selectedMuscleGroup;
    const matchesCategory =
      !selectedCategory || exercise.category === selectedCategory;

    return matchesSearch && matchesMuscleGroup && matchesCategory;
  });

  const openModal = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name,
        description: exercise.description,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        videoUrl: exercise.videoUrl || '',
        imageUrl: exercise.imageUrl || '',
        instructions: exercise.instructions.length > 0 ? exercise.instructions : [''],
        tips: exercise.tips.length > 0 ? exercise.tips : [''],
        isPublic: exercise.isPublic,
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: '',
        description: '',
        muscleGroup: '',
        category: '',
        equipment: [],
        difficulty: 'intermediate',
        videoUrl: '',
        imageUrl: '',
        instructions: [''],
        tips: [''],
        isPublic: false,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExercise(null);
  };

  const handleSave = async () => {
    if (!user || !formData.name || !formData.muscleGroup || !formData.category) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase not configured');

      const exerciseData = {
        ...formData,
        instructions: formData.instructions.filter((i) => i.trim()),
        tips: formData.tips.filter((t) => t.trim()),
        trainerId: user.uid,
        updatedAt: new Date(),
      };

      if (editingExercise) {
        // Update existing exercise
        await updateDoc(doc(db as Firestore, 'exercises', editingExercise.id), exerciseData);
      } else {
        // Create new exercise
        await addDoc(collection(db as Firestore, 'exercises'), {
          ...exerciseData,
          createdAt: new Date(),
        });
      }

      closeModal();
      loadExercises();
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Erro ao salvar exercício');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exercise: Exercise) => {
    if (!confirm(`Tem certeza que deseja excluir "${exercise.name}"?`)) return;

    try {
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase not configured');

      await deleteDoc(doc(db as Firestore, 'exercises', exercise.id));
      loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Erro ao excluir exercício');
    }
  };

  const addInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const addTip = () => {
    setFormData((prev) => ({
      ...prev,
      tips: [...prev.tips, ''],
    }));
  };

  const updateTip = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tips: prev.tips.map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeTip = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index),
    }));
  };

  const toggleEquipment = (equipment: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Exercícios</h1>
          <p className="text-gray-500 mt-1">
            Gerencie seus exercícios personalizados
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Novo Exercício
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar exercícios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            Filtros
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo Muscular
              </label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos os grupos</option>
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum exercício encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedMuscleGroup || selectedCategory
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro exercício personalizado'}
          </p>
          {!searchTerm && !selectedMuscleGroup && !selectedCategory && (
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Criar Exercício
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Exercise Image/Video Placeholder */}
              <div className="aspect-video bg-gray-100 relative">
                {exercise.imageUrl ? (
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Dumbbell className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                {exercise.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="h-6 w-6 text-gray-900 ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Exercise Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      difficultyColors[exercise.difficulty]
                    }`}
                  >
                    {difficultyLabels[exercise.difficulty]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {exercise.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {exercise.muscleGroup}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    {exercise.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openModal(exercise)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(exercise)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={closeModal}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Exercício *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Ex: Supino Reto com Barra"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                      placeholder="Descreva o exercício..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grupo Muscular *
                    </label>
                    <select
                      value={formData.muscleGroup}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, muscleGroup: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Selecione...</option>
                      {muscleGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Selecione...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dificuldade
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="beginner">Iniciante</option>
                      <option value="intermediate">Intermediário</option>
                      <option value="advanced">Avançado</option>
                    </select>
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipamentos Necessários
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {equipmentOptions.map((equipment) => (
                      <button
                        key={equipment}
                        type="button"
                        onClick={() => toggleEquipment(equipment)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          formData.equipment.includes(equipment)
                            ? 'bg-primary-100 border-primary-500 text-primary-700'
                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {equipment}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Imagem
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                        }
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        <Upload className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do Vídeo
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
                      }
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruções de Execução
                  </label>
                  <div className="space-y-2">
                    {formData.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="flex-shrink-0 w-6 h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={instruction}
                          onChange={(e) => updateInstruction(index, e.target.value)}
                          placeholder={`Passo ${index + 1}...`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        {formData.instructions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInstruction(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addInstruction}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Adicionar passo
                    </button>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dicas e Observações
                  </label>
                  <div className="space-y-2">
                    {formData.tips.map((tip, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={tip}
                          onChange={(e) => updateTip(index, e.target.value)}
                          placeholder="Dica..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        {formData.tips.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTip(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTip}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Adicionar dica
                    </button>
                  </div>
                </div>

                {/* Public Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Tornar este exercício público (outros treinadores poderão usar)
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingExercise ? 'Salvar Alterações' : 'Criar Exercício'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
