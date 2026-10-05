FROM node:24.18.0-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM base AS production-dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM dependencies AS build
COPY . .
RUN npm run build

FROM base AS production
RUN groupadd --system app && useradd --system --gid app --create-home app
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database/migrations ./dist/database/migrations
COPY package.json ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/health/live').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/app/server.js"]
