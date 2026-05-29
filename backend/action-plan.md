# Action Plan — Chronus (Laravel)

---

## Stack

```
Framework:   Laravel 11
Auth:        Laravel Sanctum (tokens para users) + token customizado para staff
DB:          MySQL / PostgreSQL — já tens migrations, models, factories, seeders
Hashing:     bcrypt via Hash::make() para passwords, sha256 para emails
Google OAuth: Socialite
```

---

## Estrutura de Pastas

Só o que vais criar — models já existem.

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   └── AuthController.php
│   │   ├── Staff/
│   │   │   ├── StaffAuthController.php
│   │   │   ├── StaffMembersController.php
│   │   │   ├── StaffWorkspacesController.php
│   │   │   ├── StaffUsersController.php
│   │   │   ├── StaffActivityLogController.php
│   │   │   ├── StaffMetricsController.php
│   │   │   └── StaffBadgesController.php
│   │   ├── UserController.php
│   │   ├── WorkspaceController.php
│   │   ├── WorkspaceMemberController.php
│   │   ├── InviteController.php
│   │   ├── SprintController.php
│   │   ├── TaskController.php
│   │   ├── TaskCommentController.php
│   │   ├── TaskHistoryController.php
│   │   ├── TimerController.php
│   │   ├── BadgeController.php
│   │   ├── AnalyticsController.php
│   │   └── NotificationController.php
│   ├── Requests/
│   │   ├── Auth/
│   │   │   ├── RegisterRequest.php
│   │   │   ├── LoginRequest.php
│   │   │   └── GoogleCallbackRequest.php
│   │   ├── Staff/
│   │   │   ├── StaffLoginRequest.php
│   │   │   └── CreateStaffRequest.php
│   │   ├── Workspace/
│   │   │   ├── CreateWorkspaceRequest.php
│   │   │   ├── UpdateWorkspaceRequest.php
│   │   │   └── InviteMemberRequest.php
│   │   ├── Sprint/
│   │   │   ├── CreateSprintRequest.php
│   │   │   ├── UpdateSprintRequest.php
│   │   │   └── CompleteSprintRequest.php
│   │   ├── Task/
│   │   │   ├── CreateTaskRequest.php
│   │   │   ├── UpdateTaskRequest.php
│   │   │   ├── UpdateTaskStatusRequest.php
│   │   │   ├── BlockTaskRequest.php
│   │   │   ├── MoveTaskRequest.php
│   │   │   └── ReorderTasksRequest.php
│   │   ├── Timer/
│   │   │   ├── StartTimerRequest.php
│   │   │   ├── StopTimerRequest.php
│   │   │   └── CreateManualEntryRequest.php
│   │   └── Badge/
│   │       └── CreateBadgeDefinitionRequest.php
│   ├── Resources/
│   │   ├── UserResource.php
│   │   ├── WorkspaceResource.php
│   │   ├── WorkspaceMemberResource.php
│   │   ├── InviteResource.php
│   │   ├── SprintResource.php
│   │   ├── SprintMetricResource.php
│   │   ├── TaskResource.php
│   │   ├── TaskCommentResource.php
│   │   ├── TaskHistoryResource.php
│   │   ├── TimeEntryResource.php
│   │   ├── BadgeDefinitionResource.php
│   │   ├── UserBadgeResource.php
│   │   ├── NotificationResource.php
│   │   ├── ActivityLogResource.php
│   │   └── StaffUserResource.php
│   └── Middleware/
│       ├── CheckStaffToken.php          ← middleware custom para staff
│       └── CheckWorkspaceMember.php     ← verifica membership no workspace
└── Models/  ← já existem, não mexes
```

---

## Padrão de Resposta

Todos os controllers devem responder sempre da mesma forma.

**Sucesso:**
```json
{ "data": { ... } }
{ "data": [ ... ], "meta": { "total": 100, "per_page": 15, "current_page": 1 } }
```

**Erro:**
```json
{ "message": "Workspace not found." }
{ "message": "The given data was invalid.", "errors": { "email": ["..."] } }
```

Usa os HTTP status codes certos:
- `200` OK
- `201` Created
- `204` No Content (deletes)
- `400` Bad Request
- `401` Unauthenticated
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `422` Unprocessable Entity (validação)

---

## Auth — Como funciona

**Users:** Laravel Sanctum — `createToken()` no login, `auth:sanctum` middleware nas rotas.

**Staff:** Sanctum não é ideal para dois tipos de user. Vais usar uma coluna `token` e `refresh_token` na tabela `staff_sessions` — middleware custom `CheckStaffToken` que lê o Bearer token, cruza com `staff_sessions`, verifica `is_active` e `expires_at`.

**Hash de email:** Todos os lookups por email são feitos via hash (sha256) — nunca guardas o email em plain text na coluna `email_hash`. O email em plain text pode ficar na coluna `email` normal.

---

## Middlewares Customizados

### `CheckStaffToken`
```
Lê Authorization: Bearer {token}
→ Procura em staff_sessions onde token = hash(bearer) AND is_active = true AND expires_at > now()
→ Carrega staff_sessions->staff (StaffUser)
→ Injeta no request: $request->staffUser
→ 401 se inválido
```

### `CheckWorkspaceMember`
```
Lê :workspaceId da rota
→ Procura WorkspaceMember onde workspace_id = X AND user_id = auth()->id() AND status = 'active'
→ 403 se não é membro (sem revelar se workspace existe)
→ Injeta no request: $request->workspaceMember (com role)
```

---

## Rotas — `routes/api.php`

```php
// ─── AUTH ───────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::get('google',          [AuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout',  [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// ─── USERS ──────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('users')->group(function () {
    Route::get('me',    [UserController::class, 'me']);
    Route::patch('me',  [UserController::class, 'update']);
    Route::delete('me', [UserController::class, 'destroy']);
});

