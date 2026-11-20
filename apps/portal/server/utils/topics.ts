import { randomUUID } from 'node:crypto'
import { readJson, writeJson } from './auth'

/** Topics ("Themen") customers pick in the contact form. */
export type Topic = { id: string, name: string, description: string, active: boolean }

const DEFAULT_TOPICS: Topic[] = ['Abrechnung', 'Konto & Team', 'Produktfrage', 'Technischer Fehler', 'Sonstiges']
  .map((name, index) => ({ id: `topic-default-${index + 1}`, name, description: '', active: true }))

export const readTopics = async () => (await readJson<Topic[] | null>('topics.json', null)) ?? DEFAULT_TOPICS
export const saveTopics = (topics: Topic[]) => writeJson('topics.json', topics)
export const newTopicId = () => `topic-${randomUUID().slice(0, 8)}`

export function validateTopicInput(body: { name?: unknown, description?: unknown, active?: unknown } | undefined) {
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  if (name.length < 2 || name.length > 60) throw createError({ statusCode: 400, statusMessage: 'Der Name muss 2 bis 60 Zeichen lang sein.' })
  if (description.length > 200) throw createError({ statusCode: 400, statusMessage: 'Die Beschreibung darf höchstens 200 Zeichen lang sein.' })
  return { name, description, active: body?.active !== false }
}
