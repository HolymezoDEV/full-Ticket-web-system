# Holymezo MezoHelpdesk

Zwei Nuxt-4-Anwendungen: das Team-Portal auf Port 3000 und die öffentliche Supportseite auf Port 3001. Das Portal basiert auf der Nuxt-UI-Dashboard-Vorlage (`nuxt-ui-templates/dashboard`, Nuxt UI v4) mit den Farb- und Formwerten des shadcn-Presets `b1Yo1b01Q`.

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

## Anmeldung

Beim ersten Aufruf des Portals wird man zur Registrierung geleitet. Das erste Konto wird Admin, alle weiteren Agent. Admins können unter Einstellungen → Team die Selbstregistrierung sperren, Rollen ändern und Konten entfernen. Konten liegen in apps/portal/.data/users.json (Passwörter als scrypt-Hash).

## Mailserver

Unter Einstellungen → Mailserver (nur Admins) wird der Versand eingerichtet: SMTP (mit Vorlagen für Gmail, Outlook, IONOS, Strato) oder Resend. Mit „Testmail senden“ geht eine Mail an die eigene Adresse. Die Werte liegen in apps/portal/.data/mail-settings.json und haben Vorrang vor der .env.

## Oberfläche und Theme

Das Theme steht in apps/portal/app/app.config.ts (primary: blue, neutral: mauve) und apps/portal/app/assets/css/main.css (Schrift Inter, Radius 0.625rem, Zeiger-Cursor auf Buttons). Das entspricht dem shadcn-Preset `b1Yo1b01Q` (Stil base-nova). Der Befehl `shadcn init --template vite` selbst erzeugt ein React-Projekt und lässt sich in Nuxt nicht verwenden; deshalb wurden nur seine Werte übernommen.