// ─── NOTIFICATIONS ──────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/',              [NotificationController::class, 'index']);
    Route::patch('{id}/read',    [NotificationController::class, 'markRead']);
    Route::patch('read-all',     [NotificationController::class, 'markAllRead']);
    Route::delete('{id}',        [NotificationController::class, 'destroy']);
});

// ─── BADGES (catálogo público) ───────────────────────────────
Route::get('badges', [BadgeController::class, 'definitions']);

// ─── INVITES (token público) ─────────────────────────────────
Route::middleware('auth:sanctum')
    ->post('invites/{token}/accept', [InviteController::class, 'accept']);

// ─── WORKSPACES ──────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('workspaces')->group(function () {
    Route::get('/',    [WorkspaceController::class, 'index']);
    Route::post('/',   [WorkspaceController::class, 'store']);

    Route::middleware('workspace.member')->group(function () {
        Route::get('{workspaceId}',    [WorkspaceController::class, 'show']);
        Route::patch('{workspaceId}',  [WorkspaceController::class, 'update']);
        Route::delete('{workspaceId}', [WorkspaceController::class, 'destroy']);
        Route::post('{workspaceId}/leave', [WorkspaceController::class, 'leave']);

        // Members
        Route::get('{workspaceId}/members',                       [WorkspaceMemberController::class, 'index']);
        Route::patch('{workspaceId}/members/{userId}/role',       [WorkspaceMemberController::class, 'updateRole']);
        Route::delete('{workspaceId}/members/{userId}',           [WorkspaceMemberController::class, 'remove']);

        // Invites
        Route::post('{workspaceId}/invites',          [InviteController::class, 'store']);
        Route::get('{workspaceId}/invites',           [InviteController::class, 'index']);
        Route::delete('{workspaceId}/invites/{id}',   [InviteController::class, 'destroy']);

        // Sprints
        Route::get('{workspaceId}/sprints',                       [SprintController::class, 'index']);
        Route::post('{workspaceId}/sprints',                      [SprintController::class, 'store']);
        Route::get('{workspaceId}/sprints/active',                [SprintController::class, 'active']);
        Route::get('{workspaceId}/sprints/{id}',                  [SprintController::class, 'show']);
        Route::patch('{workspaceId}/sprints/{id}',                [SprintController::class, 'update']);
        Route::post('{workspaceId}/sprints/{id}/start',           [SprintController::class, 'start']);
        Route::post('{workspaceId}/sprints/{id}/complete',        [SprintController::class, 'complete']);
        Route::post('{workspaceId}/sprints/{id}/cancel',          [SprintController::class, 'cancel']);
        Route::get('{workspaceId}/sprints/{id}/metrics',          [SprintController::class, 'metrics']);

        // Tasks
        Route::get('{workspaceId}/tasks',                         [TaskController::class, 'index']);
        Route::post('{workspaceId}/tasks',                        [TaskController::class, 'store']);
        Route::get('{workspaceId}/tasks/backlog',                 [TaskController::class, 'backlog']);
        Route::post('{workspaceId}/tasks/reorder',                [TaskController::class, 'reorder']);
        Route::get('{workspaceId}/tasks/{id}',                    [TaskController::class, 'show']);
        Route::patch('{workspaceId}/tasks/{id}',                  [TaskController::class, 'update']);
        Route::delete('{workspaceId}/tasks/{id}',                 [TaskController::class, 'destroy']);
        Route::patch('{workspaceId}/tasks/{id}/status',           [TaskController::class, 'updateStatus']);
        Route::post('{workspaceId}/tasks/{id}/block',             [TaskController::class, 'block']);
        Route::post('{workspaceId}/tasks/{id}/unblock',           [TaskController::class, 'unblock']);
        Route::post('{workspaceId}/tasks/{id}/move',              [TaskController::class, 'move']);

        // Task Comments
        Route::get('{workspaceId}/tasks/{id}/comments',           [TaskCommentController::class, 'index']);
        Route::post('{workspaceId}/tasks/{id}/comments',          [TaskCommentController::class, 'store']);
        Route::patch('{workspaceId}/tasks/{id}/comments/{cId}',   [TaskCommentController::class, 'update']);
        Route::delete('{workspaceId}/tasks/{id}/comments/{cId}',  [TaskCommentController::class, 'destroy']);

        // Task History
        Route::get('{workspaceId}/tasks/{id}/history',            [TaskHistoryController::class, 'index']);

        // Timer
        Route::get('{workspaceId}/timer/active',                      [TimerController::class, 'active']);
        Route::post('{workspaceId}/timer/start',                      [TimerController::class, 'start']);
        Route::post('{workspaceId}/timer/stop',                       [TimerController::class, 'stop']);
        Route::post('{workspaceId}/timer/pomodoro/complete',          [TimerController::class, 'completePomodoro']);
        Route::post('{workspaceId}/timer/manual',                     [TimerController::class, 'manual']);
        Route::get('{workspaceId}/timer/entries',                     [TimerController::class, 'entries']);
        Route::get('{workspaceId}/tasks/{taskId}/entries',            [TimerController::class, 'taskEntries']);
        Route::delete('{workspaceId}/timer/entries/{id}',             [TimerController::class, 'deleteEntry']);

        // Badges do workspace
        Route::get('{workspaceId}/badges',                        [BadgeController::class, 'workspaceBadges']);
        Route::get('{workspaceId}/badges/me',                     [BadgeController::class, 'myBadges']);
        Route::get('{workspaceId}/members/{userId}/badges',       [BadgeController::class, 'memberBadges']);

        // Analytics
        Route::get('{workspaceId}/dashboard',                     [AnalyticsController::class, 'dashboard']);
        Route::get('{workspaceId}/analytics/stats',               [AnalyticsController::class, 'stats']);
        Route::get('{workspaceId}/analytics/members/{userId}',    [AnalyticsController::class, 'memberStats']);
        Route::get('{workspaceId}/analytics/burndown/{sprintId}', [AnalyticsController::class, 'burndown']);
        Route::get('{workspaceId}/activity',                      [AnalyticsController::class, 'activity']);
    });
});

