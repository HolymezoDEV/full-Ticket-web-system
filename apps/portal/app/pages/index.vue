<script setup lang="ts">
import type { TicketStatus } from '~/composables/useTickets'

const route = useRoute()
const { tickets, updateStatus } = await useTickets()
const search = shallowRef('')
const selectedId = shallowRef('')
const activeFilter = computed(() => typeof route.query.filter === 'string' ? route.query.filter : 'open')
const filteredTickets = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('de')
  return tickets.value.filter((ticket) => {
    const matchesTerm = !term || [ticket.id, ticket.subject, ticket.customer, ticket.preview].some(value => value.toLocaleLowerCase('de').includes(term))
    if (!matchesTerm) return false
    if (activeFilter.value === 'waiting') return ticket.status === 'Wartet auf Kunde'
    if (activeFilter.value === 'resolved') return ticket.status === 'Gelöst'
    if (activeFilter.value === 'all') return true
    return ticket.status !== 'Gelöst'
  })
})
const selectedTicket = computed(() => tickets.value.find(ticket => ticket.id === selectedId.value) ?? filteredTickets.value[0])
const openCount = computed(() => tickets.value.filter(ticket => ticket.status !== 'Gelöst').length)
const waitingCount = computed(() => tickets.value.filter(ticket => ticket.status === 'Wartet auf Kunde').length)
const resolvedCount = computed(() => tickets.value.filter(ticket => ticket.status === 'Gelöst').length)
const today = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

function statusClass(status: TicketStatus) {
  return { 'status-open': status === 'Offen', 'status-progress': status === 'In Bearbeitung', 'status-waiting': status === 'Wartet auf Kunde', 'status-done': status === 'Gelöst' }
}
async function setTicketStatus(status: TicketStatus) {
  if (selectedTicket.value) await updateStatus(selectedTicket.value.id, status)
}
function initials(name: string) { return name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() }
</script>

<template>
  <section class="welcome-row">
    <div><p class="eyebrow">{{ today }}</p><h1>Holymezo MezoHelpdesk</h1><p class="welcome-copy">Alle Supportanfragen an einem Ort.</p></div>
    <NuxtLink class="primary-button" to="/tickets/new"><Icon name="lucide:plus" /> Ticket erstellen</NuxtLink>
  </section>
  <section class="metric-strip" aria-label="Support-Übersicht">
    <div class="metric-item"><span class="metric-icon metric-inbox"><Icon name="lucide:inbox" /></span><div><strong>{{ openCount }}</strong><span>Offene Tickets</span></div></div>
    <div class="metric-item"><span class="metric-icon metric-alert"><Icon name="lucide:clock-3" /></span><div><strong>{{ waitingCount }}</strong><span>Warten auf Kunde</span></div></div>
    <div class="metric-item"><span class="metric-icon metric-check"><Icon name="lucide:check" /></span><div><strong>{{ resolvedCount }}</strong><span>Gelöst</span></div></div>
  </section>
  <section class="queue-section">
    <div class="queue-heading"><div><h2>Posteingang</h2><span class="queue-total">{{ filteredTickets.length }} Tickets</span></div><label class="search-field"><Icon name="lucide:search" /><input v-model="search" type="search" placeholder="Tickets durchsuchen" aria-label="Tickets durchsuchen"></label></div>
    <div class="queue-tabs" role="tablist" aria-label="Ticketfilter">
      <NuxtLink to="/" role="tab" :aria-selected="activeFilter === 'open'" :class="{ 'queue-tab-active': activeFilter === 'open' }">Offen <span>{{ openCount }}</span></NuxtLink>
      <NuxtLink to="/?filter=waiting" role="tab" :aria-selected="activeFilter === 'waiting'" :class="{ 'queue-tab-active': activeFilter === 'waiting' }">Wartet auf Kunde <span>{{ waitingCount }}</span></NuxtLink>
      <NuxtLink to="/?filter=all" role="tab" :aria-selected="activeFilter === 'all'" :class="{ 'queue-tab-active': activeFilter === 'all' }">Alle Tickets</NuxtLink>
      <NuxtLink to="/?filter=resolved" role="tab" :aria-selected="activeFilter === 'resolved'" :class="{ 'queue-tab-active': activeFilter === 'resolved' }">Gelöst</NuxtLink>
    </div>
    <div class="ticket-workspace">
      <div class="ticket-list" aria-label="Ticketliste">
        <button v-for="ticket in filteredTickets" :key="ticket.id" class="ticket-row" :class="{ 'ticket-row-selected': selectedTicket?.id === ticket.id }" type="button" @click="selectedId = ticket.id">
          <span class="avatar">{{ initials(ticket.customer) }}</span><span class="ticket-row-main"><span class="ticket-row-top"><strong>{{ ticket.customer }}</strong><time>{{ new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ticket.updatedAt)) }}</time></span><span class="ticket-row-subject">{{ ticket.subject }}</span><span class="ticket-row-bottom"><span class="ticket-id">{{ ticket.id }}</span><span class="ticket-preview">{{ ticket.preview }}</span></span></span>
        </button>
        <div v-if="!filteredTickets.length" class="empty-queue"><span class="empty-icon"><Icon name="lucide:inbox" /></span><strong>Keine Tickets vorhanden</strong><span>Neue Anfragen aus dem öffentlichen Formular erscheinen hier automatisch.</span></div>
      </div>
      <article v-if="selectedTicket" class="ticket-preview-panel">
        <div class="preview-panel-header"><div class="ticket-id-line"><span>{{ selectedTicket.id }}</span></div><button class="icon-button more-button" type="button" aria-label="Weitere Ticketaktionen"><Icon name="lucide:ellipsis" /></button></div>
        <h3>{{ selectedTicket.subject }}</h3>
        <div class="requester-line"><span class="avatar avatar-sm">{{ initials(selectedTicket.customer) }}</span><span><strong>{{ selectedTicket.customer }}</strong><small>{{ selectedTicket.email }}</small></span></div>
        <div class="preview-divider" />
        <div class="conversation-preview"><div v-for="message in selectedTicket.messages.slice(-2)" :key="message.id" class="message-block"><div class="message-meta"><span class="avatar avatar-xs">{{ initials(message.author) }}</span><strong>{{ message.author }}</strong><span v-if="message.role === 'Team'" class="team-label-small">Team</span><time>{{ new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.createdAt)) }}</time></div><p>{{ message.text }}</p></div></div>
        <div class="preview-divider" />
        <div class="ticket-meta-grid"><div><span>Status</span><button class="status-pill" :class="statusClass(selectedTicket.status)" type="button" @click="setTicketStatus(selectedTicket.status === 'Gelöst' ? 'Offen' : 'Gelöst')"><i />{{ selectedTicket.status }}<Icon name="lucide:chevron-down" /></button></div><div><span>Zuständig</span><span class="meta-value">{{ selectedTicket.assignee }}</span></div><div><span>Team</span><span class="meta-value"><i class="team-dot team-dot-blue" />Support</span></div><div><span>Kategorie</span><span class="meta-value">{{ selectedTicket.category }}</span></div></div>
        <NuxtLink class="open-ticket-link" :to="`/tickets/${selectedTicket.id}`">Gesamtes Ticket öffnen <Icon name="lucide:arrow-up-right" /></NuxtLink>
      </article>
      <div v-else class="ticket-preview-panel preview-placeholder"><Icon name="lucide:inbox" /><strong>Wähle ein Ticket aus</strong><span>Details und Verlauf erscheinen hier.</span></div>
    </div>
  </section>
</template>
