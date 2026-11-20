import { isPermission, type Permission } from './permissions'

export function validateRoleInput(body: { name?: unknown, description?: unknown, permissions?: unknown } | undefined) {
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  if (name.length < 2 || name.length > 40) throw createError({ statusCode: 400, statusMessage: 'Der Rollenname muss 2 bis 40 Zeichen lang sein.' })
  if (description.length > 160) throw createError({ statusCode: 400, statusMessage: 'Die Beschreibung darf höchstens 160 Zeichen lang sein.' })
  if (!Array.isArray(body?.permissions)) throw createError({ statusCode: 400, statusMessage: 'Ungültige Berechtigungen.' })
  const permissions = [...new Set(body.permissions.filter(isPermission))] as Permission[]
  return { name, description, permissions }
}
