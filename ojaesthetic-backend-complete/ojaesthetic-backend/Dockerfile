# ── Ojaesthetic Backend — Dockerfile ──────────────────────────
# Multi-stage build for minimal production image

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S ojaesthetic -u 1001

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=ojaesthetic:nodejs /app/node_modules ./node_modules
COPY --chown=ojaesthetic:nodejs . .

USER ojaesthetic

EXPOSE 5000

ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
