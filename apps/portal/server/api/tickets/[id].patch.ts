import { requirePermission } from '../../utils/permissions'
import { customerTicketUrl, issueTicketToken, sendTicketEmail, toSafeTicket, updateTicketStatus, type TicketStatus } from '../../utils/ticket-store'
import { ticketClosedEmail } from '../../utils/email-templates'
import { ticketTranscriptPdf } from '../../utils/transcript'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'tickets.status')
  const body = await readBody<{ status?: TicketStatus }>(event)
  const allowed: TicketStatus[] = ['Offen', 'In Bearbeitung', 'Wartet auf Kunde', 'Gelöst']
  if (!body?.status || !allowed.includes(body.status)) throw createError({ statusCode: 400, statusMessage: 'Ungültiger Ticketstatus.' })
  const id = getRouterParam(event, 'id')!
  const result = await updateTicketStatus(id, body.status)
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })

  // Closing sends the customer a final mail with the full transcript as PDF.
  let emailSent: boolean | undefined
  if (body.status === 'Gelöst' && result.previous !== 'Gelöst') {
    const token = await issueTicketToken(id)
    const pdf = await ticketTranscriptPdf(result.ticket)
    emailSent = await sendTicketEmail(result.ticket.email, ticketClosedEmail(result.ticket, user.name, customerTicketUrl(id, token!), {
      filename: `Transkript-${id}.pdf`, content: pdf, contentType: 'application/pdf'
    }))
  }
  return { ticket: toSafeTicket(result.ticket), emailSent }
})
