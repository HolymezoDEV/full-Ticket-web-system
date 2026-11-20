import { requirePermission } from '../../utils/permissions'
import { deleteTicket } from '../../utils/ticket-store'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'tickets.delete')
  if (!await deleteTicket(getRouterParam(event, 'id')!)) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht gefunden.' })
  return { ok: true }
})
