import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import type { H3Event } from 'h3'

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

export type StoredUser = { id: string, name: string, email: string, roleId: string, passwordHash: string, createdAt: string }
export type PublicUser = Omit<StoredUser, 'passwordHash'>
type LegacyUser = Omit<StoredUser, 'roleId'> & { roleId?: string, role?: 'Admin' | 'Agent' }
type SessionData = { userId?: string }

const dataFile = (name: string) => join(process.cwd(), '.data', name)

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(dataFile(name), 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback
    throw error
  }
}

export async function writeJson(name: string, value: unknown) {
  const path = dataFile(name)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
}
export { readJson }

// Older accounts stored a fixed role name; map them onto the built-in roles.
export const readUsers = async () => (await readJson<LegacyUser[]>('users.json', []))
  .map(({ role, ...user }) => ({ ...user, roleId: user.roleId ?? (role === 'Admin' ? 'admin' : 'agent') }) as StoredUser)
export const toPublicUser = ({ passwordHash: _hash, ...user }: StoredUser): PublicUser => user

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltB64, keyB64] = stored.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64')
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length)
  return timingSafeEqual(actual, expected)
}

// Used when no user matches, so login timing does not reveal which emails exist.
const dummyHash = hashPassword(randomBytes(16).toString('hex'))

export async function authenticate(email: string, password: string) {
  const user = (await readUsers()).find(item => item.email === email.toLowerCase())
  const ok = await verifyPassword(password, user?.passwordHash ?? await dummyHash)
  return ok && user ? user : undefined
}

export async function createUser(input: { name: string, email: string, password: string }) {
  const users = await readUsers()
  const email = input.email.toLowerCase()
  if (users.some(user => user.email === email)) return undefined
  const user: StoredUser = {
    id: randomUUID(), name: input.name, email, roleId: users.length === 0 ? 'admin' : (await readAppSettings()).defaultRoleId,
    passwordHash: await hashPassword(input.password), createdAt: new Date().toISOString()
  }
  users.push(user)
  await writeJson('users.json', users)
  return user
}

let cachedSecret: string | undefined
async function sessionSecret() {
  if (cachedSecret) return cachedSecret
  const configured = String(useRuntimeConfig().sessionSecret || '')
  if (configured.length >= 32) return (cachedSecret = configured)
  const path = dataFile('session-secret')
  try {
    cachedSecret = (await readFile(path, 'utf8')).trim()
  } catch {
    cachedSecret = randomBytes(48).toString('base64url')
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, cachedSecret, { mode: 0o600 })
  }
  return cachedSecret
}

function cookieSecure() {
  const setting = String(useRuntimeConfig().cookieSecure ?? '')
  return setting === '' ? !import.meta.dev : setting !== 'false'
}

/** Client IP; trusts X-Forwarded-For only when configured (behind Cloudflare Tunnel). */
export const clientIp = (event: H3Event) => getRequestIP(event, { xForwardedFor: useRuntimeConfig().trustProxy === true || String(useRuntimeConfig().trustProxy) === 'true' }) || 'unknown'

export async function getAuthSession(event: H3Event) {
  return useSession<SessionData>(event, {
    password: await sessionSecret(),
    name: 'mezohelpdesk-session',
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, sameSite: 'lax', secure: cookieSecure(), path: '/' }
  })
}

export async function getCurrentUser(event: H3Event) {
  if (event.context.user !== undefined) return event.context.user as StoredUser | null
  const session = await getAuthSession(event)
  const user = session.data.userId ? (await readUsers()).find(item => item.id === session.data.userId) : undefined
  event.context.user = user ?? null
  return user ?? null
}

export async function requireUser(event: H3Event) {
  const user = await getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Bitte melde dich an.' })
  return user
}

export type AppSettings = {
  allowRegistration: boolean
  /** Role given to self-registered accounts. */
  defaultRoleId: string
  /** Team mail when a new ticket arrives. */
  notifyTeamOnNewTicket: boolean
  /** Team mail on every customer follow-up message. */
  notifyTeamOnCustomerMessage: boolean
}
const appDefaults: AppSettings = { allowRegistration: true, defaultRoleId: 'agent', notifyTeamOnNewTicket: true, notifyTeamOnCustomerMessage: false }
export const readAppSettings = async (): Promise<AppSettings> => ({ ...appDefaults, ...(await readJson<Partial<AppSettings>>('app-settings.json', {})) })
export const saveAppSettings = (settings: AppSettings) => writeJson('app-settings.json', settings)

export const saveUsers = (users: StoredUser[]) => writeJson('users.json', users)

export const isValidEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
