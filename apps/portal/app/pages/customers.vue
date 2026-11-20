<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

useSeoMeta({ title: 'Kunden' })

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

type Customer = { email: string, name: string, total: number, open: number, lastActivity: string, lastTicketId: string }

const { tickets } = await useTickets()
const q = ref('')

// Customers are derived from tickets, grouped by email address.
const customers = computed<Customer[]>(() => {
  const map = new Map<string, Customer>()
  for (const ticket of tickets.value) {
    const key = ticket.email.toLowerCase()
    const entry = map.get(key) ?? { email: ticket.email, name: ticket.customer, total: 0, open: 0, lastActivity: ticket.updatedAt, lastTicketId: ticket.id }
    entry.total += 1
    if (ticket.status !== 'Gelöst') entry.open += 1
    if (ticket.updatedAt >= entry.lastActivity) Object.assign(entry, { lastActivity: ticket.updatedAt, lastTicketId: ticket.id, name: ticket.customer })
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
})

const filtered = computed(() => {
  const search = q.value.trim().toLowerCase()
  return search ? customers.value.filter(c => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search)) : customers.value
})

const columns: TableColumn<Customer>[] = [{
  accessorKey: 'name',
  header: 'Name',
  cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
    h(UAvatar, { text: initials(row.original.name), size: 'md' }),
    h('div', { class: 'min-w-0' }, [
      h('p', { class: 'font-medium text-highlighted truncate' }, row.original.name),
      h('p', { class: 'text-muted truncate' }, row.original.email)
    ])
  ])
}, {
  accessorKey: 'total',
  header: 'Tickets'
}, {
  accessorKey: 'open',
  header: 'Offen',
  cell: ({ row }) => row.original.open
    ? h(UBadge, { label: String(row.original.open), color: 'info', variant: 'subtle' })
    : h(UBadge, { label: 'Keine', color: 'neutral', variant: 'subtle' })
}, {
  accessorKey: 'lastActivity',
  header: 'Letzte Aktivität',
  cell: ({ row }) => relativeDate(row.original.lastActivity)
}, {
  id: 'actions',
  meta: { class: { td: 'text-right' } },
  cell: ({ row }) => h(UButton, {
    label: 'Letztes Ticket',
    trailingIcon: 'i-lucide-arrow-right',
    color: 'neutral',
    variant: 'ghost',
    size: 'sm',
    to: { path: '/tickets', query: { id: row.original.lastTicketId } }
  })
}]
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Kunden">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UBadge :label="customers.length" variant="subtle" />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="q"
            icon="i-lucide-search"
            placeholder="Name oder E-Mail suchen …"
            class="max-w-sm"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UTable
        :data="filtered"
        :columns="columns"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      >
        <template #empty>
          <UEmpty icon="i-lucide-users" title="Noch keine Kunden" description="Sobald Tickets eingehen, erscheinen die anfragenden Personen hier." />
        </template>
      </UTable>
    </template>
  </UDashboardPanel>
</template>
