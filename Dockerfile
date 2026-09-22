# syntax=docker/dockerfile:1

# ---- deps: full node_modules (also reused by the migrate image) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: prisma generate + next build (standalone) ----
FROM deps AS builder
COPY . .
# Placeholders only: lib/prisma.ts instantiates the MariaDB adapter at import
# time, so a URL must exist during the build. No connection is made.
ENV DATABASE_URL=mysql://build:build@127.0.0.1:3306/build \
    AUTH_SECRET=build-placeholder \
    AUTH_TRUST_HOST=true \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm exec prisma generate && pnpm build

# ---- migrate: one-shot container running `prisma migrate deploy` ----
FROM deps AS migrate
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# ---- runner: minimal Next.js standalone server ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
