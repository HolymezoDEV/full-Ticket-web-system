export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getQuery(event).token
  if (typeof token !== 'string' || token.length < 32) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht verfügbar.' })
  try {
    return await $fetch(config.ticketApiUrl + '/' + encodeURIComponent(getRouterParam(event, 'id')!), { query: { token } })
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Ticket nicht verfügbar.' })
  }
})
