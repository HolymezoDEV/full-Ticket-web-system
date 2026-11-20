<script setup lang="ts">
useSeoMeta({ title: 'Übersicht' })

const { user, can } = useAuth()
const { tickets } = await useTickets()
const isNewTicketOpen = ref(false)

const stats = computed(() => ticketStatuses.map(status => ({
  status,
  count: tickets.value.filter(ticket => ticket.status === status).length,
  icon: { 'Offen': 'i-lucide-inbox', 'In Bearbeitung': 'i-lucide-loader', 'Wartet auf Kunde': 'i-lucide-clock-3', 'Gelöst': 'i-lucide-circle-check' }[status]
})))

const recent = computed(() => [...tickets.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8))

const byCategory = computed(() => {
  const counts = new Map<string, number>()
  for (const ticket of tickets.value) counts.set(ticket.category, (counts.get(ticket.category) ?? 0) + 1)
  const max = Math.max(1, ...counts.values())
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([category, count]) => ({ category, count, share: Math.round(count / max * 100) }))
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend'
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Übersicht">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="can('tickets.create')"
            icon="i-lucide-plus"
            label="Neues Ticket"
            @click="isNewTicketOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          {{ greeting }}, {{ user?.name.split(' ')[0] }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          So steht es gerade um eure Supportanfragen.
        </p>
      </div>

      <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
        <UPageCard
          v-for="stat in stats"
          :key="stat.status"
          :icon="stat.icon"
          :title="stat.status"
          :to="{ path: '/tickets', query: { status: stat.status } }"
          variant="subtle"
          :ui="{
            container: 'gap-y-1.5',
            wrapper: 'items-start',
            leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
            title: 'font-normal text-muted text-xs uppercase'
          }"
          class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
        >
          <span class="text-2xl font-semibold text-highlighted">{{ stat.count }}</span>
        </UPageCard>
      </UPageGrid>

      <div class="grid gap-6 lg:grid-cols-3">
        <UPageCard
          title="Zuletzt aktualisiert"
          variant="subtle"
          class="lg:col-span-2"
          :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'px-4 pt-4 sm:px-6 mb-2' }"
        >
          <ul v-if="recent.length" class="divide-y divide-default">
            <li v-for="ticket in recent" :key="ticket.id">
              <NuxtLink :to="{ path: '/tickets', query: { id: ticket.id } }" class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated/50 sm:px-6">
                <UAvatar :text="initials(ticket.customer)" size="sm" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-highlighted">{{ ticket.subject }}</p>
                  <p class="truncate text-xs text-muted">{{ ticket.id }} · {{ ticket.customer }} · {{ relativeDate(ticket.updatedAt) }}</p>
                </div>
                <UBadge :label="ticket.status" :color="statusColor[ticket.status]" variant="subtle" />
              </NuxtLink>
            </li>
          </ul>
          <UEmpty
            v-else
            icon="i-lucide-inbox"
            title="Noch keine Tickets"
            description="Neue Anfragen aus dem öffentlichen Formular erscheinen hier."
            class="py-12"
          />
        </UPageCard>

        <UPageCard title="Nach Kategorie" variant="subtle">
          <div v-if="byCategory.length" class="flex flex-col gap-4">
            <div v-for="item in byCategory" :key="item.category" class="flex flex-col gap-1.5">
              <div class="flex justify-between text-sm">
                <span class="text-toned">{{ item.category }}</span>
                <span class="font-medium text-highlighted">{{ item.count }}</span>
              </div>
              <UProgress :model-value="item.share" size="sm" />
            </div>
          </div>
          <p v-else class="text-sm text-muted">
            Noch keine Daten.
          </p>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>

  <TicketsNewTicketModal v-model:open="isNewTicketOpen" />
</template>
