# How to Run — Chronus

## Pré-requisitos

- [Bun](https://bun.sh) v1.1.38+
- [Docker](https://docker.com) + Docker Compose (para PostgreSQL, Redis e OTEL)
- Node.js 20+ (opcional, apenas para ferramentas que ainda usam npm)

## 1. Clonar e instalar

```bash
git clone <repo-url>
cd chronus
bun install
```

## 2. Variáveis de ambiente

Copie os exemplos e ajuste conforme necessário:

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
cp packages/admin-frontend/.env.example packages/admin-frontend/.env
```

## 3. Subir dependências (DB, Redis, OTEL)

```bash
docker compose up -d postgres valkey
```

> Se não tiver os serviços `postgres` e `valkey` no `docker-compose.yml`, ajuste os `DATABASE_URL` e `REDIS_HOST` no `.env` para apontar para instâncias locais ou remotas.

## 4. Rodar migrations + seed

```bash
bun run db:migrate
bun run db:seed
```

## 5. Iniciar em desenvolvimento

```bash
bun run dev
```

Isso sobe todos os packages (backend, frontend, admin-frontend) via Turborepo.

Para subir apenas um:

```bash
bun run dev:backend   # Backend em http://localhost:3001
bun run dev:frontend  # Frontend em http://localhost:3000
bun run dev:admin     # Admin em http://localhost:3002
```

## 6. Acessar

| Serviço | URL |
|---------|-----|
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/docs |
| Frontend | http://localhost:3000 |
| Admin Frontend | http://localhost:3002 |


## Scripts úteis

```bash
bun run lint          # Lint em todos os packages
bun run typecheck     # TypeScript check em todos
bun run test          # Testes
bun run build         # Build de produção
```

## Estrutura do monorepo

```
chronus/
├── packages/
│   ├── backend/          # API Elysia (Bun)
│   ├── frontend/         # React + Vite
│   ├── admin-frontend/   # React + Vite (admin)
│   └── shared/           # Tipos/utils compartilhados
├── docs/                 # Documentação
├── infra/                # Infraestrutura
├── docker-compose.yml    # Serviços auxiliares
└── turbo.json            # Config Turborepo
```
