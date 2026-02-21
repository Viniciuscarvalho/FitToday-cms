# FitToday CMS — Refatoração e Especificações Técnicas

## Contexto

O FitToday.me é um CMS web (Next.js + Firebase) para personal trainers gerenciarem seus alunos. O modelo de negócio **não é venda de programas avulsos** — o aluno paga uma **mensalidade ao personal** (ex: R$150, R$250/mês) e recebe acompanhamento individualizado com treinos personalizados.

**Stack atual:** Next.js, Firebase (Firestore, Auth, Storage, Functions), Stripe Connect (Marketplace).

**Planos do Personal na plataforma:**
- **Starter (Gratuito):** até 5 alunos, comissão de 10%
- **Pro (R$97/mês):** alunos ilimitados, comissão de 5%
- **Elite (R$197/mês):** alunos ilimitados, sem comissão, white-label, **chat com alunos via Firebase**

---

## 1. Programas / Treinos (Refatoração)

### Problema atual
A interface trata programas como produtos genéricos à venda. Isso está errado.

### Como deve funcionar
Cada programa de treino é **individualizado e vinculado a um aluno específico**. O personal cria treinos para CADA aluno. Um personal pode ter inúmeros programas, mas cada um pertence a um aluno.

### Modelo de Dados — Firestore

```
trainers/{trainerId}/students/{studentId}/programs/{programId}
```

```typescript
interface Program {
  id: string;
  trainerId: string;
  studentId: string;
  title: string;                    // Ex: "Mesociclo 1 — Hipertrofia"
  description?: string;
  status: 'active' | 'completed' | 'draft';
  startDate: Timestamp;
  endDate?: Timestamp;
  weeks: number;                    // Duração em semanas
  workouts: Workout[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Workout {
  id: string;
  dayOfWeek: number;               // 0-6 (dom-sáb)
  name: string;                    // Ex: "Treino A — Peito e Tríceps"
  exercises: Exercise[];
  notes?: string;
}

interface Exercise {
  id: string;
  exerciseDbId?: string;           // Ref ao ExerciseDB/Wger
  name: string;
  sets: number;
  reps: string;                    // "8-12" ou "até falha"
  restSeconds: number;
  weight?: number;
  notes?: string;
  gifUrl?: string;
}
```

### Mudanças na UI

- **Dashboard:** O card "Programas Publicados / 0 total" deve mudar para **"Treinos Ativos"** — mostrando quantos alunos possuem um programa ativo no momento.
- **Página /programas:** Listar programas agrupados por aluno, com filtro por status (ativo, rascunho, concluído). Ao criar novo programa, o primeiro passo é **selecionar o aluno**.
- **Botão "+ Novo Programa"** (header) e **"+ Criar Programa"** (dashboard): Devem abrir um fluxo multi-step:
  1. Selecionar aluno
  2. Definir título, duração (semanas), objetivo
  3. Montar treinos (dias da semana)
  4. Adicionar exercícios a cada treino (busca no ExerciseDB/Wger)
  5. Revisão e publicação

---

## 2. Alunos — Acompanhamento de Progresso

### Problema atual
A aba de alunos mostra apenas listagem básica (ativos, novos, cancelamentos).

### Como deve funcionar
Cada perfil de aluno deve ter uma **área completa de acompanhamento**, similar a um acompanhamento nutricional, onde o personal registra e visualiza a evolução do aluno ao longo do tempo.

### Modelo de Dados — Firestore

```
trainers/{trainerId}/students/{studentId}/progress/{entryId}
```

