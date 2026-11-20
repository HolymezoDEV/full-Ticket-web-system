import { requirePermission } from '../../utils/permissions'
import { saveMailSettings, toPublicMailSettings } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.mail')
  return toPublicMailSettings(await saveMailSettings(await readBody(event) ?? {}))
})