// ─── STAFF ───────────────────────────────────────────────────
Route::prefix('staff')->group(function () {
    Route::post('auth/login',   [StaffAuthController::class, 'login']);
    Route::post('auth/refresh', [StaffAuthController::class, 'refresh']);

    Route::middleware('staff.auth')->group(function () {
        Route::post('auth/logout', [StaffAuthController::class, 'logout']);

        Route::get('members',          [StaffMembersController::class, 'index']);
        Route::post('members',         [StaffMembersController::class, 'store']);
        Route::patch('members/{id}/deactivate', [StaffMembersController::class, 'deactivate']);

        Route::get('workspaces',              [StaffWorkspacesController::class, 'index']);
        Route::get('workspaces/{id}',         [StaffWorkspacesController::class, 'show']);
        Route::post('workspaces/{id}/suspend',    [StaffWorkspacesController::class, 'suspend']);
        Route::post('workspaces/{id}/reactivate', [StaffWorkspacesController::class, 'reactivate']);

        Route::get('users',          [StaffUsersController::class, 'index']);
        Route::get('users/{id}',     [StaffUsersController::class, 'show']);
        Route::post('users/{id}/ban',   [StaffUsersController::class, 'ban']);
        Route::post('users/{id}/unban', [StaffUsersController::class, 'unban']);

        Route::get('activity-log', [StaffActivityLogController::class, 'index']);
        Route::get('metrics',      [StaffMetricsController::class, 'index']);

        Route::get('badges',          [StaffBadgesController::class, 'index']);
        Route::post('badges',         [StaffBadgesController::class, 'store']);
        Route::patch('badges/{code}', [StaffBadgesController::class, 'update']);
    });
});
```

---

## FASE 0 — Staff

### `StaffAuthController`

```
POST /staff/auth/login
  → StaffLoginRequest (email, password)
  → Procura por email_hash
  → Hash::check($password, $staff->password_hash)
  → Verifica is_active
  → Cria StaffSession com token aleatório (Str::random(80)), expires_at = +30 dias
  → Retorna { token, refresh_token, staff: StaffUserResource }

POST /staff/auth/refresh
  → Lê refresh_token do body
  → Procura StaffSession, verifica is_active e expires_at
  → Revoga sessão antiga, cria nova
  → Retorna novos tokens

POST /staff/auth/logout (middleware: staff.auth)
  → Marca StaffSession atual como is_active = false, revoked_at = now()
  → 204
```

### `StaffMembersController`

```
GET /staff/members
  → Lista todos os StaffUser (filtro: is_active)
  → Retorna StaffUserResource collection

POST /staff/members
  → CreateStaffRequest (email, name, password)
  → Verifica email único via email_hash
  → Hash::make($password) → password_hash
  → StaffUser::create()
  → Retorna StaffUserResource 201

PATCH /staff/members/{id}/deactivate
  → Verifica que não é o próprio ($request->staffUser->id !== $id)
  → $staff->update(['is_active' => false])
  → 204
```

### `StaffWorkspacesController`

```
GET /staff/workspaces
  → Query params: status
  → Workspace::query()->when($status, ...)->paginate(20)
  → WorkspaceResource collection

GET /staff/workspaces/{id}
  → Workspace::findOrFail($id)->load('owner', 'members')
  → WorkspaceResource

POST /staff/workspaces/{id}/suspend
  → Body: { reason }
  → $workspace->update(['status' => 'suspended'])
  → ActivityLog::create([...])
  → 204

POST /staff/workspaces/{id}/reactivate
  → $workspace->update(['status' => 'active'])
  → ActivityLog::create([...])
  → 204
```

### `StaffUsersController`

```
GET /staff/users
  → Query params: status
  → User::query()->when(...)->paginate(20)
  → UserResource collection

POST /staff/users/{id}/ban
  → Body: { reason }
  → $user->update(['status' => 'banned'])
  → ActivityLog::create([...])
  → 204

POST /staff/users/{id}/unban
  → $user->update(['status' => 'active'])
  → 204
