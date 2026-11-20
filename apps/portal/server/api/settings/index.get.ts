import { readAppSettings } from '../../utils/auth'
import { hasPermission } from '../../utils/permissions'
import { readMailSettings, toPublicMailSettings } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  const [mail, team] = await Promise.all([hasPermission(event, 'settings.mail'), hasPermission(event, 'settings.team')])
  if (!mail && !team) throw createError({ statusCode: 403, statusMessage: 'Dafür fehlen dir die Berechtigungen.' })
  return { app: await readAppSettings(), mail: mail ? toPublicMailSettings(await readMailSettings()) : null }
})
