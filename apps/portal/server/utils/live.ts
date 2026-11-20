import { EventEmitter } from 'node:events'
import type { H3Event } from 'h3'

/**
 * In-process event bus for live updates (new messages, status changes, typing).
 * Like the JSON file storage, it assumes a single running server process.
 */
export type LiveEvent
  = | { type: 'ticket', ticketId: string, action: 'created' | 'message' | 'updated' | 'deleted', by?: 'Team' | 'Kunde' }
    | { type: 'typing', ticketId: string, who: 'Team' | 'Kunde', name: string, userId?: string }

const bus = new EventEmitter()
bus.setMaxListeners(0)

export const publishLive = (event: LiveEvent) => bus.emit('event', event)

/** Streams live events as SSE; `filter` decides what this subscriber may see. */
export function streamLive(event: H3Event, filter: (live: LiveEvent) => LiveEvent | null) {
  const stream = createEventStream(event)
  const listener = (live: LiveEvent) => {
    const visible = filter(live)
    if (visible) stream.push({ event: visible.type, data: JSON.stringify(visible) }).catch(() => {})
  }
  bus.on('event', listener)
  // Keeps proxies from closing an idle connection.
  const heartbeat = setInterval(() => stream.push({ event: 'ping', data: '{}' }).catch(() => {}), 25_000)
  stream.onClosed(async () => {
    bus.off('event', listener)
    clearInterval(heartbeat)
    await stream.close()
  })
  setHeader(event, 'X-Accel-Buffering', 'no')
  return stream.send()
}
