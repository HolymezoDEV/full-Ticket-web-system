#!/usr/bin/env bash
# Baut Portal und Kontaktformular und packt alles in dist/mezohelpdesk-<version>.zip
# für die Installation in einem Proxmox-LXC (siehe deploy/ANLEITUNG.md).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PNPM="${PNPM:-corepack pnpm}"
VERSION="$(date +%Y.%m.%d)-$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo local)"
if [ -n "$(git -C "${ROOT}" status --porcelain -- apps deploy 2>/dev/null)" ]; then VERSION="${VERSION}-dirty"; fi

for app in portal intake; do
  echo "› ${app} bauen …"
  (cd "${ROOT}/apps/${app}" && ${PNPM} install --frozen-lockfile >/dev/null && ${PNPM} build >/dev/null)
  if find "${ROOT}/apps/${app}/.output" -name '*.node' | grep -q .; then
    echo "✗ ${app} enthält native Module, die auf Linux nicht laufen würden." >&2
    exit 1
  fi
done

STAGE="$(mktemp -d)"
PKG="${STAGE}/mezohelpdesk"
mkdir -p "${PKG}/app"
cp -a "${ROOT}/apps/portal/.output" "${PKG}/app/portal"
cp -a "${ROOT}/apps/intake/.output" "${PKG}/app/intake"
# Niemals lokale Daten mitliefern.
find "${PKG}/app" -name '.data' -prune -exec rm -rf {} +
cp "${ROOT}/deploy/install.sh" "${ROOT}/deploy/ANLEITUNG.md" "${PKG}/"
chmod +x "${PKG}/install.sh"
echo "${VERSION}" > "${PKG}/VERSION"

mkdir -p "${ROOT}/dist"
OUT="${ROOT}/dist/mezohelpdesk-${VERSION}.zip"
rm -f "${OUT}"
(cd "${STAGE}" && zip -qr -X "${OUT}" mezohelpdesk)
rm -rf "${STAGE}"
echo "✓ ${OUT} ($(du -h "${OUT}" | cut -f1))"
