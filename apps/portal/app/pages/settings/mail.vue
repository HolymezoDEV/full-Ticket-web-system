<script setup lang="ts">
useSeoMeta({ title: 'Mailserver' })

type MailProvider = 'none' | 'smtp' | 'resend'
type SettingsResponse = {
  app: { allowRegistration: boolean, notifyTeamOnNewTicket: boolean, notifyTeamOnCustomerMessage: boolean }
  mail: {
    provider: MailProvider
    from: string
    supportEmail: string
    source: 'settings' | 'env'
    smtp: { host: string, port: number, secure: boolean, user: string, hasPassword: boolean }
    resend: { hasApiKey: boolean }
  }
}

const toast = useToast()
const { user } = useAuth()
const { data, refresh } = await useFetch<SettingsResponse>('/api/settings', { key: 'settings' })

const state = reactive({
  provider: 'none' as MailProvider,
  from: '',
  supportEmail: '',
  smtp: { host: '', port: 587, secure: false, user: '', password: '', clearPassword: false },
  resend: { apiKey: '' }
})

function fill() {
  const mail = data.value?.mail
  if (!mail) return
  Object.assign(state, { provider: mail.provider, from: mail.from, supportEmail: mail.supportEmail })
  Object.assign(state.smtp, { host: mail.smtp.host, port: mail.smtp.port, secure: mail.smtp.secure, user: mail.smtp.user, password: '', clearPassword: false })
  state.resend.apiKey = ''
}
fill()

const providers = [
  { label: 'SMTP-Server', value: 'smtp', description: 'Eigener Mailserver oder Anbieter wie Gmail, IONOS, Strato.', icon: 'i-lucide-server' },
  { label: 'Resend', value: 'resend', description: 'Versand über die Resend-API.', icon: 'i-lucide-send' },
  { label: 'Kein Versand', value: 'none', description: 'Tickets werden gespeichert, aber keine Mails verschickt.', icon: 'i-lucide-mail-x' }
]

const presets = [
  { label: 'Eigener Server', value: 'custom' },
  { label: 'WEB.DE', value: 'webde', host: 'smtp.web.de', port: 587, secure: false },
  { label: 'Gmail', value: 'gmail', host: 'smtp.gmail.com', port: 465, secure: true },
  { label: 'Outlook / Microsoft 365', value: 'outlook', host: 'smtp.office365.com', port: 587, secure: false },
  { label: 'IONOS', value: 'ionos', host: 'smtp.ionos.de', port: 465, secure: true },
  { label: 'Strato', value: 'strato', host: 'smtp.strato.de', port: 465, secure: true }
]
const preset = ref('custom')
watch(preset, (value) => {
  const match = presets.find(item => item.value === value)
  if (match && 'host' in match) Object.assign(state.smtp, { host: match.host, port: match.port, secure: match.secure })
})
// Port 465 uses implicit TLS; 587 and 25 use STARTTLS.
watch(() => state.smtp.port, (port) => {
  if (port === 465) state.smtp.secure = true
  else if (port === 587 || port === 25) state.smtp.secure = false
})

const saving = ref(false)
const testing = ref(false)

