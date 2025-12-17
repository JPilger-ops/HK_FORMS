import { defineConfig, env } from 'prisma/config';

const shadowDb = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    ...(shadowDb ? { shadowDatabaseUrl: shadowDb } : {})
  },
  migrations: {
    path: './prisma/migrations'
  }
});
