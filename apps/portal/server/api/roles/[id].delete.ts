import { readAppSettings, readUsers } from '../../utils/auth'
import { readRoles, requirePermission, saveRoles } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.roles')
  const id = getRouterParam(event, 'id')
  if (id === 'admin') throw createError({ statusCode: 409, statusMessage: 'Die Admin-Rolle kann nicht gelöscht werden.' })
  const roles = await readRoles()
  if (!roles.some(role => role.id === id)) throw createError({ statusCode: 404, statusMessage: 'Rolle nicht gefunden.' })
  const members = (await readUsers()).filter(user => user.roleId === id).length
  if (members) throw createError({ statusCode: 409, statusMessage: `Diese Rolle ist noch ${members === 1 ? 'einem Konto' : `${members} Konten`} zugewiesen. Weise vorher eine andere Rolle zu.` })
  if ((await readAppSettings()).defaultRoleId === id) throw createError({ statusCode: 409, statusMessage: 'Das ist die Standardrolle für neue Konten. Wähle unter Team zuerst eine andere.' })
  await saveRoles(roles.filter(role => role.id !== id))
  return { ok: true }
})
