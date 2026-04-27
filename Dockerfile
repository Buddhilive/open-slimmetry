# ── deps ──────────────────────────────────────────────────────────────────────
# Install dependencies in a separate stage so the layer is cached unless
# lockfile or manifests change.
FROM node:20-alpine AS deps

# build tools required to compile better-sqlite3 native module
RUN apk add --no-cache python3 make g++
RUN corepack enable pnpm

WORKDIR /app

# Copy every manifest pnpm needs to resolve the workspace before touching src.
COPY .npmrc pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/slimmetry-client/package.json ./packages/slimmetry-client/

# --shamefully-hoist flattens node_modules so Next.js standalone's file tracer
# (nft) can reliably follow better-sqlite3 and include the native .node binary.
RUN pnpm install --frozen-lockfile --shamefully-hoist

# ── builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder

COPY . .

RUN pnpm exec next build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DB_PATH=/app/data/slimmetry.db
ENV RETENTION_DAYS=7
ENV MAX_DB_MB=500

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next.js standalone output — a self-contained server with bundled node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Persist the SQLite database outside the container via a volume mount.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