```typescript
interface Student {
  id: string;
  trainerId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  plan: StudentPlan;
  status: 'active' | 'inactive' | 'cancelled';
  startDate: Timestamp;
  goals?: string[];                // Ex: ["Hipertrofia", "Perda de gordura"]
  createdAt: Timestamp;
}

interface StudentPlan {
  monthlyFee: number;             // Ex: 150.00 (em reais)
  billingDay: number;             // Dia de cobrança (1-31)
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  stripeSubscriptionId?: string;
  status: 'active' | 'past_due' | 'cancelled';
}

interface ProgressEntry {
  id: string;
  date: Timestamp;
  measurements: {
    weight?: number;              // kg
    bodyFat?: number;             // %
    muscleMass?: number;          // kg
    chest?: number;               // cm
    waist?: number;               // cm
    hips?: number;                // cm
    rightArm?: number;            // cm
    leftArm?: number;             // cm
    rightThigh?: number;          // cm
    leftThigh?: number;           // cm
    rightCalf?: number;           // cm
    leftCalf?: number;            // cm
  };
  photos?: {
    front?: string;               // URL do Storage
    side?: string;
    back?: string;
  };
  notes?: string;                 // Observações do personal
  registeredBy: 'trainer' | 'student';
}
```

### UI — Página do Aluno (`/alunos/{studentId}`)

A página do aluno deve ter **tabs internas:**

| Tab | Conteúdo |
|-----|----------|
| **Visão Geral** | Dados do aluno, plano atual, data de início, objetivos, status do pagamento |
| **Progresso** | Gráficos de evolução (peso, % gordura, medidas) + galeria de fotos comparativas (antes/depois) + tabela de histórico |
| **Treinos** | Lista de programas (atual e histórico), com link para editar/criar novo |
| **Financeiro** | Histórico de pagamentos, status da assinatura, próxima cobrança |

### Gráficos de Progresso (usar Recharts)

- **Gráfico de linha — Peso ao longo do tempo:** Eixo X = datas, Eixo Y = peso (kg)
- **Gráfico de linha — % Gordura Corporal:** Mesmo formato
- **Gráfico de barras agrupadas — Medidas corporais:** Comparação entre primeira avaliação e última (braço, coxa, cintura, etc.)
- **Cards de resumo no topo:**
  - Peso atual vs peso inicial (com delta ↑↓)
  - % Gordura atual vs inicial
  - Tempo de acompanhamento (em meses)
  - Treinos completados (dados vindos do app mobile via sync)

### Visibilidade do aluno
O aluno também deve conseguir ver seu próprio progresso no app mobile (Feiti Today), recebendo os dados via Firestore sync. O personal registra as medidas no CMS, e o aluno visualiza no app.

---

## 3. Mensagens — Chat Firebase (Plano Elite apenas)

### Regra de negócio
O chat entre personal e aluno **só está disponível para personais no plano Elite (R$197/mês)**. Personais nos planos Starter e Pro veem a aba "Mensagens" com um **upsell** para o plano Elite.

### Modelo de Dados — Firestore

```
chats/{chatId}
```

```typescript
interface Chat {
  id: string;
  participants: string[];           // [trainerId, studentId]
  trainerId: string;
  studentId: string;
  lastMessage?: {
    text: string;
    sentBy: string;
    sentAt: Timestamp;
  };
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcoleção
// chats/{chatId}/messages/{messageId}

interface Message {
  id: string;
  text: string;
  sentBy: string;                   // odify
  sentAt: Timestamp;
  readAt?: Timestamp;
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;                // Para imagens/arquivos
}
```

### Implementação

- **Firestore real-time listeners** (`onSnapshot`) para mensagens em tempo real
- **Cloud Function** para atualizar `lastMessage` e `unreadCount` em cada envio
- **Firebase Cloud Messaging (FCM)** para push notifications no app mobile
- **Upload de mídia** via Firebase Storage (`chats/{chatId}/media/`)

### UI — Página /mensagens

**Para trainers Elite:**
- Layout tipo WhatsApp Web: lista de conversas à esquerda, chat aberto à direita
- Indicador de mensagens não lidas
- Suporte a envio de texto, imagens e arquivos (PDF de treino, etc.)
- Busca por nome do aluno