```

### `StaffMetricsController`

```
GET /staff/metrics
  → Retorna:
    - workspaces_active: Workspace::where('status', 'active')->count()
    - users_total: User::count()
    - tasks_created: Task::count()
    - tasks_completed: Task::where('status', 'done')->count()
    - sprints_completed: Sprint::where('status', 'completed')->count()
```

---

## FASE 1 — Auth & Users

### `AuthController`

```
POST /auth/register
  → RegisterRequest (name, email, password, phone?, timezone?)
  → Verifica email único via email_hash = hash('sha256', strtolower($email))
  → DB::transaction():
      $user = User::create([...])
      $token = $user->createToken('auth_token')->plainTextToken
  → Retorna { token, user: UserResource } 201

POST /auth/login
  → LoginRequest (email, password)
  → Procura por email_hash
  → Hash::check() → 401 se falhar
  → Verifica user->status === 'active' → 403 se banido
  → $token = $user->createToken('auth_token')->plainTextToken
  → Retorna { token, user: UserResource }

POST /auth/logout (auth:sanctum)
  → $request->user()->currentAccessToken()->delete()
  → 204

GET /auth/google
  → return Socialite::driver('google')->redirect()

GET /auth/google/callback
  → $googleUser = Socialite::driver('google')->user()
  → Procura por google_id → login direto
  → Se não → procura por email_hash → liga google à conta
  → Se não → cria conta nova (password_hash = null)
  → DB::transaction(): user upsert + createToken
  → Retorna { token, user: UserResource }
```

### `UserController`

```
GET /users/me
  → return new UserResource(auth()->user())

PATCH /users/me
  → UpdateProfileRequest (name?, phone?, timezone?, locale?, avatar?)
  → auth()->user()->update($request->validated())
  → UserResource

DELETE /users/me
  → auth()->user()->delete()  ← SoftDeletes já no model
  → 204
```

---

## FASE 2 — Workspaces

### `WorkspaceController`

```
GET /workspaces
  → auth()->user()->workspaces()->get()
  → WorkspaceResource collection

POST /workspaces
  → CreateWorkspaceRequest (name, slug, sprintDurationDays?, timezone?)
  → Verifica slug único: Workspace::where('slug', $slug)->exists()
  → DB::transaction():
      $workspace = Workspace::create([..., 'owner_id' => auth()->id()])
      WorkspaceMember::create(['workspace_id' => $workspace->id, 'user_id' => auth()->id(), 'role' => 'admin', 'status' => 'active', 'joined_at' => now()])
  → WorkspaceResource 201

GET /workspaces/{workspaceId}  (middleware: workspace.member)
  → WorkspaceResource::make($workspace->load('owner'))

PATCH /workspaces/{workspaceId}  (middleware: workspace.member)
  → Verifica role admin: $request->workspaceMember->role === 'admin' → 403
  → UpdateWorkspaceRequest
  → $workspace->update($request->validated())
  → WorkspaceResource

DELETE /workspaces/{workspaceId}  (middleware: workspace.member)
  → Verifica é owner: $workspace->owner_id === auth()->id() → 403
  → $workspace->delete()
  → 204

POST /workspaces/{workspaceId}/leave  (middleware: workspace.member)
  → Verifica que não é owner → 403
  → WorkspaceMember::where(...)->delete()
  → 204
```

### `WorkspaceMemberController`

```
GET /workspaces/{workspaceId}/members
  → WorkspaceMember::with('user')->where('workspace_id', $workspaceId)->get()
  → WorkspaceMemberResource collection

PATCH /workspaces/{workspaceId}/members/{userId}/role
  → Verifica que quem pede é admin
  → Verifica que o target não é o owner
  → Verifica que não está a rebaixar o único admin
  → UpdateMemberRoleRequest (role: admin|lead|member)
  → WorkspaceMember::where(...)->update(['role' => $role])
  → WorkspaceMemberResource

DELETE /workspaces/{workspaceId}/members/{userId}
  → Verifica permissão (admin pode tudo, lead só remove member)
  → Verifica que target não é owner
  → WorkspaceMember::where(...)->delete()
  → 204
```

### `InviteController`

```
POST /workspaces/{workspaceId}/invites
  → Verifica role admin ou lead
  → InviteMemberRequest (email, role?)
  → Verifica invite pendente não existe: Invite::where('workspace_id', ...)->where('email', ...)->whereNull('accepted_at')->exists()
  → Verifica que email não pertence a membro ativo
  → $token = Str::random(64)
  → Invite::create([..., 'token' => $token, 'expires_at' => now()->addHours(72)])
  → [Envia email aqui — Mail::to($email)->send(new InviteEmail(...))]
  → InviteResource 201

GET /workspaces/{workspaceId}/invites
  → Verifica role admin
  → Invite::where('workspace_id', $workspaceId)->whereNull('accepted_at')->get()
  → InviteResource collection

DELETE /workspaces/{workspaceId}/invites/{id}
  → Verifica role admin
  → Invite::findOrFail($id)->delete()
  → 204

POST /invites/{token}/accept  (auth:sanctum)
  → $invite = Invite::where('token', $token)->firstOrFail()
  → Verifica expires_at > now() → 422 'invite_expired'
  → Verifica accepted_at === null → 409 'invite_already_used'
  → DB::transaction():
      $invite->update(['accepted_at' => now()])
      WorkspaceMember::create(['workspace_id' => $invite->workspace_id, 'user_id' => auth()->id(), 'role' => $invite->role, 'status' => 'active', 'joined_at' => now()])
  → WorkspaceMemberResource 201
