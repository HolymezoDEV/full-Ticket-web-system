import { isValidEmail, readUsers, requireUser, saveUsers } from '../../utils/auth'
import { describeUser } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  const me = await requireUser(event)
  const body = await readBody<{ name?: unknown, email?: unknown }>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (name.length < 2 || name.length > 120) throw createError({ statusCode: 400, statusMessage: 'Bitte gib deinen Namen ein.' })
  if (!isValidEmail(email)) throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
  const users = await readUsers()
  if (users.some(user => user.email === email && user.id !== me.id)) throw createError({ statusCode: 409, statusMessage: 'Diese E-Mail-Adresse wird bereits verwendet.' })
  const user = users.find(item => item.id === me.id)!
  Object.assign(user, { name, email })
  await saveUsers(users)
  return describeUser(user)
})
