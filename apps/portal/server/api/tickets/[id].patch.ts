import { updateTicketStatus, type TicketStatus } from '../../utils/ticket-store'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ status?: TicketStatus }>(event)
  const allowed: TicketStatus[] = ['Offen', 'In Bearbeitung', 'Wartet auf Kunde', 'Gelöst']
  if (!body?.status || !allowed.includes(body.status)) throw createError({ statusCode: 400, statusMessage: 'Ungültiger Ticketstatus.' })
  const ticket = await updateTicketStatus(getRouterParam(event, 'id')!, body.status)
  if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })
  const { accessTokenHash: _hash, ...safeTicket } = ticket
  return safeTicket
})
