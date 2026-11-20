<script setup lang="ts">
import type { TicketStatus } from '~/composables/useTickets'
const route = useRoute()
const { tickets, updateStatus, addReply } = await useTickets()
const ticket = computed(() => tickets.value.find(item => item.id === String(route.params.id)))
const reply = shallowRef('')
const error = shallowRef('')
const mailNotice = shallowRef('')
const statuses: TicketStatus[] = ['Offen', 'In Bearbeitung', 'Wartet auf Kunde', 'Gelöst']
const date = (value: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
async function sendReply() {
  const text = reply.value.trim()
  if (!text || !ticket.value) return
  error.value = ''
  try {
    const emailSent = await addReply(ticket.value.id, text)
    mailNotice.value = emailSent ? 'Antwort gespeichert und per E-Mail mitgeteilt.' : 'Antwort gespeichert. E-Mail-Zustellung ist noch nicht eingerichtet.'
    reply.value = ''
  }
  catch { error.value = 'Die Antwort konnte nicht gespeichert werden.' }
}
async function nextStatus() {
  if (!ticket.value) return
  const index = statuses.indexOf(ticket.value.status)
  await updateStatus(ticket.value.id, statuses[(index + 1) % statuses.length]!)
}
const initials = (name: string) => name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
</script>

<template>
  <section v-if="ticket" class="detail-page">
    <div class="detail-back-row"><NuxtLink to="/" class="back-link"><Icon name="lucide:arrow-left" /> Zurück zum Posteingang</NuxtLink><span class="detail-ticket-id">{{ ticket.id }}</span></div>
    <div class="detail-layout">
      <article class="detail-main">
        <div class="detail-title-row"><div><h1>{{ ticket.subject }}</h1><p class="welcome-copy">Anfrage von {{ ticket.customer }} · {{ date(ticket.createdAt) }}</p></div></div>
        <div class="conversation-heading"><h2>Unterhaltung <span>{{ ticket.messages.length }}</span></h2></div>
        <div class="conversation-thread"><article v-for="message in ticket.messages" :key="message.id" class="thread-message"><span class="avatar">{{ initials(message.author) }}</span><div class="thread-message-content"><div class="thread-message-meta"><strong>{{ message.author }}</strong><span v-if="message.role === 'Team'" class="team-label-small">Team</span><time>{{ date(message.createdAt) }}</time></div><p>{{ message.text }}</p></div></article></div>
        <form class="reply-composer" @submit.prevent="sendReply"><div class="composer-toolbar"><span>Antwort an {{ ticket.customer }}</span></div><textarea v-model="reply" placeholder="Schreibe deine Antwort …" rows="4" maxlength="10000" aria-label="Antworttext"/><p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="mailNotice" class="mail-notice" role="status">{{ mailNotice }}</p><div class="composer-footer"><span /><button class="primary-button send-button" type="submit" :disabled="!reply.trim()"><Icon name="lucide:send" />Antwort senden</button></div></form>
      </article>
      <aside class="detail-sidebar"><div class="detail-card"><h2>Ticketdetails</h2><div class="detail-field"><span>Status</span><button class="detail-select" type="button" @click="nextStatus"><i class="status-dot" :class="'dot-' + ticket.status.toLowerCase().replaceAll(' ', '-')"/>{{ ticket.status }}<Icon name="lucide:chevron-down"/></button></div><div class="detail-field"><span>Priorität</span><span class="meta-value">{{ ticket.priority }}</span></div><div class="detail-field"><span>Zuständig</span><span class="meta-value">{{ ticket.assignee }}</span></div><div class="detail-field"><span>Team</span><span class="meta-value">Support</span></div><div class="detail-field"><span>Kategorie</span><span>{{ ticket.category }}</span></div><div class="detail-field"><span>Erstellt</span><span>{{ date(ticket.createdAt) }}</span></div></div><div class="detail-card customer-card"><h2>Anfragende Person</h2><div class="customer-profile"><span class="avatar avatar-lg">{{ initials(ticket.customer) }}</span><div><strong>{{ ticket.customer }}</strong><span>{{ ticket.email }}</span></div></div></div></aside>
    </div>
  </section>
  <section v-else class="not-found-ticket"><span class="empty-icon"><Icon name="lucide:ticket-x" /></span><h1>Ticket nicht gefunden</h1><p>Neue Anfragen erscheinen hier, sobald sie gespeichert wurden.</p><NuxtLink class="primary-button" to="/">Zum Posteingang</NuxtLink></section>
</template>
