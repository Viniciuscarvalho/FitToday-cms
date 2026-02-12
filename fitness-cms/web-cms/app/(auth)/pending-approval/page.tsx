'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Clock, CheckCircle, XCircle, LogOut, RefreshCw } from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, trainer, trainerStatus, loading, signOut, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (trainerStatus === 'active') {
        router.push('/');
      }
    }
  }, [user, trainerStatus, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleRefresh = async () => {
    await refreshUser();
    if (trainerStatus === 'active') {
      router.push('/');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getStatusContent = () => {
    switch (trainerStatus) {
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-50',
          title: 'Aguardando Aprovação',
          description:
            'Seu cadastro está sendo analisado pela nossa equipe. Você receberá uma notificação assim que for aprovado.',
          showRefresh: true,
        };
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          title: 'Cadastro Não Aprovado',
          description:
            trainer?.rejectionReason ||
            'Infelizmente seu cadastro não foi aprovado. Entre em contato com nosso suporte para mais informações.',
          showRefresh: false,
        };
      case 'suspended':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          title: 'Conta Suspensa',
          description:
            'Sua conta foi suspensa temporariamente. Entre em contato com nosso suporte para mais informações.',
          showRefresh: false,
        };
      default:
        return {
          icon: Clock,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-50',
          title: 'Verificando Status',
          description: 'Aguarde enquanto verificamos o status da sua conta.',
          showRefresh: true,
        };
    }
  };

  const statusContent = getStatusContent();
  const StatusIcon = statusContent.icon;

  return (
    <div className="text-center">
      {/* Status Icon */}
      <div
        className={`inline-flex items-center justify-center h-20 w-20 rounded-full ${statusContent.bgColor} mb-6`}
      >
        <StatusIcon className={`h-10 w-10 ${statusContent.iconColor}`} />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{statusContent.title}</h1>

      {/* Description */}
      <p className="text-gray-600 mb-8 max-w-sm mx-auto">{statusContent.description}</p>

      {/* User Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-lg">
                {(trainer?.displayName || user.displayName || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {trainer?.displayName || user.displayName || 'Usuário'}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {statusContent.showRefresh && (
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Verificar Status
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>

      {/* Help Link */}
      <p className="text-sm text-gray-500 mt-6">
        Precisa de ajuda?{' '}
        <a href="mailto:suporte@fittoday.com" className="text-primary-600 hover:text-primary-700">
          Entre em contato
        </a>
      </p>
    </div>
  );
}
