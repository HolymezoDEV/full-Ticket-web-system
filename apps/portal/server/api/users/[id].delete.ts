import { readUsers, saveUsers } from '../../utils/auth'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  const me = await requirePermission(event, 'settings.team')
  const id = getRouterParam(event, 'id')
  if (id === me.id) throw createError({ statusCode: 409, statusMessage: 'Du kannst dein eigenes Konto hier nicht entfernen.' })
  const users = await readUsers()
  const target = users.find(item => item.id === id)
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Konto nicht gefunden.' })
  if (target.roleId === 'admin' && users.filter(item => item.roleId === 'admin').length === 1) throw createError({ statusCode: 409, statusMessage: 'Das letzte Admin-Konto kann nicht entfernt werden.' })
  await saveUsers(users.filter(item => item.id !== id))
  return { ok: true }
})
