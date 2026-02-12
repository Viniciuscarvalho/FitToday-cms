# Tasks - FitToday CMS ↔ iOS Integration

<critical>Read the prd.md and techspec.md files in this folder before starting any task.</critical>

## Overview

Este documento lista todas as tarefas necessárias para implementar a integração entre o CMS web e o app iOS para envio de treinos em PDF.

**Escopo:** Apenas CMS (Next.js) - As tarefas de iOS serão implementadas separadamente no repositório do app.

---

# Task 1.0: Setup Firebase Storage e Types (S)

## Objective
Configurar Firebase Storage para upload de PDFs e criar types TypeScript para workouts.

## Subtasks
- [ ] 1.1 Criar arquivo `types/workout.ts` com interfaces Workout, WorkoutProgress, WorkoutFeedback
- [ ] 1.2 Configurar regras do Firebase Storage para bucket `workout-pdfs/`
- [ ] 1.3 Adicionar função de upload em `lib/firebase-admin.ts`
- [ ] 1.4 Criar função para gerar signed URLs com expiração

## Success Criteria
- Types exportados e sem erros de compilação
- Função de upload retorna URL do arquivo
- Signed URL válida por 7 dias

## Dependencies
- Firebase Admin SDK já instalado
- Projeto Firebase configurado

## Notes
- PDFs max 10MB
- Estrutura: `workout-pdfs/{trainerId}/{workoutId}/workout.pdf`

<task_context>
<domain>infra/firebase</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>firebase-admin</dependencies>
</task_context>

## Relevant Files
- `lib/firebase-admin.ts` (modificar)
- `types/workout.ts` (criar)

---

# Task 2.0: API Route - Criar Workout (M)

## Objective
Implementar endpoint POST `/api/workouts` para upload de PDF e criação de workout.

## Subtasks
- [ ] 2.1 Criar `app/api/workouts/route.ts` com handler POST
- [ ] 2.2 Implementar validação de arquivo (tipo PDF, tamanho max 10MB)
- [ ] 2.3 Upload do PDF para Firebase Storage
- [ ] 2.4 Criar documento no Firestore collection `workouts`
- [ ] 2.5 Criar documento inicial em `workout_progress`
- [ ] 2.6 Retornar workout criado com URL do PDF

## Success Criteria
- Upload de PDF funciona via multipart/form-data
- Rejeita arquivos não-PDF
- Rejeita arquivos > 10MB
- Documento criado no Firestore com todos os campos
- Response inclui ID e pdfUrl

## Dependencies
- Task 1.0 (Types e Storage setup)

## Notes
- Usar `formidable` ou `next-multipart` para parsing
- Validar trainerId via session/token

<task_context>
<domain>api/workouts</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>firebase-admin, firebase-storage</dependencies>
</task_context>

## Relevant Files
- `app/api/workouts/route.ts` (criar)

---

# Task 3.0: Push Notification Service (M)

## Objective
Implementar serviço de push notifications via Firebase Cloud Messaging.

## Subtasks
- [ ] 3.1 Criar `lib/notifications.ts` com função `sendWorkoutNotification`
- [ ] 3.2 Adicionar campo `fcmToken` na collection `users` (se não existir)
- [ ] 3.3 Integrar envio de push no POST /api/workouts após criação
- [ ] 3.4 Configurar payload com deep link para workout

## Success Criteria
- Push enviado quando workout é criado
- Payload inclui workoutId para deep link
- Graceful fallback se token inválido

## Dependencies
- Task 2.0 (API de criação)
- FCM Server Key configurado no Firebase

## Notes
- Aluno precisa ter fcmToken salvo no Firestore
- Badge count = 1 para iOS

<task_context>
<domain>infra/notifications</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>firebase-admin, fcm</dependencies>
</task_context>

## Relevant Files
- `lib/notifications.ts` (criar)
- `app/api/workouts/route.ts` (modificar)

---

# Task 4.0: API Routes - CRUD Workouts (M)

