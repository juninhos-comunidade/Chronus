# Result Pattern — How to Use

> Referência interna do padrão Result usado na repo.  
> Lê isto antes de tocar em qualquer service, repository ou handler.

---

## 1. Tipos Base

```ts
type Success<T> = { readonly success: true;  readonly value: T }
type Failure<E> = { readonly success: false; readonly error: E }
type Result<T, E = unknown> = Success<T> | Failure<E>
```

Construtores:

```ts
Ok(value)   // → Success<T>
Err(error)  // → Failure<E>
```

---

## 2. AppError — Discriminated Union

Todos os erros da app extendem `BaseAppError` e têm um campo `type` que os distingue:

| `type`                   | Status | Quando usar                              |
|--------------------------|--------|------------------------------------------|
| `VALIDATION_ERROR`       | 422    | Dados inválidos (Zod, regras de input)   |
| `NOT_FOUND`              | 404    | Recurso não existe ou foi soft-deleted   |
| `UNAUTHORIZED`           | 401    | Sem autenticação / token inválido        |
| `FORBIDDEN`              | 403    | Autenticado mas sem permissão            |
| `CONFLICT`               | 409    | Unicidade violada (slug, subdomain, etc) |
| `BUSINESS_ERROR`         | 400    | Regra de negócio violada                 |
| `DATABASE_ERROR`         | 500    | Excepção de DB capturada no repository   |
| `EXTERNAL_SERVICE_ERROR` | 502    | Falha em API externa (Multicaixa, etc)   |
| `INTERNAL_SERVER_ERROR`  | 500    | Erro inesperado / não categorizado       |

---

## 3. ErrorFactory — Criar Erros

Nunca instanciar erros manualmente. Usar sempre `ErrorFactory`:

```ts
ErrorFactory.notFound('Loja não encontrada', 'Store', storeId, COMPONENT)
ErrorFactory.conflict('Subdomínio já existe', 'subdomain', data.subdomain, COMPONENT)
ErrorFactory.forbidden('Sem permissão', undefined, COMPONENT)
ErrorFactory.business('Plano não suporta esta feature', 'plan_limit', COMPONENT)
ErrorFactory.validation('Dados inválidos', zodErrors, COMPONENT)
ErrorFactory.database('Erro ao inserir loja', cause, 'INSERT', 'stores', COMPONENT)
ErrorFactory.externalService('Falha no pagamento', 'Multicaixa', cause, 'charge', COMPONENT)
ErrorFactory.internalError('Erro inesperado', cause, COMPONENT)
```

`COMPONENT` é uma constante string no topo de cada ficheiro:
```ts
const COMPONENT = 'StoreService'
```

Todos os erros capturam stack trace automaticamente no momento da criação.

---

## 4. Repository — Regra de Ouro

> **O repository é a única camada que faz `try/catch` de queries.**  
> O service nunca usa `try/catch` — confia que o repository devolve `Result`.

### Padrão `dbExec`

```ts
// src/shared/db/db-exec.ts
import { Err } from '@/shared/result/types'
import { ErrorFactory } from '@/shared/result/factory'
import { logger } from '@/shared/logger/logger'

export async function dbExec<T>(
  operation: string,
  component: string,
  fn: () => Promise<T>,
): Promise<T | ReturnType<typeof Err>> {
  try {
    return await fn()
  } catch (err) {
    logger.error({ err, operation, component }, `DB error in ${component}.${operation}`)
    return Err(ErrorFactory.database(
      `Erro de base de dados em ${operation}`,
      err,
      inferOperation(operation),
      undefined,
      component,
    ))
  }
}

// Helper: infere o tipo de operação SQL a partir do nome do método
function inferOperation(op: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION' | undefined {
  if (op.startsWith('find') || op.startsWith('get')) return 'SELECT'
  if (op.startsWith('create') || op.startsWith('insert')) return 'INSERT'
  if (op.startsWith('update') || op.startsWith('upsert')) return 'UPDATE'
  if (op.startsWith('delete') || op.startsWith('soft')) return 'DELETE'
  return undefined
}
```

### Antes vs Depois

```ts
// ❌ Antes — explode sem log se DB falhar
async findById(id) {
  const [row] = await db.select().from(stores).where(eq(stores.id, id)).limit(1)
  return row ? toDTO(row) : null
}

// ✅ Depois — captura, loga, retorna Err tipado
async findById(id) {
  return dbExec('findById', 'StoreRepository', () =>
    db.select().from(stores)
      .where(and(eq(stores.id, id), isNull(stores.deletedAt)))
      .limit(1)
      .then(([row]) => row ? toStoreResponseDTO(row) : null)
  )
}
```

