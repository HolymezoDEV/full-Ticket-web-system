import { requirePermission } from '../../utils/permissions'
import { newTopicId, readTopics, saveTopics, validateTopicInput } from '../../utils/topics'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.topics')
  const input = validateTopicInput(await readBody(event))
  const topics = await readTopics()
  if (topics.some(topic => topic.name.toLowerCase() === input.name.toLowerCase())) throw createError({ statusCode: 409, statusMessage: 'Dieses Thema gibt es schon.' })
  const topic = { id: newTopicId(), ...input }
  await saveTopics([...topics, topic])
  setResponseStatus(event, 201)
  return topic
})
