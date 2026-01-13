##### BASE
FROM --platform=linux/amd64 node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY prisma ./prisma

##### DEPS 
FROM base AS deps
COPY package.json pnpm-lock.yaml* source.config.ts ./
RUN pnpm install --frozen-lockfile

##### BUILDER
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN SKIP_ENV_VALIDATION=1 pnpm run build

##### RUNNER
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
ENV PORT=3000

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma with migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=deps    /app/node_modules ./node_modules

CMD ["sh", "-c", "npm run db:migrate && node server.js"]
