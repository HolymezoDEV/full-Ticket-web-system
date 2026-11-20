export type TicketStatus = 'Offen' | 'In Bearbeitung' | 'Wartet auf Kunde' | 'Gelöst'
export type TicketMessage = { id: string, author: string, role: 'Team' | 'Kunde', text: string, createdAt: string }
export type Ticket = {
  id: string
  subject: string
  customer: string
  email: string
  preview: string
  status: TicketStatus
  priority: 'Normal'
  category: string
  assignee: string
  assigneeId?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

export const ticketStatuses: TicketStatus[] = ['Offen', 'In Bearbeitung', 'Wartet auf Kunde', 'Gelöst']

export const statusColor = {
  'Offen': 'info',
  'In Bearbeitung': 'warning',
  'Wartet auf Kunde': 'neutral',
  'Gelöst': 'success'
} as const satisfies Record<TicketStatus, string>

export async function useTickets() {
  const { can } = useAuth()
  const { data, refresh, status } = await useFetch<Ticket[]>('/api/tickets', { key: 'tickets', default: () => [], immediate: can('tickets.view') })
  const tickets = computed(() => data.value ?? [])

  const path = (id: string) => `/api/tickets/${encodeURIComponent(id)}`

  async function updateStatus(id: string, next: TicketStatus) {
    const result = await $fetch<{ emailSent?: boolean }>(path(id), { method: 'PATCH', body: { status: next } })
    await refresh()
    return result
  }

  async function addReply(id: string, text: string, notify: boolean) {
    const result = await $fetch<{ emailSent: boolean, notified: boolean }>(`${path(id)}/messages`, { method: 'POST', body: { text, notify } })
    await refresh()
    return result
  }

  async function assign(id: string) {
    const result = await $fetch<{ emailSent: boolean }>(`${path(id)}/assign`, { method: 'POST' })
    await refresh()
    return result
  }

  async function remove(id: string) {
    await $fetch(path(id), { method: 'DELETE' })
    await refresh()
  }

  async function createTicket(input: { subject: string, message: string, name: string, email: string, category: string }) {
    const result = await $fetch<{ ticketId: string, emailSent: boolean }>('/api/public/v1/tickets', { method: 'POST', body: input })
    await refresh()
    return result
  }

  return { tickets, status, refresh, updateStatus, addReply, assign, remove, createTicket }
}

export type Topic = { id: string, name: string, description: string, active: boolean }

/** Topics for the new-ticket form; only active ones are offered. */
export async function useTopics() {
  const { data, refresh } = await useFetch<Topic[]>('/api/topics', { key: 'topics', default: () => [] })
  const active = computed(() => data.value.filter(topic => topic.active).map(topic => topic.name))
  return { topics: data, active, refresh }
}
