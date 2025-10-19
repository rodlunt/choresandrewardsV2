# Dockerfile for Chores & Rewards PWA
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy application code
COPY . .

# Build the client application
RUN npm run build

# Copy built files to where server expects them
RUN cp -r dist/public server/public

# Don't clean up dev dependencies - we need tsx for production
# RUN npm prune --production

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000 || exit 1

# Start the application directly with tsx (avoids bundling issues)
CMD ["npx", "tsx", "server/index.ts"]