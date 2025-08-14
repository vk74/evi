#
# version: 1.0.0
# Purpose: Frontend container build for serving the SPA in production. FRONTEND file: Dockerfile
# Logic: Multi-stage build (Node for build → Nginx for runtime). Stateless, serves compiled assets from /usr/share/nginx/html.
#

# =========================
# Build stage
# =========================
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first (leverage layer cache)
COPY package*.json ./
COPY babel.config.js ./
COPY tsconfig.json ./
COPY jsconfig.json ./

RUN npm ci

# Copy source code
COPY ./ .

# Build production assets
RUN npm run build


# =========================
# Runtime stage
# =========================
FROM nginx:alpine

# Non-root user for security
# (Nginx in alpine runs as root by default; we keep root to bind 80 but use minimal surface.)

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default nginx config to enable SPA routing
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck (basic)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]



