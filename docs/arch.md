# Decisões de Arquitetura

O projeto segue uma abordagem inspirada em Clean Architecture e Ports & Adapters (Arquitetura Hexagonal), com separação clara entre o core de negócio e as tecnologias externas.

## Backend — estrutura por módulos

```
modules/{dominio}/
├── application/
│   ├── dtos/          — contratos de entrada/saída (Zod schemas + Swagger DTOs)
│   ├── ports/         — interfaces dos repositórios (contratos que a infraestrutura implementa)
│   └── services/      — regras de negócio, casos de uso
├── events/            — definição de eventos de domínio (payloads, nomes, funções de emissão)
├── infrastructure/
│   ├── http/controllers/  — contacto com o framework NestJS (rotas, decorators)
│   └── persistence/       — implementação dos repositories com Drizzle ORM
```

## Porquê esta estrutura?

- A `application` contém o que não muda se trocarmos de framework ou de base de dados.
- Os `ports` (interfaces) garantem que podemos trocar o PostgreSQL por outro motor sem tocar na lógica de negócio.
- O `db-exec` envolve todas as operações da base de dados num try/catch com logs estruturados — a base de dados é um serviço externo e deve ser tratada como tal.
- O `DbOrTx` permite reutilizar transações em múltiplos repositories sem refatoração.
- Cada repository tem um mapper (`toDto`) para traduzir os dados do ORM num contrato estável. Isto evita que tipos internos do Drizzle vazem para a aplicação.
- A paginação é unificada num helper partilhado (`ListResponse<T>`) para que todos os endpoints de listagem retornem o mesmo formato.

## Eventos de Domínio (Queue-based Event System)

Os eventos seguem um padrão **assíncrono baseado em fila (BullMQ + Redis)**, e não um EventEmitter síncrono.

### Fluxo geral

```
Service → emit*() → QueueManager (BullMQ Queue) → Redis → Worker → processEventForAudit() → activity_log
```

### Estrutura

Cada módulo que produz eventos tem uma pasta `events/` com:
- **Payload types** — tipos tipados para os dados do evento
- **Event name constants** — mapeiam nomes lógicos para strings (ex: `staff.created`)
- **Emit functions** — chamam `QueueManager.addJob(nome, payload)`
- **QueueManager instance** — wrapper BullMQ configurado com um processor partilhado

### QueueManager (`shared/queue/queue.ts`)

- Cria uma BullMQ Queue + Worker com conexão Redis única
- Retry exponencial (3 tentativas), concorrência 5, limpeza automática de jobs completos/falhados
- Exporta `closeAllQueues()` para shutdown graceful

### Módulo `activity` (consumidor central)

- `processEventForAudit()` — lookup no `EVENT_META` para extrair `entityId`, `actorId`, `actorStaffId` do payload, depois persiste na tabela `activity_log`
- `EVENT_META` — mapeia cada event name para metadados que dizem ao sistema de audit como interpretar o payload
- `auditHelpers` — inserção direta e síncrona de audit log (fallback, usado em paralelo com o evento async)
- `TelemetryExporter` — interface para exportação para sistemas externos (fire-and-forget)
- `ReactiveHandler` — interface para notificações em tempo real (previsto, ainda sem handlers registados)

### Exemplo (módulo staff)

| Evento | Payload | Emit |
|---|---|---|
| `staff.created` | `StaffCreatedPayload` | `emitStaffCreated(staffId, createdBy, email)` |
| `staff.login` | `StaffLoginPayload` | `emitStaffLogin(staffId, ipAddress?, userAgent?)` |
| `staff.action` | `StaffActionPayload` | `emitStaffAction(staffId, action, entityType, entityId, metadata?)` |
| `staff.deactivated` | `StaffDeactivatedPayload` | `emitStaffDeactivated(staffId, deactivatedBy)` |

O service dispara eventos com `Promise.allSettled([emit*(), auditHelpers.*()])` — o evento é fire-and-forget em background, e o audit helpers serve como escrita direta imediata.
