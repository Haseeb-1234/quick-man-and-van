import { defineConfig } from "prisma/config"

// DIRECT_URL = non-pooled Neon connection (required for prisma migrate).
// DATABASE_URL (pooled) is used by the app at runtime via @prisma/adapter-pg.
export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
