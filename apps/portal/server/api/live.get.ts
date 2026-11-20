import { requirePermission } from '../utils/permissions'
import { streamLive } from '../utils/live'

// Team stream: every ticket event, including customer typing.
export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'tickets.view')
  return streamLive(event, live => live.type === 'typing' && live.userId === user.id ? null : live)
})
