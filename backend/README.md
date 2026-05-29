# Action Plan — Chronus

---

## Stack & Padrões

```
Framework:     Elysia + Bun
DB:            PostgreSQL + Drizzle ORM
Auth:          JWT + Argon2 + Google OAuth
Queue/Events:  BullMQ — só para side effects assíncronos, nunca para cross-module
Cross-module:  Dependency Injection directa — interface do módulo A passada ao service do módulo B
Transacções:   withTransaction() no service, todos os repository methods aceitam DbOrTx
Result:        Ok() / Err() / ErrorFactory em toda a lógica de negócio
Email:         Resend
```

---

## Arquitectura de Pastas

```
src/
├── db/
│   └── schema.ts                          ✅ feito
├── shared/
│   ├── result/                            Ok() / Err() / ErrorFactory
│   ├── queue/                             BullMQ setup + worker base
│   ├── crypto/                            Argon2 + hash helpers
│   ├── audit/                             activity_log writer
│   ├── logger/                            logger estruturado
│   └── auth/                             JWT sign/verify + Google OAuth client
├── middlewares/
│   ├── auth.middleware.ts                 dois paths: user | staff
│   └── rate-limit.middleware.ts           por IP
└── modules/
    ├── staff/                             ← Fase 0
    ├── users/                             ← Fase 1
    ├── auth/                              ← Fase 1
    ├── workspaces/                        ← Fase 2  (workspaces, members, invites)
    ├── sprints/                           ← Fase 3  (sprints, métricas)
    ├── tasks/                             ← Fase 3  (tasks, comments, history)
    ├── timer/                             ← Fase 4  (time entries, pomodoro)
    ├── badges/                            ← Fase 4  (definitions, user badges)
    ├── analytics/                         ← Fase 5  (daily snapshots, reports)
    ├── notifications/                     ← Fase 5
    └── events/                            ← Fase 6  (observability layer)
```

---

## Mapa de Dependências Cross-Module (DI)

```
staff
  └── (sem dependências externas)

users
  └── (sem dependências externas)

auth
  ├── IUserRepository          (login/register user)
  └── IStaffRepository         (login staff dashboard)

workspaces
  └── IUserRepository          (verificar user existe ao convidar membro)

sprints
  └── IWorkspaceRepository     (verificar workspace existe e user é membro)

tasks
  ├── IWorkspaceRepository     (verificar membro do workspace)
  └── ISprintRepository        (verificar sprint existe e está activo ao assignar tarefa)

timer
  ├── ITaskRepository          (verificar tarefa existe e user tem acesso)
  └── IWorkspaceRepository     (verificar membro)

badges
  ├── ITimeEntryRepository     (calcular pomodoros e horas para condições)
  ├── ITaskRepository          (calcular tarefas fechadas para condições)
  └── ISprintRepository        (calcular sprint completion rate para condições)

analytics
  ├── ITaskRepository          (agregar métricas de tarefas)
  ├── ITimeEntryRepository     (agregar tempo logado)
  └── ISprintRepository        (dados do sprint activo/histórico)

notifications
  └── (sem dependências de negócio — só clientes externos: Resend)

events (workers)
  └── (só escrevem em activity_log — sem DI de negócio)
```

---

## Mapa de Transacções

| Service | Método | Tabelas | Razão |
|---|---|---|---|
| `authService` | `registerUser` | `users` + `sessions` | User nunca existe sem sessão inicial |
| `authService` | `loginViaGoogle` | `users` + `sessions` | Criar/ligar conta + sessão atomicamente |
| `workspacesService` | `create` | `workspaces` + `workspace_members` | Workspace sem owner como membro admin é inválido |
| `workspacesService` | `acceptInvite` | `invites` + `workspace_members` | Invite aceite e membro adicionado atomicamente |
| `sprintsService` | `start` | `sprints` + `activity_log` | Início do sprint registado atomicamente |
| `sprintsService` | `complete` | `sprints` + `sprint_metrics` + `tasks` | Snapshot imutável + carry-over atomicamente |
| `tasksService` | `create` | `tasks` + `task_history` | Tarefa criada com registo inicial no histórico |
| `tasksService` | `updateStatus` | `tasks` + `task_history` | Mudança de estado sempre com registo histórico |
| `timerService` | `stop` | `time_entries` + `tasks` | Fechar timer e actualizar `actual_minutes` atomicamente |
| `badgesService` | `checkAndAward` | `user_badges` + `notifications` | Badge desbloqueado e notificação criados juntos |
| `sprintsService` | `complete` | `sprints` + `sprint_metrics` + `tasks` + `activity_log` | Fecho completo do sprint num único acto |

---

## FASE 0 — Staff

> A primeira coisa a existir. Staff gere a plataforma, workspaces suspensos e utilizadores banidos.
> Sem staff, nada mais funciona operacionalmente.

### Módulo · `staff`

**DTOs:**
```ts
CreateStaffDTO {
  email: string
  name: string
  password: string
}

StaffResponseDTO {
  id: string
  email: string
  name: string
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

StaffLoginDTO {
  email: string
  password: string
}

StaffLoginResponseDTO {
  token: string
  refreshToken: string
  staff: StaffResponseDTO
}
```

**Interface `IStaffRepository`:**
```ts
create(data: CreateStaffDTO & { emailHash: string; passwordHash: string }, db?: DbOrTx): Promise<StaffResponseDTO>
findById(id: string): Promise<StaffResponseDTO | null>
findByEmailHash(emailHash: string): Promise<(StaffResponseDTO & { passwordHash: string }) | null>
findAll(filters?: { isActive?: boolean }): Promise<StaffResponseDTO[]>
update(id: string, data: Partial<{ name: string; isActive: boolean }>, db?: DbOrTx): Promise<StaffResponseDTO>
updateLastLogin(id: string, db?: DbOrTx): Promise<void>
```

**Interface `IStaffService`:**
```ts
create(data: CreateStaffDTO): Promise<Result<StaffResponseDTO, AppError>>
findAll(): Promise<Result<StaffResponseDTO[], AppError>>
deactivate(staffId: string, requestingStaffId: string): Promise<Result<void, AppError>>
```

**Regras de negócio:**
- Staff não pode desactivar-se a si próprio
- Seed obrigatório: 1 staff no bootstrap via env vars — se não existir nenhum na DB, cria automaticamente
- Não existe soft delete de staff — só `isActive = false`
- Todas as acções de moderação ficam em `activity_log`

**Transactions:** `create` — operação simples, sem transacção

**Events:**
```ts
'staff.created': { staffId, createdBy }
'staff.login': { staffId, ipAddress }
'staff.action': { staffId, action, entityType, entityId }
```

**Controller — todas as rotas requerem token staff:**
```
POST   /staff/auth/login
POST   /staff/auth/refresh
POST   /staff/auth/logout

GET    /staff/members                                  — listar staff
POST   /staff/members                                  — criar staff
PATCH  /staff/members/:id/deactivate                   — desactivar

GET    /staff/workspaces                               — todos os workspaces (filtros: status)
GET    /staff/workspaces/:id                           — detalhe do workspace
POST   /staff/workspaces/:id/suspend                   — suspender (body: { reason })
POST   /staff/workspaces/:id/reactivate                — reactivar

GET    /staff/users                                    — todos os users (filtros: status)
GET    /staff/users/:id                                — detalhe do user
POST   /staff/users/:id/ban                            — banir (body: { reason })
POST   /staff/users/:id/unban                          — desbanir

GET    /staff/activity-log                             — filtros: actorType, action, entityType, workspaceId, from, to
GET    /staff/metrics                                  — workspaces activos, users registados, tarefas criadas/concluídas, sprints completados
```

