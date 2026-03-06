'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, Save, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { doc, updateDoc, Firestore } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

interface ProfileFormData {
  displayName: string;
  bio: string;
  specialties: string[];
  experience: number;
  instagram: string;
  youtube: string;
  city: string;
  state: string;
}

const specialtiesOptions = [
  'Musculação', 'Crossfit', 'Funcional', 'Pilates', 'Yoga',
  'Cardio', 'HIIT', 'Reabilitação', 'Emagrecimento', 'Hipertrofia',
  'Powerlifting', 'Calistenia',
];

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export default function ProfilePage() {
  const { user, trainer, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileFormData>({
    displayName: '',
    bio: '',
    specialties: [],
    experience: 0,
    instagram: '',
    youtube: '',
    city: '',
    state: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (trainer) {
      setForm({
        displayName: trainer.displayName || '',
        bio: trainer.profile?.bio || '',
        specialties: trainer.profile?.specialties || [],
        experience: trainer.profile?.experience || 0,
        instagram: trainer.profile?.socialMedia?.instagram || '',
        youtube: trainer.profile?.socialMedia?.youtube || '',
        city: trainer.profile?.location?.city || '',
        state: trainer.profile?.location?.state || '',
      });
    } else if (user) {
      setForm((prev) => ({ ...prev, displayName: user.displayName || '' }));
    }
  }, [trainer, user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setPhotoError('Apenas JPG, PNG ou GIF são permitidos');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setPhotoError('Imagem muito grande. Máximo 2MB');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;

    const { storage } = await import('@/lib/firebase');
    if (!storage) return null;

    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const ext = photoFile.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage as any, `users/${user.uid}/profile/avatar.${ext}`);
    await uploadBytes(storageRef, photoFile);
    return getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      let photoURL = user.photoURL;

      if (photoFile) {
        setUploadingPhoto(true);
        photoURL = await uploadAvatar();
        setUploadingPhoto(false);
      }

      const { db, auth } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase não configurado');

      // Update Firebase Auth profile
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: form.displayName,
          ...(photoURL ? { photoURL } : {}),
        });
      }

      // Update Firestore user document
      await updateDoc(doc(db as Firestore, 'users', user.uid), {
        displayName: form.displayName,
        ...(photoURL ? { photoURL } : {}),
        'profile.bio': form.bio,
        'profile.specialties': form.specialties,
        'profile.experience': form.experience,
        'profile.socialMedia.instagram': form.instagram,
        'profile.socialMedia.youtube': form.youtube,
        'profile.location.city': form.city,
        'profile.location.state': form.state,
        updatedAt: new Date(),
      });

      await refreshUser();
      setPhotoFile(null);
      setPhotoPreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const currentPhoto = photoPreview || user?.photoURL;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-500 mt-1">Gerencie suas informações pessoais e como você aparece na plataforma</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={form.displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-3xl font-semibold text-primary-700">
                  {form.displayName[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-gray-600" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Foto de perfil</h3>
            <p className="text-sm text-gray-500">JPG, PNG ou GIF. Máximo 2MB.</p>
            {photoPreview && (
              <p className="text-xs text-primary-600 mt-1">Nova foto selecionada — salve para confirmar</p>
            )}
            {photoError && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <AlertCircle className="h-3 w-3" />
                {photoError}
              </p>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="Seu nome completo"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Biografia</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            rows={4}
            placeholder="Conte sobre sua experiência e metodologia..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
          />
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Anos de experiência</label>
          <input
            type="number"
            min="0"
            max="50"
            value={form.experience}
            onChange={(e) => setForm((prev) => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
            placeholder="0"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>

        {/* Specialties */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
          <div className="flex flex-wrap gap-2">
            {specialtiesOptions.map((spec) => {
              const selected = form.specialties.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? form.specialties.filter((s) => s !== spec)
                      : [...form.specialties, spec];
                    setForm((prev) => ({ ...prev, specialties: next }));
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selected
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-primary-400'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Sua cidade"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="UF"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setForm((prev) => ({ ...prev, instagram: e.target.value }))}
              placeholder="@username"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
            <input
              type="text"
              value={form.youtube}
              onChange={(e) => setForm((prev) => ({ ...prev, youtube: e.target.value }))}
              placeholder="Canal ou @username"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? 'Salvo!' : 'Salvar perfil'}
          </button>
        </div>
      </div>
    </div>
  );
}
