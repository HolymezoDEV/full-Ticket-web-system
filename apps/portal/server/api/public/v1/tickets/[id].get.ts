import { findTicket, verifyTicketToken } from '../../../../utils/ticket-store'

export default defineEventHandler(async (event) => {
  const ticket = await findTicket(getRouterParam(event, 'id')!)
  const token = getQuery(event).token
  if (!ticket || typeof token !== 'string' || !await verifyTicketToken(ticket, token)) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden oder Zugriffslink ungültig.' })
  }
  return { id: ticket.id, subject: ticket.subject, status: ticket.status, messages: ticket.messages }
})