---

## FASE 1 — Users & Auth

> Utilizadores finais. Dois canais: email+password ou Google OAuth.

### Módulo · `users`

**DTOs:**
```ts
UserResponseDTO {
  id: string
  email: string
  name: string
  phone: string | null
  avatar: string | null
  timezone: string | null
  locale: string
  status: string
  createdAt: Date
}

UpdateProfileDTO {
  name?: string
  phone?: string
  timezone?: string
  locale?: string
  avatar?: string
}
```

**Interface `IUserRepository`:**
```ts
create(data: {
  email?: string
  emailHash?: string
  passwordHash?: string
  googleId?: string
  name: string
  avatar?: string
  phone?: string
  timezone?: string
  locale?: string
}, db?: DbOrTx): Promise<UserResponseDTO>

findById(id: string): Promise<UserResponseDTO | null>
findByEmailHash(emailHash: string): Promise<(UserResponseDTO & { passwordHash: string | null }) | null>
findByGoogleId(googleId: string): Promise<UserResponseDTO | null>
update(id: string, data: Partial<UpdateProfileDTO & {
  googleId?: string
  passwordHash?: string
  status?: string
}>, db?: DbOrTx): Promise<UserResponseDTO>
softDelete(id: string, db?: DbOrTx): Promise<void>
```

**Interface `IUserService`:**
```ts
getById(userId: string): Promise<Result<UserResponseDTO, AppError>>
updateProfile(userId: string, data: UpdateProfileDTO): Promise<Result<UserResponseDTO, AppError>>
deleteAccount(userId: string): Promise<Result<void, AppError>>
```

**Regras de negócio:**
- Soft delete não apaga dados — só marca `deletedAt`
- User banido (`status: banned`) não consegue autenticar — verificação no middleware
- `timezone` e `locale` são usados para personalizar a experiência (datas dos sprints, idioma das notificações)

**Transactions:** `create` — operação simples, sem transacção

**Events:**
```ts
'user.registered': { userId, method: 'email' | 'google' }
'user.login': { userId, method: 'email' | 'google', ipAddress }
'user.profile_updated': { userId, changes }
'user.deleted': { userId }
```

**Controller:**
```
GET    /users/me              — perfil do user autenticado
PATCH  /users/me              — actualizar perfil
DELETE /users/me              — soft delete
```

---

### Módulo · `auth`

> Centraliza todos os fluxos de autenticação: users (app) e staff (dashboard).

**DTOs:**
```ts
RegisterDTO { email: string; password: string; name: string; phone?: string; timezone?: string }
LoginDTO { email: string; password: string }
AuthResponseDTO { token: string; refreshToken: string; user: UserResponseDTO }

GoogleCallbackDTO { code: string; state: string }

StaffLoginDTO { email: string; password: string }
StaffAuthResponseDTO { token: string; refreshToken: string; staff: StaffResponseDTO }

RefreshTokenDTO { refreshToken: string }
```

**Interface `IAuthService`:**
```ts
// User
register(data: RegisterDTO): Promise<Result<AuthResponseDTO, AppError>>
login(data: LoginDTO): Promise<Result<AuthResponseDTO, AppError>>
loginViaGoogle(code: string, state: string): Promise<Result<AuthResponseDTO, AppError>>
refreshToken(refreshToken: string): Promise<Result<AuthResponseDTO, AppError>>
revokeSession(token: string): Promise<Result<void, AppError>>

// Staff
loginStaff(data: StaffLoginDTO): Promise<Result<StaffAuthResponseDTO, AppError>>
refreshStaffToken(refreshToken: string): Promise<Result<StaffAuthResponseDTO, AppError>>
```

**Regras de negócio:**

`register`:
- Hash email → lookup `findByEmailHash` → `Err conflict` se já existe
- Hash password (argon2)
- `withTransaction`: `users.create` + `sessions.create`
- Emite `'user.registered'`

`loginViaGoogle`:
- Trocar `code` → Google token → obter `{ sub, email, name, picture }`
- Lookup por `googleId` → se encontrado, login directo
- Se não → lookup por `emailHash`:
  - Se existe → ligar Google à conta existente
  - Se não → criar nova conta com `passwordHash = null`
- `withTransaction`: `users.create ou update` + `sessions.create`

`loginStaff`:
- Lookup via `emailHash` em `staff_users`
- Verificar argon2 password
- Verificar `staff.isActive === true`
- Inserir `staff_sessions`
- Actualiza `lastLoginAt`
- Emite `'staff.login'`

**Transactions:**
- `register` → `withTransaction`: `users` + `sessions`
- `loginViaGoogle` → `withTransaction`: `users` + `sessions`

**Controller:**
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/google
GET    /auth/google/callback

POST   /staff/auth/login
POST   /staff/auth/refresh
POST   /staff/auth/logout
```

---

## FASE 2 — Workspaces

> Cada equipa opera num workspace isolado. O criador torna-se automaticamente admin.
> Roles são por workspace — um user pode ser admin num workspace e member noutro.

### Módulo · `workspaces`

**DTOs:**
```ts
CreateWorkspaceDTO {
  name: string
  slug: string
  sprintDurationDays?: number   // 7 | 14 | 30 — default 14
  timezone?: string
}

UpdateWorkspaceDTO {
  name?: string
  sprintDurationDays?: number
  timezone?: string
  kanbanConfig?: {
    states?: Array<{ key: string; label: string; color?: string; position: number }>
  }
}

WorkspaceResponseDTO {
  id: string
  name: string
  slug: string
  ownerId: string
  sprintDurationDays: number
  timezone: string
  kanbanConfig: {
    states?: Array<{ key: string; label: string; color?: string; position: number }>
  }
  status: string
  createdAt: Date
}

WorkspaceMemberResponseDTO {
  id: string
  workspaceId: string
  userId: string
  name: string
  email: string
  avatar: string | null
  role: 'admin' | 'lead' | 'member'
  joinedAt: Date
  status: string
}

InviteMemberDTO {
  email: string
  role?: 'admin' | 'lead' | 'member'   // default 'member'
}

InviteResponseDTO {
  id: string
  workspaceId: string
  email: string
  role: string
  token: string
  expiresAt: Date
  acceptedAt: Date | null
  createdAt: Date
}

UpdateMemberRoleDTO {
  role: 'admin' | 'lead' | 'member'
}
```

**Interface `IWorkspaceRepository`:**
```ts
create(data: CreateWorkspaceDTO & { ownerId: string }, db?: DbOrTx): Promise<WorkspaceResponseDTO>
findById(id: string): Promise<WorkspaceResponseDTO | null>
findBySlug(slug: string): Promise<WorkspaceResponseDTO | null>
findByUser(userId: string): Promise<WorkspaceResponseDTO[]>
update(id: string, data: Partial<UpdateWorkspaceDTO & { status?: string }>, db?: DbOrTx): Promise<WorkspaceResponseDTO>

// Members
addMember(data: { workspaceId: string; userId: string; role: string; invitedBy?: string }, db?: DbOrTx): Promise<WorkspaceMemberResponseDTO>
findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberResponseDTO | null>
listMembers(workspaceId: string, filters?: { role?: string; status?: string }): Promise<WorkspaceMemberResponseDTO[]>
updateMemberRole(workspaceId: string, userId: string, role: string, db?: DbOrTx): Promise<WorkspaceMemberResponseDTO>
updateMemberStatus(workspaceId: string, userId: string, status: string, db?: DbOrTx): Promise<void>
removeMember(workspaceId: string, userId: string, db?: DbOrTx): Promise<void>

