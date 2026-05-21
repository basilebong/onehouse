# syntax=docker/dockerfile:1.7

FROM oven/bun:1 AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json   ./apps/server/
COPY apps/web/package.json      ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/app-grocery/package.json ./packages/app-grocery/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm --filter @onehouse/web build

FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/app.db
ENV PORT=3000

RUN groupadd -r onehouse && useradd -r -g onehouse onehouse \
 && mkdir -p /data && chown -R onehouse:onehouse /data /app

COPY --from=build --chown=onehouse:onehouse /app/node_modules    ./node_modules
COPY --from=build --chown=onehouse:onehouse /app/packages        ./packages
COPY --from=build --chown=onehouse:onehouse /app/apps/server     ./apps/server
COPY --from=build --chown=onehouse:onehouse /app/apps/web/dist   ./apps/web/dist
COPY --from=build --chown=onehouse:onehouse /app/drizzle         ./drizzle
COPY --from=build --chown=onehouse:onehouse /app/scripts         ./scripts
COPY --from=build --chown=onehouse:onehouse /app/package.json    ./
COPY --chown=onehouse:onehouse LICENSE NOTICE ./

USER onehouse
EXPOSE 3000
VOLUME ["/data"]
CMD ["sh", "-c", "bun ./scripts/migrate.ts && exec bun ./apps/server/src/index.ts"]

FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV DATABASE_PATH=/data/app.db
ENV PORT=3000
EXPOSE 3000 5173
VOLUME ["/data"]
CMD ["sh", "-c", "bun ./scripts/migrate.ts && bun run dev"]
