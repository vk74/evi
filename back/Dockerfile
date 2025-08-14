#
# version: 1.0.0
# Purpose: Backend container build for Node.js API server. BACKEND file: Dockerfile
# Logic: Multi-stage build (Node for build → Node for runtime). Copies dist and runtime assets; exposes 3000.
#

# =========================
# Build stage
# =========================
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first (use cache)
COPY package*.json ./
RUN npm ci

# Copy sources
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript and copy runtime assets
RUN npm run build


# =========================
# Runtime stage
# =========================
FROM node:18-alpine

WORKDIR /app

# Copy only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app
COPY --from=build /app/dist ./dist

# Create module-alias-compatible path: map '@'→'src' to compiled code in 'dist'
RUN ln -s /app/dist /app/src

# Copy runtime keys where server expects them via './src/keys/...'
# Since /app/src is a symlink to /app/dist, place keys under dist/keys
COPY --from=build /app/src/keys ./dist/keys

ENV NODE_ENV=production

EXPOSE 3000

# Basic healthcheck (root route returns text when server is up)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "dist/server.js"]


