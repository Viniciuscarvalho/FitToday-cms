# FitToday CMS

Plataforma marketplace para Personal Trainers criarem e venderem programas de treino.

## Stack

- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Web CMS**: Next.js 14 + TypeScript + Tailwind CSS (a ser implementado)
- **iOS App**: SwiftUI + Swift 6 (a ser implementado)
- **Pagamentos**: Stripe Connect

## Setup

### Pré-requisitos

1. Node.js 18+
2. Firebase CLI
3. Conta Stripe (para pagamentos)

### Instalação do Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Configuração

O projeto já está configurado para o Firebase project `fittoday-2aaff`.

### Deploy das Cloud Functions

```bash
# Instalar dependências
cd backend/functions
npm install

# Build
npm run build

# Deploy functions
cd ../..
firebase deploy --only functions
```

### Deploy das Security Rules

```bash
# Firestore Rules
firebase deploy --only firestore:rules

# Storage Rules
firebase deploy --only storage:rules

# Firestore Indexes
firebase deploy --only firestore:indexes
```

### Deploy Completo

```bash
firebase deploy
```

### Configurar Variáveis de Ambiente (Stripe)

```bash
firebase functions:config:set stripe.secret_key="sk_live_xxx"
firebase functions:config:set stripe.webhook_secret="whsec_xxx"
firebase functions:config:set app.url="https://fittoday.com.br"
```

Para verificar as configurações:
```bash
firebase functions:config:get
```

## Estrutura

```
fitness-cms/
├── backend/
│   ├── functions/
│   │   ├── src/
│   │   │   └── index.ts      # Cloud Functions
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── firestore.rules       # Security Rules
│   ├── firestore.indexes.json # Composite Indexes
│   └── storage.rules         # Storage Rules
├── firebase.json             # Firebase config
└── .firebaserc              # Project alias
```

## Cloud Functions

| Function | Tipo | Descrição |
|----------|------|-----------|
| `onUserCreated` | Auth Trigger | Cria perfil no Firestore ao registrar |
| `becomeTrainer` | Callable | Promove user para trainer + Stripe Connect |
| `createCheckoutSession` | Callable | Cria sessão de pagamento Stripe |
| `stripeWebhook` | HTTP | Processa eventos do Stripe |
| `sendWorkoutReminders` | Scheduled | Lembretes diários (7h) |
| `sendWeeklyCheckInReminders` | Scheduled | Lembretes semanais (Dom 9h) |
| `calculateDailyAnalytics` | Scheduled | Analytics diários (1h) |
| `getTrainerPrograms` | Callable | Lista programas do trainer |
| `getTrainerStudents` | Callable | Lista alunos do trainer |

## Stripe Webhooks

Após deploy, configure o webhook no Stripe Dashboard:

1. Vá para Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://us-central1-fittoday-2aaff.cloudfunctions.net/stripeWebhook`
3. Selecione eventos:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Emuladores (Desenvolvimento Local)

```bash
# Iniciar emuladores
firebase emulators:start

# UI disponível em http://localhost:4000
```

## Documentação

- [PRD](tasks/prd-cms/prd.md) - Product Requirements Document
- [TechSpec](tasks/prd-cms/techspec.md) - Technical Specification
- [Tasks](tasks/prd-cms/tasks.md) - Implementation Tasks