```

---

## FASE 3 — Sprints

### `SprintController`

```
GET /workspaces/{workspaceId}/sprints
  → Query params: status, page
  → Sprint::where('workspace_id', $workspaceId)->when($status, ...)->paginate(15)
  → SprintResource collection

POST /workspaces/{workspaceId}/sprints
  → Verifica role admin ou lead → 403
  → CreateSprintRequest (name, goal?, capacityHours?, startedAt?, endsAt?)
  → Sprint::create([..., 'workspace_id' => $workspaceId, 'created_by' => auth()->id(), 'status' => 'draft'])
  → SprintResource 201

GET /workspaces/{workspaceId}/sprints/active
  → Sprint::where('workspace_id', $workspaceId)->where('status', 'active')->first()
  → SprintResource ou { data: null }

GET /workspaces/{workspaceId}/sprints/{id}
  → Sprint::where('workspace_id', $workspaceId)->findOrFail($id)
  → SprintResource

PATCH /workspaces/{workspaceId}/sprints/{id}
  → Verifica role admin ou lead
  → UpdateSprintRequest
  → $sprint->update($request->validated())
  → SprintResource

POST /workspaces/{workspaceId}/sprints/{id}/start
  → Verifica role admin ou lead
  → Verifica sprint está em draft
  → Verifica não existe sprint active no workspace: Sprint::where('workspace_id', ...)->where('status', 'active')->exists() → 409
  → DB::transaction():
      $sprint->update(['status' => 'active', 'started_at' => now()])
      ActivityLog::create([...])
  → SprintResource

POST /workspaces/{workspaceId}/sprints/{id}/complete
  → Verifica role admin ou lead
  → Verifica sprint está active
  → CompleteSprintRequest (retrospectiveNotes?)
  → Calcula métricas:
      $planned   = Task::where('sprint_id', $sprint->id)->count()
      $completed = Task::where('sprint_id', $sprint->id)->where('status', 'done')->count()
      $carriedOver = Task::where('sprint_id', $sprint->id)->whereNotIn('status', ['done', 'cancelled'])->count()
      $timeLogged = TimeEntry::where('task_id', [...taskIds])->sum('duration_seconds')
      $rate = $planned > 0 ? round(($completed / $planned) * 10000) : 0
      membersSnapshot = calcular por user (tasks done + time logged + pomodoros)
  → DB::transaction():
      $sprint->update(['status' => 'completed', 'completed_at' => now(), ...])
      SprintMetric::create([...])
      Task::where('sprint_id', $sprint->id)->whereNotIn('status', ['done', 'cancelled'])->update(['sprint_id' => null])
      ActivityLog::create([...])
  → SprintMetricResource

POST /workspaces/{workspaceId}/sprints/{id}/cancel
  → Verifica role admin ou lead
  → Verifica sprint é draft ou active
  → DB::transaction():
      $sprint->update(['status' => 'cancelled'])
      Task::where('sprint_id', $sprint->id)->update(['sprint_id' => null])
  → 204

GET /workspaces/{workspaceId}/sprints/{id}/metrics
  → SprintMetric::where('sprint_id', $id)->firstOrFail()
  → SprintMetricResource
```

---

## FASE 3 — Tasks

### `TaskController`

```
GET /workspaces/{workspaceId}/tasks
  → Filtros: sprintId, status, assigneeId, priority, isBlocked, page
  → Task::with('assignee')->where('workspace_id', $workspaceId)->when(...filtros...)->paginate(20)
  → TaskResource collection

GET /workspaces/{workspaceId}/tasks/backlog
  → Task::where('workspace_id', $workspaceId)->whereNull('sprint_id')->paginate(20)
  → TaskResource collection

POST /workspaces/{workspaceId}/tasks
  → CreateTaskRequest
  → Se sprintId → verifica Sprint pertence ao workspace
  → $position = Task::where('workspace_id', $workspaceId)->where('sprint_id', $sprintId)->where('status', 'backlog')->max('position') + 1 ?? 1
  → DB::transaction():
      $task = Task::create([..., 'workspace_id' => $workspaceId, 'created_by' => auth()->id(), 'position' => $position])
      TaskHistory::create(['task_id' => $task->id, 'changed_by' => auth()->id(), 'field' => 'created', 'new_value' => ['title' => $task->title, 'status' => $task->status]])
  → TaskResource 201

GET /workspaces/{workspaceId}/tasks/{id}
  → Task::with(['assignee', 'creator'])->where('workspace_id', $workspaceId)->findOrFail($id)
  → TaskResource

PATCH /workspaces/{workspaceId}/tasks/{id}
  → UpdateTaskRequest
  → DB::transaction():
      registar no task_history os campos que mudaram (loop em $request->validated())
      $task->update($request->validated())
  → TaskResource

DELETE /workspaces/{workspaceId}/tasks/{id}
  → $task->delete()  ← SoftDeletes
  → 204

PATCH /workspaces/{workspaceId}/tasks/{id}/status
  → UpdateTaskStatusRequest (status: enum)
  → DB::transaction():
      $old = $task->status
      $task->update(['status' => $request->status])
      TaskHistory::create(['task_id' => $task->id, 'changed_by' => auth()->id(), 'field' => 'status', 'old_value' => $old, 'new_value' => $request->status])
  → TaskResource

