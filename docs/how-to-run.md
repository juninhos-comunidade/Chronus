# How to Run — Chronus

## Pré-requisitos

- [Bun](https://bun.sh) v1.1.38+
- [Docker](https://docker.com) + Docker Compose (para PostgreSQL, Redis e OTEL)
- Node.js 20+ (opcional, apenas para ferramentas que ainda usam npm)

## 1. Clonar e instalar

```bash
git clone <repo-url>
cd chronus
cd backend && bun install
cd ../frontend && bun install
cd ../admin-frontend && bun install
```

## 2. Variáveis de ambiente

Copie os exemplos e ajuste conforme necessário:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp admin-frontend/.env.example admin-frontend/.env
```

## 3. Subir dependências (DB, Redis)

```bash
cd infra && docker compose up -d
```

> O `docker-compose.yml` em `infra/` tem Postgres e Valkey (Redis). Se preferir instâncias externas, ajuste `DATABASE_URL` e `REDIS_HOST` no `.env`.

## 4. Rodar migrations + seed

```bash
cd backend && bun run db:migrate && bun run db:seed
```

## 5. Iniciar em desenvolvimento

Cada app roda independente no seu próprio terminal:

```bash
# Terminal 1 - Backend
cd backend && bun run dev

# Terminal 2 - Frontend
cd frontend && bun run dev

# Terminal 3 - Admin Frontend
cd admin-frontend && bun run dev
```

## 6. Acessar

| Serviço | URL |
|---------|-----|
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/docs |
| Frontend | http://localhost:3000 |
| Admin Frontend | http://localhost:3002 |

## Scripts úteis (dentro de cada diretório)

```bash
cd backend
bun run lint          # Lint
bun run typecheck     # TypeScript check
bun run test          # Testes
bun run build         # Build de produção
```

## Estrutura do projeto

```
chronus/
├── backend/              # API Elysia (Bun)
├── frontend/             # React + Vite
├── admin-frontend/       # React + Vite (admin)
├── docs/                 # Documentação
├── infra/                # Infraestrutura (docker-compose)
├── docker-compose.yml    # Serviços de produção
```
