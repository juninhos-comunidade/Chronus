# Chronus — Plano de Sprints

> Documento vivo. Actualizado a cada sprint.
> Fundações do backend já estão feitas (módulo `staff` completo como referência).

---

## Equipa

| Membro | Área |
|--------|------|
| **Kauê Weber** | Frontend |
| **Felipe** | Frontend |
| **Sabrina** | Frontend / UI |
| **Ndulo** | Backend |
| **Vitoria** | Backend |
| **Gustavo** | Backend |

---

## Estado actual (pós-fundações)

O que já existe e serve de referência para todos:

```
packages/
├── admin-frontend/
├── frontend/
├── shared/
└── backend/
    └── src/
        ├── config/
        ├── db/                         schema.ts + migrations
        ├── middlewares/                staff-auth + rate-limit
        ├── shared/
        │   ├── auth/                   JWT sign/verify
        │   ├── crypto/                 encryption + hash
        │   ├── logger/                 logger estruturado
        │   ├── queue/                  BullMQ QueueManager
        │   ├── result/                 Ok() / Err() / ErrorFactory
        │   ├── types/
        │   ├── upload/
        │   └── utils/
        └── modules/
            ├── activity/               audit listener + writer
            ├── auth/                   (a arrancar)
            ├── staff/                  ✅ completo — referência
            └── users/                  (a arrancar)
```

**Módulo `staff` é o template.** Antes de começar qualquer módulo novo, ler o código dele.

---

## Anatomia de um módulo

Todo o módulo segue exactamente esta estrutura:

```
modules/<nome>/
├── application/
│   ├── dtos/<nome>.dto.ts          tipos TS + schemas Zod
│   ├── ports/<nome>.port.ts        interfaces IRepository + IService
│   └── services/
│       └── <nome>.service.ts       lógica de negócio pura
├── events/
│   └── <nome>.events.ts            QueueManager + emit helpers
└── infrastructure/
    ├── persistence/
    │   └── <nome>.repository.ts    implementação Drizzle
    └── http/
        └── <nome>.controller.ts    Elysia routes
```

**Ordem de implementação sempre igual:**
1. `dtos/` — tipos e validação Zod
2. `ports/` — interfaces (nunca implementação)
3. `persistence/` — repositório concreto
4. `services/` — lógica de negócio (só usa interfaces, nunca repositório directo)
5. `events/` — QueueManager + emitters fire-and-forget
6. `http/` — controller Elysia (bootstrap de dependências aqui)

---

## Convenções

- Tamanho: S = 1–2h · M = 3–4h · L = 5–8h · XL = dia inteiro
- Branch: `feature/<módulo>-<o-que-faz>` ou `fix/<módulo>-<o-que-corrige>`
- PR vai sempre para `main` — nunca push directo
- Definição de done: código revisto por 1 pessoa + merged

---

## Sprint 0 — ✅ Completo (Referência)

> Fundações: stack, shared, módulo staff, seed, middleware.

O que foi entregue serve de base para todas as sprints seguintes. Qualquer dúvida de padrão → ver `modules/staff/`.

---

## Sprint 1 — Users & Auth (Fase 1)

> Objectivo: utilizadores podem registar-se, fazer login com email/password e com Google OAuth.

**Duração:** 1 semana
**Meta:** `POST /auth/register`, `POST /auth/login`, `GET /auth/google/callback` funcionais + páginas no frontend

---

### Backend

#### Ndulo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-01 | `users/application/dtos/user.dto.ts` — tipos + schemas Zod (RegisterDTO, LoginDTO, UpdateProfileDTO, UserResponseDTO) | S | `feature/users-dtos` |
| B-02 | `users/application/ports/user.port.ts` — IUserRepository + IUserService | S | `feature/users-ports` |
| B-03 | `users/infrastructure/persistence/user.repository.ts` — implementação Drizzle (create, findById, findByEmailHash, findByGoogleId, update, softDelete) | M | `feature/users-repository` |
| B-04 | `users/application/services/user.service.ts` — getById, updateProfile, deleteAccount | M | `feature/users-service` |
| B-05 | `users/infrastructure/http/user.controller.ts` — GET /users/me, PATCH /users/me, DELETE /users/me | S | `feature/users-routes` |

