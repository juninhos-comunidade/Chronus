
<h1 align="center">Chronus</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Comunidade-Juninhos-7B2CBF?style=for-the-badge&logo=discord&logoColor=white" alt="Juninhos Community" />
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange?style=for-the-badge" alt="Status" />
</p>

> Documento vivo. É o cérebro do projecto — orientado a fluxo, jornada do utilizador e propriedade de dados.

---

## 1. O Que é o Chronus e Por Que Existe

O Chronus nasceu para resolver um problema real dentro de equipas de desenvolvimento: a procrastinação colectiva não tem ferramenta adequada. As equipas usam o Trello para tarefas, o Toggl para tempo, o Slack para comunicação e o Notion para documentação — e acabam com quatro janelas abertas e zero foco.

O Chronus é uma **plataforma de gestão de tempo focada em equipas** — um espaço onde qualquer membro pode ver o que está a ser feito, por quem, há quanto tempo, e o que ainda está bloqueado. Não é um simples kanban. É um sistema que une tarefas, cronómetros, métricas e gamificação numa experiência coesa.

**O que nos diferencia dos concorrentes:**

| Ferramenta | O que fazem bem | O que lhes falta |
|---|---|---|
| **Toggl Track** | Registo de tempo preciso, relatórios visuais | Sem gestão de tarefas, sem foco colectivo |
| **Linear** | Velocidade, UX para engenheiros, ciclos de sprint | Sem rastreio de tempo nativo, sem gamificação |
| **Jira** | Customização total, workflows complexos | Lento, burocrático, curva de aprendizagem alta |
| **Clockify** | Rastreio de tempo por equipas, grátis | Sem kanban, sem foco colectivo, sem badges |
| **Slack** | Comunicação em tempo real, canais contextuais | Não gere tarefas nem tempo — é só mensagens |

O Chronus não é nenhum deles — é a intersecção entre todos, pensado para equipas pequenas que querem velocidade sem perder visibilidade.

## Stack Tecnológica

O projeto foi estruturado seguindo os conceitos de **modularização**, alta coesão e baixo acoplamento:

* **Frontend:** ...
* **Backend:** ...
* **Banco de Dados:** ...
* **Infraestrutura:** ...

## Nosso Squad

Um projeto completo só ganha vida com uma equipe sintonizada. Conheça as mentes por trás do desenvolvimento do Chronus:

