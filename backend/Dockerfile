# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (including lock file)
COPY backend/package.json backend/package-lock.json* ./

# Install dependencies (use npm install as fallback if no lock file)
RUN npm install --omit=dev

# Copy source code
COPY backend/ ./

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 stash

# Copy from builder
COPY --from=builder --chown=stash:nodejs /app ./

# Install tsx globally for running TypeScript
RUN npm install -g tsx

USER stash

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["tsx", "index.ts"]