---

## 5. Service — Verificar Resultados do Repository

Quando um método do repository pode retornar `Err` (i.e., usa `dbExec`), o service verifica antes de usar o valor:

```ts
// Verificação de Err de DB
const storeResult = await repository.findById(storeId)
if (!storeResult.success) return storeResult  // propaga DatabaseError

const store = storeResult.value
if (!store) {
  return Err(ErrorFactory.notFound('Loja não encontrada', 'Store', storeId, COMPONENT))
}
```

Quando o repository ainda não usa `dbExec` (valor directo, sem Result), trata normalmente:
```ts
const store = await repository.findById(storeId)  // devolve T | null
if (!store) return Err(ErrorFactory.notFound(...))
```

---

## 6. Utilitários do Result

```ts
import { map, flatMap, isOk, isErr, unwrap, unwrapOr, matchError } from '@/shared/result/utils'

// Transformar valor dentro de Result
const nameResult = map(storeResult, s => s.name)

// Encadear operações Result sem aninhar
const result = flatMap(storeResult, store => validateStore(store))

// Verificar tipo
if (isOk(result))  { /* result.value disponível */ }
if (isErr(result)) { /* result.error disponível */ }

// Desempacotar (só quando tens 100% de certeza)
const store = unwrap(storeResult)         // lança excepção se Err
const store = unwrapOr(storeResult, null) // devolve null se Err
```

### matchError — Pattern Matching em handlers

```ts
return matchError(result.error, {
  NOT_FOUND:        (e) => reply.status(404).send(e),
  VALIDATION_ERROR: (e) => reply.status(422).send(e),
  CONFLICT:         (e) => reply.status(409).send(e),
  DATABASE_ERROR:   (e) => reply.status(500).send({ message: 'Erro interno' }),
  default:          (e) => reply.status(e.statusCode).send(e),
})
```

---

## 7. Validação com Zod

```ts
import { validateWithZod } from '@/shared/result/zod-integration'

const result = validateWithZod(CreateStoreSchema, body, COMPONENT)
if (!result.success) return Err(result.error)  // result.error é ValidationError

const data = result.value  // tipado pelo schema
```

Para updates PATCH (campos opcionais):
```ts
import { validatePartialWithZod } from '@/shared/result/zod-integration'

const result = validatePartialWithZod(UpdateStoreSchema, body, COMPONENT)
```

Para flattening de erros em respostas de formulário:
```ts
import { flattenValidationErrors } from '@/shared/result/zod-integration'

const fieldErrors = flattenValidationErrors(validationError)
// { "name": "Campo obrigatório", "subdomain": "Mínimo de 3 caracteres" }
```

---

## 8. Fire-and-Forget (Background Tasks)

Nunca `await` eventos e audits — usar sempre `Promise.allSettled`:

```ts
// ✅ Correcto — não bloqueia, não explode o request em caso de falha
Promise.allSettled([
  emitStoreCreated(store.id, ownerId),
  auditHelpers.create(ownerId, 'Store', store.id, { subdomain }),
]).catch(err => logger.error(err, 'Background tasks failed on store create'))

// ❌ Errado — um evento falhado rebenta o fluxo principal
await emitStoreCreated(store.id, ownerId)
```

---

## 9. Fluxo Completo — Request to Response

```
HTTP Request
    │
    ▼
[Handler / Controller]
    │  validateWithZod(schema, body)
    │  se !result.success → return reply.status(422)
    ▼
[Service]
    │  lógica de negócio pura
    │  chama repository
    │  verifica !result.success → propaga Err
    │  retorna Ok(value) ou Err(AppError)
    ▼
[Repository]
    │  todas as queries wrapped em dbExec()
    │  captura excepções de DB → Err(DatabaseError)
    │  devolve T | null em caso de sucesso
    ▼
[Handler / Controller]
    │  se !result.success → matchError(result.error, handlers)
    │  se result.success  → reply.status(200).send(result.value)
```

---

## 10. Checklist Rápido

- [ ] Cada ficheiro tem `const COMPONENT = 'NomeDoModulo'`
- [ ] Repository usa `dbExec` em todos os métodos com queries
- [ ] Service nunca tem `try/catch` — só verifica `.success`
- [ ] Erros criados sempre via `ErrorFactory`, nunca `new Error()`
- [ ] Eventos e audits sempre em `Promise.allSettled()`
- [ ] Validação de input sempre com `validateWithZod` no handler
- [ ] `matchError` no handler para mapeamento de status HTTP