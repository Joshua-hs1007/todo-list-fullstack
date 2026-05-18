FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --filter @todo/api...

FROM deps AS build

COPY apps/api apps/api

RUN pnpm --filter @todo/api db:generate
RUN pnpm --filter @todo/api build

FROM base AS runner

ENV NODE_ENV="production"
ENV PORT="3000"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile --prod --filter @todo/api...

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/src/generated/prisma apps/api/dist/generated/prisma
COPY --from=build /app/apps/api/prisma apps/api/prisma

EXPOSE 3000

CMD ["pnpm", "--filter", "@todo/api", "start"]
