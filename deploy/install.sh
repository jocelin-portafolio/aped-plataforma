#!/usr/bin/env bash
# Instala o actualiza el sitio APED en el servidor Vultr (NINTAI).
# Ejecutar como root en el servidor:
#
#   bash install.sh [rama] [dominio]
#
# Requiere el proxy compartido de NINTAI (/opt/nintai/proxy, red "nintai").
# Sin dominio usa aped.<ip>.sslip.io (gratis, sin cuenta). Volver a
# ejecutarlo actualiza el código y reconstruye sin borrar la base de datos.
#
# Dominio propio (debe apuntar ya a este servidor):
#   bash install.sh main www.apedchile.cl
# apedchile.cl y la dirección sslip.io quedan redirigiendo a www.apedchile.cl.
set -euo pipefail

BRANCH="${1:-main}"
APP_DIR=/opt/aped-plataforma
REPO=https://github.com/jocelin-portafolio/aped-plataforma.git
PROXY_DIR=/opt/nintai/proxy
PROXY=nintai-proxy

log() { printf '\n==> %s\n' "$*"; }
fail() { echo "ERROR: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "ejecuta este script como root."
command -v docker >/dev/null && docker compose version >/dev/null 2>&1 || fail "falta Docker con el plugin compose."
docker network inspect nintai >/dev/null 2>&1 || fail "no existe la red Docker 'nintai' del proxy compartido."
[ -d "$PROXY_DIR/sites" ] || fail "no existe $PROXY_DIR/sites."
docker ps --format '{{.Names}}' | grep -qx "$PROXY" || fail "el contenedor $PROXY no está corriendo."

IP="$(curl -fsS4 https://api.ipify.org || hostname -I | awk '{print $1}')"
DOMAIN_ARG="${2:-}"
DEFAULT_DOMAIN="aped.${IP//./-}.sslip.io"

# ¿El dominio ya apunta a este servidor? (sin eso, HTTPS no se puede emitir)
points_here() { getent ahostsv4 "$1" | awk '{print $1}' | grep -qx "$IP"; }

if [ -n "$DOMAIN_ARG" ] && ! points_here "$DOMAIN_ARG"; then
  fail "$DOMAIN_ARG todavía no apunta a $IP. Crea un registro A hacia esa IP y espera a que se propague."
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
  DOMAIN="${DOMAIN_ARG:-$DEFAULT_DOMAIN}"
  log "Creando .env.production para $DOMAIN"
  sed -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=$DOMAIN|" \
      -e "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=https://$DOMAIN|" \
      -e "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -hex 32)|" \
      .env.production.example > .env.production
  chmod 600 .env.production
elif [ -n "$DOMAIN_ARG" ]; then
  # Cambio de dominio: el resto de la configuración (y el secreto) se mantiene.
  log "Cambiando el dominio a $DOMAIN_ARG"
  sed -i -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=$DOMAIN_ARG|" \
         -e "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=https://$DOMAIN_ARG|" .env.production
fi
DOMAIN="$(grep '^SITE_DOMAIN=' .env.production | cut -d= -f2)"
[ -n "$DOMAIN" ] || fail "SITE_DOMAIN vacío en .env.production."

log "Compilando e iniciando (puede tardar varios minutos)"
docker compose -p aped-plataforma up -d --build
docker image prune -f >/dev/null

# Sitio en el proxy compartido: se valida antes de recargar, y si la
# configuración nueva falla se deja la anterior intacta.
log "Publicando $DOMAIN en el proxy compartido"
SITE_FILE="$PROXY_DIR/sites/aped-plataforma.caddy"
BACKUP="$(mktemp)"
[ -f "$SITE_FILE" ] && cp "$SITE_FILE" "$BACKUP"
sed "s|__DOMAIN__|$DOMAIN|" aped-plataforma.caddy > "$SITE_FILE"

# Redirecciones al dominio principal: la versión sin "www." (si ya apunta
# aquí) y la dirección sslip.io anterior, para que los enlaces viejos sigan.
REDIRECTS=()
if [[ "$DOMAIN" == www.* ]]; then
  APEX="${DOMAIN#www.}"
  if points_here "$APEX"; then REDIRECTS+=("$APEX"); else echo "Aviso: $APEX no apunta a $IP; se omite su redirección."; fi
fi
[ "$DOMAIN" != "$DEFAULT_DOMAIN" ] && REDIRECTS+=("$DEFAULT_DOMAIN")
for host in "${REDIRECTS[@]}"; do
  printf '\n%s {\n\tredir https://%s{uri} permanent\n}\n' "$host" "$DOMAIN" >> "$SITE_FILE"
done

if ! docker exec "$PROXY" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  if [ -s "$BACKUP" ]; then cp "$BACKUP" "$SITE_FILE"; else rm -f "$SITE_FILE"; fi
  docker exec "$PROXY" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile || true
  fail "la configuración del proxy no es válida; no se aplicaron cambios al proxy."
fi
docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
rm -f "$BACKUP"

log "Listo: https://$DOMAIN"
cat <<EOF

Primer administrador (genera y muestra la contraseña una sola vez):
  cd $APP_DIR/deploy
  docker compose -p aped-plataforma exec app node scripts/create-admin.mjs --email tu@correo.cl --name "Tu Nombre"

Ver registros:   docker compose -p aped-plataforma logs -f app
EOF