POST /workspaces/{workspaceId}/tasks/{id}/block
  → BlockTaskRequest (reason: string)
  → DB::transaction():
      $task->update(['is_blocked' => true, 'blocked_reason' => $reason, 'blocked_since' => now()])
      TaskHistory::create([..., 'field' => 'blocked', 'new_value' => ['reason' => $reason]])
  → TaskResource

POST /workspaces/{workspaceId}/tasks/{id}/unblock
  → DB::transaction():
      $task->update(['is_blocked' => false, 'blocked_reason' => null, 'blocked_since' => null])
      TaskHistory::create([..., 'field' => 'unblocked'])
  → TaskResource

POST /workspaces/{workspaceId}/tasks/{id}/move
  → MoveTaskRequest (sprintId: string|null)
  → Se sprintId → verifica Sprint pertence ao workspace e não está completed/cancelled
  → DB::transaction():
      $task->update(['sprint_id' => $request->sprintId])
      TaskHistory::create([..., 'field' => 'sprint_id', 'old_value' => $task->sprint_id, 'new_value' => $request->sprintId])
  → TaskResource

POST /workspaces/{workspaceId}/tasks/reorder
  → ReorderTasksRequest (tasks: [{ id, position }])
  → foreach $request->tasks → Task::where('id', $item['id'])->where('workspace_id', $workspaceId)->update(['position' => $item['position']])
  → 204
```

### `TaskCommentController`

```
GET /workspaces/{workspaceId}/tasks/{id}/comments
  → TaskComment::with('author')->where('task_id', $taskId)->get()
  → TaskCommentResource collection

POST /workspaces/{workspaceId}/tasks/{id}/comments
  → Body: { content: string }
  → TaskComment::create(['task_id' => $taskId, 'author_id' => auth()->id(), 'content' => $content])
  → TaskCommentResource 201

PATCH /workspaces/{workspaceId}/tasks/{id}/comments/{cId}
  → Verifica $comment->author_id === auth()->id() → 403
  → $comment->update(['content' => $request->content, 'edited_at' => now()])
  → TaskCommentResource

DELETE /workspaces/{workspaceId}/tasks/{id}/comments/{cId}
  → Verifica $comment->author_id === auth()->id() → 403
  → $comment->delete()
  → 204
```

### `TaskHistoryController`

```
GET /workspaces/{workspaceId}/tasks/{id}/history
  → TaskHistory::with('changer')->where('task_id', $taskId)->orderBy('changed_at', 'desc')->get()
  → TaskHistoryResource collection
```

---

## FASE 4 — Timer

### `TimerController`

```
GET /workspaces/{workspaceId}/timer/active
  → TimeEntry::where('user_id', auth()->id())->whereNull('ended_at')->with('task')->first()
  → Se existe: TimeEntryResource + elapsed_seconds = now()->diffInSeconds($entry->started_at)
  → Se não: { data: null }

POST /workspaces/{workspaceId}/timer/start
  → StartTimerRequest (taskId, type?: timer|pomodoro, notes?)
  → Verifica task pertence ao workspace
  → Verifica não existe timer ativo: TimeEntry::where('user_id', ...)->whereNull('ended_at')->exists() → 409
  → TimeEntry::create(['user_id' => auth()->id(), 'workspace_id' => $workspaceId, 'task_id' => $taskId, 'type' => $type, 'started_at' => now()])
  → TimeEntryResource 201

POST /workspaces/{workspaceId}/timer/stop
  → StopTimerRequest (notes?)
  → $entry = TimeEntry::where('user_id', auth()->id())->whereNull('ended_at')->firstOrFail()
  → $duration = now()->diffInSeconds($entry->started_at)
  → DB::transaction():
      $entry->update(['ended_at' => now(), 'duration_seconds' => $duration, 'notes' => $request->notes])
      $totalSeconds = TimeEntry::where('task_id', $entry->task_id)->whereNotNull('ended_at')->sum('duration_seconds')
      Task::where('id', $entry->task_id)->update(['actual_minutes' => (int) floor($totalSeconds / 60)])
  → TimeEntryResource

POST /workspaces/{workspaceId}/timer/pomodoro/complete
  → $entry = TimeEntry::where('user_id', auth()->id())->whereNull('ended_at')->where('type', 'pomodoro')->firstOrFail()
  → $entry->increment('pomodoro_count')
  → TimeEntryResource

POST /workspaces/{workspaceId}/timer/manual
  → CreateManualEntryRequest (taskId, startedAt, endedAt, notes?)
  → Verifica startedAt < endedAt → 422
  → $duration = Carbon::parse($endedAt)->diffInSeconds(Carbon::parse($startedAt))
  → DB::transaction():
      TimeEntry::create([..., 'type' => 'manual', 'duration_seconds' => $duration])
      $totalSeconds = TimeEntry::where('task_id', $taskId)->whereNotNull('ended_at')->sum('duration_seconds')
      Task::where('id', $taskId)->update(['actual_minutes' => (int) floor($totalSeconds / 60)])
  → TimeEntryResource 201

GET /workspaces/{workspaceId}/timer/entries
  → Filtros: from, to, page
  → TimeEntry::where('user_id', auth()->id())->where('workspace_id', $workspaceId)->when(...)->paginate(20)
  → TimeEntryResource collection