// Invites
createInvite(data: { workspaceId: string; email: string; role: string; invitedBy: string; token: string; expiresAt: Date }, db?: DbOrTx): Promise<InviteResponseDTO>
findInviteByToken(token: string): Promise<InviteResponseDTO | null>
findPendingInvite(workspaceId: string, email: string): Promise<InviteResponseDTO | null>
acceptInvite(token: string, db?: DbOrTx): Promise<void>
listInvites(workspaceId: string): Promise<InviteResponseDTO[]>
```

**Interface `IWorkspaceService`:**
```ts
create(data: CreateWorkspaceDTO, userId: string): Promise<Result<WorkspaceResponseDTO, AppError>>
update(workspaceId: string, data: UpdateWorkspaceDTO, userId: string): Promise<Result<WorkspaceResponseDTO, AppError>>
delete(workspaceId: string, userId: string): Promise<Result<void, AppError>>
getById(workspaceId: string, userId: string): Promise<Result<WorkspaceResponseDTO, AppError>>
listMyWorkspaces(userId: string): Promise<Result<WorkspaceResponseDTO[], AppError>>

inviteMember(workspaceId: string, data: InviteMemberDTO, invitedBy: string): Promise<Result<InviteResponseDTO, AppError>>
acceptInvite(token: string, userId: string): Promise<Result<WorkspaceMemberResponseDTO, AppError>>
listMembers(workspaceId: string, userId: string): Promise<Result<WorkspaceMemberResponseDTO[], AppError>>
updateMemberRole(workspaceId: string, targetUserId: string, data: UpdateMemberRoleDTO, requestingUserId: string): Promise<Result<WorkspaceMemberResponseDTO, AppError>>
removeMember(workspaceId: string, targetUserId: string, requestingUserId: string): Promise<Result<void, AppError>>
leaveWorkspace(workspaceId: string, userId: string): Promise<Result<void, AppError>>
```

**Regras de negócio:**

`create`:
- Verificar unicidade do `slug` → `Err conflict` se já existe
- `withTransaction`:
  1. `workspaces.create`
  2. `workspace_members.create` — owner adicionado com `role: 'admin'` automaticamente
- Emite `'workspace.created'`

`inviteMember`:
- Verificar que `requestingUser` é `admin` ou `lead` no workspace → `Err forbidden`
- Verificar que não existe invite pendente para o email → `Err conflict`
- Verificar que o email não pertence a membro já activo → `Err conflict`
- Gerar token único (hash) com expiração de 72h
- Enviar email de convite via `INotificationService`
- Sem transacção — criação simples de invite

`acceptInvite`:
- Verificar token existe e `expiresAt > now()` → `Err validation: invite_expired`
- Verificar `acceptedAt === null` → `Err conflict: invite_already_used`
- `withTransaction`:
  1. `invites.acceptInvite(token)` — preenche `acceptedAt`
  2. `workspace_members.addMember` — adiciona ao workspace com o role do invite
- Emite `'workspace.member_joined'`

`updateMemberRole`:
- Só `admin` pode alterar roles
- Owner não pode ter o seu role alterado → `Err forbidden`
- Admin não pode rebaixar-se a si próprio se for o único admin → `Err business`

`removeMember`:
- `admin` pode remover qualquer membro excepto o owner
- `lead` pode remover `member`
- Owner não pode ser removido — tem de transferir ownership ou apagar o workspace

`leaveWorkspace`:
- Owner não pode sair — tem de apagar o workspace ou transferir ownership → `Err business`

**Transactions:**
- `create` → `withTransaction`: `workspaces` + `workspace_members`
- `acceptInvite` → `withTransaction`: `invites` + `workspace_members`

**Events:**
```ts
'workspace.created': { workspaceId, ownerId }
'workspace.updated': { workspaceId, changes }
'workspace.deleted': { workspaceId, ownerId }
'workspace.member_invited': { workspaceId, email, role, invitedBy }
'workspace.member_joined': { workspaceId, userId, role }
'workspace.member_removed': { workspaceId, userId, removedBy }
'workspace.member_left': { workspaceId, userId }
'workspace.member_role_changed': { workspaceId, userId, oldRole, newRole, changedBy }
```

**Controller — requer token user + membro do workspace:**
```
GET    /workspaces                                   — listar os meus workspaces
POST   /workspaces                                   — criar workspace
GET    /workspaces/:id                               — detalhe
PATCH  /workspaces/:id                               — editar (só admin)
DELETE /workspaces/:id                               — apagar (só owner)

GET    /workspaces/:id/members                       — listar membros
POST   /workspaces/:id/invites                       — convidar membro (admin/lead)
GET    /workspaces/:id/invites                       — listar invites pendentes (admin)
DELETE /workspaces/:id/invites/:inviteId             — cancelar invite (admin)
PATCH  /workspaces/:id/members/:userId/role          — alterar role (só admin)
DELETE /workspaces/:id/members/:userId               — remover membro (admin/lead)
POST   /workspaces/:id/leave                         — sair do workspace

POST   /invites/:token/accept                        — aceitar convite (rota pública com token)
```

---

## FASE 3 — Sprints & Tasks

> O sprint é o ciclo de trabalho da equipa. Só pode haver um activo por workspace.
> As tasks são a unidade central — existem no backlog ou associadas a um sprint.

### Módulo · `sprints`

**DTOs:**
```ts
CreateSprintDTO {
  name: string
  goal?: string
  capacityHours?: number
  startedAt?: Date
  endsAt?: Date
}

UpdateSprintDTO {
  name?: string
  goal?: string
  capacityHours?: number
  endsAt?: Date
  retrospectiveNotes?: string
}

SprintResponseDTO {
  id: string
  workspaceId: string
  name: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  goal: string | null
  capacityHours: number | null
  startedAt: Date | null
  endsAt: Date | null
  completedAt: Date | null
  createdBy: string
  retrospectiveNotes: string | null
  createdAt: Date
}

SprintMetricsResponseDTO {
  id: string
  sprintId: string
  totalTasksPlanned: number
  totalTasksCompleted: number
  totalTasksCarriedOver: number
  totalTimeLoggedSeconds: number
  completionRate: number           // armazenado * 100 (ex: 8750 = 87.50%)
  membersSnapshot: Array<{
    userId: string
    name: string
    tasksCompleted: number
    timeLoggedSeconds: number
    pomodorosCompleted: number
  }>
  createdAt: Date
}

CompleteSprintDTO {
  retrospectiveNotes?: string
}
```

**Interface `ISprintRepository`:**
```ts
create(data: CreateSprintDTO & { workspaceId: string; createdBy: string }, db?: DbOrTx): Promise<SprintResponseDTO>
findById(id: string): Promise<SprintResponseDTO | null>
findActive(workspaceId: string): Promise<SprintResponseDTO | null>
findAll(workspaceId: string, filters?: { status?: string; page?: number; pageSize?: number }): Promise<{ data: SprintResponseDTO[]; total: number }>
update(id: string, data: Partial<UpdateSprintDTO & { status?: string; startedAt?: Date; completedAt?: Date }>, db?: DbOrTx): Promise<SprintResponseDTO>

