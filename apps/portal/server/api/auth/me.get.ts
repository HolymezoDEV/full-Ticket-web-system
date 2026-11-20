import { getCurrentUser, readAppSettings, readUsers } from '../../utils/auth'
import { describeUser } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  const [{ allowRegistration }, users] = await Promise.all([readAppSettings(), readUsers()])
  const hasUsers = users.length > 0
  return { user: user ? await describeUser(user) : null, registrationOpen: !hasUsers || allowRegistration, hasUsers }
})
