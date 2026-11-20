import { addTicketMessage, findTicket, portalTicketUrl, sendTicketEmail, supportNotificationEmail, verifyTicketToken } from '../../../../../utils/ticket-store'
import { customerMessageEmail } from '../../../../../utils/email-templates'
import { readAppSettings } from '../../../../../utils/auth'

export default defineEventHandler(async (event) => {
  const ticket = await findTicket(getRouterParam(event, 'id')!)
  const body = await readBody<{ token?: string, text?: string }>(event)
  if (!ticket || typeof body?.token !== 'string' || !await verifyTicketToken(ticket, body.token)) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden oder Zugriffslink ungültig.' })
  }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (text.length < 1 || text.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Die Nachricht darf nicht leer sein und höchstens 10.000 Zeichen enthalten.' })
  const updated = (await addTicketMessage(ticket.id, ticket.customer, 'Kunde', text))!
  if ((await readAppSettings()).notifyTeamOnCustomerMessage) {
    await sendTicketEmail(await supportNotificationEmail(), customerMessageEmail(updated, text, portalTicketUrl(ticket.id)))
  }
  return { id: updated.id, subject: updated.subject, status: updated.status, messages: updated.messages }
})
