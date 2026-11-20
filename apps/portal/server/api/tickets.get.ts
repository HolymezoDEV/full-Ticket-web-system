import { readTickets } from '../utils/ticket-store'

export default defineEventHandler(async () => {
  const tickets = await readTickets()
  return tickets.map(({ accessTokenHash: _hash, ...ticket }) => ticket)
})
