# Chronus — Git Flow & PR Guide

> Como abrimos branches, fazemos commits e submetemos PRs no Chronus.
> Ler uma vez, seguir sempre.

---

## Estrutura do repositório

```
Chronus/
├── backend/
├── frontend/
├── admin-frontend/
├── docs/
├── infra/
└── docker-compose.yml
```

---

## Regras base

1. **Nunca faças push directo para `main`.** Sem excepções.
2. **Todo o trabalho vai numa branch `feature/` ou `fix/`.** Sem branches pessoais soltas.
3. **Um PR por tarefa.** Não acumules múltiplas features no mesmo PR.
4. **PR precisa de 1 aprovação** antes de fazer merge.
5. **Squash merge para `main`** — mantém o histórico limpo.

---

## Ciclo completo de uma task

### 1. Criar a branch

Parte sempre de `main` actualizado:

```bash
git checkout main
git pull origin main
git checkout -b feature/workspace-invite-service
```

**Formato do nome de branch:**

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Nova funcionalidade | `feature/` | `feature/workspace-invite-service` |
| Correcção de bug | `fix/` | `fix/auth-token-expiry` |
| Documentação | `docs/` | `docs/sprint-plan` |
| Configuração/infra | `chore/` | `chore/docker-compose-review` |

> Usa sempre kebab-case. Sem espaços, sem acentos, sem maiúsculas.

---

### 2. Desenvolver

Trabalha normalmente. Faz commits pequenos e frequentes enquanto desenvolves.

**Formato de commit:**

```
<tipo>(<âmbito>): <descrição curta em minúsculas>
```

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correcção de bug |
| `refactor` | Reestruturação sem mudar comportamento |
| `test` | Adicionar ou corrigir testes |
| `chore` | Deps, config, build |
| `docs` | Documentação |

**Exemplos:**

```bash
git commit -m "feat(workspaces): add invite repository with token expiry"
git commit -m "feat(workspaces): implement acceptInvite with transaction"
git commit -m "fix(auth): correct token audience validation"
git commit -m "refactor(staff): extract session logic to service"
git commit -m "chore(deps): update drizzle-orm to 0.31"
```

> Âmbito = nome do módulo ou área: `auth`, `workspaces`, `tasks`, `timer`, `badges`, `frontend`

---

### 3. Push da branch

```bash
git push origin feature/workspace-invite-service
```

Se a branch já existe no remoto e fizeste rebase:

```bash
git push origin feature/workspace-invite-service --force-with-lease
```

> Nunca uses `--force` sem `--lease`. O `--lease` falha se alguém tiver feito push entretanto.

---

### 4. Abrir o PR

Vai ao GitHub → **Pull Requests** → **New Pull Request**.

**Base:** `main` | **Compare:** a tua branch

#### Template de descrição do PR

```markdown
## O que faz este PR

Implementa o `acceptInvite` no workspace service.
Verifica token, expiração e usa transaction para marcar o invite
como aceite e adicionar o membro ao workspace atomicamente.

## Tipo de mudança

- [x] Nova funcionalidade
- [ ] Bug fix
- [ ] Refactor
- [ ] Docs

## Como testar

1. Criar workspace e convidar membro via `POST /workspaces/:id/invites`
2. Copiar o token do email (ou da DB em dev)
3. `POST /invites/:token/accept` com token JWT de user diferente do que convidou
4. Verificar que `workspace_members` tem o novo membro e `invites.acceptedAt` está preenchido

## Checklist

- [x] Segue a estrutura do módulo `staff` (dtos → ports → repository → service → events → controller)
- [x] Usa `withTransaction` onde necessário
- [x] Erros retornados via `Err(ErrorFactory.X(...))` — nunca throw
- [x] Testado localmente com Docker Compose
- [ ] Testes unitários (se aplicável)
```

---

### 5. Review

**Quem pede review:** o autor do PR.

**Quem revê:**
- Backend PR → qualquer outro membro do backend
- Frontend PR → qualquer outro membro do frontend
- PR cross-cutting (config, infra) → qualquer pessoa do squad

**O que verificar na review:**

Para backend:
- Segue a estrutura de módulo (dtos → ports → persistence → service → events → controller)?
- Service usa apenas interfaces (IRepository), nunca implementações concretas?
- Erros são `Err(ErrorFactory.X(...))`, nunca `throw`?
- Transacções onde necessário (`withTransaction`)?
- Eventos emitidos como fire-and-forget (`Promise.allSettled(...).catch(...)`)?

Para frontend:
- Componente é reutilizável ou específico de página?
- Estados de loading e erro tratados?
- Tipos TypeScript correctos (sem `any`)?

**Como dar feedback:**
- Aprovação simples → **Approve**
- Sugestão não bloqueante → comentário normal com "sugestão:"
- Problema que bloqueia merge → **Request changes** com explicação clara

---

### 6. Merge

Só faz merge depois de:
- [ ] 1 aprovação
- [ ] Sem conflitos com `main`
- [ ] CI a verde (se configurado)

**Método:** Squash and merge.

O título do squash commit deve seguir o mesmo formato de commit convencional:
```
feat(workspaces): implement acceptInvite with atomic transaction (#42)
```

---

## Manter a branch actualizada

Se `main` avançou enquanto trabalhavas:

```bash
git fetch origin
git rebase origin/main
```

Se houver conflitos, resolve-os e continua:

```bash
# resolver conflitos manualmente nos ficheiros marcados
git add .
git rebase --continue
```

Depois de rebase:

```bash
git push origin feature/workspace-invite-service --force-with-lease
```

> **Não uses `git merge main`** na tua branch de feature. Usa sempre `rebase` — mantém o histórico linear e os PRs limpos.

---

## Situações comuns

### "Comecei a trabalhar em `main` por acidente"

```bash
# Guarda o trabalho numa branch nova
git checkout -b feature/workspace-invite-service
git push origin feature/workspace-invite-service

# Volta main ao estado do remoto
git checkout main
git reset --hard origin/main
```

### "Preciso de código de outra branch que ainda não foi mergeada"

```bash
# Faz cherry-pick do commit específico
git cherry-pick <hash-do-commit>
```

Ou fala com quem tem a branch — talvez faça sentido um merge de branches antes de ir para main.

### "Fiz commit de algo que não devia (ex: .env)"

```bash
# Desfaz o último commit mas mantém as alterações
git reset --soft HEAD~1

# Adiciona o ficheiro ao .gitignore
echo ".env" >> .gitignore

# Recomeça sem o ficheiro problemático
git add .gitignore <outros ficheiros>
git commit -m "chore: remove env from tracking"
```

Se o commit já foi para o remoto, fala com alguém antes de forçar push.

### "O meu PR tem conflitos"

```bash
git fetch origin
git rebase origin/main
# resolver conflitos
git push --force-with-lease
```

O PR actualiza-se automaticamente. Pede nova review se as mudanças foram significativas.

---

## Ficheiros que nunca vão para o repositório

Já deve estar no `.gitignore`, mas confirma:

```
.env
.env.local
.env.*.local
node_modules/
dist/
*.log
```

Se vires algum destes ficheiros num PR, bloqueia o merge e avisa o autor.

---

## Resumo rápido

```bash
# Começar task
git checkout main && git pull
git checkout -b feature/<módulo>-<o-que-faz>

# Durante o desenvolvimento
git add .
git commit -m "feat(<módulo>): <descrição>"

# Submeter
git push origin feature/<módulo>-<o-que-faz>
# → abrir PR no GitHub

# Manter actualizado com main
git fetch origin && git rebase origin/main
git push --force-with-lease
```