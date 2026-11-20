import { readTopics } from '../../../utils/topics'

// Only names: descriptions are internal notes.
export default defineEventHandler(async () => (await readTopics()).filter(topic => topic.active).map(topic => topic.name))
