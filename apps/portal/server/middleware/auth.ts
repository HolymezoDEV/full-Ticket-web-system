import { getCurrentUser } from '../utils/auth'

// Everything under /api needs a signed-in team member, except the public
// intake API (used by apps/intake) and the auth endpoints themselves.
const open = ['/api/public/', '/api/auth/', '/api/_']

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]!
  if (!path.startsWith('/api/') || open.some(prefix => path.startsWith(prefix))) return
  if (!await getCurrentUser(event)) throw createError({ statusCode: 401, statusMessage: 'Bitte melde dich an.' })
})
