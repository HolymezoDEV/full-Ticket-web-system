export type TicketStatus = 'Offen' | 'In Bearbeitung' | 'Wartet auf Kunde' | 'Gelöst'
export type TicketMessage = { id: string; author: string; role: 'Team' | 'Kunde'; text: string; createdAt: string }
export type Ticket = {
  id: string; subject: string; customer: string; email: string; preview: string; status: TicketStatus
  priority: 'Normal'; category: string; assignee: string; createdAt: string; updatedAt: string
  messages: TicketMessage[]
}

export async function useTickets() {
  const { data, refresh } = await useFetch<Ticket[]>('/api/tickets', { key: 'holymezo-tickets', default: () => [] })
  const tickets = computed(() => data.value ?? [])

  async function updateStatus(id: string, status: TicketStatus) {
    await $fetch(`/api/tickets/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } })
    await refresh()
  }

  async function addReply(id: string, text: string) {
    const result = await $fetch<{ emailSent: boolean }>(`/api/tickets/${encodeURIComponent(id)}/messages`, { method: 'POST', body: { text } })
    await refresh()
    return result.emailSent
  }

  async function createTicket(input: { subject: string; message: string; name: string; email: string; category: string }) {
    const result = await $fetch<{ ticketId: string }>('/api/public/v1/tickets', { method: 'POST', body: input })
    await refresh()
    return result.ticketId
  }

  return { tickets, refresh, updateStatus, addReply, createTicket }
}