**Para trainers Starter/Pro (upsell):**
```
┌─────────────────────────────────────────┐
│  🔒  Chat com Alunos                   │
│                                         │
│  Converse diretamente com seus alunos   │
│  pelo FitToday.                         │
│                                         │
│  Disponível no plano Elite.             │
│                                         │
│  [Fazer upgrade → R$197/mês]            │
└─────────────────────────────────────────┘
```

### Controle de acesso

```typescript
// Middleware ou check no componente
const canAccessChat = (trainer: Trainer): boolean => {
  return trainer.plan === 'elite';
};

// Firestore Security Rules
match /chats/{chatId} {
  allow read, write: if request.auth != null
    && request.auth.uid in resource.data.participants
    && get(/databases/$(database)/documents/trainers/$(request.auth.uid)).data.plan == 'elite';
}
```

---

## 4. Analytics — Avaliação do Personal (não dos programas)

### Problema atual
Analytics foca em métricas de programas publicados. Isso não faz sentido no modelo individualizado.

### Como deve funcionar
Analytics deve mostrar a **performance do personal como profissional**, medida pela satisfação e progresso dos alunos.

### Métricas do Dashboard de Analytics

| Métrica | Descrição | Cálculo |
|---------|-----------|---------|
| **Nota média** | Avaliação dos alunos (1-5 estrelas) | Média das avaliações |
| **Taxa de retenção** | % de alunos que renovam após 3 meses | (alunos > 3 meses / total histórico) × 100 |
| **Alunos ativos** | Evolução mensal | Gráfico de linha por mês |
| **Churn rate** | Taxa de cancelamento mensal | (cancelamentos no mês / ativos no início do mês) × 100 |
| **Tempo médio de permanência** | Quanto tempo os alunos ficam | Média de meses ativos |
| **NPS (Net Promoter Score)** | Probabilidade de indicação (0-10) | Pesquisa periódica no app |
| **Progresso dos alunos** | % de alunos atingindo metas | Alunos com progresso positivo / total |

### Modelo de Dados

```
trainers/{trainerId}/reviews/{reviewId}
```

```typescript
interface TrainerReview {
  id: string;
  studentId: string;
  studentName: string;
  rating: number;                   // 1-5
  npsScore?: number;                // 0-10
  comment?: string;
  createdAt: Timestamp;
}

interface AnalyticsSnapshot {
  trainerId: string;
  month: string;                    // "2026-02"
  activeStudents: number;
  newStudents: number;
  cancelledStudents: number;
  retentionRate: number;
  averageRating: number;
  revenue: number;
  churnRate: number;
}
```

### UI — Página /analytics

**Seção 1 — Cards de resumo (topo)**
- Nota média (⭐ 4.8)
- Taxa de retenção (85%)
- Alunos ativos (12)
- Churn mensal (5%)

**Seção 2 — Gráficos (Recharts)**
- Gráfico de linha: evolução de alunos ativos nos últimos 12 meses
- Gráfico de barras: novos alunos vs cancelamentos por mês
- Gráfico de pizza: distribuição de ratings (5★, 4★, 3★, etc.)

**Seção 3 — Avaliações recentes**
- Lista das últimas avaliações dos alunos com nome, nota, comentário e data

**Seção 4 — Progresso agregado**
- % de alunos que tiveram redução de peso (se objetivo = emagrecimento)
- % de alunos que tiveram aumento de massa muscular (se objetivo = hipertrofia)
- Gráfico mostrando progresso médio dos alunos

---

## 5. Dashboard — Atualização dos Cards

Os 4 cards do dashboard principal devem ser atualizados:

| Card Atual | Novo Card | Fonte |
|------------|-----------|-------|
| Alunos Ativos / 0 total | **Alunos Ativos / {total}** | Contagem de `students` com `status === 'active'` |
| Programas Publicados / 0 total | **Treinos Ativos** — quantos alunos têm programa ativo | Contagem de `programs` com `status === 'active'` |
| R$ 0,00 Receita do Mês | **Receita do Mês** (mantém) | Soma dos pagamentos do mês via Stripe |
| 0% Taxa de Conclusão | **⭐ Nota Média** — rating do personal | Média de `reviews.rating` |

