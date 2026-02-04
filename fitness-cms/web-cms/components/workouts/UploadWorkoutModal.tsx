'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface Student {
  id: string;
  displayName: string;
  email: string;
}

interface UploadWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainerId: string;
  student?: Student; // Pre-selected student
  students?: Student[]; // List of students to select from
}

export function UploadWorkoutModal({
  isOpen,
  onClose,
  onSuccess,
  trainerId,
  student,
  students = [],
}: UploadWorkoutModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(student?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState<number | ''>('');
  const [totalDays, setTotalDays] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFile = acceptedFiles[0];
    if (pdfFile) {
      if (pdfFile.type !== 'application/pdf') {
        setError('Apenas arquivos PDF são permitidos');
        return;
      }
      if (pdfFile.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setFile(pdfFile);
      setError(null);

      // Auto-fill title from filename if empty
      if (!title) {
        const fileName = pdfFile.name.replace('.pdf', '');
        setTitle(fileName);
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!file) {
      setError('Selecione um arquivo PDF');
      return;
    }

    const studentId = student?.id || selectedStudentId;
    if (!studentId) {
      setError('Selecione um aluno');
      return;
    }

    if (!title.trim()) {
      setError('Digite um título para o treino');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('trainerId', trainerId);
      formData.append('studentId', studentId);
      formData.append('title', title.trim());
      if (description) formData.append('description', description.trim());
      if (durationWeeks) formData.append('durationWeeks', String(durationWeeks));
      if (totalDays) formData.append('totalDays', String(totalDays));
      if (startDate) formData.append('startDate', startDate);

      const response = await fetch('/api/workouts', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar treino');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar treino');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setSelectedStudentId(student?.id || '');
      setTitle('');
      setDescription('');
      setDurationWeeks('');
      setTotalDays('');
      setStartDate('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Enviar Treino
            </h2>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success ? (
            <div className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Treino enviado com sucesso!
              </h3>
              <p className="text-gray-500">
                O aluno receberá uma notificação.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Student Selector (if not pre-selected) */}
              {!student && students.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aluno *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                    required
                  >
                    <option value="">Selecione um aluno</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pre-selected student display */}
              {student && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Enviando para</p>
                  <p className="font-medium text-gray-900">{student.displayName}</p>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo PDF *
                </label>
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">
                      {isDragActive
                        ? 'Solte o arquivo aqui'
                        : 'Arraste um PDF ou clique para selecionar'}
                    </p>
                    <p className="text-sm text-gray-400">Máximo 10MB</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <FileText className="h-10 w-10 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Treino *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treino de Hipertrofia - Semana 1"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruções ou observações para o aluno..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
              </div>

              {/* Duration and Days */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (semanas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="4"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total de dias
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={totalDays}
                    onChange={(e) => setTotalDays(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="28"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de início (opcional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Enviar Treino
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
