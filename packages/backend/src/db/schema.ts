import {
  pgTable, uuid, varchar, text, boolean,
  integer, real, jsonb, timestamp, index, uniqueIndex, inet,
} from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const id        = () => uuid('id').primaryKey().default(sql`uuid_generate_v7()`)
const now       = () => timestamp('created_at').defaultNow().notNull()
const updatedAt = () => timestamp('updated_at').defaultNow().notNull()
const deletedAt = () => timestamp('deleted_at')


// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const users = pgTable('users', {
  id:           id(),
  email:        text('email').notNull(),
  emailHash:    text('email_hash').notNull(),
  name:         text('name').notNull(),
  phone:        text('phone'),
  passwordHash: text('password_hash'),
  googleId:     text('google_id'),
  avatar:       text('avatar'),
  timezone:     varchar('timezone', { length: 100 }),
  locale:       varchar('locale', { length: 10 }).default('pt'),
  status:       varchar('status', { length: 20 }).notNull().default('active'),
  // active | suspended | banned
  createdAt:    now(),
  updatedAt:    updatedAt(),
  deletedAt:    deletedAt(),
}, t => ({
  emailHashIdx: uniqueIndex('users_email_hash_idx').on(t.emailHash),
  googleIdIdx:  uniqueIndex('users_google_id_idx').on(t.googleId),
  statusIdx:    index('users_status_idx').on(t.status),
}))

// ─────────────────────────────────────────────
// STAFF USERS
// ─────────────────────────────────────────────
export const staffUsers = pgTable('staff_users', {
  id:           id(),
  email:        text('email').notNull(),
  emailHash:    text('email_hash').notNull(),
  name:         text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatar:       text('avatar'),
  isActive:     boolean('is_active').notNull().default(true),
  lastLoginAt:  timestamp('last_login_at'),
  createdAt:    now(),
  updatedAt:    updatedAt(),
  deletedAt:    deletedAt(),
}, t => ({
  emailHashIdx: uniqueIndex('staff_email_hash_idx').on(t.emailHash),
}))

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id:           id(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:        text('token').notNull().unique(),
  refreshToken: text('refresh_token').unique(),
  userAgent:    text('user_agent'),
  ipAddress:    text('ip_address'),
  deviceType:   varchar('device_type', { length: 30 }),
  isActive:     boolean('is_active').notNull().default(true),
  expiresAt:    timestamp('expires_at').notNull(),
  createdAt:    now(),
  updatedAt:    updatedAt(),
  revokedAt:    timestamp('revoked_at'),
}, t => ({
  userIdx:         index('sessions_user_idx').on(t.userId),
  tokenIdx:        index('sessions_token_idx').on(t.token),
  refreshTokenIdx: index('sessions_refresh_token_idx').on(t.refreshToken),
  expiresAtIdx:    index('sessions_expires_at_idx').on(t.expiresAt),
}))

// ─────────────────────────────────────────────
// STAFF SESSIONS
// ─────────────────────────────────────────────
export const staffSessions = pgTable('staff_sessions', {
  id:           id(),
  staffId:      uuid('staff_id').notNull().references(() => staffUsers.id, { onDelete: 'cascade' }),
  token:        text('token').notNull().unique(),
  refreshToken: text('refresh_token').unique(),
  userAgent:    text('user_agent'),
  ipAddress:    text('ip_address'),
  deviceType:   varchar('device_type', { length: 30 }),
  isActive:     boolean('is_active').notNull().default(true),
  expiresAt:    timestamp('expires_at').notNull(),
  createdAt:    now(),
  updatedAt:    updatedAt(),
  revokedAt:    timestamp('revoked_at'),
}, t => ({
  staffIdx:        index('staff_sessions_staff_idx').on(t.staffId),
  tokenIdx:        index('staff_sessions_token_idx').on(t.token),
  refreshTokenIdx: index('staff_sessions_refresh_token_idx').on(t.refreshToken),
  expiresAtIdx:    index('staff_sessions_expires_at_idx').on(t.expiresAt),
}))