#### Vitoria

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-06 | `auth/application/dtos/auth.dto.ts` — tipos + schemas Zod | S | `feature/auth-dtos` |
| B-07 | `auth/application/ports/auth.port.ts` — IAuthService | S | `feature/auth-ports` |
| B-08 | `auth/application/services/auth.service.ts` — `register`: hash email → lookup → hash password → withTransaction(users + sessions) | L | `feature/auth-register` |
| B-09 | `auth/application/services/auth.service.ts` — `login`: lookup emailHash → comparePassword → criar sessão | M | `feature/auth-login` |
| B-10 | `auth/application/services/auth.service.ts` — `refreshToken` + `revokeSession` | M | `feature/auth-refresh` |

#### Gustavo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-11 | Google OAuth client em `shared/auth/` — trocar code por perfil Google | M | `feature/google-oauth-client` |
| B-12 | `auth/application/services/auth.service.ts` — `loginViaGoogle`: code → perfil → lookup googleId/emailHash → withTransaction | L | `feature/auth-google` |
| B-13 | `auth/events/auth.events.ts` — QueueManager + emitters (user.registered, user.login) | S | `feature/auth-events` |
| B-14 | `auth/infrastructure/http/auth.controller.ts` — todas as rotas: /auth/register, /login, /refresh, /logout, /google, /google/callback | M | `feature/auth-routes` |
| B-15 | `middlewares/user-auth.middleware.ts` — verifica token de sessions, verifica user.status === 'active' | M | `feature/user-middleware` |

---

### Frontend

#### Kauê

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-01 | Setup frontend: Vite + React + TypeScript + Tailwind + router base | M | `feature/frontend-setup` |
| F-02 | Hook `useAuth` — estado global, token em memória, refresh automático, logout | M | `feature/auth-hook` |
| F-03 | Página de login — form email + password + botão Google OAuth | M | `feature/login-page` |
| F-04 | Página de registo — form nome + email + password + confirmação | M | `feature/register-page` |

#### Felipe

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-05 | Design system base — tokens de cor, tipografia, Button, Input, Label, Badge | L | `feature/design-system` |
| F-06 | Auth guard — HOC/hook que redireciona para /login se sem token válido | S | `feature/auth-guard` |
| F-07 | Página de perfil — GET /users/me + form PATCH /users/me (nome, phone, timezone, locale) | M | `feature/profile-page` |

#### Sabrina

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-08 | Componente Toast/Snackbar global — sucesso, erro, info, warning | S | `feature/toast` |
| F-09 | Página callback Google OAuth — processa `?code=` da URL, chama /auth/google/callback, redireciona | S | `feature/google-callback` |
| F-10 | Layout base autenticado — sidebar + header + área de conteúdo + slot de notificações | M | `feature/app-layout` |

---

## Sprint 2 — Workspaces (Fase 2)

> Objectivo: criação de workspace, convite de membros por email, aceitação de convite, gestão de roles.

**Duração:** 1 semana
**Meta:** user cria workspace, convida membro, membro aceita e entra

---

### Backend

#### Ndulo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-16 | `workspaces/application/dtos/workspace.dto.ts` — todos os tipos + schemas | M | `feature/workspace-dtos` |
| B-17 | `workspaces/application/ports/workspace.port.ts` — IWorkspaceRepository + IWorkspaceService | S | `feature/workspace-ports` |
| B-18 | `workspaces/infrastructure/persistence/workspace.repository.ts` — workspace CRUD + findBySlug + findByUser | M | `feature/workspace-repository` |
| B-19 | `workspaces/infrastructure/persistence/workspace-member.repository.ts` — addMember, findMember, listMembers, updateMemberRole, removeMember | M | `feature/workspace-member-repository` |

#### Vitoria

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-20 | `workspaces/infrastructure/persistence/invite.repository.ts` — createInvite, findInviteByToken, findPendingInvite, acceptInvite, listInvites | M | `feature/invite-repository` |
| B-21 | `workspaces/application/services/workspace.service.ts` — create (verify slug + withTransaction workspace + member admin) | M | `feature/workspace-create-service` |
| B-22 | `workspaces/application/services/workspace.service.ts` — inviteMember (verify role + pending invite + email activo + token 72h) | M | `feature/workspace-invite-service` |
| B-23 | `workspaces/application/services/workspace.service.ts` — acceptInvite (verify token + expiry + withTransaction invite + member) | M | `feature/workspace-accept-service` |

