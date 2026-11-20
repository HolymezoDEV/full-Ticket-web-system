import { createTicket, customerTicketUrl, portalTicketUrl, sendTicketEmail, supportNotificationEmail } from '../../../../utils/ticket-store'
import { newTicketTeamEmail, ticketCreatedEmail } from '../../../../utils/email-templates'
import { readAppSettings } from '../../../../utils/auth'
import { readTopics } from '../../../../utils/topics'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const category = typeof body?.category === 'string' ? body.category : ''
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (name.length < 2 || name.length > 120) throw createError({ statusCode: 400, statusMessage: 'Bitte gib einen gültigen Namen ein.' })
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  const topics = (await readTopics()).filter(topic => topic.active).map(topic => topic.name)
  if (!topics.includes(category)) throw createError({ statusCode: 400, statusMessage: 'Bitte wähle ein gültiges Thema aus.' })
  if (subject.length < 3 || subject.length > 180) throw createError({ statusCode: 400, statusMessage: 'Der Betreff muss zwischen 3 und 180 Zeichen lang sein.' })
  if (message.length < 10 || message.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Die Nachricht muss zwischen 10 und 10.000 Zeichen lang sein.' })

  const { ticket, accessToken } = await createTicket({ name, email, category, subject, message })
  const ticketUrl = customerTicketUrl(ticket.id, accessToken)
  const { notifyTeamOnNewTicket } = await readAppSettings()
  const [emailSent] = await Promise.all([
    sendTicketEmail(email, ticketCreatedEmail(ticket, message, ticketUrl)),
    notifyTeamOnNewTicket ? sendTicketEmail(await supportNotificationEmail(), newTicketTeamEmail(ticket, message, portalTicketUrl(ticket.id))) : false
  ])
  setResponseStatus(event, 201)
  return { ticketId: ticket.id, emailSent, ticketUrl: emailSent ? undefined : ticketUrl }
})
