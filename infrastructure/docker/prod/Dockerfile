# syntax=docker/dockerfile:1

FROM node:22-slim AS base

ENV PNPM_HOME=/pnpm
ENV PNPM_STORE_DIR=/pnpm/store
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@10.30.2

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/workers/package.json apps/workers/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/integrations/package.json packages/integrations/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN --mount=type=cache,target=/pnpm/store \
  CI=true pnpm install --frozen-lockfile --prod=false --config.confirmModulesPurge=false

FROM deps AS build

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

RUN npm install -g typescript@5.9.3

COPY . .

RUN pnpm build:packages \
  && pnpm --filter @packages/database exec prisma generate \
  && pnpm --filter api exec nest build

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=build --chown=node:node /workspace /workspace

USER node
