import { readAppSettings, requireUser, writeJson } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event, 'Admin')
  const body = await readBody<{ allowRegistration?: unknown }>(event)
  const settings = { ...(await readAppSettings()), allowRegistration: body?.allowRegistration === true }
  await writeJson('app-settings.json', settings)
  return settings
})
