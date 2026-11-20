interface IntakePayload { name?: unknown, email?: unknown, category?: unknown, subject?: unknown, message?: unknown, website?: unknown }
const windows = new Map<string, { count: number, startedAt: number }>()

export default defineEventHandler(async (event) => {
  const size = Number(getRequestHeader(event, 'content-length') || 0)
  if (size > 16_000) throw createError({ statusCode: 413, statusMessage: 'Die Anfrage ist zu groß.' })
  const trustProxy = String(useRuntimeConfig().trustProxy) === 'true'
  const ip = getRequestIP(event, { xForwardedFor: trustProxy }) || 'unknown'
  const now = Date.now()
  const current = windows.get(ip)
  if (current && now - current.startedAt < 60_000 && current.count >= 5) throw createError({ statusCode: 429, statusMessage: 'Zu viele Anfragen. Bitte warte eine Minute.' })
  if (!current || now - current.startedAt >= 60_000) windows.set(ip, { count: 1, startedAt: now })
  else current.count += 1

  const body = await readBody<IntakePayload>(event)
  if (typeof body?.website === 'string' && body.website.trim()) {
    setResponseStatus(event, 202)
    return { ticketId: '', emailSent: false, spam: true }
  }
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const category = typeof body?.category === 'string' ? body.category : ''
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (name.length < 2 || name.length > 120) throw createError({ statusCode: 400, statusMessage: 'Bitte gib einen gültigen Namen ein.' })
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  // The portal checks the topic against its current list.
  if (!category || category.length > 60) throw createError({ statusCode: 400, statusMessage: 'Bitte wähle ein gültiges Thema aus.' })
  if (subject.length < 3 || subject.length > 180) throw createError({ statusCode: 400, statusMessage: 'Der Betreff muss zwischen 3 und 180 Zeichen lang sein.' })
  if (message.length < 10 || message.length > 10_000) throw createError({ statusCode: 400, statusMessage: 'Die Nachricht muss zwischen 10 und 10.000 Zeichen lang sein.' })

  const config = useRuntimeConfig()
  try {
    const result = await $fetch<{ ticketId: string, emailSent: boolean, ticketUrl?: string }>(config.ticketApiUrl, {
      method: 'POST', body: { name, email, category, subject, message }
    })
    setResponseStatus(event, 201)
    return result
  } catch (error) {
    const failure = error as { statusCode?: number, data?: { statusMessage?: string } }
    if (failure.statusCode && failure.statusCode < 500) throw createError({ statusCode: failure.statusCode, statusMessage: failure.data?.statusMessage || 'Bitte prüfe deine Eingaben.' })
    console.error('Ticket service is unavailable:', error)
    throw createError({ statusCode: 503, statusMessage: 'Der Ticketdienst ist gerade nicht erreichbar. Bitte versuche es später erneut.' })
  }
})