// Metrics
createMetrics(data: Omit<SprintMetricsResponseDTO, 'id' | 'createdAt'>, db?: DbOrTx): Promise<SprintMetricsResponseDTO>
findMetrics(sprintId: string): Promise<SprintMetricsResponseDTO | null>
```

**Interface `ISprintService`:**
```ts
create(data: CreateSprintDTO, workspaceId: string, userId: string): Promise<Result<SprintResponseDTO, AppError>>
update(sprintId: string, data: UpdateSprintDTO, userId: string): Promise<Result<SprintResponseDTO, AppError>>
start(sprintId: string, userId: string): Promise<Result<SprintResponseDTO, AppError>>
complete(sprintId: string, data: CompleteSprintDTO, userId: string): Promise<Result<SprintMetricsResponseDTO, AppError>>
cancel(sprintId: string, userId: string): Promise<Result<void, AppError>>
getById(sprintId: string, userId: string): Promise<Result<SprintResponseDTO, AppError>>
listByWorkspace(workspaceId: string, userId: string, filters?: object): Promise<Result<{ data: SprintResponseDTO[]; total: number }, AppError>>
getMetrics(sprintId: string, userId: string): Promise<Result<SprintMetricsResponseDTO, AppError>>
getActiveSprint(workspaceId: string, userId: string): Promise<Result<SprintResponseDTO | null, AppError>>
```

**Regras de negócio:**

`create`:
- Só `admin` ou `lead` podem criar sprints → `Err forbidden`
- Status inicial: `draft`
- Sem transacção — criação simples

`start`:
- Verificar que não existe sprint `active` no workspace → `Err business: sprint_already_active`
- Sprint deve estar em `draft` → `Err business` se outro estado
- Só `admin` ou `lead` podem iniciar → `Err forbidden`
- `withTransaction`:
  1. `sprints.update`: `status = active`, `startedAt = now()`
  2. `activity_log.write`
- Emite `'sprint.started'`

`complete`:
- Sprint deve estar `active` → `Err business` se outro estado
- Só `admin` ou `lead` podem completar → `Err forbidden`
- Calcular métricas do sprint no momento do fecho:
  - `totalTasksPlanned` — tarefas que estavam no sprint ao iniciar (via task_history ou count actual)
  - `totalTasksCompleted` — tarefas com `status: done`
  - `totalTasksCarriedOver` — tarefas não `done` e não `cancelled` → movidas para backlog
  - `totalTimeLoggedSeconds` — soma de `time_entries.duration_seconds` do período
  - `completionRate` — `(completed / planned) * 10000` arredondado
  - `membersSnapshot` — contribuição individual calculada neste momento
- `withTransaction`:
  1. `sprints.update`: `status = completed`, `completedAt = now()`, `retrospectiveNotes`
  2. `sprint_metrics.create` — snapshot imutável, nunca recalculado
  3. `tasks.update` (todos os não-done/não-cancelled do sprint): `sprintId = null` — voltam ao backlog
  4. `activity_log.write`
- Emite `'sprint.completed'`

`cancel`:
- Sprint deve ser `draft` ou `active`
- Tasks associadas voltam ao backlog (`sprintId = null`)
- Sem métricas criadas num sprint cancelado

**Transactions:**
- `start` → `withTransaction`: `sprints` + `activity_log`
- `complete` → `withTransaction`: `sprints` + `sprint_metrics` + `tasks` (carry-over) + `activity_log`
- `cancel` → `withTransaction`: `sprints` + `tasks`

**Events:**
```ts
'sprint.created': { sprintId, workspaceId, createdBy }
'sprint.started': { sprintId, workspaceId, startedBy }
'sprint.completed': { sprintId, workspaceId, completedBy, completionRate }
'sprint.cancelled': { sprintId, workspaceId, cancelledBy }
```

**Controller — requer token user + membro do workspace:**
```
GET    /workspaces/:workspaceId/sprints               — listar sprints (filtros: status)
POST   /workspaces/:workspaceId/sprints               — criar sprint (admin/lead)
GET    /workspaces/:workspaceId/sprints/active        — sprint activo
GET    /workspaces/:workspaceId/sprints/:id           — detalhe
PATCH  /workspaces/:workspaceId/sprints/:id           — editar (admin/lead)
POST   /workspaces/:workspaceId/sprints/:id/start     — iniciar (admin/lead)
POST   /workspaces/:workspaceId/sprints/:id/complete  — completar (admin/lead)
POST   /workspaces/:workspaceId/sprints/:id/cancel    — cancelar (admin/lead)
GET    /workspaces/:workspaceId/sprints/:id/metrics   — métricas do sprint
```

---

### Módulo · `tasks`

**DTOs:**
```ts
CreateTaskDTO {
  title: string
  description?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'   // default 'medium'
  assigneeId?: string
  sprintId?: string                                   // null = backlog
  estimatedMinutes?: number
  dueDate?: Date
  tags?: string[]
}

UpdateTaskDTO {
  title?: string
  description?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  assigneeId?: string | null
  sprintId?: string | null
  estimatedMinutes?: number | null
  dueDate?: Date | null
  tags?: string[]
  status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done' | 'cancelled'
}

UpdateTaskStatusDTO {
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done' | 'cancelled'
}

BlockTaskDTO {
  reason: string
}

ReorderTasksDTO {
  tasks: Array<{ id: string; position: number }>
}

MoveToSprintDTO {
  sprintId: string | null   // null = mover para backlog
}

TaskResponseDTO {
  id: string
  workspaceId: string
  sprintId: string | null
  title: string
  description: string | null
  status: string
  priority: string
  assigneeId: string | null
  assignee: { id: string; name: string; avatar: string | null } | null
  createdBy: string
  estimatedMinutes: number | null
  actualMinutes: number
  dueDate: Date | null
  tags: string[]
  position: number
  isBlocked: boolean
  blockedReason: string | null
  blockedSince: Date | null
  createdAt: Date
  updatedAt: Date
}

TaskCommentResponseDTO {
  id: string
  taskId: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  content: string
  createdAt: Date
  editedAt: Date | null
}

TaskHistoryResponseDTO {
  id: string
  taskId: string
  changedBy: string
  changedByName: string
  field: string
  oldValue: unknown
  newValue: unknown
  changedAt: Date
}
```

**Interface `ITaskRepository`:**
```ts
create(data: CreateTaskDTO & { workspaceId: string; createdBy: string; position: number }, db?: DbOrTx): Promise<TaskResponseDTO>
findById(id: string): Promise<TaskResponseDTO | null>
findAll(workspaceId: string, filters?: {
  sprintId?: string | null
  status?: string
  assigneeId?: string
  priority?: string
  isBlocked?: boolean
  tags?: string[]
  page?: number
  pageSize?: number
}): Promise<{ data: TaskResponseDTO[]; total: number }>
update(id: string, data: Partial<UpdateTaskDTO & {
  isBlocked?: boolean
  blockedReason?: string | null
  blockedSince?: Date | null
  position?: number
  actualMinutes?: number
}>, db?: DbOrTx): Promise<TaskResponseDTO>
softDelete(id: string, db?: DbOrTx): Promise<void>
getLastPosition(workspaceId: string, sprintId: string | null, status: string): Promise<number>

// Comments
createComment(data: { taskId: string; authorId: string; content: string }, db?: DbOrTx): Promise<TaskCommentResponseDTO>
findComments(taskId: string): Promise<TaskCommentResponseDTO[]>
updateComment(id: string, content: string, db?: DbOrTx): Promise<TaskCommentResponseDTO>
softDeleteComment(id: string, db?: DbOrTx): Promise<void>