#### Gustavo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-24 | `workspaces/application/services/workspace.service.ts` — updateMemberRole, removeMember, leaveWorkspace, update, delete, getById, listMyWorkspaces | M | `feature/workspace-member-service` |
| B-25 | `workspaces/events/workspace.events.ts` — QueueManager + emitters (workspace.created, member.invited, member.joined, etc.) | S | `feature/workspace-events` |
| B-26 | `workspaces/infrastructure/http/workspace.controller.ts` — todas as rotas de workspace + membros + invites conforme Action Plan | L | `feature/workspace-routes` |
| B-27 | `notifications/` module setup — INotificationService + Resend client + notifyMemberInvited | M | `feature/notifications-setup` |

---

### Frontend

#### Kauê

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-11 | Página de criação de workspace — form nome + slug + timezone + sprint duration | M | `feature/create-workspace` |
| F-12 | Página de listagem de workspaces — cards com nome, slug, role do utilizador | M | `feature/workspaces-list` |
| F-13 | Página de detalhe do workspace — header com info + tabs (Membros, Invites, Configurações) | L | `feature/workspace-detail` |

#### Felipe

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-14 | Modal de convidar membro — input email + select role + estado de loading/sucesso | M | `feature/invite-modal` |
| F-15 | Página de aceitação de convite via token — /invites/:token/accept, criar conta se não existe | M | `feature/accept-invite-page` |
| F-16 | Modal de confirmação genérico — reutilizável em "remover membro", "sair", "apagar" | S | `feature/confirm-modal` |

#### Sabrina

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-17 | Componente MemberList — avatar + nome + role badge + menu de acções (alterar role, remover) | M | `feature/member-list` |
| F-18 | Componente RoleBadge — Admin / Lead / Member com cores distintas | S | `feature/role-badge` |
| F-19 | Componente InviteList — lista de invites pendentes com token, data de expiração, acção de cancelar | M | `feature/invite-list` |

---

## Sprint 3 — Sprints & Tasks (Fase 3)

> Objectivo: board kanban, gestão de sprints, tarefas no backlog, histórico de mudanças.

**Duração:** 1 semana
**Meta:** lead cria e inicia sprint; member vê kanban e move tarefas; histórico registado

---

### Backend

#### Ndulo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-28 | `sprints/application/dtos/sprint.dto.ts` + `ports/sprint.port.ts` | S | `feature/sprint-dtos-ports` |
| B-29 | `sprints/infrastructure/persistence/sprint.repository.ts` — CRUD + findActive + metrics | M | `feature/sprint-repository` |
| B-30 | `sprints/application/services/sprint.service.ts` — create, update, getById, listByWorkspace, getActiveSprint | M | `feature/sprint-crud-service` |
| B-31 | `sprints/application/services/sprint.service.ts` — start: verify sem sprint activo + withTransaction(sprint + activity_log) | M | `feature/sprint-start-service` |

#### Vitoria

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-32 | `sprints/application/services/sprint.service.ts` — complete: calcular métricas + withTransaction(sprint + metrics + tasks carry-over + activity_log) | XL | `feature/sprint-complete-service` |
| B-33 | `sprints/application/services/sprint.service.ts` — cancel: withTransaction(sprint + tasks → backlog) | M | `feature/sprint-cancel-service` |
| B-34 | `sprints/events/sprint.events.ts` + `sprints/infrastructure/http/sprint.controller.ts` | M | `feature/sprint-routes` |

