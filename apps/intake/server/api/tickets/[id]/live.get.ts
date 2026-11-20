// Passes the portal's live stream for this ticket through to the browser.
export default defineEventHandler(async (event) => {
  const token = getQuery(event).token
  if (typeof token !== 'string' || token.length < 32) throw createError({ statusCode: 404, statusMessage: 'Ticket nicht verfügbar.' })
  const config = useRuntimeConfig()
  const id = encodeURIComponent(getRouterParam(event, 'id')!)

  const controller = new AbortController()
  event.node.req.on('close', () => controller.abort())

  let upstream: Response
  try {
    upstream = await fetch(`${config.ticketApiUrl}/${id}/live?token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'text/event-stream' },
      signal: controller.signal
    })
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Live-Verbindung nicht verfügbar.' })
  }
  if (!upstream.ok || !upstream.body) throw createError({ statusCode: upstream.status === 404 ? 404 : 503, statusMessage: 'Live-Verbindung nicht verfügbar.' })

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  })
  return sendStream(event, upstream.body)
})