// ─────────────────────────────────────────────
// ACTIVITY LOG
// Registo imutável de todas as acções relevantes. Nunca se apaga.
// ─────────────────────────────────────────────
export const activityLog = pgTable('activity_log', {
  id:           id(),
  workspaceId:  uuid('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }),
  actorId:      uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorStaffId: uuid('actor_staff_id').references(() => staffUsers.id, { onDelete: 'set null' }),
  action:       varchar('action', { length: 100 }).notNull(),
  // task.status_changed | sprint.started | badge.unlocked | timer.started
  // | alert.idle_task_detected | sprint.completed | member.invited …
  entityType:   varchar('entity_type', { length: 50 }).notNull(),
  entityId:     uuid('entity_id').notNull(),
  oldValue:     jsonb('old_value'),
  newValue:     jsonb('new_value'),
  metadata:     jsonb('metadata').default({}),
  ipAddress:    inet('ip_address'),
  userAgent:    text('user_agent'),
  createdAt:    now(),
}, t => ({
  workspaceIdx: index('activity_log_workspace_idx').on(t.workspaceId),
  entityIdx:    index('activity_log_entity_idx').on(t.entityType, t.entityId),
  actorIdx:     index('activity_log_actor_idx').on(t.actorId),
  staffIdx:     index('activity_log_staff_idx').on(t.actorStaffId),
  createdIdx:   index('activity_log_created_idx').on(t.createdAt),
}))

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id:          id(),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  type:        varchar('type', { length: 100 }).notNull(),
  // task.assigned | task.blocked | badge.unlocked | sprint.started
  // | sprint.completed | timer.idle_alert | member.invited …
  priority:    varchar('priority', { length: 20 }).default('normal'),
  // low | normal | high
  title:       varchar('title', { length: 255 }).notNull(),
  message:     text('message'),
  actionUrl:   text('action_url'),
  data:        jsonb('data'),
  relatedType: varchar('related_type', { length: 50 }),
  relatedId:   uuid('related_id'),
  isRead:      boolean('is_read').notNull().default(false),
  readAt:      timestamp('read_at'),
  createdAt:   now(),
  deletedAt:   deletedAt(),
}, t => ({
  recipientIdx:  index('notifications_recipient_idx').on(t.recipientId),
  unreadIdx:     index('notifications_unread_idx').on(t.recipientId, t.isRead),
  workspaceIdx:  index('notifications_workspace_idx').on(t.workspaceId),
}))

