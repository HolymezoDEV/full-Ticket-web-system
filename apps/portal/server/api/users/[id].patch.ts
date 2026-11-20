import { readUsers, saveUsers, toPublicUser } from '../../utils/auth'
import { readRoles, requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.team')
  const body = await readBody<{ roleId?: unknown }>(event)
  const roles = await readRoles()
  if (typeof body?.roleId !== 'string' || !roles.some(role => role.id === body.roleId)) throw createError({ statusCode: 400, statusMessage: 'Unbekannte Rolle.' })
  const users = await readUsers()
  const user = users.find(item => item.id === getRouterParam(event, 'id'))
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Konto nicht gefunden.' })
  if (user.roleId === 'admin' && body.roleId !== 'admin' && users.filter(item => item.roleId === 'admin').length === 1) {
    throw createError({ statusCode: 409, statusMessage: 'Es muss mindestens ein Konto mit der Rolle Admin bleiben.' })
  }
  user.roleId = body.roleId
  await saveUsers(users)
  return toPublicUser(user)
})
