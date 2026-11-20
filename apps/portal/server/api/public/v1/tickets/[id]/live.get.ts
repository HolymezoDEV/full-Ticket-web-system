import { findTicket, verifyTicketToken } from '../../../../../utils/ticket-store'
import { streamLive } from '../../../../../utils/live'

// Customer stream: only this ticket, and never the customer's own typing.
export default defineEventHandler(async (event) => {
  const ticket = await findTicket(getRouterParam(event, 'id')!)
  const token = getQuery(event).token
  if (!ticket || typeof token !== 'string' || !await verifyTicketToken(ticket, token)) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })
  }
  return streamLive(event, (live) => {
    if (live.ticketId !== ticket.id) return null
    if (live.type === 'typing') return live.who === 'Team' ? { type: 'typing', ticketId: live.ticketId, who: 'Team', name: 'Holymezo Support' } : null
    return live
  })
})
