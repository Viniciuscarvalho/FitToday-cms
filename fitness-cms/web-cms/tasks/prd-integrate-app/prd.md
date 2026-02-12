# Product Requirements Document (PRD)
# FitToday - Integração CMS ↔ App iOS

## Overview

Integração entre o CMS web (usado por Personal Trainers) e o aplicativo iOS (usado por alunos) para permitir que personal trainers compartilhem treinos em PDF com seus alunos. O personal faz upload do PDF no CMS e o aluno recebe uma notificação push, podendo visualizar o treino, marcar progresso, enviar feedback e acompanhar seu histórico.

**Problema:** Atualmente não há uma forma integrada de o personal trainer enviar treinos para seus alunos através da plataforma FitToday.

**Solução:** Sistema de envio de treinos via PDF do CMS para o app iOS com notificações push, tracking de progresso e feedback bidirecional.

## Objectives

### Métricas de Sucesso
- 80% dos treinos enviados são visualizados em até 24h
- 70% dos alunos marcam pelo menos 1 treino como concluído por semana
- Taxa de retenção de alunos aumenta 20%
- NPS da funcionalidade > 8

### Objetivos de Negócio
- Aumentar engajamento entre personal e aluno
- Reduzir churn de alunos
- Criar valor diferenciado vs competidores
- Centralizar comunicação na plataforma FitToday

## User Stories

### Personal Trainer (CMS Web)
1. **US-001:** Como personal trainer, quero fazer upload de um PDF de treino para enviar ao meu aluno, para que ele tenha acesso ao programa de treino
2. **US-002:** Como personal trainer, quero selecionar qual aluno receberá o treino, para enviar treinos personalizados
3. **US-003:** Como personal trainer, quero ver se o aluno visualizou e completou o treino, para acompanhar o engajamento
4. **US-004:** Como personal trainer, quero receber feedback do aluno sobre o treino, para ajustar os próximos programas

### Aluno (App iOS)
5. **US-005:** Como aluno, quero receber notificação push quando meu personal enviar um treino novo, para não perder atualizações
6. **US-006:** Como aluno, quero visualizar o PDF do treino no app, para saber o que fazer no treino
7. **US-007:** Como aluno, quero marcar exercícios/dias como concluídos, para acompanhar meu progresso
8. **US-008:** Como aluno, quero enviar feedback ao personal sobre o treino, para comunicar dificuldades ou dúvidas
9. **US-009:** Como aluno, quero ver meu histórico de treinos recebidos, para consultar treinos anteriores
10. **US-010:** Como aluno, quero ver meu progresso geral (streak, % conclusão), para me manter motivado

## Core Features

### F1: Upload e Envio de Treino (CMS)
**O que faz:** Permite que o personal faça upload de um PDF e envie para um aluno específico.

**Por que é importante:** É a funcionalidade core que habilita toda a integração.

**Como funciona:**
1. Personal acessa página de aluno no CMS
2. Clica em "Enviar Treino"
3. Faz upload do PDF (max 10MB)
4. Adiciona título e descrição opcional
5. Confirma envio
6. Sistema salva no Firebase Storage e cria registro no Firestore
7. Dispara push notification para o aluno

**Requisitos Funcionais:**
- RF-001: Upload de PDF com validação de tipo e tamanho (max 10MB)
- RF-002: Campos: título (obrigatório), descrição (opcional), data de início
- RF-003: Seleção de aluno destinatário
- RF-004: Preview do PDF antes de enviar
- RF-005: Confirmação de envio com feedback visual

### F2: Recebimento e Visualização (App iOS)
**O que faz:** Aluno recebe push e visualiza o treino no app.

**Por que é importante:** Permite que o aluno acesse o treino de forma conveniente.

**Como funciona:**
1. App recebe push notification com deep link
2. Ao abrir, mostra card do novo treino na home
3. Aluno toca para abrir o viewer de PDF
4. PDF é baixado e cacheado localmente
5. Marca como "visualizado" no Firestore

**Requisitos Funcionais:**
- RF-006: Push notification com título do treino
- RF-007: Badge/indicador de treino não lido
- RF-008: PDF viewer nativo com zoom e scroll
- RF-009: Download para visualização offline
- RF-010: Marcar automaticamente como visualizado

### F3: Progress Tracking (App iOS)
**O que faz:** Aluno marca exercícios/dias como concluídos.

**Por que é importante:** Gamificação e tracking motivam o aluno.

**Como funciona:**
1. Treino tem lista de dias/semanas associados
2. Aluno marca cada dia como "concluído"
3. Progresso é sincronizado com Firestore
4. Personal vê progresso no CMS