#### Gustavo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-35 | `tasks/application/dtos/task.dto.ts` + `ports/task.port.ts` | M | `feature/task-dtos-ports` |
| B-36 | `tasks/infrastructure/persistence/task.repository.ts` — CRUD + comments + history + getLastPosition | L | `feature/task-repository` |
| B-37 | `tasks/application/services/task.service.ts` — create, update, delete, getById, listByWorkspace (cada um com withTransaction + task_history) | L | `feature/task-crud-service` |
| B-38 | `tasks/application/services/task.service.ts` — updateStatus, blockTask, unblockTask, moveToSprint, reorderTasks | M | `feature/task-status-service` |
| B-39 | `tasks/application/services/task.service.ts` — comments (add, edit, delete, list) | S | `feature/task-comments-service` |
| B-40 | `tasks/events/task.events.ts` + `tasks/infrastructure/http/task.controller.ts` — todas as rotas | L | `feature/task-routes` |

---

### Frontend

#### Kauê

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-20 | Board Kanban — colunas por status, drag & drop de cards entre colunas (dnd-kit) | XL | `feature/kanban-board` |
| F-21 | Sidebar de sprint activo — nome, goal, datas, barra de progresso, botões start/complete (Lead) | M | `feature/sprint-sidebar` |

#### Felipe

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-22 | Modal de criação/edição de tarefa — título, descrição, prioridade, assignee, estimativa, sprint, dueDate, tags | L | `feature/task-modal` |
| F-23 | Modal de criação de sprint — nome, goal, datas, capacidade | M | `feature/sprint-modal` |
| F-24 | Página de backlog — lista de tasks com sprintId null, filtros, acção "mover para sprint" | M | `feature/backlog-page` |

#### Sabrina

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-25 | TaskCard no kanban — título, prioridade, assignee avatar, badge de bloqueio, indicador de tempo | M | `feature/task-card` |
| F-26 | Painel de detalhe de tarefa (sheet lateral) — info completa + tab comentários + tab histórico | L | `feature/task-detail-panel` |
| F-27 | Componente TaskHistory — timeline com actor, campo alterado, valor antes/depois | M | `feature/task-history` |

---

## Sprint 4 — Timer & Badges (Fase 4)

> Objectivo: cronómetro server-side, modo pomodoro, badges desbloqueados automaticamente.

**Duração:** 1 semana
**Meta:** member inicia/para cronómetro numa tarefa; badges desbloqueados via evento

---

### Backend

#### Ndulo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-41 | `timer/application/dtos/timer.dto.ts` + `ports/timer.port.ts` | S | `feature/timer-dtos-ports` |
| B-42 | `timer/infrastructure/persistence/time-entry.repository.ts` — CRUD + findActive + somas + contagens pomodoro | M | `feature/timer-repository` |
| B-43 | `timer/application/services/timer.service.ts` — start: verify membro + tarefa + sem timer activo | M | `feature/timer-start-service` |
| B-44 | `timer/application/services/timer.service.ts` — stop: calcular duration + withTransaction(time_entry + tasks.actualMinutes) | M | `feature/timer-stop-service` |
| B-45 | `timer/application/services/timer.service.ts` — completePomodoroRound, createManualEntry, deleteEntry | M | `feature/timer-extras-service` |

#### Vitoria

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-46 | `timer/events/timer.events.ts` + `timer/infrastructure/http/timer.controller.ts` — todas as rotas | M | `feature/timer-routes` |
| B-47 | `badges/application/dtos/badge.dto.ts` + `ports/badge.port.ts` | S | `feature/badge-dtos-ports` |
| B-48 | `badges/infrastructure/persistence/badge.repository.ts` — definitions + user badges | M | `feature/badge-repository` |
| B-49 | `badges/application/services/badge.service.ts` — checkAndAward: fire-and-forget, avaliar condições, idempotência via unique constraint | L | `feature/badge-check-award` |

#### Gustavo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-50 | Seed de badge definitions — Primeiro Foco, Em Chama, Velocidade, Construtor, Sprint Perfeito, Desbloqueador | S | `feature/badge-seed` |
| B-51 | `badges/application/services/badge.service.ts` — listDefinitions, listUserBadges, listWorkspaceBadges | S | `feature/badge-queries-service` |
| B-52 | `badges/events/badge.events.ts` + `badges/infrastructure/http/badge.controller.ts` — rotas user + rotas staff (criar/editar definições) | M | `feature/badge-routes` |
| B-53 | BullMQ job `check-idle-tasks` — cron horário, detecta tasks in_progress sem time_entry nas últimas 4h → emite alert | M | `feature/idle-tasks-job` |

