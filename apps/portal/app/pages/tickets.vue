<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core'

useSeoMeta({ title: 'Tickets' })

const route = useRoute()
const router = useRouter()
const { user, can } = useAuth()
const { tickets } = await useTickets()
const isNewTicketOpen = ref(false)

const tabItems = [
  { label: 'Aktiv', value: 'active' },
  { label: 'Meine', value: 'mine' },
  { label: 'Wartet', value: 'Wartet auf Kunde' },
  { label: 'Gelöst', value: 'Gelöst' },
  { label: 'Alle', value: 'all' }
]
const initialTab = typeof route.query.status === 'string' ? route.query.status : 'active'
const selectedTab = ref(tabItems.some(tab => tab.value === initialTab) ? initialTab : (ticketStatuses.includes(initialTab as TicketStatus) ? 'all' : 'active'))
const statusFilter = ref<TicketStatus | null>(ticketStatuses.includes(initialTab as TicketStatus) && !tabItems.some(tab => tab.value === initialTab) ? initialTab as TicketStatus : null)
const q = ref('')

const filtered = computed(() => {
  const search = q.value.trim().toLowerCase()
  return tickets.value
    .filter((ticket) => {
      if (statusFilter.value) return ticket.status === statusFilter.value
      if (selectedTab.value === 'active') return ticket.status === 'Offen' || ticket.status === 'In Bearbeitung'
      if (selectedTab.value === 'all') return true
      if (selectedTab.value === 'mine') return ticket.assigneeId === user.value?.id && ticket.status !== 'Gelöst'
      return ticket.status === selectedTab.value
    })
    .filter(ticket => !search || [ticket.id, ticket.subject, ticket.customer, ticket.email, ticket.preview].some(value => value.toLowerCase().includes(search)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})
watch(selectedTab, () => {
  statusFilter.value = null
})

// The selected ticket lives in the URL (?id=) so links and search results can open it.
const selected = computed<Ticket | null>({
  get: () => tickets.value.find(ticket => ticket.id === route.query.id) ?? null,
  set: (ticket) => { router.replace({ query: { ...route.query, id: ticket?.id } }) }
})

const isPanelOpen = computed({
  get: () => !!selected.value,
  set: (value: boolean) => { if (!value) selected.value = null }
})

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')
</script>

<template>
  <UDashboardPanel
    id="tickets-list"
    :default-size="28"
    :min-size="22"
    :max-size="40"
    resizable
  >
    <UDashboardNavbar title="Tickets">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
      <template #trailing>
        <UBadge :label="filtered.length" variant="subtle" />
      </template>
      <template #right>
        <UTooltip v-if="can('tickets.create')" text="Neues Ticket">
          <UButton icon="i-lucide-plus" aria-label="Neues Ticket" @click="isNewTicketOpen = true" />
        </UTooltip>
      </template>
    </UDashboardNavbar>
    <div class="flex flex-col gap-3 border-b border-default px-4 py-3 sm:px-6">
      <UTabs
        v-model="selectedTab"
        :items="tabItems"
        :content="false"
        size="xs"
        class="w-full"
      />
      <UInput
        v-model="q"
        icon="i-lucide-search"
        placeholder="Tickets durchsuchen …"
        class="w-full"
      >
        <template v-if="statusFilter" #trailing>
          <UBadge
            :label="statusFilter"
            variant="subtle"
            size="sm"
            class="cursor-pointer"
            @click="statusFilter = null"
          />
        </template>
      </UInput>
    </div>
    <TicketsTicketList v-model="selected" :tickets="filtered" />
  </UDashboardPanel>

  <TicketsTicketDetail v-if="selected && !isMobile" :ticket="selected" @close="selected = null" />
  <div v-else-if="!isMobile" class="hidden lg:flex flex-1 flex-col items-center justify-center gap-3 text-dimmed">
    <UIcon name="i-lucide-inbox" class="size-24" />
    <p class="text-sm">
      Wähle ein Ticket aus der Liste.
    </p>
  </div>

  <ClientOnly>
    <USlideover v-if="isMobile" v-model:open="isPanelOpen">
      <template #content>
        <TicketsTicketDetail v-if="selected" :ticket="selected" @close="selected = null" />
      </template>
    </USlideover>
  </ClientOnly>

  <TicketsNewTicketModal v-model:open="isNewTicketOpen" />
</template>
