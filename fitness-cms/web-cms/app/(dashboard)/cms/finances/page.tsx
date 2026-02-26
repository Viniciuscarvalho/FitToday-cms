'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Firestore,
  doc,
  setDoc,
} from 'firebase/firestore';

interface Transaction {
  id: string;
  type: 'sale' | 'payout' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  programName?: string;
  studentName?: string;
  createdAt: Date;
}

interface FinanceStats {
  balance: number;
  pendingBalance: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  totalEarnings: number;
  totalPayouts: number;
  nextPayoutDate?: Date;
  nextPayoutAmount?: number;
}

interface PayoutHistory {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  paidAt: Date;
  arrivalDate: Date;
}

interface StripeAccountStatus {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
  email?: string;
}

export default function FinancesPage() {
  const { user, trainer } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus>({
    connected: false,
    onboardingComplete: false,
    chargesEnabled: false,
    payoutsEnabled: false,
  });
  const [stats, setStats] = useState<FinanceStats>({
    balance: 0,
    pendingBalance: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowth: 0,
    totalEarnings: 0,
    totalPayouts: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadFinanceData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check Stripe status if trainer has account
      if (trainer?.financial?.stripeAccountId) {
        try {
          const response = await fetch(
            `/api/stripe/connect?accountId=${trainer.financial.stripeAccountId}`
          );
          const data = await response.json();

          if (!data.error) {
            setStripeStatus({
              connected: data.connected,
              onboardingComplete: data.onboardingComplete,
              chargesEnabled: data.chargesEnabled,
              payoutsEnabled: data.payoutsEnabled,
              accountId: data.accountId,
              email: data.email,
            });
          }
        } catch (error) {
          console.error('Error checking Stripe status:', error);
        }
      }

      const { db } = await import('@/lib/firebase');
      if (!db) {
        setLoading(false);
        return;
      }

      // Load subscriptions from Firestore
      const subsRef = collection(db as Firestore, 'subscriptions');
      const subsQuery = query(
        subsRef,
        where('trainerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      let subsSnapshot;
      try {
        subsSnapshot = await getDocs(subsQuery);
      } catch (error) {
        console.error('Error loading subscriptions:', error);
        setLoading(false);
        return;
      }

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      let totalEarnings = 0;
      let thisMonthRevenue = 0;
      let lastMonthRevenue = 0;
      const transactionsList: Transaction[] = [];

      subsSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const amount = data.price || 0;
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);

        totalEarnings += amount;

        if (createdAt >= thisMonthStart) {
          thisMonthRevenue += amount;
        } else if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) {
          lastMonthRevenue += amount;
        }

        transactionsList.push({
          id: docSnap.id,
          type: 'sale',
          amount,
          status: data.status === 'active' ? 'completed' : 'pending',
          description: 'Venda de programa',
          programName: data.programName || 'Programa',
          studentName: data.studentName || 'Aluno',
          createdAt,
        });
      });

      const revenueGrowth = lastMonthRevenue
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

      const platformFee = 0.1;
      const balance = totalEarnings * (1 - platformFee);
      const pendingBalance = thisMonthRevenue * (1 - platformFee);

      setStats({
        balance,
        pendingBalance,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        totalEarnings,
        totalPayouts: 0,
        nextPayoutDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        nextPayoutAmount: pendingBalance,
      });

      setTransactions(transactionsList);
      setPayouts([]);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, trainer?.financial?.stripeAccountId]);

  // Initial load
  useEffect(() => {
    if (user !== undefined) {
      loadFinanceData();
    }
  }, [user?.uid]);

  // Check if returning from Stripe onboarding
  useEffect(() => {
    const success = searchParams.get('success');
    const refresh = searchParams.get('refresh');

    if ((success === 'true' || refresh === 'true') && dataLoaded) {
      loadFinanceData();
    }
  }, [searchParams, dataLoaded]);

  const handleConnectStripe = async () => {
    if (!user) return;

    try {
      setConnectingStripe(true);

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.uid,
          email: user.email,
          existingAccountId: trainer?.financial?.stripeAccountId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Erro: ${data.error}`);
        return;
      }

      // Save Stripe account ID to Firestore
      if (data.accountId) {
        const { db } = await import('@/lib/firebase');
        if (db) {
          // Use setDoc with merge to create or update the trainer document
          await setDoc(
            doc(db as Firestore, 'trainers', user.uid),
            {
              stripeAccountId: data.accountId,
              updatedAt: new Date(),
              ...(trainer ? {} : { createdAt: new Date(), email: user.email }),
            },
            { merge: true }
          );
        }
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      alert('Erro ao conectar com Stripe. Tente novamente.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    if (!trainer?.financial?.stripeAccountId) return;

    try {
      const response = await fetch('/api/stripe/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: trainer.financial.stripeAccountId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Erro: ${data.error}`);
        return;
      }

      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      alert('Erro ao abrir dashboard do Stripe.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale':
        return 'Venda';
      case 'payout':
        return 'Saque';
      case 'refund':
        return 'Reembolso';
      default:
        return type;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>
          <p className="text-gray-500 mt-1">
            Gerencie seus ganhos e pagamentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadFinanceData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          {stripeStatus.onboardingComplete && (
            <button
              onClick={handleOpenStripeDashboard}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Dashboard Stripe
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stripe Connect Banner */}
      {!stripeStatus.onboardingComplete && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-6 w-6" />
                <h3 className="text-lg font-semibold">
                  {stripeStatus.connected
                    ? 'Complete sua configuração'
                    : 'Configure seus pagamentos'}
                </h3>
              </div>
              <p className="text-primary-100">
                {stripeStatus.connected
                  ? 'Sua conta Stripe está conectada, mas precisa completar a verificação para receber pagamentos.'
                  : 'Conecte sua conta Stripe para receber pagamentos diretamente na sua conta bancaria.'}
              </p>
              {stripeStatus.connected && (
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    {stripeStatus.chargesEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-300" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-300" />
                    )}
                    Cobranças
                  </span>
                  <span className="flex items-center gap-1">
                    {stripeStatus.payoutsEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-300" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-300" />
                    )}
                    Saques
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleConnectStripe}
              disabled={connectingStripe}
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              {connectingStripe ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {stripeStatus.connected ? 'Completar Verificação' : 'Conectar Stripe'}
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stripe Connected Success */}
      {stripeStatus.onboardingComplete && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Stripe Conectado</h4>
              <p className="text-sm text-green-700">
                Sua conta está configurada e pronta para receber pagamentos.
                {stripeStatus.email && ` (${stripeStatus.email})`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Available Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.balance)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Saldo disponível</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.pendingBalance)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Saldo pendente</p>
        </div>

        {/* This Month Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stats.revenueGrowth >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {formatPercentage(stats.revenueGrowth)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.thisMonthRevenue)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Receita este mês</p>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalEarnings)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Total de ganhos</p>
        </div>
      </div>

      {/* Next Payout Card */}
      {stats.nextPayoutDate && stats.nextPayoutAmount && stats.nextPayoutAmount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <Calendar className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Próximo pagamento</h3>
                <p className="text-gray-500">
                  Estimado para {formatDate(stats.nextPayoutDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.nextPayoutAmount)}
              </p>
              <p className="text-sm text-gray-500">Valor estimado</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Transações Recentes</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          transaction.type === 'sale'
                            ? 'bg-green-100'
                            : transaction.type === 'refund'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}
                      >
                        {transaction.type === 'sale' ? (
                          <ArrowUpRight
                            className={`h-5 w-5 ${
                              transaction.type === 'sale'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getTypeLabel(transaction.type)} - {transaction.programName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.studentName} - {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === 'refund'
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {transaction.type === 'refund' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {getStatusLabel(transaction.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {transactions.length > 10 && (
            <div className="p-4 border-t border-gray-100">
              <button className="w-full text-center text-primary-600 hover:text-primary-700 font-medium text-sm">
                Ver todas as transações
              </button>
            </div>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Histórico de Saques</h3>
          </div>
          {payouts.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum saque realizado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                        payout.status
                      )}`}
                    >
                      {getStatusLabel(payout.status)}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(payout.amount)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Pago em {formatDate(payout.paidAt)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Chegou em {formatDate(payout.arrivalDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <div className="flex gap-4">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Sobre seus pagamentos</h4>
            <p className="text-blue-700 text-sm">
              Os pagamentos são processados automaticamente a cada 7 dias. A taxa da
              plataforma é de 10% sobre cada venda. Pagamentos podem levar até 2 dias
              uteis para aparecer na sua conta bancaria apos a liberacao.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
