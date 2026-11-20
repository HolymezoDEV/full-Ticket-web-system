import { requirePermission } from '../utils/permissions'
import { readTickets, toSafeTicket } from '../utils/ticket-store'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'tickets.view')
  return (await readTickets()).map(toSafeTicket)
})
