'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, Save, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';

interface StudentRevenueTrackerProps {
  trainerId: string;
}

export function StudentRevenueTracker({ trainerId }: StudentRevenueTrackerProps) {
  const [activeStudentCount, setActiveStudentCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [savedRevenue, setSavedRevenue] = useState<number | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    const load = async () => {
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      // Count active students
      try {
        const studentsQuery = query(
          collection(db as Firestore, 'trainerStudents'),
          where('trainerId', '==', trainerId),
          where('status', '==', 'active')
        );
        const snap = await getDocs(studentsQuery);
        setActiveStudentCount(snap.size);
      } catch (err) {
        console.error('Error counting students:', err);
        setActiveStudentCount(0);
      }

      // Load saved revenue for this month
      try {
        const revenueRef = doc(db as Firestore, 'trainerRevenue', `${trainerId}_${currentMonth}`);
        const revenueSnap = await getDoc(revenueRef);
        if (revenueSnap.exists()) {
          const amount = revenueSnap.data()?.amount ?? 0;
          setSavedRevenue(amount);
          setMonthlyRevenue(amount > 0 ? String(amount) : '');
        }
      } catch (err) {
        console.error('Error loading revenue:', err);
      }

      setLoadingStudents(false);
    };

    load();
  }, [trainerId, currentMonth]);

  const handleSave = async () => {
    const amount = parseFloat(monthlyRevenue.replace(',', '.'));
    if (isNaN(amount) || amount < 0) return;

    setSaving(true);
    try {
      const { db } = await import('@/lib/firebase');
      if (!db) return;

      await setDoc(
        doc(db as Firestore, 'trainerRevenue', `${trainerId}_${currentMonth}`),
        {
          trainerId,
          month: currentMonth,
          amount,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setSavedRevenue(amount);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving revenue:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Controle de alunos e receitas</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Active students */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            {loadingStudents ? (
              <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{activeStudentCount ?? 0}</p>
            )}
            <p className="text-sm text-gray-500">Alunos ativos</p>
          </div>
        </div>

        {/* Recorded revenue */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {savedRevenue !== null ? formatCurrency(savedRevenue) : '—'}
            </p>
            <p className="text-sm text-gray-500">Receita registrada ({monthLabel})</p>
          </div>
        </div>
      </div>

      {/* Manual revenue input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receita manual — {monthLabel}
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Registre sua receita mensal manualmente (consultorias, mensalidades presenciais, etc.)
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              placeholder="0,00"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !monthlyRevenue}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              'Salvo!'
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