// ─────────────────────────────────────────────
// WORKSPACES
// Cada equipa tem um workspace isolado.
// ─────────────────────────────────────────────
export const workspaces = pgTable('workspaces', {
  id:                  id(),
  name:                varchar('name', { length: 100 }).notNull(),
  slug:                varchar('slug', { length: 100 }).notNull(),
  // único globalmente — ex: "juninhos-chronus"
  ownerId:             uuid('owner_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  sprintDurationDays:  integer('sprint_duration_days').notNull().default(14),
  // 7 | 14 | 30
  timezone:            varchar('timezone', { length: 100 }).notNull().default('UTC'),
  kanbanConfig:        jsonb('kanban_config').default({}).$type<{
    states?: Array<{ key: string; label: string; color?: string; position: number }>
  }>(),
  // estados customizados do kanban por workspace
  status:              varchar('status', { length: 20 }).notNull().default('active'),
  // active | suspended
  createdAt:           now(),
  updatedAt:           updatedAt(),
  deletedAt:           deletedAt(),
}, t => ({
  slugIdx:   uniqueIndex('workspaces_slug_idx').on(t.slug),
  ownerIdx:  index('workspaces_owner_idx').on(t.ownerId),
  statusIdx: index('workspaces_status_idx').on(t.status),
}))

// ─────────────────────────────────────────────
// WORKSPACE MEMBERS
// Relação entre user e workspace. Roles são por workspace, não globais.
// ─────────────────────────────────────────────
export const workspaceMembers = pgTable('workspace_members', {
  id:          id(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:        varchar('role', { length: 20 }).notNull().default('member'),
  // admin | lead | member
  invitedBy:   uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
  joinedAt:    timestamp('joined_at').defaultNow().notNull(),
  status:      varchar('status', { length: 20 }).notNull().default('active'),
  // active | suspended
  createdAt:   now(),
  updatedAt:   updatedAt(),
}, t => ({
  uniqueIdx:    uniqueIndex('workspace_members_workspace_user_idx').on(t.workspaceId, t.userId),
  workspaceIdx: index('workspace_members_workspace_idx').on(t.workspaceId),
  userIdx:      index('workspace_members_user_idx').on(t.userId),
  roleIdx:      index('workspace_members_role_idx').on(t.workspaceId, t.role),
}))

// ─────────────────────────────────────────────
// INVITES
// Convites pendentes para entrar no workspace.
// ─────────────────────────────────────────────
export const invites = pgTable('invites', {
  id:          id(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email:       text('email').notNull(),
  role:        varchar('role', { length: 20 }).notNull().default('member'),
  // admin | lead | member
  token:       text('token').notNull(),
  // único, hash — expiração de 72h
  invitedBy:   uuid('invited_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt:   timestamp('expires_at').notNull(),
  acceptedAt:  timestamp('accepted_at'),
  // null = pendente
  createdAt:   now(),
}, t => ({
  tokenIdx:     uniqueIndex('invites_token_idx').on(t.token),
  workspaceIdx: index('invites_workspace_idx').on(t.workspaceId),
  emailIdx:     index('invites_email_idx').on(t.email),
  expiresIdx:   index('invites_expires_at_idx').on(t.expiresAt),
}))

// ─────────────────────────────────────────────
// SPRINTS
// Ciclo de trabalho da equipa. Apenas um activo por workspace de cada vez.
// ─────────────────────────────────────────────
export const sprints = pgTable('sprints', {
  id:                  id(),
  workspaceId:         uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name:                varchar('name', { length: 150 }).notNull(),
  // ex: "Sprint 1 — Autenticação"
  status:              varchar('status', { length: 20 }).notNull().default('draft'),
  // draft | active | completed | cancelled
  goal:                text('goal'),
  // objectivo do sprint — texto livre
  capacityHours:       integer('capacity_hours'),
  // estimativa de horas disponíveis da equipa
  startedAt:           timestamp('started_at'),
  endsAt:              timestamp('ends_at'),
  completedAt:         timestamp('completed_at'),
  createdBy:           uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  retrospectiveNotes:  text('retrospective_notes'),
  // preenchido pelo Lead ao fechar o sprint
  createdAt:           now(),
  updatedAt:           updatedAt(),
}, t => ({
  workspaceIdx:      index('sprints_workspace_idx').on(t.workspaceId),
  statusIdx:         index('sprints_status_idx').on(t.workspaceId, t.status),
  activeIdx:         index('sprints_active_idx').on(t.workspaceId, t.status, t.startedAt),
}))

// ─────────────────────────────────────────────
// SPRINT METRICS
// Snapshot imutável calculado ao fechar o sprint. Nunca é recalculado.
// ─────────────────────────────────────────────
export const sprintMetrics = pgTable('sprint_metrics', {
  id:                    id(),
  sprintId:              uuid('sprint_id').notNull().unique().references(() => sprints.id, { onDelete: 'cascade' }),
  totalTasksPlanned:     integer('total_tasks_planned').notNull().default(0),
  totalTasksCompleted:   integer('total_tasks_completed').notNull().default(0),
  totalTasksCarriedOver: integer('total_tasks_carried_over').notNull().default(0),
  // tarefas que voltaram ao backlog
  totalTimeLoggedSeconds: integer('total_time_logged_seconds').notNull().default(0),
  completionRate:        integer('completion_rate').notNull().default(0),
  // armazenado * 100 (ex: 8750 = 87.50%) para evitar floats
  membersSnapshot:       jsonb('members_snapshot').default([]).$type<Array<{
    userId: string
    name: string
    tasksCompleted: number
    timeLoggedSeconds: number
    pomodorosCompleted: number
  }>>(),
  // contribuição por membro neste sprint — snapshot imutável
  createdAt:             now(),
}, t => ({
  sprintIdx: uniqueIndex('sprint_metrics_sprint_idx').on(t.sprintId),
}))

// ─────────────────────────────────────────────
// TASKS
// A unidade central do sistema.
// ─────────────────────────────────────────────
export const tasks = pgTable('tasks', {
  id:               id(),
  workspaceId:      uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  sprintId:         uuid('sprint_id').references(() => sprints.id, { onDelete: 'set null' }),
  // null = backlog
  title:            varchar('title', { length: 255 }).notNull(),
  description:      text('description'),
  status:           varchar('status', { length: 30 }).notNull().default('backlog'),
  // backlog | todo | in_progress | in_review | blocked | done | cancelled
  priority:         varchar('priority', { length: 20 }).notNull().default('medium'),
  // urgent | high | medium | low
  assigneeId:       uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  createdBy:        uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  estimatedMinutes: integer('estimated_minutes'),
  // nullable — estimativa opcional
  actualMinutes:    integer('actual_minutes').notNull().default(0),
  // calculado a partir de time_entries — nunca editado directamente
  dueDate:          timestamp('due_date'),
  tags:             jsonb('tags').default([]).$type<string[]>(),
  position:         real('position').notNull().default(0),
  // LexoRank simplificado — float para drag & drop sem reordenar tudo
  isBlocked:        boolean('is_blocked').notNull().default(false),
  blockedReason:    text('blocked_reason'),
  blockedSince:     timestamp('blocked_since'),
  createdAt:        now(),
  updatedAt:        updatedAt(),
  deletedAt:        deletedAt(),
}, t => ({
  workspaceIdx:  index('tasks_workspace_idx').on(t.workspaceId),
  sprintIdx:     index('tasks_sprint_idx').on(t.sprintId),
  statusIdx:     index('tasks_status_idx').on(t.workspaceId, t.status),
  assigneeIdx:   index('tasks_assignee_idx').on(t.assigneeId),
  priorityIdx:   index('tasks_priority_idx').on(t.workspaceId, t.priority),
  blockedIdx:    index('tasks_blocked_idx').on(t.workspaceId, t.isBlocked),
  positionIdx:   index('tasks_position_idx').on(t.sprintId, t.status, t.position),
  backlogIdx:    index('tasks_backlog_idx').on(t.workspaceId, t.sprintId),
}))

// ─────────────────────────────────────────────
// TASK COMMENTS
// Comentários contextuais numa tarefa.
// ─────────────────────────────────────────────
export const taskComments = pgTable('task_comments', {
  id:        id(),
  taskId:    uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  authorId:  uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content:   text('content').notNull(),
  createdAt: now(),
  editedAt:  timestamp('edited_at'),
  deletedAt: deletedAt(),
}, t => ({
  taskIdx:    index('task_comments_task_idx').on(t.taskId),
  authorIdx:  index('task_comments_author_idx').on(t.authorId),
  createdIdx: index('task_comments_created_idx').on(t.taskId, t.createdAt),
}))

// ─────────────────────────────────────────────
// TASK HISTORY
// Registo imutável de todas as mudanças de estado de uma tarefa.
// ─────────────────────────────────────────────
export const taskHistory = pgTable('task_history', {
  id:          id(),
  taskId:      uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  changedBy:   uuid('changed_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  field:       varchar('field', { length: 50 }).notNull(),
  // status | assignee_id | priority | sprint_id | is_blocked …
  oldValue:    jsonb('old_value'),
  newValue:    jsonb('new_value'),
  changedAt:   timestamp('changed_at').defaultNow().notNull(),
}, t => ({
  taskIdx:      index('task_history_task_idx').on(t.taskId),
  changedByIdx: index('task_history_changed_by_idx').on(t.changedBy),
  changedAtIdx: index('task_history_changed_at_idx').on(t.taskId, t.changedAt),
}))

// ─────────────────────────────────────────────
// TIME ENTRIES
// Cada sessão de trabalho numa tarefa.
// ─────────────────────────────────────────────
export const timeEntries = pgTable('time_entries', {
  id:              id(),
  taskId:          uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workspaceId:     uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  startedAt:       timestamp('started_at').defaultNow().notNull(),
  endedAt:         timestamp('ended_at'),
  // null = cronómetro activo
  durationSeconds: integer('duration_seconds'),
  // calculado no servidor ao fechar — cliente nunca envia este valor
  type:            varchar('type', { length: 20 }).notNull().default('timer'),
  // manual | timer | pomodoro
  pomodoroCount:   integer('pomodoro_count').notNull().default(0),
  // número de ciclos completos de 25min — só relevante para type=pomodoro
  notes:           text('notes'),
  createdAt:       now(),
  updatedAt:       updatedAt(),
}, t => ({
  taskIdx:        index('time_entries_task_idx').on(t.taskId),
  userIdx:        index('time_entries_user_idx').on(t.userId),
  workspaceIdx:   index('time_entries_workspace_idx').on(t.workspaceId),
  activeIdx:      index('time_entries_active_idx').on(t.userId, t.endedAt),
  // para verificar cronómetros activos rapidamente
  startedAtIdx:   index('time_entries_started_at_idx').on(t.workspaceId, t.startedAt),
}))

// ─────────────────────────────────────────────
// BADGE DEFINITIONS
// Catálogo de todas as insígnias possíveis. Gerido pelo sistema.
// ─────────────────────────────────────────────
export const badgeDefinitions = pgTable('badge_definitions', {
  id:          id(),
  code:        varchar('code', { length: 100 }).notNull(),
  // ex: focus_first_pomodoro — único globalmente
  name:        varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  iconUrl:     text('icon_url'),
  category:    varchar('category', { length: 30 }).notNull(),
  // focus | consistency | speed | collaboration | milestone
  condition:   jsonb('condition').notNull().$type<{
    type: string
    threshold?: number
    sprintCompletionRate?: number
    // ex: { type: "pomodoros_completed", threshold: 1 }
    // ex: { type: "sprint_completion_rate", sprintCompletionRate: 100 }
    // ex: { type: "tasks_closed_in_day", threshold: 5 }
    // ex: { type: "focus_streak_days", threshold: 7 }
    // ex: { type: "total_hours_logged", threshold: 100 }
    // ex: { type: "blocker_removed", threshold: 1 }
  }>(),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   now(),
  updatedAt:   updatedAt(),
}, t => ({
  codeIdx:     uniqueIndex('badge_definitions_code_idx').on(t.code),
  categoryIdx: index('badge_definitions_category_idx').on(t.category),
  activeIdx:   index('badge_definitions_active_idx').on(t.isActive),
}))

// ─────────────────────────────────────────────
// USER BADGES
// Insígnias desbloqueadas por um utilizador num workspace.
// ─────────────────────────────────────────────
export const userBadges = pgTable('user_badges', {
  id:           id(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workspaceId:  uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  badgeCode:    varchar('badge_code', { length: 100 }).notNull().references(() => badgeDefinitions.code, { onDelete: 'restrict' }),
  unlockedAt:   timestamp('unlocked_at').defaultNow().notNull(),
  context:      jsonb('context').default({}).$type<{
    sprintId?: string
    taskId?: string
    streakDays?: number
    // contexto adicional para o modal de celebração
  }>(),
  createdAt:    now(),
}, t => ({
  uniqueIdx:    uniqueIndex('user_badges_user_workspace_badge_idx').on(t.userId, t.workspaceId, t.badgeCode),
  userIdx:      index('user_badges_user_idx').on(t.userId, t.workspaceId),
  workspaceIdx: index('user_badges_workspace_idx').on(t.workspaceId),
  unlockedIdx:  index('user_badges_unlocked_at_idx').on(t.unlockedAt),
}))

// ─────────────────────────────────────────────
// DAILY SNAPSHOTS
// Agregação diária por workspace. Calculada em job nocturno.
// Para performance — evita recalcular histórico.
// ─────────────────────────────────────────────
export const dailySnapshots = pgTable('daily_snapshots', {
  id:                  id(),
  workspaceId:         uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  date:                timestamp('date').notNull(),
  // truncado a dia — ex: 2025-05-26 00:00:00 UTC
  tasksCreated:        integer('tasks_created').notNull().default(0),
  tasksCompleted:      integer('tasks_completed').notNull().default(0),
  tasksBlocked:        integer('tasks_blocked').notNull().default(0),
  totalTimeSeconds:    integer('total_time_seconds').notNull().default(0),
  activeMembers:       integer('active_members').notNull().default(0),
  // membros com pelo menos 1 time_entry no dia
  pomodorosCompleted:  integer('pomodoros_completed').notNull().default(0),
  idleTasksDetected:   integer('idle_tasks_detected').notNull().default(0),
  // tarefas in_progress sem actividade há +4h — proxy de procrastinação
  createdAt:           now(),
}, t => ({
  uniqueIdx:    uniqueIndex('daily_snapshots_workspace_date_idx').on(t.workspaceId, t.date),
  workspaceIdx: index('daily_snapshots_workspace_idx').on(t.workspaceId),
  dateIdx:      index('daily_snapshots_date_idx').on(t.date),
}))


// ═════════════════════════════════════════════
// RELATIONS
// ═════════════════════════════════════════════

export const usersRelations = relations(users, ({ many }) => ({
  sessions:         many(sessions),
  notifications:    many(notifications),
  workspaceMembers: many(workspaceMembers),
  ownedWorkspaces:  many(workspaces),
  tasksAssigned:    many(tasks),
  tasksCreated:     many(tasks),
  timeEntries:      many(timeEntries),
  taskComments:     many(taskComments),
  taskHistory:      many(taskHistory),
  userBadges:       many(userBadges),
  activityLog:      many(activityLog),
  invitesSent:      many(invites),
  sprintsCreated:   many(sprints),
}))

export const staffUsersRelations = relations(staffUsers, ({ many }) => ({
  sessions:    many(staffSessions),
  activityLog: many(activityLog),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const staffSessionsRelations = relations(staffSessions, ({ one }) => ({
  staff: one(staffUsers, { fields: [staffSessions.staffId], references: [staffUsers.id] }),
}))

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  workspace:  one(workspaces,  { fields: [activityLog.workspaceId],  references: [workspaces.id] }),
  actor:      one(users,       { fields: [activityLog.actorId],      references: [users.id] }),
  actorStaff: one(staffUsers,  { fields: [activityLog.actorStaffId], references: [staffUsers.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users,      { fields: [notifications.recipientId], references: [users.id] }),
  workspace: one(workspaces, { fields: [notifications.workspaceId], references: [workspaces.id] }),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner:           one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members:         many(workspaceMembers),
  invites:         many(invites),
  sprints:         many(sprints),
  tasks:           many(tasks),
  timeEntries:     many(timeEntries),
  userBadges:      many(userBadges),
  dailySnapshots:  many(dailySnapshots),
  notifications:   many(notifications),
  activityLog:     many(activityLog),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user:      one(users,      { fields: [workspaceMembers.userId],      references: [users.id] }),
  invitedBy: one(users,      { fields: [workspaceMembers.invitedBy],   references: [users.id] }),
}))

export const invitesRelations = relations(invites, ({ one }) => ({
  workspace: one(workspaces, { fields: [invites.workspaceId], references: [workspaces.id] }),
  invitedBy: one(users,      { fields: [invites.invitedBy],   references: [users.id] }),
}))

export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  workspace:     one(workspaces, { fields: [sprints.workspaceId], references: [workspaces.id] }),
  createdBy:     one(users,      { fields: [sprints.createdBy],   references: [users.id] }),
  tasks:         many(tasks),
  sprintMetrics: one(sprintMetrics),
}))

export const sprintMetricsRelations = relations(sprintMetrics, ({ one }) => ({
  sprint: one(sprints, { fields: [sprintMetrics.sprintId], references: [sprints.id] }),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace:   one(workspaces, { fields: [tasks.workspaceId], references: [workspaces.id] }),
  sprint:      one(sprints,    { fields: [tasks.sprintId],    references: [sprints.id] }),
  assignee:    one(users,      { fields: [tasks.assigneeId],  references: [users.id] }),
  createdBy:   one(users,      { fields: [tasks.createdBy],   references: [users.id] }),
  comments:    many(taskComments),
  history:     many(taskHistory),
  timeEntries: many(timeEntries),
}))

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task:   one(tasks, { fields: [taskComments.taskId],   references: [tasks.id] }),
  author: one(users, { fields: [taskComments.authorId], references: [users.id] }),
}))

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task:      one(tasks, { fields: [taskHistory.taskId],     references: [tasks.id] }),
  changedBy: one(users, { fields: [taskHistory.changedBy],  references: [users.id] }),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task:      one(tasks,       { fields: [timeEntries.taskId],      references: [tasks.id] }),
  user:      one(users,       { fields: [timeEntries.userId],      references: [users.id] }),
  workspace: one(workspaces,  { fields: [timeEntries.workspaceId], references: [workspaces.id] }),
}))

