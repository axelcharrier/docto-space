import { defineConfig, env } from "prisma/config";

// The `prisma` CLI doesn't read .env.local (Next.js's convention) on its
// own; load it explicitly so `prisma migrate`/`db` can see DATABASE_URL.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Falls through to a plain .env or an already-exported DATABASE_URL.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  // Only used by `prisma migrate`/`db` commands (schema diffing against the
  // live database), not by PrismaClient at runtime — the app connects via
  // the driver adapter in lib/prisma.ts instead.
  datasource: {
    url: env("DATABASE_URL"),
  },
});
