FROM node:22-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2 prune @snio/api --docker

FROM base AS builder
WORKDIR /app
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @snio/api exec prisma generate
RUN pnpm --filter @snio/api build
RUN pnpm deploy --filter=@snio/api --prod /prod/api
RUN cp -r apps/api/prisma /prod/api/prisma
RUN cd /prod/api && node node_modules/prisma/build/index.js generate

FROM node:22-alpine AS runner
ENV NODE_ENV=production
RUN apk add --no-cache wget
RUN addgroup -S snio && adduser -S snio -G snio
WORKDIR /app
COPY --from=builder /prod/api ./
USER snio
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
CMD ["node", "dist/src/main.js"]
