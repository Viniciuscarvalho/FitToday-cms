'use client';

import { useState } from 'react';
import { Crown, Zap, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { PLANS, PlanId } from '@/lib/constants';

interface PlatformSubscription {
  plan: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface PlanSubscriptionCardProps {
  subscription: PlatformSubscription;
  onUpgrade: (plan: 'pro' | 'elite') => Promise<void>;
  onCancel: () => Promise<void>;
  loading?: boolean;
}

export function PlanSubscriptionCard({
  subscription,
  onUpgrade,
  onCancel,
  loading = false,
}: PlanSubscriptionCardProps) {
  const [upgrading, setUpgrading] = useState<'pro' | 'elite' | null>(null);
  const [canceling, setCanceling] = useState(false);

  const currentPlan = PLANS[subscription.plan] ?? PLANS.starter;
  const isPaid = subscription.plan !== 'starter';
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const isPastDue = subscription.status === 'past_due';
  const isCanceling = subscription.cancelAtPeriodEnd && isActive;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const handleUpgrade = async (plan: 'pro' | 'elite') => {
    setUpgrading(plan);
    try {
      await onUpgrade(plan);
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar? Você continuará com acesso até o fim do período.')) return;
    setCanceling(true);
    try {
      await onCancel();
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Minha assinatura FitToday</h2>

      {/* Current plan badge */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm ${
            subscription.plan === 'elite'
              ? 'bg-purple-100 text-purple-700'
              : subscription.plan === 'pro'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {subscription.plan === 'elite' ? (
            <Crown className="h-4 w-4" />
          ) : subscription.plan === 'pro' ? (
            <Zap className="h-4 w-4" />
          ) : null}
          Plano {currentPlan.name}
          {isPaid && currentPlan.priceMonthly > 0 && (
            <span className="font-normal">
              — R${(currentPlan.priceMonthly / 100).toFixed(0).replace('.', ',')}/mês
            </span>
          )}
        </div>

        {isActive && isPaid && !isCanceling && (
          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Ativo
          </span>
        )}
        {isPastDue && (
          <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" />
            Pagamento pendente
          </span>
        )}
        {isCanceling && (
          <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
            <X className="h-3 w-3" />
            Cancelando
          </span>
        )}
      </div>

      {/* Renewal/cancellation info */}
      {isPaid && subscription.currentPeriodEnd && (
        <p className="text-sm text-gray-500 mb-4">
          {isCanceling
            ? `Acesso até ${formatDate(subscription.currentPeriodEnd)}`
            : `Renova em ${formatDate(subscription.currentPeriodEnd)}`}
        </p>
      )}

      {isPastDue && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 mb-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Houve um problema com seu pagamento. Por favor, atualize seu método de pagamento para
            continuar com acesso ao plano.
          </span>
        </div>
      )}

      {/* Upgrade CTAs for Starter */}
      {!isPaid && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={() => handleUpgrade('pro')}
            disabled={upgrading !== null}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {upgrading === 'pro' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Upgrade para Pro — R$97/mês
          </button>
          <button
            onClick={() => handleUpgrade('elite')}
            disabled={upgrading !== null}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {upgrading === 'elite' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            Upgrade para Elite — R$197/mês
          </button>
        </div>
      )}

      {/* Pro user: upgrade to Elite or cancel */}
      {subscription.plan === 'pro' && isActive && !isCanceling && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={() => handleUpgrade('elite')}
            disabled={upgrading !== null}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {upgrading === 'elite' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            Fazer upgrade para Elite
          </button>
          <button
            onClick={handleCancel}
            disabled={canceling}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            {canceling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cancelar assinatura
          </button>
        </div>
      )}

      {/* Elite: just cancel */}
      {subscription.plan === 'elite' && isActive && !isCanceling && (
        <button
          onClick={handleCancel}
          disabled={canceling}
          className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
        >
          {canceling ? 'Cancelando...' : 'Cancelar assinatura'}
        </button>
      )}
    </div>
  );
}
