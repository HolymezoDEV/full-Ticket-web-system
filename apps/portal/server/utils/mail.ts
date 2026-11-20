import nodemailer from 'nodemailer'
import { readJson, writeJson } from './auth'

export type MailProvider = 'none' | 'smtp' | 'resend'
export type MailSettings = {
  provider: MailProvider
  from: string
  supportEmail: string
  smtp: { host: string; port: number; secure: boolean; user: string; password: string }
  resend: { apiKey: string }
}
/** What the browser gets: secrets are replaced by "is one stored?" flags. */
export type PublicMailSettings = Omit<MailSettings, 'smtp' | 'resend'> & {
  smtp: Omit<MailSettings['smtp'], 'password'> & { hasPassword: boolean }
  resend: { hasApiKey: boolean }
  source: 'settings' | 'env'
}

const FILE = 'mail-settings.json'

function envDefaults(): MailSettings {
  const config = useRuntimeConfig()
  return {
    provider: config.resendApiKey ? 'resend' : 'none',
    from: String(config.mailFrom || ''),
    supportEmail: String(config.supportEmail || ''),
    smtp: { host: '', port: 587, secure: false, user: '', password: '' },
    resend: { apiKey: String(config.resendApiKey || '') },
  }
}

export async function readMailSettings(): Promise<MailSettings & { source: 'settings' | 'env' }> {
  const stored = await readJson<MailSettings | null>(FILE, null)
  if (!stored) return { ...envDefaults(), source: 'env' }
  const defaults = envDefaults()
  return { ...defaults, ...stored, smtp: { ...defaults.smtp, ...stored.smtp }, resend: { ...defaults.resend, ...stored.resend }, source: 'settings' }
}

export function toPublicMailSettings(settings: MailSettings & { source: 'settings' | 'env' }): PublicMailSettings {
  const { password, ...smtp } = settings.smtp
  return { provider: settings.provider, from: settings.from, supportEmail: settings.supportEmail, source: settings.source, smtp: { ...smtp, hasPassword: Boolean(password) }, resend: { hasApiKey: Boolean(settings.resend.apiKey) } }
}

const isEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
// Accepts "addr@x.de" or "Name <addr@x.de>".
const isSender = (value: string) => isEmail(value) || /^[^<>]{1,120}<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/.test(value)

/** Validates input from the settings form; empty secret fields keep the stored secret. */
export async function saveMailSettings(input: Record<string, any>) {
  const current = await readMailSettings()
  const provider = input.provider as MailProvider
  if (!['none', 'smtp', 'resend'].includes(provider)) throw createError({ statusCode: 400, statusMessage: 'Unbekannter Mail-Anbieter.' })
  const from = String(input.from ?? '').trim()
  const supportEmail = String(input.supportEmail ?? '').trim()
  if (provider !== 'none' && !isSender(from)) throw createError({ statusCode: 400, statusMessage: 'Bitte gib eine gültige Absenderadresse an, z. B. Support <support@example.com>.' })
  if (supportEmail && !isEmail(supportEmail)) throw createError({ statusCode: 400, statusMessage: 'Die Support-Adresse ist ungültig.' })

  const smtpIn = input.smtp ?? {}
  const smtp = {
    host: String(smtpIn.host ?? '').trim(),
    port: Number(smtpIn.port ?? 587),
    secure: Boolean(smtpIn.secure),
    user: String(smtpIn.user ?? '').trim(),
    password: typeof smtpIn.password === 'string' && smtpIn.password ? smtpIn.password : current.smtp.password,
  }
  if (smtpIn.clearPassword) smtp.password = ''
  if (provider === 'smtp') {
    if (!/^[a-z0-9.-]{1,253}$/i.test(smtp.host)) throw createError({ statusCode: 400, statusMessage: 'Bitte gib einen gültigen SMTP-Host an.' })
    if (!Number.isInteger(smtp.port) || smtp.port < 1 || smtp.port > 65535) throw createError({ statusCode: 400, statusMessage: 'Der SMTP-Port muss zwischen 1 und 65535 liegen.' })
  }
  const apiKeyIn = input.resend?.apiKey
  const resend = { apiKey: typeof apiKeyIn === 'string' && apiKeyIn.trim() ? apiKeyIn.trim() : current.resend.apiKey }
  if (provider === 'resend' && !resend.apiKey) throw createError({ statusCode: 400, statusMessage: 'Bitte gib einen Resend-API-Schlüssel an.' })

  const settings: MailSettings = { provider, from, supportEmail, smtp, resend }
  await writeJson(FILE, settings)
  return { ...settings, source: 'settings' as const }
}

export type SendResult = { ok: true } | { ok: false; error: string }

export async function sendMail(to: string, subject: string, html: string, override?: MailSettings): Promise<SendResult> {
  const settings = override ?? await readMailSettings()
  if (settings.provider === 'none' || !settings.from) return { ok: false, error: 'Kein Mailserver eingerichtet.' }
  try {
    if (settings.provider === 'smtp') {
      const transport = nodemailer.createTransport({
        host: settings.smtp.host, port: settings.smtp.port, secure: settings.smtp.secure,
        auth: settings.smtp.user ? { user: settings.smtp.user, pass: settings.smtp.password } : undefined,
        connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
      })
      await transport.sendMail({ from: settings.from, to, subject, html })
      return { ok: true }
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${settings.resend.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: settings.from, to: [to], subject, html }),
    })
    if (!response.ok) {
      const detail = await response.text()
      console.error('Resend delivery failed:', response.status, detail)
      return { ok: false, error: `Resend lehnte die Mail ab (HTTP ${response.status}).` }
    }
    return { ok: true }
  } catch (error) {
    console.error('Mail delivery failed:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Mailversand fehlgeschlagen.' }
  }
}
