import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './server/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'skiiin',
    ssl: false
  },
} satisfies Config;
