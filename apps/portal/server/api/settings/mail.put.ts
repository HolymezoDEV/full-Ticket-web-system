import { requireUser } from '../../utils/auth'
import { saveMailSettings, toPublicMailSettings } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  await requireUser(event, 'Admin')
  return toPublicMailSettings(await saveMailSettings(await readBody(event) ?? {}))
})
