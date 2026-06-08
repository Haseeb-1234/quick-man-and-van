import "dotenv/config"
import { defineConfig } from "prisma/config"

// DIRECT_URL = non-pooled Neon connection (required for prisma migrate).
// DATABASE_URL (pooled) is used by the app at runtime via @prisma/adapter-pg.
// Use || not ?? so an empty-string DIRECT_URL falls back to DATABASE_URL.
export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
})
