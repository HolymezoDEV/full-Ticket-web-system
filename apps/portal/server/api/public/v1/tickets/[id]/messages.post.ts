import { addTicketMessage, findTicket, verifyTicketToken, sendTicketEmail, supportNotificationEmail, escapeHtml } from '../../../../../utils/ticket-store'

export default defineEventHandler(async (event) => {
  const ticket = await findTicket(getRouterParam(event, 'id')!)
  const body = await readBody<{ token?: string; text?: string }>(event)
  if (!ticket || typeof body?.token !== 'string' || !await verifyTicketToken(ticket, body.token)) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden oder Zugriffslink ungültig.' })
  }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (text.length < 1 || text.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Die Nachricht darf nicht leer sein und höchstens 10.000 Zeichen enthalten.' })
  const updated = await addTicketMessage(ticket.id, ticket.customer, 'Kunde', text)
  await sendTicketEmail(await supportNotificationEmail(), `Neue Nachricht zu ${ticket.id}: ${ticket.subject}`, `<p>${escapeHtml(ticket.customer)} hat eine Nachricht zu <strong>${escapeHtml(ticket.id)}</strong> hinzugefügt.</p><p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`)
  return { id: updated!.id, subject: updated!.subject, status: updated!.status, messages: updated!.messages }
})
