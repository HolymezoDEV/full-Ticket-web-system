import { createUser, getAuthSession, readAppSettings, readUsers, toPublicUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const hasUsers = (await readUsers()).length > 0
  if (hasUsers && !(await readAppSettings()).allowRegistration) throw createError({ statusCode: 403, statusMessage: 'Die Registrierung ist deaktiviert. Bitte wende dich an eine Administratorin oder einen Administrator.' })

  const body = await readBody<{ name?: unknown; email?: unknown; password?: unknown }>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (name.length < 2 || name.length > 120) throw createError({ statusCode: 400, statusMessage: 'Bitte gib deinen Namen ein.' })
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  if (password.length < 10 || password.length > 1024) throw createError({ statusCode: 400, statusMessage: 'Das Passwort muss mindestens 10 Zeichen lang sein.' })

  const user = await createUser({ name, email, password })
  if (!user) throw createError({ statusCode: 409, statusMessage: 'Für diese E-Mail-Adresse gibt es bereits ein Konto.' })
  const session = await getAuthSession(event)
  await session.clear()
  await session.update({ userId: user.id })
  setResponseStatus(event, 201)
  return { user: toPublicUser(user) }
})