GET /workspaces/{workspaceId}/tasks/{taskId}/entries
  → TimeEntry::where('task_id', $taskId)->paginate(20)
  → TimeEntryResource collection

DELETE /workspaces/{workspaceId}/timer/entries/{id}
  → $entry = TimeEntry::findOrFail($id)
  → Verifica $entry->user_id === auth()->id() → 403
  → Verifica $entry->ended_at !== null → 409 'timer_still_active'
  → DB::transaction():
      $entry->delete()
      $totalSeconds = TimeEntry::where('task_id', $entry->task_id)->whereNotNull('ended_at')->sum('duration_seconds')
      Task::where('id', $entry->task_id)->update(['actual_minutes' => (int) floor($totalSeconds / 60)])
  → 204
```

---

## FASE 4 — Badges

### `BadgeController`

```
GET /badges
  → BadgeDefinition::where('is_active', true)->get()
  → BadgeDefinitionResource collection

GET /workspaces/{workspaceId}/badges
  → UserBadge::with('badge')->where('workspace_id', $workspaceId)->get()
  → UserBadgeResource collection

GET /workspaces/{workspaceId}/badges/me
  → UserBadge::with('badge')->where('workspace_id', $workspaceId)->where('user_id', auth()->id())->get()
  → UserBadgeResource collection

GET /workspaces/{workspaceId}/members/{userId}/badges
  → UserBadge::with('badge')->where('workspace_id', $workspaceId)->where('user_id', $userId)->get()
  → UserBadgeResource collection

[Staff]
GET /staff/badges
  → BadgeDefinition::all() → BadgeDefinitionResource collection

POST /staff/badges
  → CreateBadgeDefinitionRequest
  → BadgeDefinition::create($request->validated())
  → BadgeDefinitionResource 201

PATCH /staff/badges/{code}
  → BadgeDefinition::where('code', $code)->firstOrFail()
  → $badge->update($request->validated())
  → BadgeDefinitionResource
```

**Como verificar e atribuir badges (chamado internamente após eventos chave):**

Cria um método privado ou uma classe simples `BadgeChecker` que é chamada nos pontos certos dos controllers:

```php
// Chamado depois de parar o timer, completar sprint, fechar tarefa, etc.
// Não usa queue — chama direto, simples

class BadgeChecker
{
    public static function check(User $user, Workspace $workspace, string $trigger, array $context = []): void
    {
        $badges = BadgeDefinition::where('is_active', true)->get();

        foreach ($badges as $badge) {
            // já tem esta badge?
            $already = UserBadge::where('user_id', $user->id)
                ->where('workspace_id', $workspace->id)
                ->where('badge_code', $badge->code)
                ->exists();

            if ($already) continue;

            $earned = match ($badge->condition['type']) {
                'pomodoros_completed'    => self::checkPomodoros($user, $badge),
                'tasks_closed_in_day'    => self::checkTasksClosedToday($user, $workspace, $badge),
                'sprint_completion_rate' => self::checkSprintRate($context, $badge),
                'total_hours_logged'     => self::checkHoursLogged($user, $badge),
                'blocker_removed'        => $trigger === 'task.unblocked',
                default                  => false,
            };

            if ($earned) {
                DB::transaction(function () use ($user, $workspace, $badge, $context) {
                    UserBadge::create([
                        'user_id'      => $user->id,
                        'workspace_id' => $workspace->id,
                        'badge_code'   => $badge->code,
                        'unlocked_at'  => now(),
                        'context'      => $context,
                    ]);
                    Notification::create([
                        'recipient_id' => $user->id,
                        'workspace_id' => $workspace->id,
                        'type'         => 'badge_unlocked',
                        'title'        => "Badge desbloqueada: {$badge->name}",
                        'message'      => $badge->description,
                        'is_read'      => false,
                    ]);
                });
            }
        }
    }

    // métodos privados de cada condição...
}
```

Onde chamar `BadgeChecker::check()`:
- `TimerController::stop()` — depois do `DB::transaction()`
- `TimerController::completePomodoro()` — depois do increment
- `TaskController::updateStatus()` — se novo status for `done`
- `TaskController::unblock()` — depois da transaction
- `SprintController::complete()` — dentro da transaction, depois de criar o SprintMetric

---

## FASE 5 — Analytics

### `AnalyticsController`

```
GET /workspaces/{workspaceId}/dashboard
  → $activeSprint = Sprint::where('workspace_id', $workspaceId)->where('status', 'active')->first()
  → $tasksByStatus = Task::where('workspace_id', $workspaceId)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status')
  → $recentActivity = ActivityLog::where('workspace_id', $workspaceId)->with('actor')->latest('created_at')->limit(10)->get()
  → $topContributors = calcular com queries de time_entries e tasks do sprint ativo
  → $blockedCount = Task::where('workspace_id', $workspaceId)->where('is_blocked', true)->count()
  → Retorna tudo montado

GET /workspaces/{workspaceId}/analytics/stats
  → Query params: from, to
  → Usa DailySnapshot se período histórico, dados em tempo real para o dia de hoje
  → DailySnapshot::where('workspace_id', $workspaceId)->whereBetween('date', [$from, $to])->get()

