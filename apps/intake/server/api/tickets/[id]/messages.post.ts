export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string; text?: string }>(event)
  if (typeof body?.token !== 'string' || body.token.length < 32 || typeof body.text !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine gültige Nachricht ein.' })
  }
  const config = useRuntimeConfig()
  try {
    return await $fetch(config.ticketApiUrl + '/' + encodeURIComponent(getRouterParam(event, 'id')!) + '/messages', {
      method: 'POST', body,
    })
  } catch (error) {
    const failure = error as { statusCode?: number; data?: { statusMessage?: string } }
    throw createError({ statusCode: failure.statusCode && failure.statusCode < 500 ? failure.statusCode : 503, statusMessage: failure.data?.statusMessage || 'Nachricht konnte nicht gesendet werden.' })
  }
})
