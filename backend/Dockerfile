# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/ ./

# Build TypeScript
RUN npm run build 2>/dev/null || echo "No build script, using tsx in production"

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
