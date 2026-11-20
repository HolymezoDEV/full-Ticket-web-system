import { readRoles, requirePermission, saveRoles } from '../../utils/permissions'
import { validateRoleInput } from '../../utils/role-input'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.roles')
  const id = getRouterParam(event, 'id')
  const input = validateRoleInput(await readBody(event))
  const roles = await readRoles()
  const role = roles.find(item => item.id === id)
  if (!role) throw createError({ statusCode: 404, statusMessage: 'Rolle nicht gefunden.' })
  if (roles.some(item => item.id !== id && item.name.toLowerCase() === input.name.toLowerCase())) throw createError({ statusCode: 409, statusMessage: 'Eine Rolle mit diesem Namen gibt es schon.' })
  // Admin keeps every permission so nobody can lock the portal.
  Object.assign(role, role.id === 'admin' ? { name: input.name, description: input.description } : input)
  await saveRoles(roles)
  return role
})
