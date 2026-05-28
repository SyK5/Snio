FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2 prune @snio/api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @snio/api exec prisma generate
RUN pnpm --filter @snio/api build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S snio && adduser -S snio -G snio
COPY --from=installer --chown=snio:snio /app .
USER snio
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
