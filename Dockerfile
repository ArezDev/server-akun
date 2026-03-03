# Stage 1: Install dependencies
FROM oven/bun:1.1 AS deps
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma/ 
RUN bun install

# Stage 2: Builder
FROM oven/bun:1.1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1

# Generate prisma client dhisik
RUN bun x prisma generate 
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1.1-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Neng Debian/Slim runner biasane butuh ijin akses
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3003
ENV PORT 3003
ENV HOSTNAME "0.0.0.0"

CMD ["bun", "server.js"]