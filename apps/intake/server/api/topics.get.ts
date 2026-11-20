export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const base = config.ticketApiUrl.replace(/\/tickets\/?$/, '')
  try {
    return await $fetch<string[]>(`${base}/topics`)
  } catch (error) {
    console.error('Topics are unavailable:', error)
    throw createError({ statusCode: 503, statusMessage: 'Die Themen konnten nicht geladen werden.' })
  }
})
