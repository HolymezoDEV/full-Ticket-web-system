import { requireUser } from '../../utils/auth'
import { sendMail } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event, 'Admin')
  const result = await sendMail(user.email, 'Testmail von MezoHelpdesk', '<p>Diese Testmail bestätigt, dass der Mailserver von MezoHelpdesk richtig eingerichtet ist.</p>')
  if (!result.ok) throw createError({ statusCode: 502, statusMessage: `Testmail fehlgeschlagen: ${result.error}` })
  return { sentTo: user.email }
})