**Requisitos Funcionais:**
- RF-011: Checkbox para marcar dia/semana como concluído
- RF-012: Barra de progresso visual (% conclusão)
- RF-013: Streak counter (dias consecutivos)
- RF-014: Sincronização em tempo real com Firestore

### F4: Feedback Bidirecional
**O que faz:** Aluno envia feedback, personal recebe notificação.

**Por que é importante:** Comunicação melhora a experiência e os resultados.

**Como funciona:**
1. Aluno escreve feedback sobre o treino
2. Feedback é salvo no Firestore
3. Personal recebe notificação/email
4. Personal pode responder pelo CMS

**Requisitos Funcionais:**
- RF-015: Campo de texto para feedback (até 500 caracteres)
- RF-016: Opções rápidas (muito fácil, adequado, muito difícil)
- RF-017: Notificação para personal no CMS
- RF-018: Histórico de feedbacks no treino

### F5: Histórico e Analytics
**O que faz:** Visualização de treinos anteriores e estatísticas.

**Por que é importante:** Tracking de longo prazo aumenta retenção.

**Como funciona:**
1. Lista de todos os treinos recebidos
2. Filtro por período/status
3. Estatísticas de conclusão
4. Exportar histórico (futuro)

**Requisitos Funcionais:**
- RF-019: Lista cronológica de treinos
- RF-020: Filtro por status (ativo, concluído, em andamento)
- RF-021: Card com resumo de cada treino
- RF-022: Estatísticas: total treinos, % conclusão média, melhor streak

## User Experience

### Personas

**Personal Trainer (Ana, 32 anos)**
- Gerencia 15-30 alunos
- Cria treinos em PDF no Google Docs/Canva
- Precisa de forma rápida de enviar e acompanhar
- Usa laptop para trabalhar

**Aluno (Carlos, 28 anos)**
- Treina 4-5x por semana
- Quer praticidade no celular
- Gosta de ver progresso e conquistas
- Usa iPhone como device principal

### User Flows

**Flow 1: Envio de Treino (Personal)**
```
CMS Home → Alunos → Selecionar Aluno → Enviar Treino → Upload PDF → Preencher Info → Confirmar → Sucesso
```

**Flow 2: Receber e Ver Treino (Aluno)**
```
Push Notification → Abre App → Home (badge) → Toca Card → PDF Viewer → Marca como Visto
```

**Flow 3: Marcar Progresso (Aluno)**
```
Home → Treino Ativo → Ver Dias → Marca Dia X Concluído → Atualiza Progresso → Celebração
```

### UI/UX Considerations

**CMS (Web):**
- Modal de upload com drag & drop
- Progress bar durante upload
- Confirmação visual de envio
- Dashboard com status de visualização/conclusão

**App iOS:**
- Card de treino na home com preview
- PDF viewer fullscreen com controles
- Checkboxes satisfatórios (haptic feedback)
- Animações de progresso e celebração
- Empty states informativos

## High-Level Technical Constraints

### Integrações Obrigatórias
- **Firebase Firestore:** Database para treinos, progresso, feedback
- **Firebase Storage:** Armazenamento de PDFs
- **Firebase Cloud Messaging (FCM):** Push notifications
- **Firebase Auth:** Autenticação existente

### Performance/Escalabilidade
- PDFs: max 10MB por arquivo
- Tempo de upload: < 30 segundos para 10MB
- Push notification: < 5 segundos após envio
- Sincronização de progresso: tempo real

### Segurança
- PDFs acessíveis apenas pelo aluno destinatário
- URLs assinadas com expiração para Storage
- Validação de ownership em todas as operações

### Compatibilidade
- iOS 15+ (app)
- Browsers modernos (CMS)
- Offline support para visualização de PDFs baixados

## Non-Goals (Out of Scope)

### Não incluído nesta versão:
- ❌ Criação de treino estruturado no CMS (apenas PDF)
- ❌ Chat em tempo real entre personal e aluno
- ❌ Vídeos de exercícios
- ❌ Integração com Apple Health/HealthKit
- ❌ Múltiplos arquivos por treino
- ❌ Treinos em grupo (apenas 1:1)
- ❌ App Android (apenas iOS por agora)

### Considerações Futuras:
- Criação de treino estruturado no CMS
- Templates de treino reutilizáveis
- Biblioteca de exercícios com vídeos
- Integração com wearables

## Open Questions

1. **Duração do treino:** O personal deve definir duração (4 semanas, 8 semanas) ou é indefinido?
2. **Múltiplos treinos ativos:** Aluno pode ter mais de um treino ativo simultaneamente?
3. **Arquivamento:** Treinos antigos são arquivados automaticamente ou mantidos indefinidamente?
4. **Permissões:** Aluno pode compartilhar/exportar o PDF ou é bloqueado?

---

**Autor:** FitToday Team
**Data:** 2026-02-04
**Versão:** 1.0
