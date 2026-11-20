import { authenticate, clientIp, getAuthSession } from '../../utils/auth'
import { describeUser } from '../../utils/permissions'

const attempts = new Map<string, { count: number, startedAt: number }>()

export default defineEventHandler(async (event) => {
  const ip = clientIp(event)
  const now = Date.now()
  const entry = attempts.get(ip)
  if (entry && now - entry.startedAt < 15 * 60_000 && entry.count >= 10) throw createError({ statusCode: 429, statusMessage: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.' })

  const body = await readBody<{ email?: unknown, password?: unknown }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password || password.length > 1024) throw createError({ statusCode: 400, statusMessage: 'Bitte gib E-Mail-Adresse und Passwort ein.' })

  const user = await authenticate(email, password)
  if (!user) {
    if (!entry || now - entry.startedAt >= 15 * 60_000) attempts.set(ip, { count: 1, startedAt: now })
    else entry.count += 1
    throw createError({ statusCode: 401, statusMessage: 'E-Mail-Adresse oder Passwort ist falsch.' })
  }
  attempts.delete(ip)
  const session = await getAuthSession(event)
  await session.clear()
  await session.update({ userId: user.id })
  return { user: await describeUser(user) }
})