async function save() {
  saving.value = true
  try {
    await $fetch('/api/settings/mail', { method: 'PUT', body: state })
    await refresh()
    fill()
    toast.add({ title: 'Mailserver gespeichert', icon: 'i-lucide-check', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Nicht gespeichert', description: errorMessage(err, 'Bitte prüfe deine Eingaben.'), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  testing.value = true
  try {
    const result = await $fetch<{ sentTo: string }>('/api/settings/mail-test', { method: 'POST' })
    toast.add({ title: 'Testmail gesendet', description: `An ${result.sentTo}. Prüfe dein Postfach.`, icon: 'i-lucide-mail-check', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Testmail fehlgeschlagen', description: errorMessage(err, 'Der Mailserver hat nicht geantwortet.'), color: 'error', icon: 'i-lucide-mail-x', duration: 10000 })
  } finally {
    testing.value = false
  }
}

const senderMismatch = computed(() => {
  if (state.provider !== 'smtp' || !state.smtp.user.includes('@') || !state.from) return false
  const address = (state.from.match(/<([^<>]+)>\s*$/)?.[1] ?? state.from).trim().toLowerCase()
  return address !== state.smtp.user.toLowerCase()
})

function useLoginAsSender() {
  state.from = `Holymezo Support <${state.smtp.user}>`
}

async function saveRule(key: 'notifyTeamOnNewTicket' | 'notifyTeamOnCustomerMessage', value: boolean) {
  try {
    await $fetch('/api/settings/app', { method: 'PUT', body: { [key]: value } })
    await refresh()
    toast.add({ title: 'Benachrichtigung gespeichert', color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    await refresh()
    toast.add({ title: 'Nicht gespeichert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  }
}

const customerMails = [
  { icon: 'i-lucide-inbox', title: 'Eingangsbestätigung', text: 'Sofort nach dem Absenden, mit persönlichem Ticket-Link.' },
  { icon: 'i-lucide-hand', title: 'Ticket übernommen', text: 'Wenn jemand aus dem Team das Ticket zum ersten Mal übernimmt.' },
  { icon: 'i-lucide-mail-check', title: 'Relevante Antworten', text: 'Nur wenn beim Antworten „Kund:in per E-Mail benachrichtigen“ angehakt ist.' },
  { icon: 'i-lucide-file-text', title: 'Abschluss mit Transkript', text: 'Beim Schließen, mit dem ganzen Verlauf als PDF im Anhang.' }
]

const fieldClass = 'flex max-sm:flex-col justify-between items-start gap-4'
</script>

<template>
  <form id="mail" @submit.prevent="save">
    <UPageCard
      title="Mailserver"
      description="Darüber gehen Ticketbestätigungen, Antworten und Team-Benachrichtigungen raus."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 lg:ms-auto">
        <UTooltip :text="`Sendet an ${user?.email}`" :disabled="data?.mail.provider === 'none'">
          <UButton
            label="Testmail senden"
            icon="i-lucide-flask-conical"
            color="neutral"
            variant="outline"
            :loading="testing"
            :disabled="data?.mail.provider === 'none' || saving"
            @click="sendTest"
          />
        </UTooltip>
        <UButton
          form="mail"
          type="submit"
          label="Speichern"
          :loading="saving"
        />
      </div>
    </UPageCard>

    <UAlert
      v-if="data?.mail.source === 'env'"
      class="mb-4"
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Aktuell gelten die Werte aus der .env-Datei."
      description="Sobald du hier speicherst, haben diese Einstellungen Vorrang."
    />

    <UPageCard variant="subtle" class="mb-4">
      <URadioGroup
        v-model="state.provider"
        :items="providers"
        variant="table"
        legend="Versandart"
      />
    </UPageCard>

    <UPageCard
      v-if="state.provider === 'smtp'"
      title="SMTP-Verbindung"
      variant="subtle"
      class="mb-4"
    >
      <UFormField label="Vorlage" description="Füllt Host, Port und TLS für bekannte Anbieter aus." :class="fieldClass">
        <USelect v-model="preset" :items="presets" class="w-56" />
      </UFormField>
      <UAlert
        v-if="preset === 'webde' || state.smtp.host === 'smtp.web.de'"
        color="info"
        variant="subtle"
        icon="i-lucide-info"
        title="Hinweis für WEB.DE"
        description="Aktiviere im WEB.DE-Postfach unter Einstellungen → POP3/IMAP den Zugriff über externe Programme. Benutzername ist deine vollständige WEB.DE-Adresse, und der Absender muss dieselbe Adresse sein."
      />
      <USeparator />
      <UFormField label="Host" required :class="fieldClass">
        <UInput
          v-model.trim="state.smtp.host"
          placeholder="smtp.example.com"
          required
          class="w-56"
        />
      </UFormField>
      <USeparator />
      <UFormField
        label="Port"
        description="465 für TLS, 587 für STARTTLS."
        required
        :class="fieldClass"
      >
        <UInputNumber
          v-model="state.smtp.port"
          :min="1"
          :max="65535"
          :format-options="{ useGrouping: false }"
          class="w-56"
        />
      </UFormField>
      <USeparator />
      <UFormField label="Direkte TLS-Verbindung" description="Für Port 465. Bei 587 wird automatisch STARTTLS genutzt." :class="fieldClass">
        <USwitch v-model="state.smtp.secure" />
      </UFormField>
      <USeparator />
      <UFormField label="Benutzername" description="Meist die E-Mail-Adresse des Postfachs." :class="fieldClass">
        <UInput v-model.trim="state.smtp.user" autocomplete="off" class="w-56" />
      </UFormField>
      <USeparator />
      <UFormField label="Passwort" :description="data?.mail.smtp.hasPassword ? 'Ein Passwort ist gespeichert. Leer lassen, um es zu behalten.' : 'Bei Gmail ein App-Passwort verwenden.'" :class="fieldClass">
        <div class="flex w-56 flex-col gap-2">
          <UInput
            v-model="state.smtp.password"
            type="password"
            autocomplete="new-password"
            :placeholder="data?.mail.smtp.hasPassword ? '••••••••' : ''"
          />
          <UCheckbox v-if="data?.mail.smtp.hasPassword" v-model="state.smtp.clearPassword" label="Gespeichertes Passwort entfernen" />
        </div>
      </UFormField>
    </UPageCard>

    <UPageCard
      v-if="state.provider === 'resend'"
      title="Resend"
      variant="subtle"
      class="mb-4"
    >
      <UFormField label="API-Schlüssel" :description="data?.mail.resend.hasApiKey ? 'Ein Schlüssel ist gespeichert. Leer lassen, um ihn zu behalten.' : 'Die Absenderdomain muss bei Resend verifiziert sein.'" :class="fieldClass">
        <UInput
          v-model="state.resend.apiKey"
          type="password"
          autocomplete="off"
          :placeholder="data?.mail.resend.hasApiKey ? '••••••••' : 're_…'"
          class="w-56"
        />
      </UFormField>
    </UPageCard>

    <UPageCard v-if="state.provider !== 'none'" title="Adressen" variant="subtle">
      <UFormField
        label="Absender"
        description="Name und Adresse, die Kund:innen sehen."
        required
        :class="fieldClass"
      >
        <UInput
          v-model.trim="state.from"
          placeholder="Support <support@example.com>"
          required
          class="w-56"
          :color="senderMismatch ? 'warning' : undefined"
          :highlight="senderMismatch"
        />
      </UFormField>
      <UAlert
        v-if="senderMismatch"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="Absender passt nicht zum Benutzernamen"
        :description="`Die meisten Anbieter (z. B. WEB.DE, GMX, Outlook) verschicken nur mit der Adresse, mit der du dich anmeldest: ${state.smtp.user}.`"
        :actions="[{ label: `${state.smtp.user} als Absender verwenden`, color: 'warning', variant: 'outline', onClick: useLoginAsSender }]"
      />
      <USeparator />
      <UFormField label="Benachrichtigungen an" description="Erhält eine Mail, wenn Kund:innen antworten." :class="fieldClass">
        <UInput
          v-model.trim="state.supportEmail"
          type="email"
          placeholder="team@example.com"
          class="w-56"
        />
      </UFormField>
    </UPageCard>
  </form>

  <UPageCard
    title="Wann wird gemailt?"
    description="Kund:innen bekommen nur die wichtigen Mails. Alles andere sehen sie über ihren Ticket-Link."
    variant="naked"
    class="mt-4"
  />
  <UPageCard variant="subtle" title="An Kund:innen" :ui="{ title: 'text-sm' }">
    <ul class="flex flex-col gap-3">
      <li v-for="mail in customerMails" :key="mail.title" class="flex gap-3">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring ring-inset ring-primary/25">
          <UIcon :name="mail.icon" class="size-4" />
        </span>
        <div class="text-sm">
          <p class="font-medium text-highlighted">
            {{ mail.title }}
          </p>
          <p class="text-muted">
            {{ mail.text }}
          </p>
        </div>
      </li>
    </ul>
  </UPageCard>
  <UPageCard
    variant="subtle"
    title="An das Team"
    :description="state.supportEmail ? `Geht an ${state.supportEmail}` : 'Trage oben unter „Benachrichtigungen an“ eine Adresse ein.'"
    :ui="{ title: 'text-sm' }"
  >
    <UFormField label="Neues Ticket" description="Mail, sobald eine neue Anfrage eingeht." :class="fieldClass">
      <USwitch :model-value="data?.app.notifyTeamOnNewTicket" @update:model-value="saveRule('notifyTeamOnNewTicket', $event)" />
    </UFormField>
    <USeparator />
    <UFormField label="Jede Kundennachricht" description="Mail bei jeder weiteren Nachricht im Ticket. Standardmäßig aus." :class="fieldClass">
      <USwitch :model-value="data?.app.notifyTeamOnCustomerMessage" @update:model-value="saveRule('notifyTeamOnCustomerMessage', $event)" />
    </UFormField>
  </UPageCard>
</template>
