<script setup lang="ts">
useHead({ title: 'Einstellungen · MezoHelpdesk' })

type MailProvider = 'none' | 'smtp' | 'resend'
type SettingsResponse = {
  app: { allowRegistration: boolean }
  mail: {
    provider: MailProvider; from: string; supportEmail: string; source: 'settings' | 'env'
    smtp: { host: string; port: number; secure: boolean; user: string; hasPassword: boolean }
    resend: { hasApiKey: boolean }
  }
}

const { data, refresh } = await useFetch<SettingsResponse>('/api/settings', { key: 'settings' })

const mail = reactive({
  provider: 'none' as MailProvider, from: '', supportEmail: '',
  smtp: { host: '', port: 587, secure: false, user: '', password: '', clearPassword: false },
  resend: { apiKey: '' },
})
const allowRegistration = shallowRef(true)

function fillForm() {
  if (!data.value) return
  const m = data.value.mail
  Object.assign(mail, { provider: m.provider, from: m.from, supportEmail: m.supportEmail })
  Object.assign(mail.smtp, { host: m.smtp.host, port: m.smtp.port, secure: m.smtp.secure, user: m.smtp.user, password: '', clearPassword: false })
  mail.resend.apiKey = ''
  allowRegistration.value = data.value.app.allowRegistration
}
fillForm()

const presets = [
  { label: 'Eigener Server', host: '', port: 587, secure: false },
  { label: 'Gmail', host: 'smtp.gmail.com', port: 465, secure: true },
  { label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, secure: false },
  { label: 'IONOS', host: 'smtp.ionos.de', port: 465, secure: true },
  { label: 'Strato', host: 'smtp.strato.de', port: 465, secure: true },
]
function applyPreset(event: Event) {
  const preset = presets[Number((event.target as HTMLSelectElement).value)]
  if (preset?.host) Object.assign(mail.smtp, { host: preset.host, port: preset.port, secure: preset.secure })
}
// Port 465 uses implicit TLS; 587/25 use STARTTLS.
watch(() => mail.smtp.port, (port) => { if (port === 465) mail.smtp.secure = true; else if (port === 587 || port === 25) mail.smtp.secure = false })

const mailState = reactive({ saving: false, testing: false, message: '', error: '' })
async function saveMail() {
  Object.assign(mailState, { saving: true, message: '', error: '' })
  try {
    await $fetch('/api/settings/mail', { method: 'PUT', body: mail })
    await refresh(); fillForm()
    mailState.message = 'Mailserver gespeichert.'
  } catch (err) {
    mailState.error = errorMessage(err, 'Die Einstellungen konnten nicht gespeichert werden.')
  } finally { mailState.saving = false }
}
async function sendTest() {
  Object.assign(mailState, { testing: true, message: '', error: '' })
  try {
    const result = await $fetch<{ sentTo: string }>('/api/settings/mail-test', { method: 'POST' })
    mailState.message = `Testmail an ${result.sentTo} gesendet.`
  } catch (err) {
    mailState.error = errorMessage(err, 'Die Testmail konnte nicht gesendet werden.')
  } finally { mailState.testing = false }
}

const appState = reactive({ saving: false, message: '', error: '' })
async function saveApp() {
  Object.assign(appState, { saving: true, message: '', error: '' })
  try {
    await $fetch('/api/settings/app', { method: 'PUT', body: { allowRegistration: allowRegistration.value } })
    await refresh()
    appState.message = allowRegistration.value ? 'Registrierung ist jetzt erlaubt.' : 'Registrierung ist jetzt gesperrt.'
  } catch (err) {
    appState.error = errorMessage(err, 'Die Einstellung konnte nicht gespeichert werden.')
  } finally { appState.saving = false }
}
</script>

