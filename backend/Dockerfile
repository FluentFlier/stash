# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy prisma schema (if present in backend)
COPY prisma ./prisma/

# Install ALL dependencies (including devDeps for prisma)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . ./

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 stash

# Copy from builder (including node_modules with prisma client)
COPY --from=builder --chown=stash:nodejs /app ./

# Install tsx globally for running TypeScript
RUN npm install -g tsx

USER stash

# Cloud Run sets PORT automatically
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Start server - reads PORT from environment
CMD ["tsx", "index.ts"]