// History
createHistory(data: {
  taskId: string
  changedBy: string
  field: string
  oldValue: unknown
  newValue: unknown
}, db?: DbOrTx): Promise<void>
findHistory(taskId: string): Promise<TaskHistoryResponseDTO[]>
```

**Interface `ITaskService`:**
```ts
create(data: CreateTaskDTO, workspaceId: string, userId: string): Promise<Result<TaskResponseDTO, AppError>>
update(taskId: string, data: UpdateTaskDTO, userId: string): Promise<Result<TaskResponseDTO, AppError>>
updateStatus(taskId: string, data: UpdateTaskStatusDTO, userId: string): Promise<Result<TaskResponseDTO, AppError>>
delete(taskId: string, userId: string): Promise<Result<void, AppError>>
getById(taskId: string, userId: string): Promise<Result<TaskResponseDTO, AppError>>
listByWorkspace(workspaceId: string, userId: string, filters?: object): Promise<Result<{ data: TaskResponseDTO[]; total: number }, AppError>>

blockTask(taskId: string, data: BlockTaskDTO, userId: string): Promise<Result<TaskResponseDTO, AppError>>
unblockTask(taskId: string, userId: string): Promise<Result<TaskResponseDTO, AppError>>

moveToSprint(taskId: string, data: MoveToSprintDTO, userId: string): Promise<Result<TaskResponseDTO, AppError>>
reorderTasks(workspaceId: string, data: ReorderTasksDTO, userId: string): Promise<Result<void, AppError>>

// Comments
addComment(taskId: string, content: string, userId: string): Promise<Result<TaskCommentResponseDTO, AppError>>
editComment(commentId: string, content: string, userId: string): Promise<Result<TaskCommentResponseDTO, AppError>>
deleteComment(commentId: string, userId: string): Promise<Result<void, AppError>>
listComments(taskId: string, userId: string): Promise<Result<TaskCommentResponseDTO[], AppError>>

// History
listHistory(taskId: string, userId: string): Promise<Result<TaskHistoryResponseDTO[], AppError>>
```

**Regras de negócio:**

`create`:
- Verificar que user é membro do workspace → `Err forbidden`
- Se `sprintId` fornecido → verificar que sprint existe e pertence ao workspace → `Err not_found`
- `position` calculado automaticamente — inserido no fim da coluna (getLastPosition + 1)
- `withTransaction`:
  1. `tasks.create`
  2. `task_history.create` — registo inicial: `field: 'created'`, `newValue: { title, status, priority }`
- Emite `'task.created'`

`updateStatus`:
- Verificar membro do workspace → `Err forbidden`
- Registar mudança no histórico sempre
- Se `status → done` → verificar se deve desbloquear badge (via `IBadgeService.checkAndAward`)
- Se `status → blocked` → `isBlocked = true`, `blockedSince = now()` — usar `blockTask` em vez disto
- `withTransaction`:
  1. `tasks.update` — novo status
  2. `task_history.create` — `field: 'status'`, `oldValue`, `newValue`
- Emite `'task.status_changed'`

`blockTask`:
- `isBlocked = true`, `blockedSince = now()`, `blockedReason = reason`
- `withTransaction`: `tasks.update` + `task_history.create`
- Emite `'task.blocked'`

`unblockTask`:
- `isBlocked = false`, `blockedReason = null`, `blockedSince = null`
- `withTransaction`: `tasks.update` + `task_history.create`
- Emite `'task.unblocked'`

`moveToSprint`:
- Verificar sprint `active` ou `draft` → `Err business` se `completed` ou `cancelled`
- `withTransaction`: `tasks.update` + `task_history.create`

`reorderTasks`:
- Actualizar `position` de múltiplas tarefas de uma só vez
- Sem transacção explícita — batch update atómico no repositório

`addComment`:
- Qualquer membro do workspace pode comentar

`editComment` / `deleteComment`:
- Só o autor pode editar/apagar o seu comentário → `Err forbidden`

**Transactions:**
- `create` → `withTransaction`: `tasks` + `task_history`
- `updateStatus` → `withTransaction`: `tasks` + `task_history`
- `blockTask` → `withTransaction`: `tasks` + `task_history`
- `unblockTask` → `withTransaction`: `tasks` + `task_history`
- `moveToSprint` → `withTransaction`: `tasks` + `task_history`
- `update` (campos gerais) → `withTransaction`: `tasks` + `task_history` (para cada campo alterado)

**Events:**
```ts
'task.created': { taskId, workspaceId, sprintId, createdBy, title }
'task.status_changed': { taskId, workspaceId, oldStatus, newStatus, changedBy }
'task.assigned': { taskId, workspaceId, assigneeId, assignedBy }
'task.blocked': { taskId, workspaceId, blockedBy, reason }
'task.unblocked': { taskId, workspaceId, unblockedBy }
'task.moved_to_sprint': { taskId, workspaceId, sprintId, movedBy }
'task.deleted': { taskId, workspaceId, deletedBy }
'task.comment_added': { taskId, workspaceId, commentId, authorId }
'alert.idle_task_detected': { taskId, workspaceId, assigneeId, idleSinceHours }
```

**BullMQ Jobs:**
- `check-idle-tasks` — job recorrente a cada hora: detecta tasks `in_progress` sem time_entry nas últimas 4h → emite `'alert.idle_task_detected'` + notifica assignee

**Controller — requer token user + membro do workspace:**
```
GET    /workspaces/:workspaceId/tasks                        — kanban/lista (filtros: sprintId, status, assigneeId, priority)
POST   /workspaces/:workspaceId/tasks                        — criar tarefa
GET    /workspaces/:workspaceId/tasks/backlog                — backlog (sprintId = null)
GET    /workspaces/:workspaceId/tasks/:id                    — detalhe
PATCH  /workspaces/:workspaceId/tasks/:id                    — editar tarefa
DELETE /workspaces/:workspaceId/tasks/:id                    — apagar (soft delete)
PATCH  /workspaces/:workspaceId/tasks/:id/status             — mudar status
POST   /workspaces/:workspaceId/tasks/:id/block              — bloquear (body: { reason })
POST   /workspaces/:workspaceId/tasks/:id/unblock            — desbloquear
POST   /workspaces/:workspaceId/tasks/:id/move               — mover para sprint (body: { sprintId })
POST   /workspaces/:workspaceId/tasks/reorder                — reordenar (body: { tasks: [{ id, position }] })

GET    /workspaces/:workspaceId/tasks/:id/comments           — listar comentários
POST   /workspaces/:workspaceId/tasks/:id/comments           — adicionar comentário
PATCH  /workspaces/:workspaceId/tasks/:id/comments/:cId      — editar comentário (só autor)
DELETE /workspaces/:workspaceId/tasks/:id/comments/:cId      — apagar comentário (só autor)

GET    /workspaces/:workspaceId/tasks/:id/history            — histórico de mudanças
```

---

## FASE 4 — Timer & Badges

> O timer regista sessões de trabalho. O pomodoro é um modo especial do timer.
> As badges são desbloqueadas automaticamente por eventos — nunca manualmente.

### Módulo · `timer`

**DTOs:**
```ts
StartTimerDTO {
  taskId: string
  type?: 'timer' | 'pomodoro'   // default 'timer'
  notes?: string
}

StopTimerDTO {
  notes?: string
}

CreateManualEntryDTO {
  taskId: string
  startedAt: Date
  endedAt: Date
  notes?: string
}

TimeEntryResponseDTO {
  id: string
  taskId: string
  userId: string
  workspaceId: string
  startedAt: Date
  endedAt: Date | null
  durationSeconds: number | null
  type: 'manual' | 'timer' | 'pomodoro'
  pomodoroCount: number
  notes: string | null
  isActive: boolean
  createdAt: Date
}

