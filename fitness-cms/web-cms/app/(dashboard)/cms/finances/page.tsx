'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { PlanSubscriptionCard } from '@/components/finances/PlanSubscriptionCard';
import { PlanComparisonTable } from '@/components/finances/PlanComparisonTable';
import { StudentRevenueTracker } from '@/components/finances/StudentRevenueTracker';
import type { PlanId } from '@/lib/constants';

interface PlatformSubscription {
  plan: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function FinancesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<PlatformSubscription>({
    plan: 'starter',
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [banner, setBanner] = useState<'success' | 'canceled' | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/platform-subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription({
          plan: data.plan || 'starter',
          status: data.status || null,
          currentPeriodEnd: data.currentPeriodEnd || null,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoadingSubscription(false);
    }
  }, [user]);

  useEffect(() => {
    if (user !== undefined) {
      fetchSubscription();
    }
  }, [user?.uid]);

  // Show banner on return from Stripe Checkout
  useEffect(() => {
    const success = searchParams.get('subscription_success');
    const canceled = searchParams.get('subscription_canceled');

    if (success === 'true') {
      setBanner('success');
      // Refetch subscription (webhook may take a moment)
      setTimeout(() => fetchSubscription(), 3000);
    } else if (canceled === 'true') {
      setBanner('canceled');
    }
  }, [searchParams]);

  const handleUpgrade = async (plan: 'pro' | 'elite') => {
    if (!user) return;

    const token = await user.getIdToken();
    const res = await fetch('/api/stripe/platform-checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (data.error) {
      alert(`Erro: ${data.error}`);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    }
  };

  const handleCancel = async () => {
    if (!user) return;

    const token = await user.getIdToken();
    const res = await fetch('/api/stripe/platform-subscription', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (data.error) {
      alert(`Erro: ${data.error}`);
      return;
    }

    await fetchSubscription();
  };

  if (!user) {
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
          <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>
          <p className="text-gray-500 mt-1">Gerencie sua assinatura e controle sua receita</p>
        </div>
        <button
          onClick={() => { setLoadingSubscription(true); fetchSubscription(); }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Return banners from Stripe */}
      {banner === 'success' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-900">Assinatura confirmada!</p>
            <p className="text-sm text-green-700">
              Seu plano será atualizado em instantes. Se não atualizar, clique em Atualizar acima.
            </p>
          </div>
        </div>
      )}

      {banner === 'canceled' && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            O processo de assinatura foi cancelado. Nenhuma cobrança foi feita.
          </p>
        </div>
      )}

      {/* Section A: Platform subscription */}
      <PlanSubscriptionCard
        subscription={subscription}
        onUpgrade={handleUpgrade}
        onCancel={handleCancel}
        loading={loadingSubscription}
      />

      {/* Plan comparison table */}
      <PlanComparisonTable currentPlan={subscription.plan} />

      {/* Section B: Student & revenue tracking */}
      <StudentRevenueTracker trainerId={user.uid} />

      {/* Note about Stripe Connect */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Sobre comissões e vendas de programas</p>
            <p>
              A venda de programas diretamente pela plataforma (com cobrança automática de alunos) é
              um recurso futuro. Por enquanto, use o controle manual acima para registrar sua receita.
              A taxa de comissão exibida no plano se aplicará quando esse recurso for ativado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
