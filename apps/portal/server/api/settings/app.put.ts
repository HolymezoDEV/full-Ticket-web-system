import { readAppSettings, saveAppSettings } from '../../utils/auth'
import { hasPermission, readRoles } from '../../utils/permissions'

// Team settings and mail notification rules live in one file but need different permissions.
export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event) ?? {}
  const settings = await readAppSettings()
  const teamKeys = ['allowRegistration', 'defaultRoleId'].filter(key => key in body)
  const mailKeys = ['notifyTeamOnNewTicket', 'notifyTeamOnCustomerMessage'].filter(key => key in body)
  if (!teamKeys.length && !mailKeys.length) throw createError({ statusCode: 400, statusMessage: 'Keine Änderung angegeben.' })
  if (teamKeys.length && !await hasPermission(event, 'settings.team')) throw createError({ statusCode: 403, statusMessage: 'Dafür fehlen dir die Berechtigungen.' })
  if (mailKeys.length && !await hasPermission(event, 'settings.mail')) throw createError({ statusCode: 403, statusMessage: 'Dafür fehlen dir die Berechtigungen.' })

  if ('allowRegistration' in body) settings.allowRegistration = body.allowRegistration === true
  if ('defaultRoleId' in body) {
    const role = (await readRoles()).find(item => item.id === body.defaultRoleId)
    if (!role) throw createError({ statusCode: 400, statusMessage: 'Unbekannte Rolle.' })
    if (role.id === 'admin') throw createError({ statusCode: 400, statusMessage: 'Neue Konten können nicht automatisch Admin werden.' })
    settings.defaultRoleId = role.id
  }
  if ('notifyTeamOnNewTicket' in body) settings.notifyTeamOnNewTicket = body.notifyTeamOnNewTicket === true
  if ('notifyTeamOnCustomerMessage' in body) settings.notifyTeamOnCustomerMessage = body.notifyTeamOnCustomerMessage === true
  await saveAppSettings(settings)
  return settings
})
