import { migrationClient } from './index'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MIGRATIONS_DIR = path.join(__dirname, '../../drizzle')

async function ensureSetup() {
  await migrationClient`CREATE SCHEMA IF NOT EXISTS "drizzle"`
  await migrationClient`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id serial PRIMARY KEY,
      name text UNIQUE,
      hash text NOT NULL,
      created_at bigint NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    )
  `
  await migrationClient`ALTER TABLE "drizzle"."__drizzle_migrations" ADD COLUMN IF NOT EXISTS "name" text`
  await migrationClient`CREATE UNIQUE INDEX IF NOT EXISTS "__drizzle_migrations_name_idx" ON "drizzle"."__drizzle_migrations" (name) WHERE name IS NOT NULL`
  await migrationClient`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`
  await migrationClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
  await migrationClient`
    CREATE OR REPLACE FUNCTION uuid_generate_v7()
    RETURNS uuid LANGUAGE plpgsql AS $$
    DECLARE unix_ts_ms bigint; uuid_bytes bytea;
    BEGIN
      unix_ts_ms := (extract(epoch from clock_timestamp()) * 1000)::bigint;
      uuid_bytes := overlay(gen_random_bytes(16)
        placing substring(int8send(unix_ts_ms), 3, 6) from 1 for 6);
      uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
      uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
      RETURN encode(uuid_bytes, 'hex')::uuid;
    END $$;
  `
}

async function getApplied(): Promise<Map<string, string>> {
  const rows = await migrationClient`
    SELECT COALESCE(name, 'migration-' || id::text) AS name, hash
    FROM "drizzle"."__drizzle_migrations" ORDER BY id
  `
  const map = new Map<string, string>()
  for (const r of rows as unknown as Array<{ name: string; hash: string }>) map.set(r.name, r.hash)
  return map
}

async function markApplied(name: string, hash: string) {
  await migrationClient`
    INSERT INTO "drizzle"."__drizzle_migrations" (name, hash, created_at)
    VALUES (${name}, ${hash}, (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint)
  `
}

async function runMigrations() {
  console.log('Chronus — Migrations')

  await ensureSetup()
  const applied = await getApplied()
  console.log(`  • ${applied.size} migration(s) already applied`)

  const files = await fs.readdir(MIGRATIONS_DIR)
  const sqlFiles = files
    .filter(f => f.endsWith('.sql') && !f.startsWith('.') && !f.startsWith('meta'))
    .sort()

  const pending: Array<{ name: string; path: string; content: string }> = []

  for (const file of sqlFiles) {
    const name = file.replace(/\.sql$/, '')
    const filePath = path.join(MIGRATIONS_DIR, file)
    const content = await fs.readFile(filePath, 'utf-8')

    if (!applied.has(name)) {
      pending.push({ name, path: filePath, content })
      continue
    }

    const storedHash = applied.get(name)
    const currentHash = hashContent(content)
    if (storedHash !== currentHash) {
      console.log(`  ⚠  ${name} — content changed since applied (hash mismatch)`)
      console.log('     Run with chronus_MIGRATE_FORCE=1 to re-apply\n')
    }
  }

  if (pending.length === 0) {
    console.log('  ✓ Up to date — no pending migrations\n')
    await migrationClient.end()
    return
  }

  console.log(`  • ${pending.length} migration(s) pending\n`)

  for (const { name, content } of pending) {
    const statements = content
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(Boolean)

    const contentHash = hashContent(content)

    process.stdout.write(`  ${name} (${statements.length} stmts) ... `)

    try {
      await migrationClient`BEGIN`

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i]
        if (!stmt) continue
        try {
          await migrationClient.unsafe(stmt)
        } catch (err: unknown) {
          const pgErr = err as { code?: string; message?: string }
          if (pgErr.code === '42701' || pgErr.code === '42P07' || pgErr.code === '42710') {
            continue
          }
          throw err
        }
      }

      await migrationClient`COMMIT`
      await markApplied(name, contentHash)
      console.log('✅')
    } catch (err: unknown) {
      await migrationClient`ROLLBACK`
      const pgErr = err as { code?: string; severity?: string; message?: string }
      console.log('❌\n')
      console.error(`  Migration "${name}" FAILED and was rolled back.`)
      console.error(`  ${pgErr.message ?? String(err)}\n`)
      await migrationClient.end()
      process.exit(1)
    }
  }

  console.log(`\n  ✓ ${pending.length} migration(s) applied successfully\n`)
  await migrationClient.end()
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16)
}

runMigrations()
