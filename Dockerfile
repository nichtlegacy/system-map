# The map is static data compiled into the build, so the image carries no
# state and needs nothing mounted: rebuild it to change the map.
# The build runs once, natively, whatever the target architecture: its output
# is plain JavaScript (next.config.ts keeps sharp out), so emulating npm ci
# and next build for arm64 would only cost twenty minutes for the same files.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Where the app will be served, for the absolute URLs in its link previews.
# It is baked into the pages, so it has to be known at build time.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

# `output: "standalone"` traces the server's own dependencies into
# .next/standalone, so the runtime stage never sees node_modules or npm.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
