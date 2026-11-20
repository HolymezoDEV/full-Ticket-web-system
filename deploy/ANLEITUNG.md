# MezoHelpdesk auf Proxmox (LXC) mit Cloudflare Tunnel

Ohne Docker. Das Paket enthält beide Apps fertig gebaut, das Installationsskript richtet
Node.js, die Dienste und optional den Cloudflare Tunnel ein.

```
mezohelpdesk/
├── install.sh        Installation und Update
├── ANLEITUNG.md      diese Anleitung
├── VERSION
└── app/
    ├── portal/       Team-Portal (Port 3000)
    └── intake/       Kontaktformular für Kund:innen (Port 3001)
```

---

## 1. Cloudflare Tunnel anlegen (2 Minuten, im Browser)

1. <https://one.dash.cloudflare.com> öffnen → **Networks → Tunnels → Create a tunnel**.
2. Typ **Cloudflared** wählen, Namen vergeben (z. B. `mezohelpdesk`).
3. Bei „Install and run a connector“ steht ein Befehl mit einem langen **Token**
   (beginnt mit `eyJ…`). Nur das Token kopieren, den Befehl selbst brauchst du nicht.
4. Weiter zu **Public Hostnames** und zwei Einträge anlegen:

   | Subdomain / Domain        | Service-Typ | URL              |
   |---------------------------|-------------|------------------|
   | `portal.deinedomain.de`   | HTTP        | `127.0.0.1:3000` |
   | `support.deinedomain.de`  | HTTP        | `127.0.0.1:3001` |

   Die Namen kannst du frei wählen. Die Domain muss bei Cloudflare verwaltet werden.
   Bitte `127.0.0.1` statt `localhost` eintragen (sonst versucht cloudflared teils IPv6).

## 2. Container in Proxmox anlegen

In der Proxmox-Oberfläche **Create CT**:

- Template: **Debian 12** (oder Debian 13 / Ubuntu 24.04)
- Unprivileged: **ja**, unter *Options → Features* am besten **Nesting** aktivieren
  (bei neuen Containern meist schon an; ohne läuft es auch, nur ohne Zusatz-Sandbox)
- CPU: 1 Kern · RAM: **1024 MB** · Disk: **8 GB**
- Netzwerk: DHCP reicht

Container starten und als `root` einloggen (Konsole in Proxmox).

## 3. ZIP in den Container bringen

Am einfachsten auf dem **Proxmox-Host** (Shell) mit der Container-ID, z. B. `105`:

```bash
pct push 105 mezohelpdesk-*.zip /root/mezohelpdesk.zip
```

Alternativ mit `scp` vom eigenen Rechner, falls im Container SSH läuft.

## 4. Installieren

Im **Container**:

```bash
apt-get update && apt-get install -y unzip
cd /root && unzip mezohelpdesk.zip && cd mezohelpdesk
bash install.sh
```

Das Skript fragt:

- **Adresse des Team-Portals**, z. B. `portal.deinedomain.de`
- **Adresse des Kontaktformulars**, z. B. `support.deinedomain.de`
- **Im Heimnetz ohne Tunnel testen?** Mit Enter überspringen (Nein).
- **Cloudflare-Tunnel-Token** aus Schritt 1 einfügen.

Danach `https://portal.deinedomain.de` öffnen. Beim ersten Aufruf legst du das
**Admin-Konto** an. Dann unter **Einstellungen → Mailserver** den Versand einrichten
und eine Testmail schicken.

---

## Update

Neues ZIP in den Container kopieren, entpacken und erneut ausführen:

```bash
cd /root && rm -rf mezohelpdesk && unzip -o mezohelpdesk.zip && cd mezohelpdesk
bash install.sh
```

Tickets, Konten und Einstellungen bleiben erhalten. Es wird nichts gefragt.

## Wo liegt was?

| Was                          | Ort                                   |
|------------------------------|---------------------------------------|
| Programm                     | `/opt/mezohelpdesk/`                  |
| Daten (Tickets, Konten, Mail-Einstellungen, Rollen, Themen) | `/var/lib/mezohelpdesk/portal/.data/` |
| Einstellungen (Adressen, Geheimschlüssel) | `/etc/mezohelpdesk/portal.env`, `intake.env` |
| Node.js                      | `/opt/node/`                          |

## Nützliche Befehle

```bash
systemctl status mezohelpdesk-portal mezohelpdesk-intake cloudflared
journalctl -u mezohelpdesk-portal -f          # Live-Log Portal
journalctl -u mezohelpdesk-intake -f          # Live-Log Kontaktformular
systemctl restart mezohelpdesk-portal mezohelpdesk-intake
```

## Backup

```bash
tar czf /root/mezohelpdesk-backup-$(date +%F).tgz /var/lib/mezohelpdesk /etc/mezohelpdesk
```

Zusätzlich kannst du in Proxmox Backups des ganzen Containers planen.

## Bestehende Daten übernehmen

Tickets und Konten aus der lokalen Entwicklung liegen in `apps/portal/.data/`.
Zum Übernehmen diese Dateien nach `/var/lib/mezohelpdesk/portal/.data/` kopieren
(`session-secret` weglassen), dann:

```bash
chown -R mezohelpdesk:mezohelpdesk /var/lib/mezohelpdesk
systemctl restart mezohelpdesk-portal
```

## Später vom Heimnetz-Test auf Tunnel umstellen

In `/etc/mezohelpdesk/portal.env` und `intake.env`:

```
HOST=127.0.0.1
NUXT_TRUST_PROXY=true
```

In `portal.env` zusätzlich `NUXT_COOKIE_SECURE=true` und die beiden Adressen
(`NUXT_PUBLIC_PORTAL_URL`, `NUXT_PUBLIC_INTAKE_URL`) auf die echten `https://`-Domains setzen.
Danach den Tunnel einrichten:

```bash
CF_TUNNEL_TOKEN=eyJ... bash install.sh
systemctl restart mezohelpdesk-portal mezohelpdesk-intake
```

## Hinweise

- Die Apps lauschen nur auf `127.0.0.1`. Von außen erreichbar sind sie ausschließlich
  über den Cloudflare Tunnel; im Container müssen keine Ports geöffnet werden.
- Für den Mailversand braucht der Container ausgehenden Zugriff auf den SMTP-Port
  deines Anbieters (meist 587 oder 465).
- Live-Updates, Tipp-Anzeige und Töne laufen über den Tunnel ohne Zusatzeinstellungen.
- Die App ist für **einen** Container ausgelegt (Daten als Dateien, Live-Updates im
  Arbeitsspeicher). Für mehrere Instanzen bräuchte es eine Datenbank.

## Deinstallieren

```bash
systemctl disable --now mezohelpdesk-portal mezohelpdesk-intake
rm /etc/systemd/system/mezohelpdesk-*.service && systemctl daemon-reload
rm -rf /opt/mezohelpdesk          # Programm
# Daten erst löschen, wenn ein Backup existiert:
# rm -rf /var/lib/mezohelpdesk /etc/mezohelpdesk
cloudflared service uninstall     # falls der Tunnel nicht mehr gebraucht wird
```
