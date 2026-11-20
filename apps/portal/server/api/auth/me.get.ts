import { getCurrentUser, readAppSettings, readUsers, toPublicUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  const [{ allowRegistration }, users] = await Promise.all([readAppSettings(), readUsers()])
  const hasUsers = users.length > 0
  return { user: user ? toPublicUser(user) : null, registrationOpen: !hasUsers || allowRegistration, hasUsers }
})
