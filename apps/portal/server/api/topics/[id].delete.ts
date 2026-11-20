import { requirePermission } from '../../utils/permissions'
import { readTopics, saveTopics } from '../../utils/topics'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.topics')
  const id = getRouterParam(event, 'id')
  const topics = await readTopics()
  const next = topics.filter(item => item.id !== id)
  if (next.length === topics.length) throw createError({ statusCode: 404, statusMessage: 'Thema nicht gefunden.' })
  if (!next.some(item => item.active)) throw createError({ statusCode: 409, statusMessage: 'Mindestens ein Thema muss im Formular sichtbar bleiben.' })
  await saveTopics(next)
  return { ok: true }
})
