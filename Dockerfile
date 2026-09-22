# syntax=docker/dockerfile:1

# ---- deps: full node_modules (also reused by the migrate image) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: prisma generate + next build ----
FROM deps AS builder
COPY . .
# Placeholders only: lib/prisma.ts instantiates the MariaDB adapter at import
# time, so a URL must exist during the build. No connection is made.
ENV DATABASE_URL=mysql://build:build@127.0.0.1:3306/build \
    AUTH_SECRET=build-placeholder \
    AUTH_TRUST_HOST=true \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm exec prisma generate && pnpm build
# Drop dev dependencies for the runner. The generated Prisma client lives
# inside the @prisma/client package (a prod dep), so it survives the prune.
RUN pnpm prune --prod

# ---- migrate: one-shot container running `prisma migrate deploy` ----
FROM deps AS migrate
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY prisma ./prisma
COPY prisma.config.ts ./
# `db seed` runs prisma/seed.ts (see prisma.config.ts): it fills the official
# medicine catalogue from the file committed under prisma/data. Idempotent,
# so re-running it on every deploy is a no-op once the catalogue is loaded.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed"]

# ---- runner: custom server (Next.js + WebSocket, see server.mjs) ----
# Not `output: "standalone"`: Next can't trace a custom server, so we ship
# the built .next dir plus the pruned node_modules instead.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts /app/server.mjs ./
USER nextjs
EXPOSE 3000
CMD ["node", "server.mjs"]
