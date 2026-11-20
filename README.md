# Holymezo MezoHelpdesk

Zwei Nuxt-4-Anwendungen: das Team-Portal auf Port 3000 und die öffentliche Supportseite auf Port 3001. Beide Apps verwenden Vue 3 und Tailwind CSS. Die Portaloberfläche verwendet shadcn-vue (Vue-Umsetzung aus dem Repository unovue/shadcn-vue).

## Lokal starten

Im ersten Terminal:

    cd apps/portal
    corepack pnpm install
    corepack pnpm dev --host 127.0.0.1 --port 3000

In einem zweiten Terminal:

    cd apps/intake
    corepack pnpm install
    corepack pnpm dev --host 127.0.0.1 --port 3001

Portal: http://127.0.0.1:3000 · Ticketformular: http://127.0.0.1:3001

## Ticketfluss

Die öffentliche Seite sendet ihre Anfrage an ihren eigenen Nuxt-Server. Dieser leitet sie serverseitig an POST /api/public/v1/tickets des Portals weiter. Das Portal speichert die Anfrage in apps/portal/.data/tickets.json; GET /api/tickets liest dieselbe Datei für den Posteingang. Kund:innen erhalten einen zufälligen persönlichen Zugangstoken. Gespeichert wird nur dessen SHA-256-Hash. Der Link öffnet den Verlauf und erlaubt weitere Nachrichten. Der API-Zugang wird über den Token geprüft; der Token wird nicht an das Team-API ausgegeben.

Die Dateiablage ist für lokale Entwicklung und einen einzelnen dauerhaft laufenden Node-Server gedacht. Vor einem Mehrinstanz- oder Produktionsbetrieb muss der Speicher auf eine gemeinsame Datenbank wie Supabase/Postgres umgestellt werden. Die Teamoberfläche hat in diesem lokalen Stand noch keine Anmeldung oder Rollenprüfung; daher nicht öffentlich deployen.

## E-Mail

Die Ticketdaten werden auch dann gespeichert, wenn kein Mailzugang konfiguriert ist. Eine E-Mail wird nur als gesendet ausgewiesen, wenn Resend sie erfolgreich annimmt. In apps/portal/.env die folgenden Werte eintragen (Absenderdomain muss bei Resend verifiziert sein):

    RESEND_API_KEY=
    MAIL_FROM=
    SUPPORT_EMAIL=
    NUXT_PUBLIC_INTAKE_URL=http://127.0.0.1:3001

SUPPORT_EMAIL erhält Benachrichtigungen zu Kundennachrichten. Für die getrennte Intake-App kann NUXT_TICKET_API_URL in apps/intake/.env gesetzt werden; lokal zeigt der Standardwert auf Port 3000.

## shadcn-vue

Die offizielle shadcn-vue Nuxt-Initialisierung wurde ausgeführt. Die Konfiguration liegt in apps/portal/components.json; der Button liegt unter apps/portal/app/components/ui/button. Weitere Komponenten lassen sich aus dem Portal-Verzeichnis mit pnpm dlx shadcn-vue@latest add <komponente> ergänzen.