## Objective
Implementar endpoints GET, PATCH, DELETE para gerenciamento de workouts.

## Subtasks
- [ ] 4.1 GET `/api/workouts` - Listar workouts do trainer
- [ ] 4.2 GET `/api/workouts/[id]` - Detalhes de um workout
- [ ] 4.3 PATCH `/api/workouts/[id]` - Atualizar workout
- [ ] 4.4 DELETE `/api/workouts/[id]` - Arquivar workout
- [ ] 4.5 Implementar filtros (status, studentId)

## Success Criteria
- Trainer só vê seus próprios workouts
- Filtros funcionam corretamente
- Delete faz soft-delete (status = archived)
- Validação de ownership em todas as rotas

## Dependencies
- Task 2.0 (API de criação)

## Notes
- Ordenar por createdAt desc
- Incluir dados de progress no GET detalhado

<task_context>
<domain>api/workouts</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>firebase-admin</dependencies>
</task_context>

## Relevant Files
- `app/api/workouts/route.ts` (modificar)
- `app/api/workouts/[id]/route.ts` (criar)

---

# Task 5.0: API Routes - Progress e Feedback (S)

## Objective
Implementar endpoints para visualizar progresso e feedback dos alunos.

## Subtasks
- [ ] 5.1 GET `/api/workouts/[id]/progress` - Ver progresso do aluno
- [ ] 5.2 GET `/api/workouts/[id]/feedback` - Listar feedbacks
- [ ] 5.3 POST `/api/workouts/[id]/feedback/reply` - Responder feedback

## Success Criteria
- Progress inclui streak e percentComplete
- Feedbacks ordenados por data
- Reply atualiza trainerResponse e respondedAt

## Dependencies
- Task 4.0 (CRUD básico)

## Notes
- Progress é read-only no CMS (aluno atualiza via app)

<task_context>
<domain>api/workouts</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>low</complexity>
<dependencies>firebase-admin</dependencies>
</task_context>

## Relevant Files
- `app/api/workouts/[id]/progress/route.ts` (criar)
- `app/api/workouts/[id]/feedback/route.ts` (criar)

---

# Task 6.0: UI - Upload Workout Modal (L)

## Objective
Criar componente modal para upload de treino no CMS.

## Subtasks
- [ ] 6.1 Criar `components/workouts/UploadWorkoutModal.tsx`
- [ ] 6.2 Implementar drag & drop de PDF
- [ ] 6.3 Adicionar seletor de aluno (dropdown)
- [ ] 6.4 Campos: título, descrição, duração, data início
- [ ] 6.5 Preview do PDF antes de enviar
- [ ] 6.6 Progress bar durante upload
- [ ] 6.7 Feedback visual de sucesso/erro

## Success Criteria
- Drag & drop funciona
- Validação client-side de tipo e tamanho
- Preview do PDF visível
- Loading state durante upload
- Toast de sucesso/erro

## Dependencies
- Task 2.0 (API de upload)

## Notes
- Usar react-dropzone para drag & drop
- Usar react-pdf para preview

<task_context>
<domain>ui/workouts</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>react-dropzone, react-pdf</dependencies>
</task_context>

## Relevant Files
- `components/workouts/UploadWorkoutModal.tsx` (criar)

---

# Task 7.0: UI - Página de Treinos do Aluno (L)

## Objective
Criar interface no CMS para o trainer ver e gerenciar treinos enviados a um aluno.

## Subtasks
- [ ] 7.1 Adicionar tab "Treinos" na página do aluno `/students/[id]`
- [ ] 7.2 Criar `components/workouts/WorkoutsList.tsx` - Lista de treinos
- [ ] 7.3 Criar `components/workouts/WorkoutCard.tsx` - Card individual
- [ ] 7.4 Mostrar status, progresso, último acesso
- [ ] 7.5 Botão "Novo Treino" abre UploadWorkoutModal
- [ ] 7.6 Ações: ver detalhes, arquivar

