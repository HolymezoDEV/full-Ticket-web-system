import { readAppSettings, requireUser } from '../../utils/auth'
import { readMailSettings, toPublicMailSettings } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  await requireUser(event, 'Admin')
  return { app: await readAppSettings(), mail: toPublicMailSettings(await readMailSettings()) }
})