<template>
  <section class="settings-page">
    <div class="welcome-row"><div><p class="eyebrow">Verwaltung</p><h1>Einstellungen</h1><p class="welcome-copy">Mailversand und Zugang für dein Team.</p></div></div>

    <div class="new-ticket-card settings-card">
      <div class="new-ticket-heading">
        <span class="new-ticket-icon"><Icon name="lucide:mail" /></span>
        <div><h2>Mailserver</h2><p>Darüber gehen Ticketbestätigungen, Antworten und Team-Benachrichtigungen raus.</p></div>
      </div>
      <p v-if="data?.mail.source === 'env'" class="auth-hint settings-hint"><Icon name="lucide:info" />Aktuell gelten die Werte aus der .env-Datei. Sobald du hier speicherst, haben diese Einstellungen Vorrang.</p>

      <form class="staff-ticket-form" @submit.prevent="saveMail">
        <fieldset class="provider-choice">
          <legend>Versandart</legend>
          <label :class="{ active: mail.provider === 'smtp' }"><input v-model="mail.provider" type="radio" value="smtp"><Icon name="lucide:server" /><span>SMTP-Server</span></label>
          <label :class="{ active: mail.provider === 'resend' }"><input v-model="mail.provider" type="radio" value="resend"><Icon name="lucide:send" /><span>Resend</span></label>
          <label :class="{ active: mail.provider === 'none' }"><input v-model="mail.provider" type="radio" value="none"><Icon name="lucide:mail-x" /><span>Kein Versand</span></label>
        </fieldset>

        <template v-if="mail.provider === 'smtp'">
          <label for="smtp-preset">Vorlage<select id="smtp-preset" @change="applyPreset"><option v-for="(preset, index) in presets" :key="preset.label" :value="index">{{ preset.label }}</option></select></label>
          <div class="form-row form-row-host">
            <label for="smtp-host">Host<input id="smtp-host" v-model.trim="mail.smtp.host" required placeholder="smtp.example.com"></label>
            <label for="smtp-port">Port<input id="smtp-port" v-model.number="mail.smtp.port" type="number" min="1" max="65535" required></label>
          </div>
          <label class="checkbox-label" for="smtp-secure"><input id="smtp-secure" v-model="mail.smtp.secure" type="checkbox"><span>Direkte TLS-Verbindung (für Port 465). Bei 587 wird automatisch STARTTLS genutzt.</span></label>
          <div class="form-row">
            <label for="smtp-user">Benutzername<input id="smtp-user" v-model.trim="mail.smtp.user" autocomplete="off" placeholder="meist die E-Mail-Adresse"></label>
            <label for="smtp-password">Passwort<input id="smtp-password" v-model="mail.smtp.password" type="password" autocomplete="new-password" :placeholder="data?.mail.smtp.hasPassword ? '•••••••• (gespeichert)' : ''"></label>
          </div>
          <label v-if="data?.mail.smtp.hasPassword" class="checkbox-label" for="smtp-clear"><input id="smtp-clear" v-model="mail.smtp.clearPassword" type="checkbox"><span>Gespeichertes Passwort entfernen</span></label>
        </template>

        <label v-if="mail.provider === 'resend'" for="resend-key">API-Schlüssel<input id="resend-key" v-model="mail.resend.apiKey" type="password" autocomplete="off" :placeholder="data?.mail.resend.hasApiKey ? '•••••••• (gespeichert)' : 're_…'"><small class="field-hint">Die Absenderdomain muss bei Resend verifiziert sein.</small></label>

        <div v-if="mail.provider !== 'none'" class="form-row">
          <label for="mail-from">Absender<input id="mail-from" v-model.trim="mail.from" required placeholder="Support <support@example.com>"></label>
          <label for="mail-support">Benachrichtigungen an<input id="mail-support" v-model.trim="mail.supportEmail" type="email" placeholder="team@example.com"><small class="field-hint">Erhält eine Mail, wenn Kund:innen antworten.</small></label>
        </div>

        <p v-if="mailState.error" class="form-error" role="alert"><Icon name="lucide:circle-alert" />{{ mailState.error }}</p>
        <p v-if="mailState.message" class="form-success" role="status"><Icon name="lucide:circle-check" />{{ mailState.message }}</p>
        <div class="new-ticket-actions">
          <button v-if="data?.mail.provider !== 'none'" class="secondary-button" type="button" :disabled="mailState.testing || mailState.saving" @click="sendTest"><Icon name="lucide:flask-conical" />{{ mailState.testing ? 'Wird gesendet …' : 'Testmail senden' }}</button>
          <button class="primary-button" type="submit" :disabled="mailState.saving"><Icon name="lucide:save" />{{ mailState.saving ? 'Wird gespeichert …' : 'Speichern' }}</button>
        </div>
      </form>
    </div>

    <div class="new-ticket-card settings-card">
      <div class="new-ticket-heading">
        <span class="new-ticket-icon"><Icon name="lucide:users" /></span>
        <div><h2>Zugang</h2><p>Lege fest, ob sich neue Teammitglieder selbst registrieren dürfen.</p></div>
      </div>
      <form class="staff-ticket-form" @submit.prevent="saveApp">
        <label class="checkbox-label" for="allow-registration"><input id="allow-registration" v-model="allowRegistration" type="checkbox"><span>Registrierung für neue Konten erlauben. Neue Konten erhalten die Rolle Agent.</span></label>
        <p v-if="appState.error" class="form-error" role="alert"><Icon name="lucide:circle-alert" />{{ appState.error }}</p>
        <p v-if="appState.message" class="form-success" role="status"><Icon name="lucide:circle-check" />{{ appState.message }}</p>
        <div class="new-ticket-actions"><button class="primary-button" type="submit" :disabled="appState.saving"><Icon name="lucide:save" />Speichern</button></div>
      </form>
    </div>
  </section>
</template>
