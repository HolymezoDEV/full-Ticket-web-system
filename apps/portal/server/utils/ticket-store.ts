import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export type TicketStatus = 'Offen' | 'In Bearbeitung' | 'Wartet auf Kunde' | 'Gelöst'
export type TicketMessage = { id: string; author: string; role: 'Team' | 'Kunde'; text: string; createdAt: string }
export type StoredTicket = {
  id: string; subject: string; customer: string; email: string; preview: string; status: TicketStatus
  priority: 'Normal'; category: string; assignee: string; createdAt: string; updatedAt: string
  messages: TicketMessage[]; accessTokenHash: string
}

const file = () => join(process.cwd(), '.data', 'tickets.json')
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function readTickets(): Promise<StoredTicket[]> {
  try { return JSON.parse(await readFile(file(), 'utf8')) as StoredTicket[] }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

async function saveTickets(tickets: StoredTicket[]) {
  const path = file()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(tickets, null, 2)}\n`, { mode: 0o600 })
}

export async function createTicket(input: { name: string; email: string; category: string; subject: string; message: string }) {
  const tickets = await readTickets()
  const now = new Date().toISOString()
  const id = `MH-${randomUUID().slice(0, 8).toUpperCase()}`
  const accessToken = randomBytes(32).toString('base64url')
  const ticket: StoredTicket = {
    id, subject: input.subject, customer: input.name, email: input.email, preview: input.message,
    status: 'Offen', priority: 'Normal', category: input.category, assignee: 'Nicht zugewiesen',
    createdAt: now, updatedAt: now, accessTokenHash: tokenHash(accessToken),
    messages: [{ id: randomUUID(), author: input.name, role: 'Kunde', text: input.message, createdAt: now }],
  }
  tickets.unshift(ticket)
  await saveTickets(tickets)
  return { ticket, accessToken }
}

export async function findTicket(id: string) {
  return (await readTickets()).find(ticket => ticket.id === id)
}

export async function verifyTicketToken(ticket: StoredTicket, token: string) {
  if (!token) return false
  const candidate = Buffer.from(tokenHash(token), 'hex')
  const stored = Buffer.from(ticket.accessTokenHash, 'hex')
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
}

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
  return ticket
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const tickets = await readTickets()
  const ticket = tickets.find(item => item.id === id)
  if (!ticket) return undefined
  ticket.status = status
  ticket.updatedAt = new Date().toISOString()
  await saveTickets(tickets)
  return ticket
}

export async function sendTicketEmail(to: string, subject: string, html: string) {
  const config = useRuntimeConfig()
  if (!config.resendApiKey || !config.mailFrom) return false
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.mailFrom, to: [to], subject, html }),
    })
    if (!response.ok) {
      const detail = await response.text()
      console.error('Ticket email delivery failed:', response.status, detail)
      return false
    }
    return true
  } catch (error) {
    console.error('Ticket email service is unavailable:', error)
    return false
  }
}

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
