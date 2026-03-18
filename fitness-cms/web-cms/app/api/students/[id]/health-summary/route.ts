import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyTrainerRequest } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

type Period = 'week' | 'month' | 'year';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getDateRange(period: Period, startDate?: string, endDate?: string) {
  const now = new Date();

  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return {
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    };
  }

  if (period === 'month') {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    return {
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    };
  }

  // year: last 12 months
  const start = new Date(now);
  start.setFullYear(now.getFullYear() - 1);
  start.setDate(1);
  return {
    start: start.toISOString().slice(0, 10),
    end: now.toISOString().slice(0, 10),
  };
}

function getPreviousDateRange(period: Period, currentStart: string, currentEnd: string) {
  const start = new Date(currentStart);
  const end = new Date(currentEnd);
  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);
  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
  };
}

// GET /api/students/[id]/health-summary - Aggregated health metrics for CMS
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const authResult = await verifyTrainerRequest(request.headers.get('authorization'));
    if (!authResult.isTrainer || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: studentId } = await params;
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'week') as Period;

    if (!['week', 'month', 'year'].includes(period)) {
      return NextResponse.json(
        { error: 'period must be week, month, or year' },
        { status: 400 }
      );
    }

    const range = getDateRange(
      period,
      searchParams.get('startDate') || undefined,
      searchParams.get('endDate') || undefined
    );

    // Query health_metrics for this student within date range
    const snapshot = await adminDb
      .collection('health_metrics')
      .where('studentId', '==', studentId)
      .where('date', '>=', range.start)
      .where('date', '<=', range.end)
      .orderBy('date', 'asc')
      .get();

    const entries = snapshot.docs.map((doc) => doc.data());

    // Compute totals
    let strengthLoadTotal = 0;
    let resistanceLoadTotal = 0;
    let totalCalories = 0;
    let totalSessions = 0;

    for (const entry of entries) {
      strengthLoadTotal += entry.strengthLoadTotal || 0;
      resistanceLoadTotal += entry.resistanceLoadTotal || 0;
      totalCalories += entry.activeCalories || 0;
      totalSessions += (entry.sessions || []).length;
    }

    const daysWithData = entries.length;
    const avgDailyCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;

    // Compute trend vs previous period
    const prevRange = getPreviousDateRange(period, range.start, range.end);
    const prevSnapshot = await adminDb
      .collection('health_metrics')
      .where('studentId', '==', studentId)
      .where('date', '>=', prevRange.start)
      .where('date', '<=', prevRange.end)
      .orderBy('date', 'asc')
      .get();

    let prevStrengthTotal = 0;
    for (const doc of prevSnapshot.docs) {
      prevStrengthTotal += doc.data().strengthLoadTotal || 0;
    }

    const trendPercentage = prevStrengthTotal > 0
      ? Math.round(((strengthLoadTotal - prevStrengthTotal) / prevStrengthTotal) * 100)
      : 0;

    // Weekly breakdown by day-of-week (always compute for any period)
    const weeklyBreakdown = DAY_NAMES.map((day) => ({
      day,
      strength: 0,
      resistance: 0,
      calories: 0,
    }));

    for (const entry of entries) {
      const dayIndex = new Date(entry.date + 'T12:00:00').getDay();
      weeklyBreakdown[dayIndex].strength += entry.strengthLoadTotal || 0;
      weeklyBreakdown[dayIndex].resistance += entry.resistanceLoadTotal || 0;
      weeklyBreakdown[dayIndex].calories += entry.activeCalories || 0;
    }

    // Average weekly breakdown when period is longer than a week
    if (period !== 'week' && daysWithData > 7) {
      const weeks = Math.max(1, Math.ceil(daysWithData / 7));
      for (const day of weeklyBreakdown) {
        day.strength = Math.round(day.strength / weeks);
        day.resistance = Math.round(day.resistance / weeks);
        day.calories = Math.round(day.calories / weeks);
      }
    }

    // Monthly breakdown (for year view)
    const monthlyBreakdown: { month: string; strengthLoad: number; resistanceLoad: number; calories: number }[] = [];

    if (period === 'year') {
      const monthMap = new Map<string, { strength: number; resistance: number; calories: number }>();

      for (const entry of entries) {
        const monthKey = entry.date.slice(0, 7); // YYYY-MM
        const existing = monthMap.get(monthKey) || { strength: 0, resistance: 0, calories: 0 };
        existing.strength += entry.strengthLoadTotal || 0;
        existing.resistance += entry.resistanceLoadTotal || 0;
        existing.calories += entry.activeCalories || 0;
        monthMap.set(monthKey, existing);
      }

      // Fill all 12 months
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        const data = monthMap.get(key) || { strength: 0, resistance: 0, calories: 0 };
        monthlyBreakdown.push({
          month: MONTH_NAMES[d.getMonth()],
          strengthLoad: data.strength,
          resistanceLoad: data.resistance,
          calories: data.calories,
        });
      }
    }

    // Completion rate: days with sessions / total days in period
    const totalDaysInPeriod = Math.max(1, Math.ceil(
      (new Date(range.end).getTime() - new Date(range.start).getTime()) / (24 * 60 * 60 * 1000)
    ) + 1);
    const daysWithSessions = entries.filter((e) => (e.sessions || []).length > 0).length;
    const completionRate = Math.round((daysWithSessions / totalDaysInPeriod) * 100);

    return NextResponse.json({
      studentId,
      period,
      dateRange: range,
      strengthLoadTotal,
      resistanceLoadTotal,
      avgDailyCalories,
      sessionCount: totalSessions,
      completionRate,
      trendPercentage,
      daysWithData,
      weeklyBreakdown,
      monthlyBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching health summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch health summary' },
      { status: 500 }
    );
  }
}
