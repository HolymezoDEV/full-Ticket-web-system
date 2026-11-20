import { readUsers, toPublicUser } from '../../utils/auth'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.team')
  return (await readUsers()).map(toPublicUser)
})
