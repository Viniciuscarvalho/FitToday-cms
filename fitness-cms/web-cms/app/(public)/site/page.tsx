import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Dumbbell,
  Users,
  Library,
  Wallet,
  MessageSquare,
  BarChart3,
  CheckCircle,
  ArrowRight,
  UserPlus,
  Settings,
  CreditCard,
  Shield,
  Zap,
  Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'FitToday - Plataforma para Personal Trainers',
  description:
    'Gerencie seus programas de treino, alunos e pagamentos em um unico lugar. A plataforma completa para personal trainers profissionais.',
};

export default function SitePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FitToday</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#funcionalidades" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Funcionalidades
              </a>
              <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Como Funciona
              </a>
              <a href="#precos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Precos
              </a>
              <a href="#contato" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Contato
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-orange-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Plataforma completa para personal trainers
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Gerencie seus treinos e{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-orange-500">
                receba pagamentos
              </span>{' '}
              em um so lugar
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Crie programas de treino, acompanhe seus alunos e receba pagamentos
              de forma segura. Tudo o que voce precisa para profissionalizar
              seu trabalho como personal trainer.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                Comece Gratuitamente
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Saiba Mais
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Sem mensalidade
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Pagamentos via Stripe
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Apps iOS e Android
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Tudo que voce precisa em uma plataforma
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Ferramentas profissionais para gerenciar cada aspecto do seu
              trabalho como personal trainer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Dumbbell className="w-6 h-6" />}
              title="Programas de Treino"
              description="Crie e gerencie programas de treino completos com exercicios, series, repeticoes e videos demonstrativos."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Gestao de Alunos"
              description="Acompanhe o progresso de cada aluno, visualize historico de treinos e mantenha comunicacao direta."
            />
            <FeatureCard
              icon={<Library className="w-6 h-6" />}
              title="Biblioteca de Exercicios"
              description="Acesse uma biblioteca completa de exercicios com videos e instrucoes para montar seus programas."
            />
            <FeatureCard
              icon={<Wallet className="w-6 h-6" />}
              title="Gestao Financeira"
              description="Receba pagamentos de forma segura via Stripe. Acompanhe receitas, taxas e repasses em tempo real."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Mensagens"
              description="Comunique-se diretamente com seus alunos pela plataforma. Envie orientacoes e receba feedback."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Analytics"
              description="Visualize metricas do seu negocio: alunos ativos, receita mensal, programas mais populares e tendencias."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Como Funciona
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Comece a usar o FitToday em poucos minutos. Sem complicacao.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <StepCard
              number="1"
              icon={<UserPlus className="w-6 h-6" />}
              title="Crie sua Conta"
              description="Cadastre-se gratuitamente e configure seu perfil profissional com suas especialidades e experiencia."
            />
            <StepCard
              number="2"
              icon={<Settings className="w-6 h-6" />}
              title="Configure seus Programas"
              description="Monte seus programas de treino com exercicios, defina precos e publique para seus alunos acessarem."
            />
            <StepCard
              number="3"
              icon={<CreditCard className="w-6 h-6" />}
              title="Receba Pagamentos"
              description="Seus alunos pagam diretamente pelo app. Voce recebe automaticamente na sua conta bancaria via Stripe."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simples e Transparente
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Sem mensalidade, sem surpresas. Voce so paga quando recebe.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-8 py-10 text-center text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  <Star className="w-4 h-4" />
                  Plano Unico
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">10%</span>
                  <span className="text-primary-100 text-lg">por transacao</span>
                </div>
                <p className="mt-2 text-primary-100">
                  Apenas sobre pagamentos recebidos
                </p>
              </div>

              <div className="px-8 py-8">
                <ul className="space-y-4">
                  <PricingItem text="Sem taxa de adesao ou mensalidade" />
                  <PricingItem text="Programas de treino ilimitados" />
                  <PricingItem text="Alunos ilimitados" />
                  <PricingItem text="Dashboard completo com analytics" />
                  <PricingItem text="Mensagens com alunos" />
                  <PricingItem text="Pagamentos seguros via Stripe" />
                  <PricingItem text="Aceita Pix, boleto e cartao" />
                  <PricingItem text="Repasse automatico na sua conta" />
                  <PricingItem text="Apps iOS e Android para seus alunos" />
                </ul>

                <Link
                  href="/register"
                  className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Comece Agora
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Security */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl px-8 py-12 sm:px-12 sm:py-16 text-center">
            <Shield className="w-12 h-12 text-primary-400 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Pagamentos seguros com Stripe
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              Todos os pagamentos sao processados pelo Stripe, lider mundial em
              pagamentos online. Seus dados e os dos seus alunos estao protegidos
              com criptografia de nivel bancario.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Criptografia SSL/TLS
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                PCI DSS Compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Protecao contra fraudes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Pronto para profissionalizar seu trabalho?
          </h2>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            Junte-se a personal trainers que ja usam o FitToday para gerenciar
            seus treinos e receber pagamentos.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3 bg-white text-primary-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition-colors text-center"
            >
              Ja tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">FitToday</span>
              </div>
              <p className="text-sm leading-relaxed">
                Plataforma completa para personal trainers gerenciarem
                programas de treino, alunos e pagamentos.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#funcionalidades" className="hover:text-white transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#precos" className="hover:text-white transition-colors">
                    Precos
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" className="hover:text-white transition-colors">
                    Como Funciona
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Contato</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:contato@fittoday.com.br"
                    className="hover:text-white transition-colors"
                  >
                    contato@fittoday.com.br
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} FitToday. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Pagamentos processados por</span>
              <span className="font-semibold text-white">Stripe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          {number}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
      <span className="text-gray-700">{text}</span>
    </li>
  );
}
