# Dockerfile for Chores & Rewards PWA
#
# Multi-stage build: the build stage compiles the client (vite) and bundles
# the server (esbuild, --packages=external --external:./vite) into
# dist/index.js + dist/public/. The runtime stage installs only production
# node_modules and runs the built bundle directly with node, so vite, esbuild,
# tsx and the rest of devDependencies never ship in the deployed image.
#
# Base image pinned by digest (see #59): node:22-alpine, resolved 2026-08-18
# via the registry API (docker-content-digest header on a HEAD-equivalent
# manifest request for the linux multi-arch index).
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build

WORKDIR /app

# Copy package files first so this layer caches independently of source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install ALL dependencies (build tooling - vite, esbuild - is only needed here).
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy application source and build both the client bundle and the server bundle.
COPY . .
RUN pnpm run build

FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS runtime

# curl is needed for the healthcheck below; nothing else from apk is required
# at runtime.
RUN apk add --no-cache curl

WORKDIR /app

# Install production dependencies only - no vite, esbuild, tsx or other
# devDependencies in the final image.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

# Copy the built server bundle and client assets from the build stage.
# server/static.ts resolves the client directory relative to dist/index.js,
# so dist/public must sit alongside dist/index.js as-is.
COPY --from=build /app/dist ./dist

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000 || exit 1

# Run the built bundle directly - no tsx, no dev tooling in the container.
CMD ["node", "dist/index.js"]