| Avatar | Membro | Função / Especialidade | GitHub |
| :---: | :--- | :--- | :--- |
| <img src="https://avatars.githubusercontent.com/u/90227291?v=4" width="40" height="40" style="border-radius:50%"/> | **Kauê Henrick Wiliam de Jesus Weber** | Pendente | [kauehenrick](https://github.com/kauehenrick) |
| <img src="https://avatars.githubusercontent.com/u/86389273?v=4" width="40" height="40" style="border-radius:50%"/> | **Sabrina** | Pendente | [SabrinaZ8](https://github.com/SabrinaZ8) |
| <img src="https://avatars.githubusercontent.com/u/73138345?v=4" width="40" height="40" style="border-radius:50%"/> | **Gustavo Oliveira Souza** | Pendente | [gstvoli](https://github.com/gstvoli) |
| <img src="https://avatars.githubusercontent.com/u/81269768?v=4" width="40" height="40" style="border-radius:50%"/> | **Vitoria Pio Camilo da Silva** | Pendente | [VitoriaPio](https://github.com/VitoriaPio) |
| <img src="https://avatars.githubusercontent.com/u/195234422?v=4" width="40" height="40" style="border-radius:50%"/> | **Felipe Gomes** | Pendente | [felipegs0](https://github.com/felipegs0) |
| <img src="https://avatars.githubusercontent.com/u/178031162?v=4" width="40" height="40" style="border-radius:50%"/> | **Edgar Manuel Janota** | Pendente | [ndulomk](https://github.com/ndulomk) |

---

## 2. Os Três Actores

| Actor | Quem é | O que quer |
|---|---|---|
| **Member** | Qualquer pessoa da equipa | Saber o que fazer agora, registar o tempo, não perder foco |
| **Lead** | Líder de sprint ou tech lead | Distribuir tarefas, ver o progresso, identificar bloqueios |
| **Admin** | Quem criou o workspace | Gerir membros, ver métricas globais, configurar o sistema |

Um utilizador pode ser Member num workspace e Lead noutro. Os papéis são por workspace, não globais.

---

## 3. Módulos do Sistema

| Módulo | Responsabilidade |
|---|---|
| **Identity** | Auth, perfis, workspaces, sessões |
| **Tasks** | Criação, atribuição, priorização e ciclo de vida de tarefas |
| **Kanban** | Visualização e movimentação de tarefas por estado |
| **Timer** | Cronómetros por tarefa, sessões Pomodoro, rastreio de tempo |
| **Sprint** | Planeamento de ciclos de 30 dias, backlog, capacidade |
| **Metrics** | Dashboard de produtividade, relatórios anti-procrastinação |
| **Badges** | Gamificação, insígnias, metas de foco e consistência |
| **Notifications** | Alertas em tempo real para todos os actores |
| **Activity Log** | Registo imutável de todas as acções relevantes |

---

## 4. Jornadas do Utilizador

As jornadas são o coração deste documento. Tudo o que o sistema faz serve uma destas jornadas.

---

### 4.1 Jornada do Member — Foco Diário

```
[1] Abre o Chronus
        ↓
[2] Vê o seu painel pessoal:
    - Tarefas atribuídas a si
    - Tarefas em curso (com cronómetro activo)
    - Tarefas bloqueadas
        ↓
[3] Escolhe uma tarefa → abre o detalhe
        ↓
[4] Clica "Iniciar" → cronómetro arranca
        ↓
[5] Trabalha na tarefa
        ↓
[6] Pausa ou termina o cronómetro
        ↓
[7] Move a tarefa no kanban (ex: "Em curso" → "Em revisão")
        ↓
[8] Se bloqueado → marca tarefa como bloqueada + adiciona nota
        ↓
[9] Fim do dia → vê tempo total registado e resumo das sessões
        ↓
[10] Acumula streak de foco → desbloqueia badge
```

**Regras desta jornada:**
- Um member só pode ter **um cronómetro activo de cada vez**. Se iniciar outro, o anterior é pausado automaticamente.
- O cronómetro continua mesmo que o member feche o browser — é server-side, não client-side.
- A tarefa não muda de estado automaticamente quando o cronómetro arranca. O member controla o estado.
- O tempo mínimo registado é de 1 minuto. Sessões abaixo disso são descartadas.

---

### 4.2 Jornada do Lead — Planeamento de Sprint

```
[1] Abre o painel de sprint
        ↓
[2] Vê o backlog: tarefas sem sprint atribuído
        ↓
[3] Cria novo sprint (nome, datas, capacidade da equipa em horas)
        ↓
[4] Arrasta tarefas do backlog para o sprint
        ↓
[5] Distribui tarefas pelos membros (atribuição)
        ↓
[6] Define prioridades (urgent / high / medium / low)
        ↓
[7] Inicia o sprint → tarefas ficam visíveis no kanban de todos
        ↓
[8] Durante o sprint: acompanha o progresso no dashboard
        ↓
[9] Detecta tarefas paradas há mais de X horas → alerta
        ↓
[10] Sprint termina → retrospectiva: tarefas entregues vs planeadas
```

**Regras desta jornada:**
- Um sprint só pode ser iniciado se tiver pelo menos uma tarefa atribuída.
- Tarefas podem ser movidas entre sprints enquanto o sprint de destino não tiver iniciado.
- Quando um sprint termina, as tarefas não concluídas voltam automaticamente ao backlog.
- O Lead pode ver o tempo real gasto vs estimado por tarefa e por membro.

---

### 4.3 Jornada do Lead — Gestão Diária Durante o Sprint

```
[1] Abre dashboard de sprint activo
        ↓
[2] Vê métricas em tempo real:
    - Tarefas: to-do / em curso / bloqueadas / concluídas
    - Tempo: estimado vs real por membro
    - Velocidade: tarefas fechadas por dia
        ↓
[3] Identifica tarefas bloqueadas → entra no detalhe → lê a nota do member
        ↓
[4] Desbloqueia: reatribui, divide em sub-tarefas ou remove do sprint
        ↓
[5] Adiciona comentário na tarefa → member é notificado
        ↓
[6] Vê quem está sem tarefas activas → redistribui carga
        ↓
[7] No fim do dia: exporta relatório de progresso
```

---

### 4.4 Jornada do Member — Sessão Pomodoro (Foco Técnico)

```
[1] Member abre tarefa
        ↓
[2] Activa modo Pomodoro (25min foco / 5min pausa)
        ↓
[3] Cronómetro conta 25 minutos
        ↓
[4] Notificação: "Pausa de 5 minutos"
        ↓
[5] Após 4 ciclos → pausa longa de 15 minutos
        ↓
[6] Sistema regista automaticamente quantos pomodoros foram feitos naquela tarefa
        ↓
[7] Ao fim do dia: resumo de pomodoros completos → pontos para badge "Foco Profundo"
```

**Regras desta jornada:**
- O Pomodoro pode ser interrompido manualmente. O ciclo incompleto não conta para badges mas o tempo é registado.
- O Lead vê no dashboard quantos pomodoros o team completou hoje.

---

### 4.5 Jornada do Admin — Onboarding da Equipa

```
[1] Admin cria workspace (nome, slug único, timezone)
        ↓
[2] Convida membros via email (link de convite com expiração de 72h)
        ↓
[3] Membros aceitam o convite → criam conta → entram no workspace
        ↓
[4] Admin atribui roles: Member ou Lead
        ↓
[5] Admin configura o kanban (estados por defeito ou customizados)
        ↓
[6] Admin define a duração do sprint padrão (7, 14 ou 30 dias)
        ↓
[7] Primeiro sprint criado pelo Lead → sistema está operacional
```

---

### 4.6 Jornada do Sistema — Métricas Anti-Procrastinação

Esta jornada não é accionada por um humano — é o sistema a agir proactivamente.

```
[1] Sistema verifica continuamente:
    - Tarefas "Em curso" sem actividade de cronómetro há mais de 4h
    - Tarefas não movidas no kanban há mais de 2 dias
    - Membros sem nenhum cronómetro activo durante horas de trabalho
        ↓
[2] Gera alertas internos (não spam — máximo 1 alerta por tarefa por dia)
        ↓
[3] Notifica o Lead: "3 tarefas parecem estar paradas"
        ↓
[4] Notifica o Member: "Tens uma tarefa em curso sem tempo registado há 4h"
        ↓
[5] Regista o evento no activity log para análise posterior
        ↓
[6] No relatório semanal: mostra padrões de procrastinação por membro e por tipo de tarefa
```

---

## 5. Entidades — O Que Existe no Sistema

---

### 5.1 Identity

**`users`** — tabela global de todos os utilizadores.

Campos chave: `email`, `name`, `avatar_url`, `password_hash`, `google_id` (OAuth), `timezone`, `status` (`active | suspended`), `created_at`.

**`workspaces`** — cada equipa tem um workspace isolado.

Campos chave: `name`, `slug` (único globalmente, ex: `juninhos-chronus`), `owner_id` (FK → users), `sprint_duration_days` (7 / 14 / 30), `timezone`, `kanban_config` (jsonb — estados customizados), `created_at`.

**`workspace_members`** — relação entre user e workspace.

Campos chave: `workspace_id`, `user_id`, `role` (`admin | lead | member`), `invited_by` (FK → users), `joined_at`, `status` (`active | suspended`).

**`invites`** — convites pendentes para entrar no workspace.

Campos chave: `workspace_id`, `email`, `role`, `token` (único, hash), `invited_by`, `expires_at`, `accepted_at` (nullable).

**`sessions`** — sessões autenticadas.

Campos chave: `user_id`, `token_hash`, `device_info`, `ip_address`, `expires_at`, `last_active_at`.

---

### 5.2 Tasks

**`tasks`** — a unidade central do sistema.

Campos chave: `workspace_id`, `sprint_id` (nullable — null significa backlog), `title`, `description`, `status` (`backlog | todo | in_progress | in_review | blocked | done | cancelled`), `priority` (`urgent | high | medium | low`), `assignee_id` (FK → users, nullable), `created_by` (FK → users), `estimated_minutes` (nullable), `actual_minutes` (calculado a partir de time_entries), `due_date`, `tags` (jsonb array), `position` (número de ordem no kanban — para drag & drop), `is_blocked`, `blocked_reason`, `blocked_since`.

Sem sub-tarefas na fase 1. Uma tarefa é atómica. Se for grande demais, o Lead divide em múltiplas tarefas.

**`task_comments`** — comentários contextuais numa tarefa.

Campos chave: `task_id`, `author_id` (FK → users), `content`, `created_at`, `edited_at` (nullable).

**`task_history`** — registo imutável de todas as mudanças de estado de uma tarefa.

Campos chave: `task_id`, `changed_by` (FK → users), `field` (ex: `status`, `assignee_id`, `priority`), `old_value`, `new_value`, `changed_at`.

---

### 5.3 Kanban

O Kanban não tem tabela própria — é uma view sobre `tasks`, filtrada por `workspace_id` + `sprint_id`, agrupada por `status` e ordenada por `position`.

**Estados por defeito:**

| Estado | Descrição |
|---|---|
| `todo` | Tarefa planeada para este sprint, não iniciada |
| `in_progress` | Cronómetro activo ou recentemente activo |
| `in_review` | Aguarda revisão de outro membro |
| `blocked` | Impedimento identificado |
| `done` | Concluída e aceite |

O Admin pode renomear os estados ou adicionar estados intermédios (ex: `in_qa`, `waiting_deploy`). A configuração vive em `workspaces.kanban_config`.

**Regra de posição:** `position` é um número de vírgula flutuante (ex: 1.0, 2.0, 1.5) para permitir inserção entre items sem reordenar tudo — padrão LexoRank simplificado, como usa o Linear e o Jira.

---

### 5.4 Timer

**`time_entries`** — cada sessão de trabalho numa tarefa.

Campos chave: `task_id`, `user_id`, `workspace_id`, `started_at`, `ended_at` (nullable — null significa cronómetro activo), `duration_seconds` (calculado ao fechar), `type` (`manual | timer | pomodoro`), `pomodoro_count` (número de ciclos completos, para type=pomodoro), `notes` (opcional).

`duration_seconds` é sempre calculado no servidor quando `ended_at` é preenchido. O cliente não envia a duração — envia o `ended_at` e o servidor calcula. Protege contra manipulação.

**Regra de concorrência:** O sistema verifica, antes de criar um novo `time_entry` com `ended_at = null`, se o utilizador já tem algum entry activo naquele workspace. Se sim, fecha o anterior automaticamente com `ended_at = now()`.

**`active_timers`** — cache em memória (Redis) dos cronómetros activos. Não é a fonte de verdade — é só para performance de leitura.

Campos chave: `user_id`, `task_id`, `started_at`, `ttl` (renovado a cada heartbeat do cliente).

Se o cliente fechar o browser sem parar o cronómetro, o TTL expira e o sistema fecha o `time_entry` automaticamente com `ended_at = last_heartbeat_at`.

---

### 5.5 Sprint

**`sprints`** — ciclo de trabalho da equipa.

Campos chave: `workspace_id`, `name` (ex: "Sprint 1 — Autenticação"), `status` (`draft | active | completed | cancelled`), `started_at`, `ends_at`, `created_by` (FK → users), `capacity_hours` (estimativa de horas disponíveis da equipa), `goal` (texto livre — o objectivo do sprint), `retrospective_notes` (preenchido ao fechar o sprint).

Apenas um sprint pode estar `active` por workspace de cada vez.

**`sprint_metrics`** — snapshot calculado ao fechar o sprint. Não é recalculado — é imutável.

Campos chave: `sprint_id`, `total_tasks_planned`, `total_tasks_completed`, `total_tasks_carried_over` (voltaram ao backlog), `total_time_logged_seconds`, `completion_rate` (%), `members_snapshot` (jsonb — contribuição por membro neste sprint).

---

### 5.6 Metrics

O módulo de métricas não tem tabelas próprias na maioria dos casos — é servido por queries sobre `time_entries`, `tasks` e `task_history`.

**`daily_snapshots`** — agregação diária por workspace. Calculada no fim de cada dia (job nocturno). Para performance — evita recalcular histórico.

Campos chave: `workspace_id`, `date`, `tasks_created`, `tasks_completed`, `tasks_blocked`, `total_time_seconds`, `active_members` (quantos membros registaram pelo menos 1 entrada), `pomodoros_completed`.

**Métricas em tempo real** (calculadas on-demand, sem snapshot):
- Tempo total por membro hoje
- Tarefas por estado agora
- Cronómetros activos agora

**Métricas de procrastinação** (calculadas no job nocturno):
- Tarefas `in_progress` sem `time_entries` nas últimas 4h
- Tarefas sem mudança de estado há mais de 2 dias
- Membros sem actividade no dia

---

### 5.7 Badges

**`badge_definitions`** — catálogo de todas as insígnias possíveis. Gerido pelo sistema (não pelos utilizadores).

Campos chave: `code` (único, ex: `focus_first_pomodoro`), `name`, `description`, `icon_url`, `category` (`focus | consistency | speed | collaboration | milestone`), `condition` (jsonb — critérios para desbloquear: ex: `{"type": "pomodoros_completed", "threshold": 1}`).

**`user_badges`** — insígnias desbloqueadas por um utilizador num workspace.

Campos chave: `user_id`, `workspace_id`, `badge_code` (FK → badge_definitions), `unlocked_at`, `context` (jsonb — ex: `{"sprint_id": 3, "task_id": 42}`).

**Exemplos de badges:**

| Badge | Condição |
|---|---|
| 🍅 Primeiro Foco | Completar o primeiro Pomodoro |
| 🔥 Em Chama | 7 dias consecutivos com pelo menos 1 Pomodoro |
| ⚡ Velocidade | Fechar 5 tarefas num único dia |
| 🧱 Construtor | Registar 100 horas totais no workspace |
| 🎯 Sprint Perfeito | Sprint com 100% de conclusão |
| 🤝 Desbloqueador | Remover o bloqueio de uma tarefa de outro membro |

**Regra de desbloqueio:** Um job corre a cada hora e verifica condições de badges por utilizador. Se a condição for cumprida e o badge não estiver ainda desbloqueado, cria o registo em `user_badges` e dispara uma notificação.

---

### 5.8 Notifications

**`notifications`** — alertas para todos os actores.

Campos chave: `recipient_id` (FK → users), `workspace_id`, `type` (ex: `task.assigned`, `task.blocked`, `badge.unlocked`, `sprint.started`, `timer.idle_alert`), `title`, `message`, `action_url`, `data` (jsonb), `is_read`, `read_at`, `created_at`.

**Canais de entrega (fase 1):** in-app (polling ou WebSocket). Email apenas para convites e badges importantes.

---

### 5.9 Activity Log

**`activity_log`** — registo imutável de todas as acções relevantes. Nunca se apaga.

Campos chave: `workspace_id`, `actor_id` (FK → users), `action` (ex: `task.status_changed`, `sprint.started`, `badge.unlocked`, `timer.started`), `entity_type`, `entity_id`, `old_value` (jsonb, nullable), `new_value` (jsonb, nullable), `ip_address`, `created_at`.

---

## 6. Fluxos Detalhados

### 6.1 Fluxo de Cronómetro (Timer)

O cronómetro parece simples. Não é. É o coração do sistema e tem de ser robusto.

```
[1] Member clica "Iniciar" numa tarefa
        ↓
[2] Cliente envia POST /timers/start { task_id }
        ↓
[3] Servidor verifica se há cronómetro activo para este user no workspace
    ├── Se sim → fecha o anterior: time_entry.ended_at = now(), calcula duration
    └── Se não → continua
        ↓
[4] Cria time_entry { task_id, user_id, started_at: now(), ended_at: null }
[5] Actualiza active_timers no Redis (TTL: 90 segundos)
        ↓
[6] Cliente envia heartbeat a cada 60 segundos (renova TTL no Redis)
        ↓
[7] Member clica "Parar"
    → Cliente envia POST /timers/stop { time_entry_id }
    → Servidor: time_entry.ended_at = now(), duration_seconds calculado
    → Remove de active_timers no Redis
        ↓
[8] Se cliente fechar o browser sem parar:
    → TTL expira no Redis (após 90 segundos sem heartbeat)
    → Job de limpeza detecta time_entry com ended_at = null e started_at > 90s atrás
    → Fecha automaticamente com ended_at = last_heartbeat_at
```

**Porquê server-side?** O Toggl e o Clockify aprenderam da forma difícil: cronómetros client-side perdem-se quando o browser fecha, o telemóvel bloqueia ou a ligação cai. O tempo de trabalho real é precioso — não pode desaparecer.

---

### 6.2 Fluxo de Kanban (Drag & Drop)

```
[1] Member arrasta tarefa de "To Do" para "In Progress"
        ↓
[2] Cliente calcula nova posição (LexoRank):
    nova_posição = (posição_anterior + posição_seguinte) / 2
        ↓
[3] Cliente envia PATCH /tasks/{id} { status: "in_progress", position: 1.5 }
        ↓
[4] Servidor valida a transição de estado (ex: não pode ir de "Done" para "In Progress" sem passar por "In Review")
        ↓
[5] Actualiza task.status e task.position
[6] Cria registo em task_history
        ↓
[7] Broadcast via WebSocket para todos os membros do workspace:
    { type: "task.moved", task_id, new_status, new_position, moved_by }
        ↓
[8] Todos os clientes actualizam a sua view em tempo real
```

**Porquê WebSocket aqui?** O Slack ensinou que updates em tempo real mudam completamente a experiência colectiva. Quando o Lead vê a tarefa a mover-se no kanban ao mesmo tempo que o member a move, o trabalho deixa de ser assíncrono — passa a ser colaborativo. O Linear usa o mesmo padrão.

---

### 6.3 Fluxo de Sprint (Abertura e Fecho)

```
ABERTURA:
[1] Lead cria sprint (nome, datas, capacidade)
        ↓
[2] Lead adiciona tarefas do backlog ao sprint (sprint_id preenchido nas tasks)
        ↓
[3] Lead clica "Iniciar Sprint"
    → sprint.status = active
    → tasks.status = todo (para todas as tarefas do sprint ainda em backlog)
    → Notificação para todos os membros: "Sprint X iniciado"
        ↓
[4] Sprint activo: sistema monitoriza tarefas e tempo em tempo real

FECHO:
[5] Data de fim chegou OU Lead fecha manualmente
        ↓
[6] Sistema calcula sprint_metrics (snapshot imutável)
        ↓
[7] Tarefas não concluídas → sprint_id = null (voltam ao backlog)
        ↓
[8] sprint.status = completed
        ↓
[9] Verifica badges de sprint (ex: "Sprint Perfeito" se completion_rate = 100%)
        ↓
[10] Lead preenche retrospective_notes
        ↓
[11] Relatório de sprint disponível para toda a equipa
```

---

### 6.4 Fluxo de Badge (Desbloqueio)

```
[1] Job corre a cada hora
        ↓
[2] Para cada badge_definition activo:
    - Lê a condição (ex: { type: "pomodoros_completed", threshold: 10 })
    - Corre query para verificar quem cumpriu a condição e ainda não tem o badge
        ↓
[3] Para cada utilizador elegível:
    - Cria registo em user_badges
    - Cria notificação: { type: "badge.unlocked", ... }
    - Regista em activity_log
        ↓
[4] Cliente recebe notificação (WebSocket ou polling)
        ↓
[5] Modal de celebração aparece: "Desbloqueaste: 🔥 Em Chama"
```

---

### 6.5 Fluxo de Alerta Anti-Procrastinação

```
[1] Job corre a cada hora (hora de trabalho: 8h-22h, timezone do workspace)
        ↓
[2] Detecta tarefas problemáticas:
    - SELECT tasks WHERE status = 'in_progress'
      AND task_id NOT IN (
        SELECT task_id FROM time_entries
        WHERE ended_at IS NULL OR ended_at > now() - interval '4 hours'
      )
        ↓
[3] Verifica se já foi enviado alerta para esta tarefa hoje
    → Se sim: skip (máximo 1 alerta por tarefa por dia)
        ↓
[4] Cria notificação para o assignee: "Tens uma tarefa em curso sem actividade há 4h"
[5] Cria notificação para o Lead: "X tarefas parecem estar paradas"
        ↓
[6] Regista em activity_log { action: "alert.idle_task_detected" }
```

---

## 7. Arquitectura de Tempo Real (Inspirada no Slack)

O Chronus precisa de tempo real para três casos de uso:
- Kanban colaborativo (todos vêem o board mudar em simultâneo)
- Cronómetros activos visíveis para o Lead
- Notificações instantâneas (badges, alertas, comentários)

O Slack serve tens of millions of WebSocket connections simultâneas. Nós não precisamos de nada disso na fase 1 — mas aprendemos os padrões certos.

### Fase 1 — Polling Inteligente
- Cliente faz polling a cada 5 segundos para o board activo
- Polling a cada 30 segundos para notificações
- Suficiente para equipas pequenas (até 50 membros por workspace)
- Zero complexidade de infra

### Fase 2 — WebSockets
- Quando houver volume e a latência do polling se tornar notável
- Cada cliente mantém uma conexão WebSocket persistente
- Servidor publica eventos via pub/sub interno (Redis)
- Eventos: `task.moved`, `timer.started`, `badge.unlocked`, `sprint.updated`
- Segue o modelo de fan-out do Slack: um evento publicado uma vez, entregue a todos os clientes conectados ao workspace

---

## 8. Decisões de Arquitectura

| Decisão | Escolha | Motivo |
|---|---|---|
| Cronómetro | Server-side | Sobrevive ao fecho do browser — Toggl e Clockify aprenderam da forma difícil |
| Posição no kanban | LexoRank (float) | Inserção entre items sem reordenar — padrão do Linear e Jira |
| Estados do kanban | Configuráveis por workspace | Equipas diferentes têm workflows diferentes — rigidez mata adopção |
| Sub-tarefas | Sem sub-tarefas na fase 1 | Complexidade sem ROI claro para equipas pequenas |
| Sprint | Um activo por workspace | Foco — equipas pequenas não gerem múltiplos sprints em paralelo |
| Métricas anti-procrastinação | Job horário, não real-time | Real-time seria over-engineering; 1h de lag é suficiente para alertas de inactividade |
| Badge check | Job horário | Consistente com o anterior; desbloqueio em 1h é aceitável para gamificação |
| Kanban real-time | Polling na fase 1 | Equipas pequenas toleram 5s de lag; WebSocket na fase 2 quando necessário |
| Roles | Por workspace | Um utilizador pode ser Lead num workspace e Member noutro |
| Contas para entrar | Convite obrigatório | Workspace privado — não é produto público |
| Timezone | Por workspace | Equipas distribuídas têm horários diferentes — alertas de inactividade respeitam o timezone |
| task_history | Imutável | Audit trail permanente — quem mudou o quê e quando |
| sprint_metrics | Snapshot ao fechar | Histórico de sprints não deve mudar com o tempo |

---

## 9. O Que NÃO Existe no Chronus na Fase 1

- **Integração com GitHub/GitLab** — ligar commits a tarefas é útil mas não é blocker para lançar
- **Time tracking automático** (como o TimeCamp faz, detectando janelas activas) — privacidade e complexidade técnica alta
- **Facturação / billable hours** — o Harvest e o Toggl fazem isso bem; o Chronus é focado em foco, não em invoicing
- **Chat integrado** — o Slack existe e integra melhor do que qualquer chat que construíssemos
- **Mobile app nativa** — Progressive Web App (PWA) na fase 1
- **Sub-tarefas** — futuro; complica o kanban e o rastreio de tempo sem valor claro agora
- **Múltiplos sprints activos em paralelo** — foco é o produto; complexidade de planeamento na fase 2
- **Exportação para Jira/Linear** — futuro, quando houver pedido real da comunidade
- **Permissões granulares** (além de admin/lead/member) — over-engineering para equipas de 6 pessoas

---

## 10. Backlog de Funcionalidades por Módulo

### 🔐 Identity & Auth
- [ ] Registo com email + password
- [ ] Login com Google (OAuth)
- [ ] Criação de workspace (nome, slug, timezone)
- [ ] Convite de membros por email (token com expiração de 72h)
- [ ] Aceitação de convite → criação de conta
- [ ] Gestão de roles pelo Admin (promover / remover Lead)
- [ ] Logout e invalidação de sessão
- [ ] Edição de perfil (nome, avatar, timezone)

### ⏱️ Timer
- [ ] Iniciar cronómetro numa tarefa (um por vez)
- [ ] Pausar / retomar cronómetro
- [ ] Parar cronómetro e registar tempo
- [ ] Modo Pomodoro (25min/5min com notificações)
- [ ] Registo manual de tempo (para retroactivo)
- [ ] Heartbeat client-side (manter cronómetro vivo)
- [ ] Job de limpeza de cronómetros abandonados (TTL expirado)
- [ ] Visualização de tempo total do dia

### 📋 Tasks & Kanban
- [ ] Criar tarefa (título, descrição, prioridade, estimativa, assignee)
- [ ] Mover tarefa entre estados (drag & drop no kanban)
- [ ] Atribuir / reatribuir tarefa
- [ ] Marcar tarefa como bloqueada + nota de bloqueio
- [ ] Adicionar comentário numa tarefa
- [ ] Ver histórico de mudanças de uma tarefa
- [ ] Filtrar tarefas (por assignee, prioridade, estado, tags)
- [ ] Adicionar tarefa ao backlog (sem sprint)
- [ ] Estados de kanban configuráveis pelo Admin

### 🌀 Sprint
- [ ] Criar sprint (nome, datas, capacidade em horas, objectivo)
- [ ] Adicionar tarefas do backlog ao sprint
- [ ] Iniciar sprint → notificar equipa
- [ ] Fechar sprint → calcular métricas, mover não concluídas para backlog
- [ ] Ver tarefas por sprint (histórico)
- [ ] Retrospectiva: notas do Lead ao fechar o sprint

### 📊 Metrics & Dashboard
- [ ] Dashboard pessoal: tempo hoje, tarefas activas, streak
- [ ] Dashboard de sprint: progresso por estado, tempo por membro
- [ ] Alerta de tarefas sem actividade há mais de 4h (job horário)
- [ ] Relatório semanal: produtividade, padrões de procrastinação
- [ ] Histórico de sprints: completion rate, velocidade da equipa

### 🏅 Badges
- [ ] Catálogo de badges no sistema (definições iniciais)
- [ ] Job de verificação de condições (horário)
- [ ] Notificação e modal de celebração ao desbloquear badge
- [ ] Perfil de utilizador com badges desbloqueados
- [ ] Badges de foco (Pomodoro), consistência (streak), sprint (conclusão)

### 🔔 Notifications
- [ ] Notificação: tarefa atribuída a mim
- [ ] Notificação: tarefa bloqueada (para o Lead)
- [ ] Notificação: sprint iniciado / fechado
- [ ] Notificação: badge desbloqueado
- [ ] Notificação: alerta de inactividade
- [ ] Marcar notificações como lidas
- [ ] Preferências de notificação (o que receber)

---

## 11. Onboarding Checklist por Actor

### Admin (após criar workspace)
1. Workspace criado com nome, slug e timezone
2. Pelo menos 2 membros convidados e dentro do workspace
3. Pelo menos 1 Lead atribuído
4. Configuração do kanban revisada (estados por defeito ou customizados)
5. Primeiro sprint criado

### Lead (após entrar no workspace)
1. Primeiro sprint criado com nome e datas
2. Pelo menos 3 tarefas no sprint com assignees definidos
3. Sprint iniciado

### Member (após entrar no workspace)
1. Perfil preenchido (avatar, timezone)
2. Primeira tarefa iniciada
3. Primeiro cronómetro activo
4. Primeiro Pomodoro completo

---

## 12. Métricas que o Squad Acompanha

| Métrica | O que mede |
|---|---|
| DAU (Daily Active Users) | Quantos membros registam pelo menos 1 entrada de tempo por dia |
| Tempo médio por sessão | Duração média de um cronómetro — indicador de foco real |
| Taxa de conclusão de sprint | Tarefas concluídas / tarefas planeadas |
| Tarefas bloqueadas em aberto | Indicador de fricção e bloqueios da equipa |
| Pomodoros completados por dia | Proxy de foco colectivo |
| Badges desbloqueados por semana | Engajamento com o sistema de gamificação |
| Tempo médio de uma tarefa em cada estado | Detecta onde o trabalho para — no kanban, em revisão, etc. |
| Alertas de inactividade gerados | Quantas vezes o sistema detectou procrastinação |


---

## 🌿 Diretrizes do Git Flow (Guia de Sobrevivência)

Para manter o código limpo e organizado para todo o time, seguimos rigorosamente estas regras de contribuição:

### 1. Nomenclatura de Branches
Sempre crie uma ramificação específica para a sua tarefa a partir da branch principal:
* `feature/nome-da-funcionalidade`
* `fix/correcao-de-bug`
* `docs/atualizacao-readme`

```bash
git checkout -b feature/minha-tarefa
```

### 2. Padrão de Commits
Os commits devem ser claros, em português e indicar a intenção da alteração:
* `feat: adiciona componente de cronometro pomodoro`
* `fix: corrige vazamento de memoria no painel de metricas`
* `style: atualiza cores do kanban`

### 3. Revisão de Código (Pull Requests)
* Nunca faça o merge direto na branch principal.
* Abra um **Pull Request (PR)** e solicite a revisão de pelo menos um outro membro do squad antes de aplicar as alterações.


---

> **Nota do Squad:** Este documento é atualizado a cada sprint. Funcionalidades marcadas como "fase 2" ou "futuro" não têm data — entram no backlog quando houver pedido real da comunidade ou quando a fase 1 estiver sólida.

## ⚖️ Licença

Este projeto é de uso exclusivo e educacional dos membros vinculados à **Juninhos Community**.

---

## 🤝 Apoio e Organização

Este projeto é desenvolvido e mantido pelos membros da **Juninhos Community**.
Se precisar de suporte técnico, mentoria de deploy ou dúvidas sobre infraestrutura, use os canais oficiais no Discord.

**Bora transformar ideias em código! [++]**
