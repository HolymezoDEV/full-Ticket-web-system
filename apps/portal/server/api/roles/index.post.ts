import { newRoleId, readRoles, requirePermission, saveRoles } from '../../utils/permissions'
import { validateRoleInput } from '../../utils/role-input'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.roles')
  const input = validateRoleInput(await readBody(event))
  const roles = await readRoles()
  if (roles.some(role => role.name.toLowerCase() === input.name.toLowerCase())) throw createError({ statusCode: 409, statusMessage: 'Eine Rolle mit diesem Namen gibt es schon.' })
  const role = { id: newRoleId(), ...input }
  await saveRoles([...roles, role])
  setResponseStatus(event, 201)
  return role
})
