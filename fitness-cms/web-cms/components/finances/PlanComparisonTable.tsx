import { Check, X } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Grátis',
    features: {
      students: '5 alunos',
      programs: '3 programas',
      commission: '10% comissão',
      analytics: false,
      branding: false,
      support: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$97/mês',
    highlight: true,
    features: {
      students: 'Ilimitados',
      programs: 'Ilimitados',
      commission: '5% comissão',
      analytics: true,
      branding: false,
      support: false,
    },
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 'R$197/mês',
    features: {
      students: 'Ilimitados',
      programs: 'Ilimitados',
      commission: '0% comissão',
      analytics: true,
      branding: true,
      support: true,
    },
  },
];

const rows: { label: string; key: keyof (typeof plans)[0]['features'] }[] = [
  { label: 'Alunos', key: 'students' },
  { label: 'Programas', key: 'programs' },
  { label: 'Comissão por venda', key: 'commission' },
  { label: 'Analytics avançado', key: 'analytics' },
  { label: 'Marca própria', key: 'branding' },
  { label: 'Suporte prioritário', key: 'support' },
];

export function PlanComparisonTable({ currentPlan }: { currentPlan: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Comparativo de planos</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-4 font-medium text-gray-500 w-1/3">Recurso</th>
              {plans.map((plan) => (
                <th key={plan.id} className="p-4 text-center">
                  <div
                    className={`inline-flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${
                      plan.highlight
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700'
                    } ${currentPlan === plan.id ? 'ring-2 ring-primary-400' : ''}`}
                  >
                    <span className="font-semibold">{plan.name}</span>
                    <span className="text-xs font-normal text-gray-500">{plan.price}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-gray-50">
                <td className="p-4 text-gray-600">{row.label}</td>
                {plans.map((plan) => {
                  const val = plan.features[row.key];
                  return (
                    <td key={plan.id} className="p-4 text-center">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