ActiveTimerResponseDTO {
  entry: TimeEntryResponseDTO
  elapsedSeconds: number        // calculado no servidor: now() - startedAt
  taskTitle: string
}
```

**Interface `ITimeEntryRepository`:**
```ts
create(data: Omit<TimeEntryResponseDTO, 'id' | 'durationSeconds' | 'isActive' | 'createdAt'> & { endedAt?: Date }, db?: DbOrTx): Promise<TimeEntryResponseDTO>
findById(id: string): Promise<TimeEntryResponseDTO | null>
findActive(userId: string): Promise<TimeEntryResponseDTO | null>
findByTask(taskId: string, filters?: { page?: number; pageSize?: number }): Promise<{ data: TimeEntryResponseDTO[]; total: number }>
findByUser(userId: string, workspaceId: string, filters?: { from?: Date; to?: Date; page?: number; pageSize?: number }): Promise<{ data: TimeEntryResponseDTO[]; total: number }>
update(id: string, data: Partial<{ endedAt: Date; durationSeconds: number; pomodoroCount: number; notes: string }>, db?: DbOrTx): Promise<TimeEntryResponseDTO>
delete(id: string, db?: DbOrTx): Promise<void>
sumDurationByTask(taskId: string): Promise<number>   // soma total em segundos
sumDurationByUserInSprint(userId: string, sprintId: string): Promise<number>
countPomodorosByUserInSprint(userId: string, sprintId: string): Promise<number>
countPomodorosByUserTotal(userId: string): Promise<number>
```

**Interface `ITimerService`:**
```ts
start(data: StartTimerDTO, userId: string, workspaceId: string): Promise<Result<TimeEntryResponseDTO, AppError>>
stop(data: StopTimerDTO, userId: string): Promise<Result<TimeEntryResponseDTO, AppError>>
getActive(userId: string): Promise<Result<ActiveTimerResponseDTO | null, AppError>>
createManualEntry(data: CreateManualEntryDTO, userId: string, workspaceId: string): Promise<Result<TimeEntryResponseDTO, AppError>>
deleteEntry(entryId: string, userId: string): Promise<Result<void, AppError>>
listByTask(taskId: string, userId: string): Promise<Result<{ data: TimeEntryResponseDTO[]; total: number }, AppError>>
listMyEntries(userId: string, workspaceId: string, filters?: object): Promise<Result<{ data: TimeEntryResponseDTO[]; total: number }, AppError>>
completePomodoroRound(userId: string): Promise<Result<TimeEntryResponseDTO, AppError>>
```

**Regras de negócio:**

`start`:
- Verificar que user é membro do workspace → `Err forbidden`
- Verificar que tarefa pertence ao workspace → `Err not_found`
- Verificar que não existe timer activo (`endedAt = null`) para o user → `Err business: timer_already_active`
- Criar `time_entry` com `endedAt = null` — timer activo
- Sem transacção — criação simples

`stop`:
- Lookup `findActive(userId)` → `Err not_found: no_active_timer` se nenhum activo
- `durationSeconds = Math.floor((now() - startedAt) / 1000)`
- `withTransaction`:
  1. `time_entries.update`: `endedAt = now()`, `durationSeconds`
  2. `tasks.update`: `actualMinutes = sumDurationByTask(taskId) / 60` (recalculado)
- Trigger badge check (fire-and-forget via event)
- Emite `'timer.stopped'`

`completePomodoroRound`:
- Encontrar timer activo com `type: pomodoro` → `Err business` se não for pomodoro
- Incrementar `pomodoroCount` no entry activo
- `withTransaction`:
  1. `time_entries.update`: `pomodoroCount += 1`
  2. Não fecha o timer — apenas regista o ciclo
- Emite `'pomodoro.completed'`
- Trigger badge check

`createManualEntry`:
- Verificar `startedAt < endedAt` → `Err validation`
- `durationSeconds = Math.floor((endedAt - startedAt) / 1000)`
- `withTransaction`:
  1. `time_entries.create` com `type: manual`
  2. `tasks.update`: `actualMinutes` recalculado

`deleteEntry`:
- Só o próprio user pode apagar as suas entradas → `Err forbidden`
- Timer activo não pode ser apagado directamente — deve ser parado primeiro → `Err business`
- `withTransaction`:
  1. `time_entries.delete`
  2. `tasks.update`: `actualMinutes` recalculado

**Transactions:**
- `stop` → `withTransaction`: `time_entries` + `tasks`
- `completePomodoroRound` → `withTransaction`: `time_entries`
- `createManualEntry` → `withTransaction`: `time_entries` + `tasks`
- `deleteEntry` → `withTransaction`: `time_entries` + `tasks`

**Events:**
```ts
'timer.started': { entryId, taskId, userId, workspaceId, type }
'timer.stopped': { entryId, taskId, userId, workspaceId, durationSeconds }
'pomodoro.completed': { entryId, taskId, userId, workspaceId, pomodoroCount }
```

**Controller — requer token user + membro do workspace:**
```
GET    /workspaces/:workspaceId/timer/active          — timer activo do user
POST   /workspaces/:workspaceId/timer/start           — iniciar timer
POST   /workspaces/:workspaceId/timer/stop            — parar timer
POST   /workspaces/:workspaceId/timer/pomodoro/complete  — completar ciclo pomodoro
POST   /workspaces/:workspaceId/timer/manual          — registar entrada manual
GET    /workspaces/:workspaceId/timer/entries         — histórico do user (filtros: from, to)
GET    /workspaces/:workspaceId/tasks/:taskId/entries — entradas de uma tarefa
DELETE /workspaces/:workspaceId/timer/entries/:id     — apagar entrada (própria)
```

---

### Módulo · `badges`

**DTOs:**
```ts
BadgeDefinitionResponseDTO {
  id: string
  code: string
  name: string
  description: string | null
  iconUrl: string | null
  category: 'focus' | 'consistency' | 'speed' | 'collaboration' | 'milestone'
  condition: {
    type: string
    threshold?: number
    sprintCompletionRate?: number
  }
  isActive: boolean
}

UserBadgeResponseDTO {
  id: string
  userId: string
  workspaceId: string
  badgeCode: string
  badge: BadgeDefinitionResponseDTO
  unlockedAt: Date
  context: {
    sprintId?: string
    taskId?: string
    streakDays?: number
  }
}

CreateBadgeDefinitionDTO {
  code: string
  name: string
  description?: string
  iconUrl?: string
  category: 'focus' | 'consistency' | 'speed' | 'collaboration' | 'milestone'
  condition: {
    type: string
    threshold?: number
    sprintCompletionRate?: number
  }
}
```

**Interface `IBadgeRepository`:**
```ts
// Definitions
createDefinition(data: CreateBadgeDefinitionDTO, db?: DbOrTx): Promise<BadgeDefinitionResponseDTO>
findDefinitionByCode(code: string): Promise<BadgeDefinitionResponseDTO | null>
findAllDefinitions(filters?: { isActive?: boolean; category?: string }): Promise<BadgeDefinitionResponseDTO[]>
updateDefinition(code: string, data: Partial<CreateBadgeDefinitionDTO & { isActive?: boolean }>, db?: DbOrTx): Promise<BadgeDefinitionResponseDTO>

// User Badges
award(data: { userId: string; workspaceId: string; badgeCode: string; context?: object }, db?: DbOrTx): Promise<UserBadgeResponseDTO>
findUserBadge(userId: string, workspaceId: string, badgeCode: string): Promise<UserBadgeResponseDTO | null>
findByUser(userId: string, workspaceId: string): Promise<UserBadgeResponseDTO[]>
findByWorkspace(workspaceId: string): Promise<UserBadgeResponseDTO[]>
```

**Interface `IBadgeService`:**
```ts
// Chamado pelos workers de eventos — fire-and-forget
checkAndAward(userId: string, workspaceId: string, triggerEvent: string, context?: object): Promise<void>

