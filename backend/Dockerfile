# Build stage - use Debian slim instead of Alpine for OpenSSL compatibility
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy prisma schema FIRST
COPY prisma ./prisma/

# Install ALL dependencies (including devDeps for prisma)
RUN npm install

# Generate Prisma client with correct binaries
RUN npx prisma generate

# Copy source code
COPY . ./

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install wget for health checks
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 stash

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