---

### Frontend

#### Kauê

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-28 | Widget de cronómetro — botão start/stop, tempo decorrido em tempo real (polling /timer/active), indicador de tarefa activa | L | `feature/timer-widget` |
| F-29 | Modo Pomodoro — timer visual 25min, alerta de pausa, contagem de ciclos, botão completar ciclo | L | `feature/pomodoro-mode` |

#### Felipe

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-30 | Histórico de time entries por tarefa — lista de sessões com duração, tipo (manual/timer/pomodoro), notas | M | `feature/timer-history` |
| F-31 | Formulário de entrada manual de tempo — date picker startedAt + endedAt + notas + validação | M | `feature/manual-entry-form` |

#### Sabrina

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-32 | Página de badges do workspace — grid locked/unlocked com categoria, nome, ícone | M | `feature/badges-page` |
| F-33 | Modal de celebração de badge — aparece ao receber notificação badge.unlocked, animação + nome + descrição | M | `feature/badge-unlock-modal` |
| F-34 | BadgeCard — ícone, nome, categoria, data de desbloqueio vs estado locked com opacity | S | `feature/badge-card` |

---

## Sprint 5 — Analytics & Notifications (Fase 5)

> Objectivo: dashboard com métricas do sprint, burndown chart, notificações in-app.

**Duração:** 1 semana
**Meta:** lead vê dashboard em tempo real; todos recebem notificações por polling

---

### Backend

#### Ndulo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-54 | `analytics/application/ports/analytics.port.ts` + `dtos/analytics.dto.ts` | S | `feature/analytics-dtos-ports` |
| B-55 | `analytics/application/services/analytics.service.ts` — getDashboard: tasks por status + sprint activo + top 5 contribuidores + últimas 10 actividades | L | `feature/analytics-dashboard-service` |
| B-56 | `analytics/application/services/analytics.service.ts` — getMemberStats (por userId + filtros sprint/período) | M | `feature/analytics-member-stats` |
| B-57 | `analytics/application/services/analytics.service.ts` — getSprintBurndown: calculado a partir de task_history | M | `feature/analytics-burndown-service` |

#### Vitoria

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-58 | `analytics/application/services/analytics.service.ts` — getWorkspaceStats: usa daily_snapshots para histórico + tempo real para hoje | M | `feature/analytics-workspace-stats` |
| B-59 | BullMQ job `compute-daily-snapshot` — cron 00:05 UTC por workspace activo, upsert em daily_snapshots | M | `feature/daily-snapshot-job` |
| B-60 | `analytics/infrastructure/http/analytics.controller.ts` — todas as rotas conforme Action Plan | M | `feature/analytics-routes` |

#### Gustavo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-61 | `notifications/application/services/notification.service.ts` — sendEmail (Resend) + createInApp + todos os helpers semânticos | L | `feature/notifications-service` |
| B-62 | Workers BullMQ — `send-email` (concurrency 5, retry 3) + `create-in-app-notification` (concurrency 10, retry 2) | M | `feature/notification-workers` |
| B-63 | `notifications/infrastructure/http/notification.controller.ts` — GET/PATCH/DELETE /notifications | M | `feature/notifications-routes` |

---

### Frontend

#### Kauê

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-35 | Dashboard principal — cards de métricas (tasks por status, tempo logado, bloqueados, idle) + sprint activo | L | `feature/dashboard-page` |
| F-36 | Burndown chart — linha ideal vs real, usando /analytics/burndown/:sprintId (Recharts ou Chart.js) | L | `feature/burndown-chart` |

#### Felipe

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-37 | Secção top contribuidores — avatar + nome + tasks, tempo e pomodoros do sprint activo | M | `feature/top-contributors` |
| F-38 | Página de stats do workspace — gráfico de actividade diária + filtros de período (from/to) | M | `feature/workspace-stats-page` |

#### Sabrina

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-39 | Sino de notificações no header — badge com contagem, dropdown com as últimas 5 | M | `feature/notifications-bell` |
| F-40 | Página de centro de notificações — lista completa, marcar como lida, apagar, filtros | M | `feature/notifications-center` |
| F-41 | Hook `useNotifications` — polling a cada 30s, actualiza contador e lista | S | `feature/notifications-hook` |