GET /workspaces/{workspaceId}/analytics/members/{userId}
  → Verifica membro do workspace
  → Filtros: sprintId, from, to
  → tasks assigned, tasks completed, time logged, pomodoros, badges count

GET /workspaces/{workspaceId}/analytics/burndown/{sprintId}
  → Sprint::where('workspace_id', $workspaceId)->findOrFail($sprintId)
  → Calcula a partir de task_history: quantas tasks ficaram done por dia
  → Monta array de { date, remaining, ideal }

GET /workspaces/{workspaceId}/activity
  → ActivityLog::where('workspace_id', $workspaceId)->with('actor')->latest('created_at')->paginate(20)
```

---

## FASE 5 — Notifications

### `NotificationController`

```
GET /notifications
  → Notification::where('recipient_id', auth()->id())->orderBy('is_read')->orderBy('created_at', 'desc')->paginate(20)
  → NotificationResource collection

PATCH /notifications/{id}/read
  → Notification::where('id', $id)->where('recipient_id', auth()->id())->firstOrFail()
  → $notif->update(['is_read' => true, 'read_at' => now()])
  → NotificationResource

PATCH /notifications/read-all
  → Notification::where('recipient_id', auth()->id())->where('is_read', false)->update(['is_read' => true, 'read_at' => now()])
  → 204

DELETE /notifications/{id}
  → Notification::where('id', $id)->where('recipient_id', auth()->id())->firstOrFail()->delete()
  → 204
```

---

## FormRequests — Exemplos Chave

```php
// CreateWorkspaceRequest
public function rules(): array {
    return [
        'name'                => 'required|string|max:100',
        'slug'                => 'required|string|max:60|regex:/^[a-z0-9-]+$/',
        'sprint_duration_days'=> 'nullable|integer|in:7,14,30',
        'timezone'            => 'nullable|string|timezone',
    ];
}

// CreateTaskRequest
public function rules(): array {
    return [
        'title'             => 'required|string|max:255',
        'description'       => 'nullable|string',
        'priority'          => 'nullable|in:urgent,high,medium,low',
        'assignee_id'       => 'nullable|exists:users,id',
        'sprint_id'         => 'nullable|exists:sprints,id',
        'estimated_minutes' => 'nullable|integer|min:1',
        'due_date'          => 'nullable|date|after:today',
        'tags'              => 'nullable|array',
        'tags.*'            => 'string|max:50',
    ];
}

// UpdateTaskStatusRequest
public function rules(): array {
    return [
        'status' => 'required|in:backlog,todo,in_progress,in_review,blocked,done,cancelled',
    ];
}

// StartTimerRequest
public function rules(): array {
    return [
        'task_id' => 'required|exists:tasks,id',
        'type'    => 'nullable|in:timer,pomodoro',
        'notes'   => 'nullable|string|max:500',
    ];
}
```

---

## API Resources — Exemplos Chave

```php
// TaskResource
public function toArray(Request $request): array {
    return [
        'id'              => $this->id,
        'workspace_id'    => $this->workspace_id,
        'sprint_id'       => $this->sprint_id,
        'title'           => $this->title,
        'description'     => $this->description,
        'status'          => $this->status,
        'priority'        => $this->priority,
        'assignee'        => $this->whenLoaded('assignee', fn() => [
            'id'     => $this->assignee->id,
            'name'   => $this->assignee->name,
            'avatar' => $this->assignee->avatar,
        ]),
        'created_by'        => $this->created_by,
        'estimated_minutes' => $this->estimated_minutes,
        'actual_minutes'    => $this->actual_minutes,
        'due_date'          => $this->due_date,
        'tags'              => $this->tags ?? [],
        'position'          => $this->position,
        'is_blocked'        => $this->is_blocked,
        'blocked_reason'    => $this->blocked_reason,
        'blocked_since'     => $this->blocked_since,
        'created_at'        => $this->created_at,
        'updated_at'        => $this->updated_at,
    ];
}
```

---

## Registo de Middleware — `bootstrap/app.php`

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
    $middleware->alias([
        'staff.auth'       => \App\Http\Middleware\CheckStaffToken::class,
        'workspace.member' => \App\Http\Middleware\CheckWorkspaceMember::class,
    ]);
})
```

---

## Regras Transversais

**Isolamento por workspace:** toda query a tasks, sprints, time_entries e user_badges inclui `where('workspace_id', $workspaceId)` — nunca confias só no ID do recurso.

**actual_minutes nunca é editável via API:** sempre recalculado como `SUM(duration_seconds) / 60` ao parar timer ou apagar entrada.

**Sprint metrics são imutáveis:** criados uma vez no `complete`, nunca atualizados depois.

**Badges são idempotentes:** unique constraint em `(user_id, workspace_id, badge_code)` — se já existe, falha silenciosamente.

**Email hash:** lookups por email sempre via `hash('sha256', strtolower($email))` — nunca query direta no email.

**Task history imutável:** nunca se apaga ou edita — só se cria. Cada mudança de campo = nova linha.

**Timer único por user:** sempre verificar `TimeEntry::where('user_id', ...)->whereNull('ended_at')->exists()` antes de criar novo.

**Sprint único por workspace:** sempre verificar `Sprint::where('workspace_id', ...)->where('status', 'active')->exists()` antes de iniciar.

**Sanctum para users, token custom para staff** — os dois sistemas nunca se misturam. Middleware separado para cada um.