## Success Criteria
- Lista mostra todos os treinos do aluno
- Cards mostram progresso visual
- Ações funcionam corretamente
- Empty state quando sem treinos

## Dependencies
- Task 4.0 (API CRUD)
- Task 6.0 (Upload Modal)

## Notes
- Reutilizar padrões visuais existentes do CMS

<task_context>
<domain>ui/workouts</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>react</dependencies>
</task_context>

## Relevant Files
- `app/(dashboard)/students/[id]/page.tsx` (modificar)
- `components/workouts/WorkoutsList.tsx` (criar)
- `components/workouts/WorkoutCard.tsx` (criar)

---

# Task 8.0: UI - Workout Detail e Feedback (M)

## Objective
Criar página de detalhes do workout com visualização de progresso e feedbacks.

## Subtasks
- [ ] 8.1 Criar página `/students/[id]/workouts/[workoutId]`
- [ ] 8.2 Mostrar informações do treino e link para PDF
- [ ] 8.3 Visualizar progresso (dias concluídos, streak)
- [ ] 8.4 Lista de feedbacks do aluno
- [ ] 8.5 Formulário para responder feedback

## Success Criteria
- Todas as informações do workout visíveis
- Progress bar visual de conclusão
- Feedbacks listados com histórico
- Reply funciona e atualiza em tempo real

## Dependencies
- Task 5.0 (API Progress/Feedback)
- Task 7.0 (Lista de workouts)

## Notes
- Considerar usar Firestore listener para updates real-time

<task_context>
<domain>ui/workouts</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>react, firestore</dependencies>
</task_context>

## Relevant Files
- `app/(dashboard)/students/[id]/workouts/[workoutId]/page.tsx` (criar)

---

# Task 9.0: Instalar Dependências e Configurar (S)

## Objective
Instalar pacotes necessários e configurar ambiente.

## Subtasks
- [ ] 9.1 Instalar `react-dropzone` para drag & drop
- [ ] 9.2 Instalar `react-pdf` ou `@react-pdf/renderer` para preview
- [ ] 9.3 Verificar versão do Firebase Admin SDK
- [ ] 9.4 Configurar variáveis de ambiente para FCM

## Success Criteria
- Todas as dependências instaladas sem conflitos
- Build passa sem erros
- Variáveis de ambiente documentadas

## Dependencies
- Nenhuma

## Notes
- Deve ser executada antes das tasks de UI

<task_context>
<domain>infra/deps</domain>
<type>configuration</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>npm</dependencies>
</task_context>

## Relevant Files
- `package.json` (modificar)

---

## Task Summary

| Task | Título | Size | Deps | Status |
|------|--------|------|------|--------|
| 1.0 | Firebase Storage e Types | S | - | pending |
| 2.0 | API Route - Criar Workout | M | 1.0 | pending |
| 3.0 | Push Notification Service | M | 2.0 | pending |
| 4.0 | API Routes - CRUD Workouts | M | 2.0 | pending |
| 5.0 | API Routes - Progress/Feedback | S | 4.0 | pending |
| 6.0 | UI - Upload Workout Modal | L | 2.0 | pending |
| 7.0 | UI - Página de Treinos | L | 4.0, 6.0 | pending |
| 8.0 | UI - Workout Detail | M | 5.0, 7.0 | pending |
| 9.0 | Instalar Dependências | S | - | pending |

## Recommended Execution Order

1. **Task 9.0** - Instalar dependências
2. **Task 1.0** - Setup types e storage
3. **Task 2.0** - API criar workout
4. **Task 3.0** - Push notifications
5. **Task 4.0** - API CRUD
6. **Task 5.0** - API progress/feedback
7. **Task 6.0** - UI upload modal
8. **Task 7.0** - UI lista de treinos
9. **Task 8.0** - UI detalhes

---

**Total Estimado:** 8 tasks (2S + 4M + 2L)
**Autor:** FitToday Team
**Data:** 2026-02-04
