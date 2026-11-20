<script setup lang="ts">
type PublicTicket = { id: string; subject: string; status: string; messages: { id: string; author: string; role: string; text: string; createdAt: string }[] }
const route = useRoute()
const id = computed(() => String(route.params.id))
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const text = shallowRef('')
const error = shallowRef('')
const sent = shallowRef(false)
useHead({ title: 'Ticketverlauf — Holymezo MezoHelpdesk', meta: [{ name: 'referrer', content: 'no-referrer' }] })
const { data: ticket, error: loadError, refresh } = await useAsyncData('public-ticket-' + id.value, () => $fetch<PublicTicket>('/api/tickets/' + encodeURIComponent(id.value), { query: { token: token.value } }), { watch: [token] })
const date = (value: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
async function send() {
  error.value = ''
  sent.value = false
  try {
    await $fetch('/api/tickets/' + encodeURIComponent(id.value) + '/messages', { method: 'POST', body: { token: token.value, text: text.value } })
    text.value = ''
    sent.value = true
    await refresh()
  } catch (cause: unknown) {
    const failure = cause as { data?: { statusMessage?: string } }
    error.value = failure.data?.statusMessage || 'Die Nachricht konnte nicht hinzugefügt werden.'
  }
}
</script>

<template>
  <div class="public-layout">
    <header class="public-header"><NuxtLink class="brand public-brand" to="/"><span class="brand-mark">H</span><span class="brand-name">Holymezo<br>MezoHelpdesk</span></NuxtLink><NuxtLink to="/">Neue Anfrage</NuxtLink></header>
    <main v-if="ticket" class="public-ticket">
      <NuxtLink class="back-link" to="/">← Neue Anfrage</NuxtLink>
      <section class="public-ticket-card"><span class="step-label">TICKET {{ ticket.id }}</span><h1>{{ ticket.subject }}</h1><p class="public-ticket-status">Status: <strong>{{ ticket.status }}</strong></p>
        <div class="public-thread"><article v-for="message in ticket.messages" :key="message.id" class="public-message"><div><strong>{{ message.author }}</strong><time>{{ date(message.createdAt) }}</time></div><p>{{ message.text }}</p></article></div>
        <form class="public-reply" @submit.prevent="send"><label for="follow-up">Nachricht hinzufügen</label><textarea id="follow-up" v-model="text" rows="4" maxlength="10000" required placeholder="Schreibe eine Nachricht an das Support-Team …"/><p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="sent" class="follow-up-success" role="status">Deine Nachricht wurde hinzugefügt.</p><button class="primary-button" type="submit" :disabled="!text.trim()">Nachricht senden</button></form>
      </section>
    </main>
    <main v-else class="submitted-wrap"><h1>Ticket nicht verfügbar</h1><p>{{ loadError ? 'Der Link ist ungültig oder abgelaufen. Öffne den persönlichen Link aus deiner Ticket-E-Mail.' : 'Ticket wird geladen …' }}</p><NuxtLink class="primary-button" to="/">Zur Supportseite</NuxtLink></main>
    <footer class="public-footer"><span>Holymezo MezoHelpdesk</span><a href="mailto:support@holymezo.com">support@holymezo.com</a></footer>
  </div>
</template>
