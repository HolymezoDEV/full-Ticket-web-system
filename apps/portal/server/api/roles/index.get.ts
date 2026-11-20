import { readUsers } from '../../utils/auth'
import { hasPermission, PERMISSIONS, readRoles } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  if (!await hasPermission(event, 'settings.roles') && !await hasPermission(event, 'settings.team')) {
    throw createError({ statusCode: 403, statusMessage: 'Dafür fehlen dir die Berechtigungen.' })
  }
  const [roles, users] = await Promise.all([readRoles(), readUsers()])
  return {
    roles: roles.map(role => ({ ...role, members: users.filter(user => user.roleId === role.id).length })),
    permissions: Object.entries(PERMISSIONS).map(([id, info]) => ({ id, ...info }))
  }
})
