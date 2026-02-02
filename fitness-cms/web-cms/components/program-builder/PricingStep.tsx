'use client';

import { ProgramFormData } from '@/app/(dashboard)/programs/new/page';
import { DollarSign, Percent, AlertCircle, CheckCircle } from 'lucide-react';

interface PricingStepProps {
  data: ProgramFormData;
  onChange: (data: Partial<ProgramFormData>) => void;
  errors: Record<string, string>;
}

const suggestedPrices = [49.9, 97, 147, 197, 297, 497];

export function PricingStep({ data, onChange, errors }: PricingStepProps) {
  const platformFee = 0.15; // 15%
  const trainerShare = 1 - platformFee;
  const trainerEarnings = data.price * trainerShare;
  const platformEarnings = data.price * platformFee;

  const discount =
    data.originalPrice > 0
      ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Preço do Programa
        </h2>
        <p className="text-gray-500 mb-6">
          Defina o valor do seu programa de treino
        </p>
      </div>

      {/* Price Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preço de Venda
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            R$
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={data.price || ''}
            onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
            placeholder="0,00"
            className={`w-full pl-12 pr-4 py-3 text-2xl font-bold rounded-lg border ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none`}
          />
        </div>
        {errors.price && (
          <p className="text-sm text-red-500 mt-1">{errors.price}</p>
        )}
      </div>

      {/* Suggested Prices */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          Preços sugeridos
        </label>
        <div className="flex flex-wrap gap-2">
          {suggestedPrices.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => onChange({ price })}
              className={`px-4 py-2 rounded-lg border font-medium transition-all ${
                data.price === price
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              R$ {price.toFixed(2).replace('.', ',')}
            </button>
          ))}
        </div>
      </div>

      {/* Original Price (for discount) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preço Original (opcional - para mostrar desconto)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            R$
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={data.originalPrice || ''}
            onChange={(e) =>
              onChange({ originalPrice: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
            className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
        </div>
        {discount > 0 && (
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <Percent className="h-4 w-4" />
            <span className="text-sm font-medium">{discount}% de desconto</span>
          </div>
        )}
      </div>

      {/* Revenue Split */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Divisão de Receita
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Preço de venda</span>
            <span className="font-semibold text-gray-900">
              R$ {data.price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex items-center justify-between text-green-600">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Você recebe (85%)
            </span>
            <span className="font-bold text-lg">
              R$ {trainerEarnings.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-500 text-sm">
            <span>Taxa da plataforma (15%)</span>
            <span>R$ {platformEarnings.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              A taxa da plataforma cobre processamento de pagamentos, hospedagem,
              suporte e melhorias contínuas.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tips */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3">
          Dicas de precificação
        </h4>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            Pesquise preços de programas similares no mercado
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            Considere o valor que você entrega (duração, suporte, qualidade)
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            Preços terminados em 7 ou 9 tendem a converter melhor
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            Você pode ajustar o preço a qualquer momento
          </li>
        </ul>
      </div>

      {/* Free Program Option */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="free-program"
          checked={data.price === 0}
          onChange={(e) => onChange({ price: e.target.checked ? 0 : 97 })}
          className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
        <label htmlFor="free-program" className="text-sm text-gray-700">
          Este é um programa gratuito
        </label>
      </div>
    </div>
  );
}
