import { requirePermission } from '../../utils/permissions'
import { readTopics, saveTopics, validateTopicInput } from '../../utils/topics'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.topics')
  const id = getRouterParam(event, 'id')
  const input = validateTopicInput(await readBody(event))
  const topics = await readTopics()
  const topic = topics.find(item => item.id === id)
  if (!topic) throw createError({ statusCode: 404, statusMessage: 'Thema nicht gefunden.' })
  if (topics.some(item => item.id !== id && item.name.toLowerCase() === input.name.toLowerCase())) throw createError({ statusCode: 409, statusMessage: 'Dieses Thema gibt es schon.' })
  if (!input.active && topics.filter(item => item.active && item.id !== id).length === 0) throw createError({ statusCode: 409, statusMessage: 'Mindestens ein Thema muss im Formular sichtbar bleiben.' })
  Object.assign(topic, input)
  await saveTopics(topics)
  return topic
})
