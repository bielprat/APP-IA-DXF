# Build context: repository root (see docker-compose.yml).
FROM node:22-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1 CHECKPOINT_DISABLE=1
# Optional build-time CA for corporate TLS proxies (docker/certs/README.md).
COPY docker/certs/ /tmp/extra-certs/
RUN cat /tmp/extra-certs/*.crt > /usr/local/share/extra-ca.pem 2>/dev/null; \
    if [ -s /usr/local/share/extra-ca.pem ]; then npm config set -g cafile /usr/local/share/extra-ca.pem; fi
RUN npm install -g pnpm@10.28.0
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/prisma.config.ts apps/web/
COPY apps/web/prisma apps/web/prisma
COPY packages/catalog/package.json packages/catalog/
COPY packages/prompt-engine/package.json packages/prompt-engine/
RUN if [ -s /usr/local/share/extra-ca.pem ]; then export NODE_EXTRA_CA_CERTS=/usr/local/share/extra-ca.pem; fi; \
    pnpm install --frozen-lockfile

FROM deps AS build
COPY packages packages
COPY apps/web apps/web
RUN pnpm --filter web build

# One-shot job that applies pending migrations before the web container starts.
FROM build AS migrate
WORKDIR /repo/apps/web
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM node:22-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN useradd --create-home --uid 10001 web && mkdir -p /app/storage && chown web /app/storage
COPY --from=build --chown=web /repo/apps/web/.next/standalone ./
COPY --from=build --chown=web /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=web /repo/apps/web/public ./apps/web/public
USER web
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "apps/web/server.js"]
