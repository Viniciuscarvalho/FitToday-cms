'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Loader2,
  Save,
  Camera,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { doc, updateDoc, Firestore } from 'firebase/firestore';

type SettingsTab = 'profile' | 'notifications' | 'billing' | 'security';

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

interface NotificationSettings {
  emailNewStudent: boolean;
  emailCheckIn: boolean;
  emailPayment: boolean;
  pushNewStudent: boolean;
  pushCheckIn: boolean;
  pushMessage: boolean;
}

const tabs = [
  { id: 'profile', name: 'Perfil', icon: User },
  { id: 'notifications', name: 'Notificações', icon: Bell },
  { id: 'billing', name: 'Faturamento', icon: CreditCard },
  { id: 'security', name: 'Segurança', icon: Shield },
];

const specialtiesOptions = [
  'Musculação',
  'Crossfit',
  'Funcional',
  'Pilates',
  'Yoga',
  'Cardio',
  'HIIT',
  'Reabilitação',
  'Emagrecimento',
  'Hipertrofia',
  'Powerlifting',
  'Calistenia',
];

export default function SettingsPage() {
  const { user, trainer, refreshTrainer } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    displayName: '',
    bio: '',
    specialties: [],
    experience: 0,
    instagram: '',
    youtube: '',
    city: '',
    state: '',
  });

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNewStudent: true,
    emailCheckIn: true,
    emailPayment: true,
    pushNewStudent: true,
    pushCheckIn: true,
    pushMessage: true,
  });

  // Load user data
  useEffect(() => {
    if (trainer) {
      setProfileForm({
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
      setProfileForm((prev) => ({
        ...prev,
        displayName: user.displayName || '',
      }));
    }
  }, [trainer, user]);

  const handleProfileChange = (field: keyof ProfileFormData, value: string | number | string[]) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = profileForm.specialties.includes(specialty)
      ? profileForm.specialties.filter((s) => s !== specialty)
      : [...profileForm.specialties, specialty];
    handleProfileChange('specialties', newSpecialties);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase not configured');

      await updateDoc(doc(db as Firestore, 'users', user.uid), {
        displayName: profileForm.displayName,
        'profile.bio': profileForm.bio,
        'profile.specialties': profileForm.specialties,
        'profile.experience': profileForm.experience,
        'profile.socialMedia.instagram': profileForm.instagram,
        'profile.socialMedia.youtube': profileForm.youtube,
        'profile.location.city': profileForm.city,
        'profile.location.state': profileForm.state,
        updatedAt: new Date(),
      });

      await refreshTrainer();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error('Firebase not configured');

      await updateDoc(doc(db as Firestore, 'users', user.uid), {
        'settings.notifications': notifications,
        updatedAt: new Date(),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving notifications:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={profileForm.displayName}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-3xl font-semibold text-primary-700">
                {profileForm.displayName[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50">
            <Camera className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Foto de perfil</h3>
          <p className="text-sm text-gray-500">
            JPG, PNG ou GIF. Máximo 2MB.
          </p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome completo
        </label>
        <input
          type="text"
          value={profileForm.displayName}
          onChange={(e) => handleProfileChange('displayName', e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          value={profileForm.bio}
          onChange={(e) => handleProfileChange('bio', e.target.value)}
          rows={4}
          placeholder="Conte um pouco sobre você e sua experiência..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          {profileForm.bio.length}/500 caracteres
        </p>
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anos de experiência
        </label>
        <input
          type="number"
          min="0"
          value={profileForm.experience}
          onChange={(e) =>
            handleProfileChange('experience', parseInt(e.target.value) || 0)
          }
          className="w-32 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
        />
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Especialidades
        </label>
        <div className="flex flex-wrap gap-2">
          {specialtiesOptions.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                profileForm.specialties.includes(specialty)
                  ? 'bg-primary-100 text-primary-700 border-primary-300 border'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* Social Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              @
            </span>
            <input
              type="text"
              value={profileForm.instagram}
              onChange={(e) => handleProfileChange('instagram', e.target.value)}
              placeholder="seuusuario"
              className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube
          </label>
          <input
            type="text"
            value={profileForm.youtube}
            onChange={(e) => handleProfileChange('youtube', e.target.value)}
            placeholder="URL do canal"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cidade
          </label>
          <input
            type="text"
            value={profileForm.city}
            onChange={(e) => handleProfileChange('city', e.target.value)}
            placeholder="Sua cidade"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <input
            type="text"
            value={profileForm.state}
            onChange={(e) => handleProfileChange('state', e.target.value)}
            placeholder="UF"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        {saved && (
          <span className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            Salvo com sucesso
          </span>
        )}
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar alterações
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notificações por Email
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div>
              <p className="font-medium text-gray-900">Novo aluno</p>
              <p className="text-sm text-gray-500">
                Receba um email quando um aluno se inscrever
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailNewStudent}
              onChange={(e) =>
                setNotifications((prev) => ({
                  ...prev,
                  emailNewStudent: e.target.checked,
                }))
              }
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div>
              <p className="font-medium text-gray-900">Check-in semanal</p>
              <p className="text-sm text-gray-500">
                Receba um email quando um aluno enviar check-in
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailCheckIn}
              onChange={(e) =>
                setNotifications((prev) => ({
                  ...prev,
                  emailCheckIn: e.target.checked,
                }))
              }
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div>
              <p className="font-medium text-gray-900">Pagamentos</p>
              <p className="text-sm text-gray-500">
                Receba um email sobre transações e pagamentos
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailPayment}
              onChange={(e) =>
                setNotifications((prev) => ({
                  ...prev,
                  emailPayment: e.target.checked,
                }))
              }
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notificações Push
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div>
              <p className="font-medium text-gray-900">Novo aluno</p>
              <p className="text-sm text-gray-500">
                Receba uma notificação quando um aluno se inscrever
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.pushNewStudent}
              onChange={(e) =>
                setNotifications((prev) => ({
                  ...prev,
                  pushNewStudent: e.target.checked,
                }))
              }
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div>
              <p className="font-medium text-gray-900">Check-in</p>
              <p className="text-sm text-gray-500">
                Receba uma notificação quando um aluno enviar check-in
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.pushCheckIn}
              onChange={(e) =>
                setNotifications((prev) => ({
                  ...prev,
                  pushCheckIn: e.target.checked,
                }))
              }
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <div>
              <p className="font-medium text-gray-900">Mensagens</p>
              <p className="text-sm text-gray-500">
                Receba uma notificação para novas mensagens
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications.pushMessage}
              onChange={(e) =>
                setNotifications((prev) => ({
                  ...prev,
                  pushMessage: e.target.checked,
                }))
              }
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        {saved && (
          <span className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            Salvo com sucesso
          </span>
        )}
        <button
          onClick={handleSaveNotifications}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar alterações
        </button>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      {/* Stripe Connect Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Stripe Connect
            </h3>
            <p className="text-sm text-gray-500">
              Conecte sua conta Stripe para receber pagamentos
            </p>
          </div>
          {trainer?.financial?.stripeAccountId ? (
            <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Check className="h-4 w-4" />
              Conectado
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              Não conectado
            </span>
          )}
        </div>
        {!trainer?.financial?.stripeAccountId && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <ExternalLink className="h-4 w-4" />
            Conectar conta Stripe
          </button>
        )}
      </div>

      {/* Earnings Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resumo de Ganhos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total ganho</p>
            <p className="text-2xl font-bold text-gray-900">
              R$ {(trainer?.financial?.totalEarnings || 0).toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Disponível para saque</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {(trainer?.financial?.availableBalance || 0).toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">
              R$ {(trainer?.financial?.pendingBalance || 0).toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>

      {/* Commission Rate */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Taxa da Plataforma
        </h3>
        <p className="text-blue-700">
          A taxa atual da plataforma é de <strong>10%</strong> sobre cada venda.
          Você recebe 90% do valor de cada programa vendido.
        </p>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <div className="flex items-center gap-4">
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
          />
          <button className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium">
            Alterar
          </button>
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Senha
        </label>
        <div className="flex items-center gap-4">
          <input
            type="password"
            value="••••••••••••"
            disabled
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
          />
          <button className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium">
            Alterar
          </button>
        </div>
      </div>

      {/* Two Factor */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">
              Autenticação de dois fatores
            </h4>
            <p className="text-sm text-gray-500">
              Adicione uma camada extra de segurança à sua conta
            </p>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Ativar
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Sessões ativas</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Navegador atual</p>
              <p className="text-sm text-gray-500">
                Chrome em macOS • São Paulo, BR
              </p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
              Atual
            </span>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="font-medium text-red-600 mb-2">Zona de perigo</h4>
        <p className="text-sm text-gray-500 mb-4">
          Uma vez que você exclua sua conta, não há como voltar atrás. Por favor,
          tenha certeza.
        </p>
        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
          Excluir minha conta
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'billing':
        return renderBillingTab();
      case 'security':
        return renderSecurityTab();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">
          Gerencie suas preferências e configurações de conta
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <nav className="w-full md:w-56 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon
                className={`h-5 w-5 ${
                  activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
