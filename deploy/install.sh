#!/usr/bin/env bash
# MezoHelpdesk – Installation und Update für einen Proxmox-LXC (Debian/Ubuntu), ohne Docker.
#
#   bash install.sh            # erste Installation (fragt nach Domains und Tunnel-Token)
#   bash install.sh            # erneut ausführen = Update (Daten und Einstellungen bleiben)
#
# Ohne Rückfragen (z. B. für Skripte):
#   PORTAL_URL=https://portal.example.de SUPPORT_URL=https://support.example.de \
#   CF_TUNNEL_TOKEN=eyJ... bash install.sh
set -euo pipefail

APP_NAME="mezohelpdesk"
APP_DIR="/opt/${APP_NAME}"
DATA_DIR="/var/lib/${APP_NAME}"
CONF_DIR="/etc/${APP_NAME}"
SERVICE_USER="${APP_NAME}"
NODE_MAJOR="24"
NODE_DIR="/opt/node"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
info() { printf '\033[34m›\033[0m %s\n' "$*"; }
ok() { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }
die() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Bitte als root ausführen (im Container: einfach als root einloggen)."
command -v apt-get >/dev/null || die "Dieses Skript ist für Debian oder Ubuntu gedacht."
[ -f "${SRC_DIR}/app/portal/server/index.mjs" ] || die "app/portal fehlt. Bitte das Skript aus dem entpackten ZIP-Ordner starten."

case "$(uname -m)" in
  x86_64) NODE_ARCH="x64"; DEB_ARCH="amd64" ;;
  aarch64 | arm64) NODE_ARCH="arm64"; DEB_ARCH="arm64" ;;
  *) die "Nicht unterstützte Architektur: $(uname -m)" ;;
esac

bold "MezoHelpdesk $(cat "${SRC_DIR}/VERSION" 2>/dev/null || echo '')"
echo

# ---------------------------------------------------------------- Pakete
info "Systempakete installieren …"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates xz-utils openssl >/dev/null
ok "Systempakete bereit"

# ---------------------------------------------------------------- Node.js
current_node_major() { command -v node >/dev/null && node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }
if [ "$(current_node_major)" -lt 22 ]; then
  info "Node.js ${NODE_MAJOR} herunterladen (offizielle Version von nodejs.org) …"
  tmp="$(mktemp -d)"
  base="https://nodejs.org/dist/latest-v${NODE_MAJOR}.x"
  curl -fsSL "${base}/SHASUMS256.txt" -o "${tmp}/SHASUMS256.txt"
  file="$(grep -o "node-v[0-9.]*-linux-${NODE_ARCH}.tar.xz" "${tmp}/SHASUMS256.txt" | head -1)"
  [ -n "${file}" ] || die "Keine Node.js-Version für ${NODE_ARCH} gefunden."
  curl -fsSL "${base}/${file}" -o "${tmp}/${file}"
  (cd "${tmp}" && grep " ${file}\$" SHASUMS256.txt | sha256sum -c - >/dev/null) || die "Prüfsumme von Node.js stimmt nicht."
  rm -rf "${NODE_DIR}" && mkdir -p "${NODE_DIR}"
  tar -xJf "${tmp}/${file}" -C "${NODE_DIR}" --strip-components=1
  ln -sf "${NODE_DIR}/bin/node" /usr/local/bin/node
  rm -rf "${tmp}"
fi
NODE_BIN="$(command -v node)"
ok "Node.js $(node -v) unter ${NODE_BIN}"

# ---------------------------------------------------------------- Konfiguration
FIRST_INSTALL=1
[ -f "${CONF_DIR}/portal.env" ] && FIRST_INSTALL=0

ask() { # ask VAR "Frage" "Vorgabe"
  local var="$1" question="$2" default="${3:-}" answer
  if [ -n "${!var:-}" ]; then return; fi
  if [ -t 0 ]; then
    read -r -p "${question}${default:+ [${default}]}: " answer
    printf -v "${var}" '%s' "${answer:-${default}}"
  else
    printf -v "${var}" '%s' "${default}"
  fi
}

