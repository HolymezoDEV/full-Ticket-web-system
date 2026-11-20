import { createTicket, sendTicketEmail, escapeHtml } from '../../../../utils/ticket-store'

const categories = new Set(['Abrechnung', 'Konto & Team', 'Produktfrage', 'Technischer Fehler', 'Sonstiges'])

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const category = typeof body?.category === 'string' ? body.category : ''
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (name.length < 2 || name.length > 120) throw createError({ statusCode: 400, statusMessage: 'Bitte gib einen gültigen Namen ein.' })
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  if (!categories.has(category)) throw createError({ statusCode: 400, statusMessage: 'Bitte wähle ein gültiges Thema aus.' })
  if (subject.length < 3 || subject.length > 180) throw createError({ statusCode: 400, statusMessage: 'Der Betreff muss zwischen 3 und 180 Zeichen lang sein.' })
  if (message.length < 10 || message.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Die Nachricht muss zwischen 10 und 10.000 Zeichen lang sein.' })

  const { ticket, accessToken } = await createTicket({ name, email, category, subject, message })
  const config = useRuntimeConfig()
  const ticketUrl = `${config.public.intakeUrl}/tickets/${encodeURIComponent(ticket.id)}?token=${encodeURIComponent(accessToken)}`
  const emailSent = await sendTicketEmail(email, `Wir haben deine Anfrage erhalten (${ticket.id})`, `<p>Hallo ${escapeHtml(name)},</p><p>deine Anfrage <strong>${escapeHtml(subject)}</strong> wurde unter der Nummer <strong>${escapeHtml(ticket.id)}</strong> angelegt.</p><p>Über den folgenden persönlichen Link kannst du den Verlauf ansehen und weitere Nachrichten hinzufügen:</p><p><a href="${ticketUrl}">Ticket öffnen und Nachricht hinzufügen</a></p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`)
  setResponseStatus(event, 201)
  return { ticketId: ticket.id, emailSent, ticketUrl: emailSent ? undefined : ticketUrl }
})
