FROM node:22-alpine AS base

# Install build dependencies (includes dev dependencies)
FROM base AS build-deps
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN cd frontend && npm ci
RUN cd backend && npm ci

# Install production dependencies only
FROM base AS prod-deps
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN cd frontend && npm ci --only=production
RUN cd backend && npm ci --only=production

FROM base AS frontend-builder
WORKDIR /app

COPY types/ ./types/
COPY frontend/ ./frontend/
COPY --from=build-deps /app/frontend/node_modules ./frontend/node_modules

RUN cd frontend && npm run build

FROM base AS backend-builder
WORKDIR /app

COPY types/ ./types/
COPY backend/ ./backend/
COPY --from=build-deps /app/backend/node_modules ./backend/node_modules

RUN cd backend && npm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=backend-builder --chown=appuser:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=appuser:nodejs /app/backend/package*.json ./backend/
COPY --from=frontend-builder --chown=appuser:nodejs /app/frontend/dist ./frontend/dist

COPY --chown=appuser:nodejs backend/src/db/migrations ./backend/src/db/migrations

COPY --from=prod-deps --chown=appuser:nodejs /app/backend/node_modules ./backend/node_modules

RUN mkdir -p /app/backend/logs /app/backend/data
RUN chown -R appuser:nodejs /app/backend/logs /app/backend/data

USER appuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/backend/data/db.sqlite

WORKDIR /app/backend
CMD ["node", "dist/index.js"]
