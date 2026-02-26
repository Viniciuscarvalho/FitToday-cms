import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade | FitToday',
  description: 'Política de Privacidade da plataforma FitToday.',
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 mb-10">Última atualização: fevereiro de 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introdução</h2>
            <p>
              A FitToday valoriza a privacidade dos seus usuários. Esta Política de Privacidade
              descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais
              ao usar nossa plataforma, em conformidade com a Lei Geral de Proteção de Dados
              (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Dados que Coletamos</h2>
            <p>Coletamos os seguintes tipos de dados:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>
                <strong>Dados de cadastro:</strong> nome, email, senha (armazenada de forma
                criptografada via Firebase Authentication).
              </li>
              <li>
                <strong>Dados de perfil:</strong> foto, informações profissionais fornecidas
                voluntariamente.
              </li>
              <li>
                <strong>Dados financeiros:</strong> informações bancárias e de pagamento são
                gerenciadas diretamente pela Stripe e não são armazenadas em nossos servidores.
              </li>
              <li>
                <strong>Dados de uso:</strong> informações sobre como você usa a plataforma
                (programas criados, acessos, etc.).
              </li>
              <li>
                <strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo, navegador e
                sistema operacional.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Como Usamos seus Dados</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Fornecer e melhorar nossos serviços;</li>
              <li>Processar pagamentos e repasses;</li>
              <li>Enviar comunicações sobre sua conta e atualizações da plataforma;</li>
              <li>Cumprir obrigações legais;</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento de Dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>
                <strong>Stripe:</strong> para processamento seguro de pagamentos. Consulte a{' '}
                <a
                  href="https://stripe.com/br/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Política de Privacidade da Stripe
                </a>
                .
              </li>
              <li>
                <strong>Firebase (Google):</strong> para autenticação, banco de dados e
                armazenamento de arquivos.
              </li>
              <li>
                <strong>Autoridades legais:</strong> quando exigido por lei ou ordem judicial.
              </li>
            </ul>
            <p className="mt-3">
              Não vendemos seus dados pessoais a terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros do Firebase (Google Cloud Platform),
              com criptografia em trânsito (TLS) e em repouso. Implementamos medidas técnicas e
              organizacionais para proteger seus dados contra acesso não autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Seus Direitos (LGPD)</h2>
            <p>De acordo com a LGPD, você tem o direito de:</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar seus dados;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Revogar o consentimento para o tratamento dos seus dados;</li>
              <li>Portabilidade dos dados a outro fornecedor de serviço.</li>
            </ul>
            <p className="mt-3">
              Para exercer seus direitos, entre em contato pelo email{' '}
              <a
                href="mailto:privacidade@fittoday.com.br"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                privacidade@fittoday.com.br
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para manter sua sessão autenticada na plataforma.
              Não utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e cumprir
              obrigações legais. Após o encerramento da sua conta, seus dados são excluídos em
              até 90 dias, exceto quando a retenção for exigida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você
              por email sobre alterações significativas. Recomendamos revisar esta política
              regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contato</h2>
            <p>
              Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus
              dados, entre em contato pelo email{' '}
              <a
                href="mailto:privacidade@fittoday.com.br"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                privacidade@fittoday.com.br
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 FitToday. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Termos de Uso
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
