import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { getCurrentUser, readJson, readUsers, writeJson, type StoredUser } from './auth'

/** Every permission the portal checks. Labels are shown in the role editor. */
export const PERMISSIONS = {
  'tickets.view': { group: 'Tickets', label: 'Tickets ansehen', description: 'Posteingang, Übersicht und Ticketverlauf sehen.' },
  'tickets.create': { group: 'Tickets', label: 'Tickets anlegen', description: 'Im Portal neue Tickets erfassen.' },
  'tickets.reply': { group: 'Tickets', label: 'Antworten', description: 'Nachrichten an Kund:innen schreiben.' },
  'tickets.assign': { group: 'Tickets', label: 'Tickets übernehmen', description: 'Tickets sich selbst zuweisen.' },
  'tickets.status': { group: 'Tickets', label: 'Status ändern und schließen', description: 'Status setzen und Tickets abschließen.' },
  'tickets.delete': { group: 'Tickets', label: 'Tickets löschen', description: 'Tickets endgültig entfernen.' },
  'customers.view': { group: 'Kunden', label: 'Kunden ansehen', description: 'Kundenliste öffnen.' },
  'settings.mail': { group: 'Verwaltung', label: 'Mailserver und Benachrichtigungen', description: 'Versand und E-Mail-Regeln einrichten.' },
  'settings.topics': { group: 'Verwaltung', label: 'Themen verwalten', description: 'Themen für das Kontaktformular anlegen und ändern.' },
  'settings.team': { group: 'Verwaltung', label: 'Team verwalten', description: 'Konten, Rollenzuweisung und Registrierung.' },
  'settings.roles': { group: 'Verwaltung', label: 'Rollen und Berechtigungen', description: 'Rollen anlegen und Berechtigungen festlegen.' }
} as const

export type Permission = keyof typeof PERMISSIONS
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[]
export const isPermission = (value: unknown): value is Permission => typeof value === 'string' && value in PERMISSIONS

export type Role = { id: string, name: string, description: string, permissions: Permission[], system?: boolean }

const DEFAULT_ROLES: Role[] = [
  { id: 'admin', name: 'Admin', description: 'Voller Zugriff auf alles.', permissions: ALL_PERMISSIONS, system: true },
  { id: 'agent', name: 'Agent', description: 'Bearbeitet Tickets im Support.', permissions: ['tickets.view', 'tickets.create', 'tickets.reply', 'tickets.assign', 'tickets.status', 'customers.view'] }
]

export async function readRoles(): Promise<Role[]> {
  const stored = await readJson<Role[] | null>('roles.json', null)
  const roles = stored ?? DEFAULT_ROLES
  // The admin role always holds every permission, including ones added later.
  return roles.map(role => role.id === 'admin' ? { ...role, permissions: ALL_PERMISSIONS, system: true } : { ...role, permissions: role.permissions.filter(isPermission) })
}
export const saveRoles = (roles: Role[]) => writeJson('roles.json', roles)
export const newRoleId = () => `role-${randomUUID().slice(0, 8)}`

export async function permissionsOf(user: StoredUser) {
  const role = (await readRoles()).find(item => item.id === user.roleId)
  return { role, permissions: new Set<Permission>(role?.permissions ?? []) }
}

export async function requirePermission(event: H3Event, permission: Permission) {
  const user = await getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Bitte melde dich an.' })
  const { permissions } = await permissionsOf(user)
  if (!permissions.has(permission)) throw createError({ statusCode: 403, statusMessage: 'Dafür fehlen dir die Berechtigungen.' })
  return user
}

export async function hasPermission(event: H3Event, permission: Permission) {
  const user = await getCurrentUser(event)
  return user ? (await permissionsOf(user)).permissions.has(permission) : false
}

/** Counts accounts holding the admin role, so the last one cannot be removed. */
export const adminCount = async () => (await readUsers()).filter(user => user.roleId === 'admin').length

/** User as the browser sees it: profile plus role name and permissions. */
export async function describeUser(user: StoredUser) {
  const { passwordHash: _hash, ...profile } = user
  const { role, permissions } = await permissionsOf(user)
  return { ...profile, roleName: role?.name ?? 'Ohne Rolle', permissions: [...permissions] }
}
