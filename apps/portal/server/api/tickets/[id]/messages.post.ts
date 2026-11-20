import { requirePermission } from '../../../utils/permissions'
import { addTicketMessage, customerTicketUrl, findTicket, issueTicketToken, sendTicketEmail, toSafeTicket } from '../../../utils/ticket-store'
import { teamReplyEmail } from '../../../utils/email-templates'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'tickets.reply')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ text?: string, notify?: boolean }>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (text.length < 1 || text.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Die Antwort darf nicht leer sein und höchstens 10.000 Zeichen enthalten.' })
  if (!await findTicket(id)) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })

  const ticket = (await addTicketMessage(id, user.name, 'Team', text))!
  // Only replies marked as relevant go out by email; the rest is visible via the ticket link.
  let emailSent = false
  if (body?.notify === true) {
    const token = await issueTicketToken(id)
    const reply = ticket.messages[ticket.messages.length - 1]!
    emailSent = await sendTicketEmail(ticket.email, teamReplyEmail(ticket, reply, customerTicketUrl(id, token!)))
  }
  return { ticket: toSafeTicket((await findTicket(id))!), emailSent, notified: body?.notify === true }
})
