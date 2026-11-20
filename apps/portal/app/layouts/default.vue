<script setup lang="ts">
import type { CommandPaletteItem, NavigationMenuItem } from '@nuxt/ui'

const config = useRuntimeConfig()
const router = useRouter()
const { can } = useAuth()
const { tickets } = await useTickets()
const settingsLinks = useSettingsLinks()

const open = ref(false)
const close = () => {
  open.value = false
}

const openCount = computed(() => tickets.value.filter(ticket => ticket.status === 'Offen').length)

const links = computed<NavigationMenuItem[][]>(() => [[
  { label: 'Übersicht', icon: 'i-lucide-house', to: '/', onSelect: close },
  ...(can('tickets.view') ? [{ label: 'Tickets', icon: 'i-lucide-inbox', to: '/tickets', badge: openCount.value ? String(openCount.value) : undefined, onSelect: close }] : []),
  ...(can('customers.view') ? [{ label: 'Kunden', icon: 'i-lucide-users', to: '/customers', onSelect: close }] : []),
  {
    label: 'Einstellungen',
    to: '/settings',
    icon: 'i-lucide-settings',
    defaultOpen: true,
    type: 'trigger',
    children: settingsLinks.value.map(({ label, to, exact }) => ({ label, to, exact, onSelect: close }))
  }
], [{
  label: 'Öffentliches Formular',
  icon: 'i-lucide-external-link',
  to: String(config.public.intakeUrl),
  target: '_blank'
}]])

const groups = computed(() => [{
  id: 'links',
  label: 'Gehe zu',
  items: links.value.flat().flatMap(link => link.children ?? [link]).map(link => ({ ...link, label: String(link.label), icon: link.icon ?? 'i-lucide-arrow-right' })) as CommandPaletteItem[]
}, {
  id: 'tickets',
  label: 'Tickets',
  items: tickets.value.map(ticket => ({
    id: ticket.id,
    label: ticket.subject,
    suffix: `${ticket.id} · ${ticket.customer}`,
    icon: 'i-lucide-ticket',
    onSelect: () => router.push({ path: '/tickets', query: { id: ticket.id } })
  }))
}])

// Live updates: new tickets, messages and typing appear without reloading.
const live = useLive()
onMounted(() => {
  if (can('tickets.view')) live.connect()
})
onBeforeUnmount(() => live.disconnect())

defineShortcuts({
  'g-h': () => router.push('/'),
  'g-t': () => router.push('/tickets'),
  'g-k': () => router.push('/customers'),
  'g-s': () => router.push('/settings')
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-center gap-2.5 px-1.5 py-2 min-w-0" @click="close">
          <span class="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-inverted">
            <UIcon name="i-lucide-life-buoy" class="size-4" />
          </span>
          <span v-if="!collapsed" class="min-w-0 leading-tight">
            <span class="block truncate text-sm font-semibold text-highlighted">Holymezo</span>
            <span class="block truncate text-xs text-muted">MezoHelpdesk</span>
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" label="Suchen …" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" placeholder="Tickets und Seiten durchsuchen …" />

    <slot />
  </UDashboardGroup>
</template>