normalize_url() { local url="${1%/}"; case "${url}" in http://* | https://*) ;; *) url="https://${url}" ;; esac; echo "${url}"; }

if [ "${FIRST_INSTALL}" -eq 1 ]; then
  bold "Einrichtung"
  echo "Das Team-Portal und das Kontaktformular bekommen je eine eigene Adresse."
  echo "Beispiel: portal.deinedomain.de und support.deinedomain.de"
  echo
  ask PORTAL_URL "Adresse des Team-Portals" "https://portal.example.de"
  ask SUPPORT_URL "Adresse des Kontaktformulars" "https://support.example.de"
  PORTAL_URL="$(normalize_url "${PORTAL_URL}")"
  SUPPORT_URL="$(normalize_url "${SUPPORT_URL}")"
  echo
  echo "Ohne Domain zuerst im Heimnetz testen? Dann sind die Apps über die IP des"
  echo "Containers erreichbar (http, Port 3000/3001). Später einfach auf Tunnel umstellen."
  ask LAN_MODE "Im Heimnetz ohne Tunnel testen? (j/N)" "n"
  echo
  ask CF_TUNNEL_TOKEN "Cloudflare-Tunnel-Token (leer lassen, um es später einzurichten)" ""

  if [[ "${LAN_MODE,,}" =~ ^(j|ja|y|yes)$ ]]; then
    BIND="0.0.0.0"; COOKIE_SECURE="false"; TRUST_PROXY="false"
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    PORTAL_URL="http://${ip:-127.0.0.1}:3000"; SUPPORT_URL="http://${ip:-127.0.0.1}:3001"
  else
    BIND="127.0.0.1"; COOKIE_SECURE="true"; TRUST_PROXY="true"
  fi

  install -d -m 0750 "${CONF_DIR}"
  cat > "${CONF_DIR}/portal.env" <<EOF
# MezoHelpdesk Team-Portal. Nach Änderungen: systemctl restart ${APP_NAME}-portal
HOST=${BIND}
PORT=3000
NODE_ENV=production
NUXT_PUBLIC_PORTAL_URL=${PORTAL_URL}
NUXT_PUBLIC_INTAKE_URL=${SUPPORT_URL}
NUXT_SESSION_SECRET=$(openssl rand -hex 32)
# true hinter Cloudflare Tunnel (Besucher-IP aus X-Forwarded-For)
NUXT_TRUST_PROXY=${TRUST_PROXY}
# false nur zum Testen ohne HTTPS
NUXT_COOKIE_SECURE=${COOKIE_SECURE}
EOF
  cat > "${CONF_DIR}/intake.env" <<EOF
# MezoHelpdesk Kontaktformular. Nach Änderungen: systemctl restart ${APP_NAME}-intake
HOST=${BIND}
PORT=3001
NODE_ENV=production
NUXT_TICKET_API_URL=http://127.0.0.1:3000/api/public/v1/tickets
NUXT_TRUST_PROXY=${TRUST_PROXY}
EOF
  ok "Konfiguration unter ${CONF_DIR} angelegt"
else
  ok "Bestehende Konfiguration aus ${CONF_DIR} wird beibehalten (Update)"
fi

# ---------------------------------------------------------------- Benutzer und Dateien
id -u "${SERVICE_USER}" >/dev/null 2>&1 || useradd --system --home-dir "${DATA_DIR}" --shell /usr/sbin/nologin "${SERVICE_USER}"
install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0750 "${DATA_DIR}" "${DATA_DIR}/portal" "${DATA_DIR}/intake"
chown root:"${SERVICE_USER}" "${CONF_DIR}" "${CONF_DIR}"/*.env
chmod 0640 "${CONF_DIR}"/*.env

if systemctl is-active --quiet "${APP_NAME}-portal" 2>/dev/null; then
  info "Dienste für das Update anhalten …"
  systemctl stop "${APP_NAME}-intake" "${APP_NAME}-portal" || true
fi

info "Programmdateien nach ${APP_DIR} kopieren …"
install -d -m 0755 "${APP_DIR}"
rm -rf "${APP_DIR}/portal.new" "${APP_DIR}/intake.new"
cp -a "${SRC_DIR}/app/portal" "${APP_DIR}/portal.new"
cp -a "${SRC_DIR}/app/intake" "${APP_DIR}/intake.new"
rm -rf "${APP_DIR}/portal" "${APP_DIR}/intake"
mv "${APP_DIR}/portal.new" "${APP_DIR}/portal"
mv "${APP_DIR}/intake.new" "${APP_DIR}/intake"
cp -f "${SRC_DIR}/VERSION" "${APP_DIR}/VERSION" 2>/dev/null || true
chown -R root:root "${APP_DIR}"
ok "Programmdateien aktualisiert"

# ---------------------------------------------------------------- systemd
write_unit() { # name description port-dir after
  local name="$1" description="$2" dir="$3" after="$4"
  cat > "/etc/systemd/system/${APP_NAME}-${name}.service" <<EOF
[Unit]
Description=${description}
After=network-online.target ${after}
Wants=network-online.target ${after}

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
EnvironmentFile=${CONF_DIR}/${name}.env
# Die App speichert ihre Daten in .data/ im Arbeitsverzeichnis.
WorkingDirectory=${DATA_DIR}/${dir}
ExecStart=${NODE_BIN} ${APP_DIR}/${dir}/server/index.mjs
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${DATA_DIR}

[Install]
WantedBy=multi-user.target
EOF
}
write_unit portal "MezoHelpdesk Team-Portal" portal ""
write_unit intake "MezoHelpdesk Kontaktformular" intake "${APP_NAME}-portal.service"
systemctl daemon-reload
systemctl enable --now "${APP_NAME}-portal" "${APP_NAME}-intake" >/dev/null 2>&1
systemctl restart "${APP_NAME}-portal" "${APP_NAME}-intake"
sleep 2

# Unprivileged containers without "nesting" cannot set up systemd's sandboxing
# (status 226/NAMESPACE). Fall back to running without it.
for name in portal intake; do
  unit="${APP_NAME}-${name}"
  if ! systemctl is-active --quiet "${unit}" && [ "$(systemctl show -p ExecMainStatus --value "${unit}")" = "226" ]; then
    warn "${unit}: Sandbox nicht möglich (Container ohne Nesting). Starte ohne Sandbox."
    install -d "/etc/systemd/system/${unit}.service.d"
    printf '[Service]\nProtectSystem=no\nProtectHome=no\nPrivateTmp=no\n' > "/etc/systemd/system/${unit}.service.d/no-sandbox.conf"
    systemctl daemon-reload
    systemctl restart "${unit}"
  fi
done

info "Auf den Start warten …"
for port in 3000 3001; do
  for _ in $(seq 1 30); do
    curl -fs -o /dev/null "http://127.0.0.1:${port}/" -m 2 && break
    curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/" -m 2 | grep -qE '^(2|3)' && break
    sleep 1
  done
done
systemctl is-active --quiet "${APP_NAME}-portal" || die "Portal startet nicht. Log: journalctl -u ${APP_NAME}-portal -n 50"
systemctl is-active --quiet "${APP_NAME}-intake" || die "Kontaktformular startet nicht. Log: journalctl -u ${APP_NAME}-intake -n 50"
ok "Dienste laufen (Portal :3000, Kontaktformular :3001)"

# ---------------------------------------------------------------- Cloudflare Tunnel
if [ -n "${CF_TUNNEL_TOKEN:-}" ]; then
  if ! command -v cloudflared >/dev/null; then
    info "cloudflared installieren (offizielles Paket von Cloudflare) …"
    tmp="$(mktemp -d)"
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${DEB_ARCH}.deb" -o "${tmp}/cloudflared.deb"
    apt-get install -y -qq "${tmp}/cloudflared.deb" >/dev/null
    rm -rf "${tmp}"
  fi
  if systemctl list-unit-files | grep -q '^cloudflared.service'; then
    cloudflared service uninstall >/dev/null 2>&1 || true
  fi
  cloudflared service install "${CF_TUNNEL_TOKEN}" >/dev/null 2>&1
  systemctl enable --now cloudflared >/dev/null 2>&1 || true
  sleep 2
  systemctl is-active --quiet cloudflared && ok "Cloudflare Tunnel läuft" || warn "cloudflared läuft nicht. Prüfen mit: journalctl -u cloudflared -n 50"
fi

# ---------------------------------------------------------------- Zusammenfassung
# shellcheck disable=SC1091
. "${CONF_DIR}/portal.env"
echo
bold "Fertig!"
echo
echo "  Team-Portal:       ${NUXT_PUBLIC_PORTAL_URL}"
echo "  Kontaktformular:   ${NUXT_PUBLIC_INTAKE_URL}"
echo
if [ "${HOST}" = "127.0.0.1" ]; then
  echo "  In Cloudflare (Zero Trust → Networks → Tunnels → dein Tunnel → Public Hostnames):"
  echo "    $(echo "${NUXT_PUBLIC_PORTAL_URL}" | sed -E 's#https?://##')  →  HTTP  127.0.0.1:3000"
  echo "    $(echo "${NUXT_PUBLIC_INTAKE_URL}" | sed -E 's#https?://##')  →  HTTP  127.0.0.1:3001"
  echo
fi
echo "  Beim ersten Aufruf des Portals legst du das Admin-Konto an."
echo "  Daten:   ${DATA_DIR}     Einstellungen: ${CONF_DIR}"
echo "  Logs:    journalctl -u ${APP_NAME}-portal -f"
echo "  Update:  neues ZIP entpacken und dort erneut 'bash install.sh' ausführen"
