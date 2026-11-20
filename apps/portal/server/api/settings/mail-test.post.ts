import { requirePermission } from '../../utils/permissions'
import { readMailSettings, sendMail } from '../../utils/mail'
import { testEmail } from '../../utils/email-templates'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'settings.mail')
  const settings = await readMailSettings()
  const content = testEmail({
    recipient: user.email,
    provider: settings.provider === 'smtp' ? 'SMTP' : 'Resend',
    server: settings.provider === 'smtp' ? `${settings.smtp.host}:${settings.smtp.port}` : 'api.resend.com',
    from: settings.from
  })
  const result = await sendMail(user.email, content, settings)
  if (!result.ok) throw createError({ statusCode: 502, statusMessage: `Testmail fehlgeschlagen: ${result.error}` })
  return { sentTo: user.email }
})