### Atividade Recente
Deve mostrar eventos reais:
- "João Silva completou o Treino A" (sync do app)
- "Maria Souza — nova avaliação registrada"
- "Pedro Lima — pagamento confirmado R$200"
- "Ana Costa — cancelou assinatura"

### Ações Rápidas (manter, ajustar labels)
- **Criar Treino** → Abre fluxo de criação vinculado a aluno
- **Falar com Alunos** → Vai para /mensagens (ou mostra upsell)
- **Ver Financeiro** → Vai para /financeiro

---

## 6. Sidebar — Sem mudanças estruturais

A sidebar mantém as mesmas seções:
- Dashboard
- Programas → renomear para **Treinos**
- Alunos
- Mensagens (com ícone de 🔒 se não for Elite)
- Analytics
- Financeiro
- Configurações

---

## 7. Requisitos Técnicos Gerais

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Trainers podem ler/escrever seus próprios dados
    match /trainers/{trainerId} {
      allow read, write: if request.auth.uid == trainerId;

      // Students do trainer
      match /students/{studentId}/{document=**} {
        allow read, write: if request.auth.uid == trainerId;
      }
    }

    // Chats — apenas participantes com plano Elite
    match /chats/{chatId} {
      allow read, write: if request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
          && request.resource.data.sentBy == request.auth.uid;
      }
    }
  }
}
```

### Cloud Functions necessárias

| Function | Trigger | Descrição |
|----------|---------|-----------|
| `onMessageCreated` | Firestore onCreate em `chats/{chatId}/messages/{messageId}` | Atualiza `lastMessage` e `unreadCount` no chat, envia push via FCM |
| `onStudentStatusChange` | Firestore onUpdate em `trainers/{trainerId}/students/{studentId}` | Registra evento em `atividade_recente`, atualiza `analyticsSnapshot` |
| `generateMonthlySnapshot` | Pub/Sub scheduled (todo dia 1) | Gera o `AnalyticsSnapshot` mensal para cada trainer |
| `processPaymentWebhook` | HTTPS callable (Stripe webhook) | Atualiza status de pagamento do aluno |

### Dependências do projeto

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "firebase": "^10.x",
    "firebase-admin": "^12.x",
    "recharts": "^2.x",
    "stripe": "^14.x",
    "@stripe/stripe-js": "^2.x",
    "date-fns": "^3.x",
    "tailwindcss": "^3.x",
    "lucide-react": "^0.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x"
  }
}
```

### Ordem de implementação sugerida

1. **Semana 1-2:** Refatorar modelo de dados (Programs vinculados a Students), atualizar UI de criação de treino
2. **Semana 3-4:** Implementar sistema de progresso do aluno (medidas, gráficos, fotos)
3. **Semana 5-6:** Implementar chat Firebase (plano Elite) com real-time e push
4. **Semana 7-8:** Refatorar Analytics (avaliações, retenção, NPS)
5. **Semana 9:** Atualizar Dashboard (cards, atividade recente)
6. **Semana 10:** Testes, ajustes e deploy

---

## Notas Finais

- Todos os valores monetários são em BRL (R$)
- Pagamentos processados via Stripe Connect no modelo Marketplace
- O app mobile (FitToday) consome os mesmos dados via Firestore sync
- O aluno visualiza seu progresso e treinos no app — o personal gerencia tudo pelo CMS web
- Fotos de progresso devem ser armazenadas no Firebase Storage com path: `trainers/{trainerId}/students/{studentId}/progress-photos/{filename}`
- Dados sensíveis (fotos, medidas) devem respeitar LGPD — incluir consentimento no onboarding do aluno