export const badgeDefinitionsRelations = relations(badgeDefinitions, ({ many }) => ({
  userBadges: many(userBadges),
}))

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user:             one(users,            { fields: [userBadges.userId],      references: [users.id] }),
  workspace:        one(workspaces,       { fields: [userBadges.workspaceId], references: [workspaces.id] }),
  badgeDefinition:  one(badgeDefinitions, { fields: [userBadges.badgeCode],   references: [badgeDefinitions.code] }),
}))

export const dailySnapshotsRelations = relations(dailySnapshots, ({ one }) => ({
  workspace: one(workspaces, { fields: [dailySnapshots.workspaceId], references: [workspaces.id] }),
}))


// ═════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════
export type User                 = typeof users.$inferSelect
export type NewUser              = typeof users.$inferInsert
export type StaffUser            = typeof staffUsers.$inferSelect
export type NewStaffUser         = typeof staffUsers.$inferInsert
export type Session              = typeof sessions.$inferSelect
export type NewSession           = typeof sessions.$inferInsert
export type StaffSession         = typeof staffSessions.$inferSelect
export type NewStaffSession      = typeof staffSessions.$inferInsert
export type ActivityLog          = typeof activityLog.$inferSelect
export type NewActivityLog       = typeof activityLog.$inferInsert
export type Notification         = typeof notifications.$inferSelect
export type NewNotification      = typeof notifications.$inferInsert
export type Workspace            = typeof workspaces.$inferSelect
export type NewWorkspace         = typeof workspaces.$inferInsert
export type WorkspaceMember      = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember   = typeof workspaceMembers.$inferInsert
export type Invite               = typeof invites.$inferSelect
export type NewInvite            = typeof invites.$inferInsert
export type Sprint               = typeof sprints.$inferSelect
export type NewSprint            = typeof sprints.$inferInsert
export type SprintMetrics        = typeof sprintMetrics.$inferSelect
export type NewSprintMetrics     = typeof sprintMetrics.$inferInsert
export type Task                 = typeof tasks.$inferSelect
export type NewTask              = typeof tasks.$inferInsert
export type TaskComment          = typeof taskComments.$inferSelect
export type NewTaskComment       = typeof taskComments.$inferInsert
export type TaskHistory          = typeof taskHistory.$inferSelect
export type NewTaskHistory       = typeof taskHistory.$inferInsert
export type TimeEntry            = typeof timeEntries.$inferSelect
export type NewTimeEntry         = typeof timeEntries.$inferInsert
export type BadgeDefinition      = typeof badgeDefinitions.$inferSelect
export type NewBadgeDefinition   = typeof badgeDefinitions.$inferInsert
export type UserBadge            = typeof userBadges.$inferSelect
export type NewUserBadge         = typeof userBadges.$inferInsert
export type DailySnapshot        = typeof dailySnapshots.$inferSelect
export type NewDailySnapshot     = typeof dailySnapshots.$inferInsert