// Queries
listDefinitions(filters?: { category?: string }): Promise<Result<BadgeDefinitionResponseDTO[], AppError>>
listUserBadges(userId: string, workspaceId: string): Promise<Result<UserBadgeResponseDTO[], AppError>>
listWorkspaceBadges(workspaceId: string): Promise<Result<UserBadgeResponseDTO[], AppError>>

// Staff — gestão do catálogo
createDefinition(data: CreateBadgeDefinitionDTO, staffId: string): Promise<Result<BadgeDefinitionResponseDTO, AppError>>
updateDefinition(code: string, data: Partial<CreateBadgeDefinitionDTO & { isActive?: boolean }>, staffId: string): Promise<Result<BadgeDefinitionResponseDTO, AppError>>
```

**Regras de negócio:**

`checkAndAward`:
- Chamado em fire-and-forget — falhas não afectam o fluxo principal
- Avalia as condições de todas as badges activas relevantes para o `triggerEvent`:
  - `pomodoros_completed` → disparado por `'pomodoro.completed'`: `countPomodorosByUserTotal(userId) >= threshold`
  - `tasks_closed_in_day` → disparado por `'task.status_changed'` (→ done): contar tasks done pelo user hoje
  - `sprint_completion_rate` → disparado por `'sprint.completed'`: `sprintMetrics.completionRate / 100 >= sprintCompletionRate`
  - `focus_streak_days` → disparado por `'timer.stopped'`: calcular dias consecutivos com time_entry
  - `total_hours_logged` → disparado por `'timer.stopped'`: `sumAllDuration(userId) / 3600 >= threshold`
  - `blocker_removed` → disparado por `'task.unblocked'`
- Para cada badge elegível:
  1. `findUserBadge(userId, workspaceId, badgeCode)` — verificar se já desbloqueada
  2. Se não existe → `withTransaction`: `user_badges.award` + `notifications.createInApp`
- Emite `'badge.unlocked'` por cada badge nova

**Mapa de condições → eventos disparadores:**
```ts
const badgeTriggers: Record<string, string[]> = {
  'pomodoros_completed':      ['pomodoro.completed'],
  'tasks_closed_in_day':      ['task.status_changed'],
  'sprint_completion_rate':   ['sprint.completed'],
  'focus_streak_days':        ['timer.stopped'],
  'total_hours_logged':       ['timer.stopped'],
  'blocker_removed':          ['task.unblocked'],
}
```

**Transactions:**
- `checkAndAward` (por badge) → `withTransaction`: `user_badges` + `notifications`

**Events:**
```ts
'badge.unlocked': { userId, workspaceId, badgeCode, badgeName, context }
```

**Controller — requer token user + membro do workspace:**
```
GET    /badges                                        — catálogo de badges (público — sem auth)
GET    /workspaces/:workspaceId/badges                — badges desbloqueadas no workspace
GET    /workspaces/:workspaceId/members/:userId/badges — badges de um membro específico
GET    /workspaces/:workspaceId/badges/me             — as minhas badges neste workspace
```

**Controller — staff:**
```
GET    /staff/badges                                  — listar definições
POST   /staff/badges                                  — criar definição
PATCH  /staff/badges/:code                            — editar definição
```

---

## FASE 5 — Analytics & Notifications

### Módulo · `analytics`

> Métricas agregadas para dashboards. `daily_snapshots` calculado por job nocturno.
> Queries em tempo real para dados do sprint activo.

**DTOs:**
```ts
DashboardResponseDTO {
  workspace: WorkspaceResponseDTO
  activeSprint: SprintResponseDTO | null
  tasksByStatus: Record<string, number>
  // { backlog: N, todo: N, in_progress: N, in_review: N, blocked: N, done: N }
  recentActivity: ActivityItemDTO[]
  topContributors: Array<{
    userId: string
    name: string
    avatar: string | null
    tasksCompleted: number
    timeLoggedSeconds: number
    pomodorosCompleted: number
  }>
  idleTasksCount: number
  blockedTasksCount: number
}

MemberStatsResponseDTO {
  userId: string
  name: string
  avatar: string | null
  tasksAssigned: number
  tasksCompleted: number
  timeLoggedSeconds: number
  pomodorosCompleted: number
  badgesCount: number
  // período: sprint activo ou range de datas
}

WorkspaceStatsResponseDTO {
  period: { from: Date; to: Date }
  tasksCreated: number
  tasksCompleted: number
  tasksBlocked: number
  totalTimeSeconds: number
  activeMembers: number
  pomodorosCompleted: number
  idleTasksDetected: number
  dailyBreakdown: DailySnapshotResponseDTO[]
}

DailySnapshotResponseDTO {
  date: Date
  tasksCreated: number
  tasksCompleted: number
  tasksBlocked: number
  totalTimeSeconds: number
  activeMembers: number
  pomodorosCompleted: number
  idleTasksDetected: number
}

SprintBurndownDTO {
  sprintId: string
  sprintName: string
  startedAt: Date
  endsAt: Date
  totalTasks: number
  dailyPoints: Array<{
    date: Date
    remaining: number     // tarefas ainda não done nesse dia
    ideal: number         // linha ideal calculada
  }>
}

ActivityItemDTO {
  id: string
  action: string
  entityType: string
  entityId: string
  actorId: string
  actorName: string
  metadata: Record<string, unknown>
  createdAt: Date
}
```

**Interface `IAnalyticsService`:**
```ts
getDashboard(workspaceId: string, userId: string): Promise<Result<DashboardResponseDTO, AppError>>
getMemberStats(workspaceId: string, targetUserId: string, requestingUserId: string, filters?: { sprintId?: string; from?: Date; to?: Date }): Promise<Result<MemberStatsResponseDTO, AppError>>
getWorkspaceStats(workspaceId: string, userId: string, filters?: { from?: Date; to?: Date }): Promise<Result<WorkspaceStatsResponseDTO, AppError>>
getSprintBurndown(sprintId: string, userId: string): Promise<Result<SprintBurndownDTO, AppError>>
getActivityFeed(workspaceId: string, userId: string, filters?: { page?: number; pageSize?: number }): Promise<Result<{ data: ActivityItemDTO[]; total: number }, AppError>>
```

**Regras de negócio:**
- `getDashboard` — dados em tempo real (sem cache por agora): tasks por status, sprint activo, top 5 contribuidores do sprint activo, últimas 10 actividades do workspace
- `getSprintBurndown` — calculado a partir do `task_history` (mudanças para `done` ao longo do tempo) — não depende do snapshot
- `getWorkspaceStats` — usa `daily_snapshots` quando o período é histórico, dados em tempo real para o dia de hoje
- Todos os métodos verificam que o `userId` é membro do workspace → `Err forbidden`

**BullMQ Jobs:**
- `compute-daily-snapshot` — cron diário às 00:05 UTC por workspace activo:
  - Calcula todos os campos do `daily_snapshots` para o dia anterior
  - Upsert — se o snapshot já existir (re-run), actualiza
  - Sem transacção complexa — escrita atómica numa única linha

**Controller — requer token user + membro do workspace:**
```
GET    /workspaces/:workspaceId/dashboard             — dashboard resumo
GET    /workspaces/:workspaceId/analytics/stats       — stats do workspace (query: from, to)
GET    /workspaces/:workspaceId/analytics/members/:userId — stats de um membro
GET    /workspaces/:workspaceId/analytics/burndown/:sprintId — burndown do sprint
GET    /workspaces/:workspaceId/activity              — feed de actividade (paginado)
```

---

### Módulo · `notifications`

> Puramente output. Sem lógica de negócio própria.

**Interface `INotificationService`:**
```ts
sendEmail(to: string, template: EmailTemplate, data: unknown): Promise<void>
createInApp(recipientId: string, workspaceId: string | null, type: string, title: string, message: string, data?: Record<string, unknown>, actionUrl?: string): Promise<void>

