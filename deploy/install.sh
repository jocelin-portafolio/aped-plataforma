#!/usr/bin/env bash
# Instala o actualiza el sitio APED en un servidor Linux (Vultr) con Docker.
# Ejecutar como root en el servidor:
#
#   curl -fsSL https://raw.githubusercontent.com/jocelin-portafolio/aped-plataforma/main/deploy/install.sh -o install.sh
#   bash install.sh [rama] [dominio]
#
# Sin dominio usa <ip>.sslip.io (gratis, sin cuenta). Volver a ejecutarlo
# actualiza el código y reconstruye sin borrar la base de datos.
set -euo pipefail

BRANCH="${1:-main}"
APP_DIR=/opt/aped-plataforma
REPO=https://github.com/jocelin-portafolio/aped-plataforma.git

log() { printf '\n==> %s\n' "$*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este script como root (sudo bash install.sh)." >&2
  exit 1
fi

IP="$(curl -fsS4 https://api.ipify.org || hostname -I | awk '{print $1}')"
DOMAIN="${2:-${IP//./-}.sslip.io}"

# Docker (solo si falta).
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  log "Instalando Docker"
  curl -fsSL https://get.docker.com | sh
fi

# Next.js necesita ~2 GB de memoria para compilar: agrega swap si hace falta.
MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
SWAP_MB=$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)
if [ $((MEM_MB + SWAP_MB)) -lt 2500 ] && [ ! -f /swapfile ]; then
  log "Memoria baja (${MEM_MB} MB): creando 2 GB de swap"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Código.
if [ -d "$APP_DIR/.git" ]; then
  log "Actualizando código (rama $BRANCH)"
  git -C "$APP_DIR" fetch --prune origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  log "Descargando código (rama $BRANCH)"
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

cd "$APP_DIR/deploy"

# Configuración: se crea una sola vez, con un secreto aleatorio.
if [ ! -f .env.production ]; then
  log "Creando .env.production para $DOMAIN"
  sed -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=$DOMAIN|" \
      -e "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=https://$DOMAIN|" \
      -e "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -hex 32)|" \
      .env.production.example > .env.production
  chmod 600 .env.production
fi
# docker compose lee deploy/.env para el dominio de Caddy.
echo "SITE_DOMAIN=$(grep '^SITE_DOMAIN=' .env.production | cut -d= -f2)" > .env

# Los puertos 80 y 443 deben estar libres para Caddy (salvo que ya sea el nuestro).
if ! docker compose ps --status running caddy 2>/dev/null | grep -q caddy; then
  if ss -ltnH '( sport = :80 or sport = :443 )' | grep -q .; then
    echo "Los puertos 80/443 ya están en uso por otro programa:" >&2
    ss -ltnp '( sport = :80 or sport = :443 )' >&2
    echo "Libéralos o configura ese proxy para reenviar a este sitio." >&2
    exit 1
  fi
fi

# Firewall: abre HTTP/HTTPS si ufw está activo.
if command -v ufw >/dev/null && ufw status | grep -q 'Status: active'; then
  ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null && ufw allow 443/udp >/dev/null
fi

log "Compilando e iniciando (puede tardar varios minutos)"
docker compose up -d --build
docker image prune -f >/dev/null

SITE="$(grep '^SITE_DOMAIN=' .env.production | cut -d= -f2)"
log "Listo: https://$SITE"
cat <<EOF

Primer administrador (genera y muestra la contraseña una sola vez):
  cd $APP_DIR/deploy
  docker compose exec app node scripts/create-admin.mjs --email tu@correo.cl --name "Tu Nombre"

Ver registros:   docker compose logs -f app
EOF
