import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Schema paths
  schema: './src/db/schema.ts',
  
  // Output directory for migrations
  out: './drizzle',
  
  // Database driver
  dialect: 'postgresql',
  
  // Database connection
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'chronus',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  
  // Verbose logging
  verbose: true,
  
  // Strict mode
  strict: true,
  
  // Migration settings
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public',
  },
});
