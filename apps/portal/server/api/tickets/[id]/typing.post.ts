import { requirePermission } from '../../../utils/permissions'
import { publishLive } from '../../../utils/live'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'tickets.reply')
  publishLive({ type: 'typing', ticketId: getRouterParam(event, 'id')!, who: 'Team', name: user.name, userId: user.id })
  setResponseStatus(event, 204)
  return null
})
