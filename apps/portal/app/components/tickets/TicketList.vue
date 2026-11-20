<script setup lang="ts">
const props = defineProps<{ tickets: Ticket[] }>()
const selected = defineModel<Ticket | null>()
const { typing } = useLive()

const refs = ref<Record<string, Element | null>>({})

watch(selected, () => {
  if (selected.value) refs.value[selected.value.id]?.scrollIntoView({ block: 'nearest' })
})

defineShortcuts({
  arrowdown: () => {
    const index = props.tickets.findIndex(ticket => ticket.id === selected.value?.id)
    if (index === -1) selected.value = props.tickets[0]
    else if (index < props.tickets.length - 1) selected.value = props.tickets[index + 1]
  },
  arrowup: () => {
    const index = props.tickets.findIndex(ticket => ticket.id === selected.value?.id)
    if (index === -1) selected.value = props.tickets[props.tickets.length - 1]
    else if (index > 0) selected.value = props.tickets[index - 1]
  }
})
</script>

<template>
  <div v-if="tickets.length" class="overflow-y-auto divide-y divide-default">
    <div
      v-for="ticket in tickets"
      :key="ticket.id"
      :ref="(el) => { refs[ticket.id] = el as Element | null }"
    >
      <button
        type="button"
        class="block w-full p-4 sm:px-6 text-left text-sm border-l-2 transition-colors"
        :class="[
          ticket.status === 'Offen' ? 'text-highlighted' : 'text-toned',
          selected?.id === ticket.id ? 'border-primary bg-primary/10' : 'border-bg hover:border-primary hover:bg-primary/5'
        ]"
        @click="selected = ticket"
      >
        <div class="flex items-center justify-between gap-3" :class="[ticket.status === 'Offen' && 'font-semibold']">
          <div class="flex min-w-0 items-center gap-3">
            <span class="truncate">{{ ticket.customer }}</span>
            <UChip v-if="ticket.status === 'Offen'" />
          </div>
          <span class="shrink-0 text-xs text-muted">{{ shortDate(ticket.updatedAt) }}</span>
        </div>
        <p class="truncate" :class="[ticket.status === 'Offen' && 'font-semibold']">
          {{ ticket.subject }}
        </p>
        <div class="mt-1 flex items-center gap-2">
          <UBadge
            :label="ticket.status"
            :color="statusColor[ticket.status]"
            variant="subtle"
            size="sm"
          />
          <UTooltip v-if="ticket.assigneeId" :text="`Bearbeitet von ${ticket.assignee}`">
            <UAvatar :text="initials(ticket.assignee)" size="3xs" class="shrink-0" />
          </UTooltip>
          <span v-if="typing[ticket.id]" class="truncate text-primary">{{ typing[ticket.id]!.name }} schreibt …</span>
          <span v-else class="truncate text-dimmed">{{ ticket.preview }}</span>
        </div>
      </button>
    </div>
  </div>
  <UEmpty
    v-else
    icon="i-lucide-inbox"
    title="Keine Tickets"
    description="In dieser Ansicht gibt es gerade nichts zu tun."
    class="py-16"
  />
</template>
