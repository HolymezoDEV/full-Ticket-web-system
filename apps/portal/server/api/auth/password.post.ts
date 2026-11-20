import { hashPassword, readUsers, requireUser, saveUsers, verifyPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const me = await requireUser(event)
  const body = await readBody<{ current?: unknown, next?: unknown }>(event)
  const current = typeof body?.current === 'string' ? body.current : ''
  const next = typeof body?.next === 'string' ? body.next : ''
  if (next.length < 10 || next.length > 1024) throw createError({ statusCode: 400, statusMessage: 'Das neue Passwort muss mindestens 10 Zeichen lang sein.' })
  if (!await verifyPassword(current, me.passwordHash)) throw createError({ statusCode: 400, statusMessage: 'Das aktuelle Passwort ist falsch.' })
  const users = await readUsers()
  const user = users.find(item => item.id === me.id)!
  user.passwordHash = await hashPassword(next)
  await saveUsers(users)
  return { ok: true }
})
