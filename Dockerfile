# multi-stage build for backend (Debian-based to satisfy Prisma OpenSSL needs)

####################
# Builder
####################
FROM node:18-bullseye AS builder

WORKDIR /usr/src/app

# copy package metadata, install all deps (including dev for tsc)
COPY package*.json ./
RUN npm ci

# copy source, generate prisma client and build
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# generate prisma client for the build environment
RUN npx prisma generate --schema=./prisma/schema.prisma

# build TypeScript
RUN npm run build

####################
# Runner (final image)
####################
FROM node:18-bullseye AS runner

WORKDIR /usr/src/app

# Install OpenSSL 1.1 runtime and CA certificates
RUN apt-get update && \
    apt-get install -y --no-install-recommends libssl1.1 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# copy compiled app and node_modules and prisma
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package*.json ./

# create a non-root user (Debian style)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# ensure correct ownership
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

ENV NODE_ENV=production
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

# adjust as your start command expects (index.js or dist/index.js)
CMD ["node", "dist/index.js"]
