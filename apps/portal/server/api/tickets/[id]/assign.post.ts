import { requirePermission } from '../../../utils/permissions'
import { assignTicket, customerTicketUrl, findTicket, issueTicketToken, sendTicketEmail, toSafeTicket } from '../../../utils/ticket-store'
import { ticketAssignedEmail } from '../../../utils/email-templates'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'tickets.assign')
  const id = getRouterParam(event, 'id')!
  const before = await findTicket(id)
  if (!before) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })
  if (before.assigneeId === user.id) return { ticket: toSafeTicket(before), emailSent: false }

  const ticket = (await assignTicket(id, user))!
  // Customers hear about the first takeover; handing over between agents stays internal.
  let emailSent = false
  if (!before.assigneeId && ticket.status !== 'Gelöst') {
    const token = await issueTicketToken(id)
    emailSent = await sendTicketEmail(ticket.email, ticketAssignedEmail(ticket, user.name, customerTicketUrl(id, token!)))
  }
  return { ticket: toSafeTicket((await findTicket(id))!), emailSent }
})