---

## Sprint 6 — Events & Observability + Staff Dashboard (Fase 6)

> Objectivo: camada de eventos completa, activity log, staff consegue monitorizar a plataforma.

**Duração:** 1 semana
**Meta:** todos os eventos persistem em activity_log; staff dashboard operacional

---

### Backend

#### Ndulo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-64 | Ligar event emitters de todos os módulos ao worker `domain-events` — side effects reactivos (notificações + badge checks) conforme mapa do Action Plan | L | `feature/reactive-effects` |
| B-65 | Staff routes — workspaces: GET /staff/workspaces, /staff/workspaces/:id, suspend, reactivate | M | `feature/staff-workspace-routes` |
| B-66 | Staff routes — users: GET /staff/users, /staff/users/:id, ban, unban | M | `feature/staff-user-routes` |

#### Vitoria

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-67 | Staff route — GET /staff/metrics (workspaces activos, users, tasks criadas/concluídas, sprints completados) | M | `feature/staff-metrics-route` |
| B-68 | Staff route — GET /staff/activity-log com filtros completos (actorType, action, entityType, workspaceId, from, to) | M | `feature/staff-activity-log-route` |
| B-69 | Rate limiting middleware por IP já existe — validar cobertura em todas as rotas públicas | S | `feature/rate-limit-audit` |

#### Gustavo

| # | Task | Tam | Branch |
|---|------|-----|--------|
| B-70 | Staff badge routes — GET /staff/badges, POST /staff/badges, PATCH /staff/badges/:code | S | `feature/staff-badge-routes` |
| B-71 | Testes de integração E2E — auth flow + workspace flow + timer flow | L | `feature/e2e-tests` |
| B-72 | Docker Compose review + variáveis de ambiente documentadas + README de setup | M | `feature/devops-docs` |

---

### Frontend

#### Kauê

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-42 | Dashboard admin-frontend — overview métricas da plataforma (usa /staff/metrics) | M | `feature/staff-dashboard` |
| F-43 | Página activity log (staff) — tabela com filtros actor, action, entityType, workspace, datas | M | `feature/staff-activity-log-page` |

#### Felipe

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-44 | Página de gestão de workspaces (staff) — listagem + filtros status + suspend/reactivate | M | `feature/staff-workspaces-page` |
| F-45 | Página de gestão de users (staff) — listagem + filtros + ban/unban | M | `feature/staff-users-page` |

#### Sabrina

| # | Task | Tam | Branch |
|---|------|-----|--------|
| F-46 | Polimento global — consistência visual, estados de loading, empty states, error boundaries | L | `feature/ui-polish` |
| F-47 | Feed de actividade do workspace — GET /workspaces/:id/activity, paginação, formatação por tipo de evento | M | `feature/activity-feed` |
| F-48 | Responsividade — kanban e dashboard em viewport estreito | M | `feature/responsive` |

---

## Resumo por membro

**Kauê** — setup frontend, auth hook, login/registo, kanban board, timer widget, pomodoro, dashboard, burndown, staff dashboard

**Felipe** — design system, auth guard, perfil, modais (invite, task, sprint, confirm), backlog, timer history, top contributors, staff pages

**Sabrina** — toast, layout, member list, role badge, task card, task detail, badges, notifications bell/center, polish, activity feed

**Ndulo** — users dtos/ports/repository/service/routes, sprint dtos/repository/crud+start service, timer dtos/repository/start+stop service, analytics dashboard/member/burndown, reactive effects, staff workspace/user routes

**Vitoria** — auth register/login/refresh, workspace invite/accept/member-role, sprint complete/cancel/routes, timer routes/badge dtos/repository/checkAndAward, analytics workspace-stats/daily-snapshot/routes, staff metrics/activity-log routes

**Gustavo** — google oauth, auth google/events/routes/middleware, workspace member service/events/routes/notifications setup, task repository/services/events/routes, badge seed/queries/events/routes/idle-job, notifications service/workers/routes, staff badge routes, E2E tests, devops docs