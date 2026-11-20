import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { readMailSettings, sendMail } from './mail'
import { publishLive } from './live'
import type { EmailContent } from './email-templates'

export type TicketStatus = 'Offen' | 'In Bearbeitung' | 'Wartet auf Kunde' | 'Gelöst'
export type TicketMessage = { id: string, author: string, role: 'Team' | 'Kunde', text: string, createdAt: string }
export type StoredTicket = {
  id: string
  subject: string
  customer: string
  email: string
  preview: string
  status: TicketStatus
  priority: 'Normal'
  category: string
  assignee: string
  assigneeId?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
  accessTokenHash: string
  /** Extra access links issued with later emails; every one stays valid. */
  extraTokenHashes?: string[]
}

const file = () => join(process.cwd(), '.data', 'tickets.json')
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function readTickets(): Promise<StoredTicket[]> {
  try {
    return JSON.parse(await readFile(file(), 'utf8')) as StoredTicket[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

async function saveTickets(tickets: StoredTicket[]) {
  const path = file()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(tickets, null, 2)}\n`, { mode: 0o600 })
}

export async function createTicket(input: { name: string, email: string, category: string, subject: string, message: string }) {
  const tickets = await readTickets()
  const now = new Date().toISOString()
  const id = `MH-${randomUUID().slice(0, 8).toUpperCase()}`
  const accessToken = randomBytes(32).toString('base64url')
  const ticket: StoredTicket = {
    id, subject: input.subject, customer: input.name, email: input.email, preview: input.message,
    status: 'Offen', priority: 'Normal', category: input.category, assignee: 'Nicht zugewiesen',
    createdAt: now, updatedAt: now, accessTokenHash: tokenHash(accessToken),
    messages: [{ id: randomUUID(), author: input.name, role: 'Kunde', text: input.message, createdAt: now }]
  }
  tickets.unshift(ticket)
  await saveTickets(tickets)
  publishLive({ type: 'ticket', ticketId: id, action: 'created', by: 'Kunde' })
  return { ticket, accessToken }
}

export async function findTicket(id: string) {
  return (await readTickets()).find(ticket => ticket.id === id)
}

export async function verifyTicketToken(ticket: StoredTicket, token: string) {
  if (!token) return false
  const candidate = Buffer.from(tokenHash(token), 'hex')
  return [ticket.accessTokenHash, ...(ticket.extraTokenHashes ?? [])].some((hash) => {
    const stored = Buffer.from(hash, 'hex')
    return candidate.length === stored.length && timingSafeEqual(candidate, stored)
  })
}

/** Creates an additional personal link for a ticket (only its hash is stored). */
export async function issueTicketToken(id: string) {
  const tickets = await readTickets()
  const ticket = tickets.find(item => item.id === id)
  if (!ticket) return undefined
  const token = randomBytes(32).toString('base64url')
  ticket.extraTokenHashes = [...(ticket.extraTokenHashes ?? []), tokenHash(token)].slice(-25)
  await saveTickets(tickets)
  return token
}

export function customerTicketUrl(id: string, token: string) {
  return `${useRuntimeConfig().public.intakeUrl}/tickets/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`
}

export function portalTicketUrl(id: string) {
  return `${useRuntimeConfig().public.portalUrl}/tickets?id=${encodeURIComponent(id)}`
}

export const toSafeTicket = ({ accessTokenHash: _hash, extraTokenHashes: _extra, ...ticket }: StoredTicket) => ticket

export async function addTicketMessage(id: string, author: string, role: TicketMessage['role'], text: string) {
  const tickets = await readTickets()
  const ticket = tickets.find(item => item.id === id)
  if (!ticket) return undefined
  const now = new Date().toISOString()
  ticket.messages.push({ id: randomUUID(), author, role, text, createdAt: now })
  ticket.preview = text
  ticket.updatedAt = now
  if (role === 'Kunde') ticket.status = 'Offen'
  else ticket.status = 'Wartet auf Kunde'
  await saveTickets(tickets)
  publishLive({ type: 'ticket', ticketId: id, action: 'message', by: role })
  return ticket
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const tickets = await readTickets()
  const ticket = tickets.find(item => item.id === id)
  if (!ticket) return undefined
  const previous = ticket.status
  const now = new Date().toISOString()
  ticket.status = status
  ticket.updatedAt = now
  if (status === 'Gelöst' && previous !== 'Gelöst') ticket.closedAt = now
  await saveTickets(tickets)
  publishLive({ type: 'ticket', ticketId: id, action: 'updated' })
  return { ticket, previous }
}

export async function assignTicket(id: string, user: { id: string, name: string }) {
  const tickets = await readTickets()
  const ticket = tickets.find(item => item.id === id)
  if (!ticket) return undefined
  ticket.assigneeId = user.id
  ticket.assignee = user.name
  if (ticket.status === 'Offen') ticket.status = 'In Bearbeitung'
  ticket.updatedAt = new Date().toISOString()
  await saveTickets(tickets)
  publishLive({ type: 'ticket', ticketId: id, action: 'updated' })
  return ticket
}

export async function deleteTicket(id: string) {
  const tickets = await readTickets()
  const next = tickets.filter(item => item.id !== id)
  if (next.length === tickets.length) return false
  await saveTickets(next)
  publishLive({ type: 'ticket', ticketId: id, action: 'deleted' })
  return true
}

export async function sendTicketEmail(to: string, content: EmailContent) {
  if (!to) return false
  return (await sendMail(to, content)).ok
}

/** Notification address for the team, configured in Einstellungen → Mailserver. */
export async function supportNotificationEmail() {
  return (await readMailSettings()).supportEmail
}

export { escapeHtml } from './email-templates'