// Helpers semânticos — chamados pelos event workers
notifyMemberInvited(email: string, workspaceId: string, inviterName: string, token: string): Promise<void>
notifyMemberJoined(workspaceId: string, userId: string, newMemberName: string): Promise<void>
notifySprintStarted(workspaceId: string, sprintName: string): Promise<void>
notifySprintCompleted(workspaceId: string, sprintName: string, completionRate: number): Promise<void>
notifyTaskAssigned(userId: string, taskTitle: string, workspaceId: string): Promise<void>
notifyTaskBlocked(workspaceId: string, taskTitle: string, blockedBy: string): Promise<void>
notifyBadgeUnlocked(userId: string, workspaceId: string, badgeName: string): Promise<void>
notifyIdleTask(userId: string, workspaceId: string, taskTitle: string, idleSinceHours: number): Promise<void>
notifyMemberInvitedInApp(userId: string, workspaceId: string, workspaceName: string): Promise<void>
```

**Templates de email:**
```
workspace_invite           → "Foste convidado para [workspace]. Aceita o convite."
sprint_started             → "O sprint [name] começou. Vai às tarefas!"
sprint_completed           → "O sprint [name] terminou com [rate]% de conclusão."
task_assigned              → "A tarefa [title] foi-te atribuída."
badge_unlocked             → "Desbloqueaste a badge [name]!"
idle_task_alert            → "A tarefa [title] está parada há [N] horas."
```

**BullMQ Workers:**
- `send-email` — concurrency 5, retry 3
- `create-in-app-notification` — concurrency 10, retry 2

**Controller:**
```
GET    /notifications                                 — notificações do user (não lidas primeiro)
PATCH  /notifications/:id/read                        — marcar como lida
PATCH  /notifications/read-all                        — marcar todas como lidas
DELETE /notifications/:id                             — apagar notificação
```

---

## FASE 6 — Events (Observability Layer)

> Único consumidor dos eventos emitidos por todos os módulos.
> Escreve em `activity_log`. Não tem lógica de negócio.

**Como funciona:**
```
[Qualquer Service]
emitter.emit('task.status_changed', payload)
        ↓
[EventEmitter tipado — in-process]
        ↓
[BullMQ Producer — fire-and-forget]
  queue: 'domain-events'
        ↓
[BullMQ Worker]
  INSERT INTO activity_log
        ↓
  Se evento requer side effect → enqueue job
```

**Mapa evento → side effects reactivos:**
```ts
const reactiveEffects = {
  'workspace.member_invited':   [{ type: 'send_invite_email' }],
  'workspace.member_joined':    [{ type: 'notify_team_new_member' }],
  'sprint.started':             [{ type: 'notify_all_members_sprint_started' }],
  'sprint.completed':           [{ type: 'notify_all_members_sprint_completed' }],
  'task.assigned':              [{ type: 'notify_assignee_task_assigned' }],
  'task.blocked':               [{ type: 'notify_workspace_task_blocked' }],
  'task.status_changed':        [{ type: 'check_badges', triggers: ['tasks_closed_in_day'] }],
  'task.unblocked':             [{ type: 'check_badges', triggers: ['blocker_removed'] }],
  'timer.stopped':              [{ type: 'check_badges', triggers: ['focus_streak_days', 'total_hours_logged'] }],
  'pomodoro.completed':         [{ type: 'check_badges', triggers: ['pomodoros_completed'] }],
  'sprint.completed':           [{ type: 'check_badges', triggers: ['sprint_completion_rate'] }],
  'badge.unlocked':             [{ type: 'notify_badge_unlocked' }],
  'alert.idle_task_detected':   [{ type: 'notify_idle_task' }],
}
```

---

## Regras Transversais

**Auth por actor:**
Dois tokens JWT completamente separados — mesmos claims, audiences diferentes.
`requireUser` → verifica token de `sessions` com `userId`, verifica `user.status === 'active'`
`requireStaff` → verifica token de `staff_sessions` com `staffId`
Nunca um token de user funciona numa rota de staff, e vice-versa.

**Isolamento de dados por workspace:**
Toda a query a `tasks`, `sprints`, `time_entries`, `user_badges` feita no contexto de workspace inclui `AND workspace_id = :workspaceId`.
O membro nunca vê dados de outro workspace — garantido no service, não na DB.
`workspaceId` é sempre resolvido a partir do URL e validado contra o token do user — nunca aceite sem verificação de membership.

**Verificação de membership em todas as operações:**
Antes de qualquer operação, o service verifica `workspace_members.findMember(workspaceId, userId)`.
Resultado `null` → `Err forbidden` imediato, sem expor se o workspace existe ou não.

**Soberania da transacção no service:**
Repositories aceitam `db: DbOrTx = defaultDb`.
O service decide quando agrupar em transacção.
Nunca iniciar transacção dentro de um repository.

**Eventos sempre fire-and-forget:**
`emitter.emit()` nunca lança excepção.
Falha de persistência do evento nunca cancela a operação de negócio.
BullMQ garante retry assíncrono.

**Histórico de tasks imutável:**
`task_history` nunca é alterado ou apagado.
Cada mudança de campo gera uma linha nova — rastreabilidade completa.

**Timer: só um activo por user:**
`time_entries` com `endedAt = null` representa um timer activo.
Verificação feita via `findActive(userId)` antes de `start`.
`activeIdx` no schema garante performance desta query.

**Sprint: só um activo por workspace:**
`sprints` com `status = 'active'` deve ser único por `workspaceId`.
Verificação via `findActive(workspaceId)` antes de `start`.
Se a verificação falhar → `Err business: sprint_already_active`.

**actualMinutes nunca editado directamente:**
`tasks.actualMinutes` é sempre recalculado a partir de `SUM(time_entries.duration_seconds) / 60`.
Recalculado ao `stop` do timer, ao criar/apagar entradas manuais.
Nunca aceite como campo editável via API.

**Sprint metrics: snapshot imutável:**
`sprint_metrics` é criado uma única vez ao completar o sprint.
Nunca é recalculado — representa a verdade histórica daquele sprint.
Mesmo que tasks ou time_entries sejam alterados depois, o snapshot fica intacto.

**Badges: idempotência garantida:**
`user_badges` tem unique constraint em `(userId, workspaceId, badgeCode)`.
`checkAndAward` pode ser chamado múltiplas vezes sem risco de duplicados.
Falha de constraint → silenciosamente ignorada (badge já existe).

**Kanban config: extensível por workspace:**
`workspaces.kanbanConfig.states` permite personalizar os estados do kanban.
Se `null`, o frontend usa os estados padrão: `backlog | todo | in_progress | in_review | blocked | done | cancelled`.
A API aceita os estados customizados e valida `status` das tasks contra a config do workspace.

**position: LexoRank simplificado via float:**
`tasks.position` usa float para drag & drop sem reordenar todas as tasks.
Nova task inserida no fim: `getLastPosition() + 1`.
Reordenação: actualizar só as tasks movidas com o novo float calculado pelo cliente.
Colisão improvável — se acontecer, o reorder endpoint força recalculo para todos.