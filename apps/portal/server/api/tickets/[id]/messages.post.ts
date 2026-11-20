import { requireUser } from '../../../utils/auth'
import { addTicketMessage, findTicket, sendTicketEmail, escapeHtml } from '../../../utils/ticket-store'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ text?: string }>(event)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (text.length < 1 || text.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Die Antwort darf nicht leer sein und höchstens 10.000 Zeichen enthalten.' })
  const existing = await findTicket(id)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })
  const ticket = await addTicketMessage(id, user.name, 'Team', text)
  const emailSent = await sendTicketEmail(ticket!.email, `Neue Antwort zu ${ticket!.id}: ${ticket!.subject}`, `<p>Es gibt eine neue Antwort zu deinem Ticket <strong>${escapeHtml(ticket!.id)}</strong>.</p><p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`)
  const { accessTokenHash: _hash, ...safeTicket } = ticket!
  return { ticket: safeTicket, emailSent }
})
