import { createSharedComposable, useDebounceFn, useIntervalFn, useThrottleFn } from '@vueuse/core'

type LiveTicketEvent = { type: 'ticket', ticketId: string, action: 'created' | 'message' | 'updated' | 'deleted', by?: 'Team' | 'Kunde' }
type LiveTypingEvent = { type: 'typing', ticketId: string, who: 'Team' | 'Kunde', name: string }

const TYPING_VISIBLE_MS = 4500

/**
 * One live connection per browser tab. Ticket events refresh the ticket data in
 * place; typing events feed the "… schreibt" indicator.
 */
const _useLive = () => {
  const typing = ref<Record<string, { who: 'Team' | 'Kunde', name: string, until: number }>>({})
  const connected = ref(false)
  const sounds = useSounds()
  let source: EventSource | undefined

  // Several events in a burst (e.g. reply + status change) cause one refetch.
  const refreshTickets = useDebounceFn(() => refreshNuxtData('tickets'), 150)

  function onTicket(event: MessageEvent) {
    const data = JSON.parse(event.data) as LiveTicketEvent
    if (data.action === 'message') {
      const { [data.ticketId]: _removed, ...rest } = typing.value
      typing.value = rest
      // Team replies are already heard by the sender; only customer messages chime.
      if (data.by === 'Kunde') sounds.play('message')
    }
    if (data.action === 'created') sounds.play('ticket')
    refreshTickets()
  }

  function onTyping(event: MessageEvent) {
    const data = JSON.parse(event.data) as LiveTypingEvent
    typing.value = { ...typing.value, [data.ticketId]: { who: data.who, name: data.name, until: Date.now() + TYPING_VISIBLE_MS } }
  }

  // Expire indicators when no new keystroke arrives.
  useIntervalFn(() => {
    const now = Date.now()
    const entries = Object.entries(typing.value).filter(([, value]) => value.until > now)
    if (entries.length !== Object.keys(typing.value).length) typing.value = Object.fromEntries(entries)
  }, 1000)

  function connect() {
    if (source || import.meta.server) return
    source = new EventSource('/api/live')
    source.addEventListener('open', () => {
      connected.value = true
      // Catch up on anything missed while disconnected.
      refreshTickets()
    })
    source.addEventListener('error', () => {
      connected.value = false
    })
    source.addEventListener('ticket', onTicket)
    source.addEventListener('typing', onTyping)
  }

  function disconnect() {
    source?.close()
    source = undefined
    connected.value = false
  }

  const typingIn = (ticketId: string) => computed(() => typing.value[ticketId])

  // Tell others we are typing, at most every 2.5 s.
  const notifyTyping = useThrottleFn((ticketId: string) => {
    $fetch(`/api/tickets/${encodeURIComponent(ticketId)}/typing`, { method: 'POST' }).catch(() => {})
  }, 2500)

  return { connected, typing, typingIn, connect, disconnect, notifyTyping }
}

export const useLive = createSharedComposable(_useLive)
