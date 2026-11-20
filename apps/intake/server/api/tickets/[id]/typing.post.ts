export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: unknown }>(event)
  if (typeof body?.token !== 'string' || body.token.length < 32) throw createError({ statusCode: 400, statusMessage: 'Ungültig.' })
  const config = useRuntimeConfig()
  await $fetch(`${config.ticketApiUrl}/${encodeURIComponent(getRouterParam(event, 'id')!)}/typing`, { method: 'POST', body: { token: body.token } }).catch(() => {})
  setResponseStatus(event, 204)
  return null
})
