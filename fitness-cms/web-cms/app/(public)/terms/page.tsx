import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso | FitToday',
  description: 'Termos de Uso da plataforma FitToday para personal trainers e alunos.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/site" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            FitToday
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
        <p className="text-gray-500 mb-10">Última atualização: fevereiro de 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou usar a plataforma FitToday, você concorda em estar sujeito a estes
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá
              acessar ou usar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descrição do Serviço</h2>
            <p>
              A FitToday é uma plataforma SaaS que permite a personal trainers criar, gerenciar e
              comercializar programas de treino para seus alunos. A plataforma oferece dois modelos
              de negócio:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>
                <strong>Assinatura SaaS:</strong> O personal trainer paga uma mensalidade para
                acessar as funcionalidades da plataforma.
              </li>
              <li>
                <strong>Marketplace:</strong> Os alunos pagam diretamente ao personal trainer pelos
                programas adquiridos. A plataforma retém 10% de comissão sobre cada transação.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cadastro e Conta</h2>
            <p>
              Para usar a plataforma como personal trainer, você deve criar uma conta fornecendo
              informações verdadeiras e completas. Você é responsável por manter a confidencialidade
              de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pagamentos e Comissões</h2>
            <p>
              Os pagamentos realizados por alunos são processados pela Stripe, nosso parceiro de
              pagamentos. A FitToday retém uma comissão de 10% sobre cada transação. O valor
              restante (90%) é repassado ao personal trainer conforme o cronograma de pagamentos
              da Stripe.
            </p>
            <p className="mt-3">
              O personal trainer é responsável por declarar e pagar todos os impostos aplicáveis
              sobre os valores recebidos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Conteúdo do Usuário</h2>
            <p>
              Você mantém a propriedade de todo o conteúdo que criar na plataforma (programas de
              treino, vídeos, PDFs, etc.). Ao publicar conteúdo, você nos concede uma licença
              não-exclusiva para exibir e distribuir esse conteúdo dentro da plataforma.
            </p>
            <p className="mt-3">
              Você é responsável por garantir que todo o conteúdo publicado seja original, não
              infrinja direitos de terceiros e esteja em conformidade com as leis brasileiras.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Uso Aceitável</h2>
            <p>É proibido usar a plataforma para:</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Publicar conteúdo falso, enganoso ou fraudulento;</li>
              <li>Violar direitos de propriedade intelectual;</li>
              <li>Praticar qualquer ato ilegal;</li>
              <li>Interferir no funcionamento da plataforma;</li>
              <li>Coletar dados de outros usuários sem consentimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitação de Responsabilidade</h2>
            <p>
              A FitToday não se responsabiliza por danos indiretos, incidentais ou consequentes
              decorrentes do uso da plataforma. Nossa responsabilidade máxima em qualquer caso
              é limitada ao valor pago pelo usuário nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta a qualquer momento caso você viole estes
              Termos de Uso. Você pode cancelar sua conta a qualquer momento através das
              configurações da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes termos periodicamente. Notificaremos você sobre mudanças
              significativas por email. O uso continuado da plataforma após a notificação
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos de Uso, entre em contato pelo email{' '}
              <a
                href="mailto:suporte@fittoday.com.br"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                suporte@fittoday.com.br
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 FitToday. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/site" className="hover:text-gray-700 transition-colors">
              Página Inicial
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
