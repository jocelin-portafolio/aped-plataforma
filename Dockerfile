# Imagen de producción del sitio APED (Next.js en modo standalone).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# mongodb-memory-server (solo para tests) no debe descargar MongoDB aquí.
ENV MONGOMS_DISABLE_POSTINSTALL=1
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S aped && adduser -S aped -G aped

COPY --from=build --chown=aped:aped /app/.next/standalone ./
COPY --from=build --chown=aped:aped /app/.next/static ./.next/static
COPY --from=build --chown=aped:aped /app/public ./public
# Script para crear el primer administrador dentro del contenedor.
COPY --from=build --chown=aped:aped /app/scripts/create-admin.mjs ./scripts/create-admin.mjs

USER aped
EXPOSE 3000
CMD ["node", "server.js"]
