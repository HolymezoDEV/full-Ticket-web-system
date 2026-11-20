import { findTicket, verifyTicketToken } from '../../../../../utils/ticket-store'
import { publishLive } from '../../../../../utils/live'

export default defineEventHandler(async (event) => {
  const ticket = await findTicket(getRouterParam(event, 'id')!)
  const body = await readBody<{ token?: unknown }>(event)
  if (!ticket || typeof body?.token !== 'string' || !await verifyTicketToken(ticket, body.token)) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })
  }
  publishLive({ type: 'typing', ticketId: ticket.id, who: 'Kunde', name: ticket.customer })
  setResponseStatus(event, 204)
  return null
})
