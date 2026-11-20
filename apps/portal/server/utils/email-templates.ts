/**
 * Branded HTML emails for MezoHelpdesk.
 *
 * Email clients ignore <style> blocks and modern CSS in many cases, so the
 * markup uses nested tables and inline styles only. Colors follow the portal
 * theme (Nuxt UI primary blue-700, mauve neutrals).
 */

const c = {
  primary: '#1d4ed8',
  primarySoft: '#eff6ff',
  primaryBorder: '#bfdbfe',
  page: '#f5f3f6',
  card: '#ffffff',
  border: '#e7e3e9',
  text: '#241f26',
  muted: '#6e6672',
  faint: '#9a929e',
  success: '#15803d',
  successSoft: '#f0fdf4',
  warning: '#b45309',
  warningSoft: '#fffbeb'
}
const font = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

export type EmailAttachment = { filename: string, content: Buffer, contentType: string }
export type EmailContent = { subject: string, html: string, text: string, attachments?: EmailAttachment[] }

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[char]!)
const multiline = (value: string) => escapeHtml(value).replace(/\r?\n/g, '<br>')
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name
const dateDe = (iso: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(iso))

// ---------- building blocks ----------

function badge(label: string, tone: 'primary' | 'success' | 'warning' = 'primary') {
  const [fg, bg] = tone === 'success' ? [c.success, c.successSoft] : tone === 'warning' ? [c.warning, c.warningSoft] : [c.primary, c.primarySoft]
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:600;letter-spacing:.2px;">${escapeHtml(label)}</span>`
}

function button(label: string, href: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
    <tr><td style="border-radius:10px;background:${c.primary};">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:13px 22px;font-family:${font};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(label)} &rarr;</a>
    </td></tr>
  </table>
  <p style="margin:0;font-size:12px;line-height:18px;color:${c.faint};">Button funktioniert nicht? Diesen Link im Browser öffnen:<br><a href="${escapeHtml(href)}" style="color:${c.primary};word-break:break-all;">${escapeHtml(href)}</a></p>`
}

function details(rows: [string, string][]) {
  const body = rows.map(([label, value], index) => `
    <tr>
      <td style="padding:11px 16px;${index ? `border-top:1px solid ${c.border};` : ''}font-size:13px;color:${c.muted};width:38%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:11px 16px;${index ? `border-top:1px solid ${c.border};` : ''}font-size:14px;color:${c.text};font-weight:500;vertical-align:top;">${value}</td>
    </tr>`).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;border:1px solid ${c.border};border-radius:12px;border-collapse:separate;">${body}</table>`
}

function quote(author: string, meta: string, text: string, highlight = false) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
    <tr><td style="padding:16px 18px;border-radius:12px;background:${highlight ? c.primarySoft : c.page};border:1px solid ${highlight ? c.primaryBorder : c.border};">
      <p style="margin:0 0 8px;font-size:13px;color:${c.muted};"><strong style="color:${c.text};">${escapeHtml(author)}</strong> &middot; ${escapeHtml(meta)}</p>
      <p style="margin:0;font-size:15px;line-height:24px;color:${c.text};">${multiline(text)}</p>
    </td></tr>
  </table>`
}

function steps(items: [string, string][]) {
  const rows = items.map(([title, text], index) => `
    <tr>
      <td width="36" valign="top" style="padding:0 0 14px;">
        <div style="width:26px;height:26px;line-height:26px;border-radius:999px;background:${c.primarySoft};border:1px solid ${c.primaryBorder};color:${c.primary};font-size:13px;font-weight:700;text-align:center;">${index + 1}</div>
      </td>
      <td valign="top" style="padding:2px 0 14px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:${c.text};">${escapeHtml(title)}</p>
        <p style="margin:2px 0 0;font-size:13px;line-height:20px;color:${c.muted};">${escapeHtml(text)}</p>
      </td>
    </tr>`).join('')
  return `<p style="margin:28px 0 12px;font-size:12px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${c.faint};">Wie geht es weiter?</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
}

function layout(input: { preheader: string, body: string, audience: 'customer' | 'team' }) {
  const notice = input.audience === 'customer'
    ? 'Bitte antworte nicht auf diese E-Mail, Antworten an diese Adresse werden nicht gelesen. Nutze für Rückfragen den Button oben, um direkt in deinem Ticket zu schreiben.'
    : 'Benachrichtigung aus dem MezoHelpdesk-Portal. Bitte nicht auf diese E-Mail antworten, sondern direkt im Portal.'

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>Holymezo Support</title>
</head>
<body style="margin:0;padding:0;background:${c.page};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.page};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;font-family:${font};">

        <tr><td style="padding:0 4px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:36px;height:36px;border-radius:9px;background:${c.primary};color:#ffffff;font-size:17px;font-weight:700;text-align:center;line-height:36px;">H</td>
            <td style="padding-left:11px;font-size:15px;color:${c.text};"><strong>Holymezo</strong> <span style="color:${c.muted};">MezoHelpdesk</span></td>
          </tr></table>
        </td></tr>

        <tr><td style="background:${c.card};border:1px solid ${c.border};border-radius:16px;overflow:hidden;">
          <div style="height:4px;background:${c.primary};line-height:4px;font-size:0;">&nbsp;</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:36px 36px 32px;font-size:15px;line-height:24px;color:${c.text};">
              ${input.body}
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:22px 8px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:14px 16px;border:1px dashed ${c.border};border-radius:12px;font-size:12px;line-height:18px;color:${c.muted};">
              <strong style="color:${c.text};">Automatisch versendet.</strong> ${escapeHtml(notice)}
            </td></tr>
          </table>
          <p style="margin:18px 0 0;font-size:12px;line-height:18px;color:${c.faint};text-align:center;">
            &copy; ${new Date().getFullYear()} Holymezo &middot; MezoHelpdesk<br>
            Du erhältst diese E-Mail, weil zu deiner Adresse ein Support-Vorgang besteht.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const heading = (eyebrow: string, title: string, tone?: 'primary' | 'success' | 'warning') =>
  `${badge(eyebrow, tone)}<h1 style="margin:16px 0 10px;font-size:26px;line-height:32px;font-weight:700;color:${c.text};letter-spacing:-.4px;">${escapeHtml(title)}</h1>`

const note = (html: string) => `<p style="margin:20px 0 0;font-size:13px;line-height:20px;color:${c.muted};">${html}</p>`

const p = (html: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:24px;color:${c.text};">${html}</p>`

const plainFooter = (audience: 'customer' | 'team') => audience === 'customer'
  ? '\n\n—\nDiese Nachricht wurde automatisch versendet. Bitte antworte nicht auf diese E-Mail. Nutze den Link oben, um in deinem Ticket zu schreiben.\nHolymezo · MezoHelpdesk'
  : '\n\n—\nAutomatische Benachrichtigung aus dem MezoHelpdesk-Portal. Bitte im Portal antworten.'

// ---------- templates ----------

type TicketInfo = { id: string, subject: string, category: string, status: string, createdAt: string, customer: string, email: string }

export function ticketCreatedEmail(ticket: TicketInfo, message: string, ticketUrl: string): EmailContent {
  const body = [
    heading('Anfrage eingegangen', `Danke, ${firstName(ticket.customer)}!`, 'success'),
    p(`Wir haben deine Anfrage erhalten und kümmern uns darum. Unter der Ticketnummer <strong>${escapeHtml(ticket.id)}</strong> findest du jederzeit den aktuellen Stand.`),
    details([
      ['Ticketnummer', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(ticket.id)}</span>`],
      ['Betreff', escapeHtml(ticket.subject)],
      ['Thema', escapeHtml(ticket.category)],
      ['Status', badge(ticket.status)],
      ['Eingegangen', escapeHtml(dateDe(ticket.createdAt))]
    ]),
    button('Ticket ansehen & antworten', ticketUrl),
    steps([
      ['Wir prüfen dein Anliegen', 'Ein Mensch aus unserem Team liest deine Nachricht.'],
      ['Du bekommst eine Antwort', 'Sobald wir antworten, schicken wir dir eine E-Mail mit Link.'],
      ['Weitere Infos jederzeit', 'Über deinen persönlichen Link kannst du Details oder Screenshots nachreichen.']
    ]),
    quote('Deine Nachricht', dateDe(ticket.createdAt), message),
    `<p style="margin:24px 0 0;font-size:13px;line-height:20px;color:${c.muted};">Bewahre diese E-Mail auf: Der Link ist persönlich und nur für dich bestimmt. Gib ihn bitte nicht weiter.</p>`
  ].join('')

  return {
    subject: `Anfrage erhalten · ${ticket.id} · ${ticket.subject}`,
    html: layout({ preheader: `Ticket ${ticket.id} ist angelegt. Wir melden uns per E-Mail.`, body, audience: 'customer' }),
    text: `Hallo ${firstName(ticket.customer)},\n\nwir haben deine Anfrage erhalten.\n\nTicketnummer: ${ticket.id}\nBetreff: ${ticket.subject}\nThema: ${ticket.category}\nStatus: ${ticket.status}\n\nTicket ansehen und antworten:\n${ticketUrl}\n\nDeine Nachricht:\n${message}${plainFooter('customer')}`
  }
}

export function teamReplyEmail(ticket: TicketInfo, reply: { author: string, text: string, createdAt: string }, ticketUrl: string): EmailContent {
  const body = [
    heading('Neue Antwort', `Hallo ${firstName(ticket.customer)}, wir haben geantwortet`),
    p(`Zu deinem Ticket <strong>${escapeHtml(ticket.subject)}</strong> gibt es eine neue Nachricht von unserem Support-Team.`),
    quote(`${reply.author} · Holymezo Support`, dateDe(reply.createdAt), reply.text, true),
    button('Im Ticket antworten', ticketUrl),
    details([
      ['Ticketnummer', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(ticket.id)}</span>`],
      ['Status', badge(ticket.status, ticket.status === 'Gelöst' ? 'success' : 'primary')]
    ])
  ].join('')

  return {
    subject: `Neue Antwort · ${ticket.id} · ${ticket.subject}`,
    html: layout({ preheader: reply.text.slice(0, 120), body, audience: 'customer' }),
    text: `Hallo ${firstName(ticket.customer)},\n\n${reply.author} vom Holymezo Support hat auf dein Ticket ${ticket.id} geantwortet:\n\n${reply.text}\n\nIm Ticket antworten:\n${ticketUrl}${plainFooter('customer')}`
  }
}

export function customerMessageEmail(ticket: TicketInfo, text: string, portalUrl: string): EmailContent {
  const body = [
    heading('Neue Kundennachricht', `${ticket.customer} hat geschrieben`, 'warning'),
    p(`Im Ticket <strong>${escapeHtml(ticket.id)}</strong> ist eine neue Nachricht eingegangen. Das Ticket steht wieder auf <strong>Offen</strong>.`),
    quote(ticket.customer, ticket.email, text),
    details([
      ['Ticket', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(ticket.id)}</span>`],
      ['Betreff', escapeHtml(ticket.subject)],
      ['Thema', escapeHtml(ticket.category)]
    ]),
    button('Im Portal öffnen', portalUrl)
  ].join('')

  return {
    subject: `Kundennachricht · ${ticket.id} · ${ticket.subject}`,
    html: layout({ preheader: `${ticket.customer}: ${text.slice(0, 100)}`, body, audience: 'team' }),
    text: `${ticket.customer} (${ticket.email}) hat im Ticket ${ticket.id} geschrieben:\n\n${text}\n\nIm Portal öffnen:\n${portalUrl}${plainFooter('team')}`
  }
}

export function newTicketTeamEmail(ticket: TicketInfo, message: string, portalUrl: string): EmailContent {
  const body = [
    heading('Neues Ticket', ticket.subject, 'primary'),
    p(`<strong>${escapeHtml(ticket.customer)}</strong> (${escapeHtml(ticket.email)}) hat eine neue Anfrage gestellt.`),
    details([
      ['Ticket', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(ticket.id)}</span>`],
      ['Thema', escapeHtml(ticket.category)],
      ['Eingegangen', escapeHtml(dateDe(ticket.createdAt))]
    ]),
    quote(ticket.customer, ticket.email, message),
    button('Im Portal öffnen', portalUrl)
  ].join('')

  return {
    subject: `Neues Ticket · ${ticket.id} · ${ticket.subject}`,
    html: layout({ preheader: `${ticket.customer}: ${message.slice(0, 100)}`, body, audience: 'team' }),
    text: `Neues Ticket ${ticket.id} von ${ticket.customer} (${ticket.email})\nThema: ${ticket.category}\nBetreff: ${ticket.subject}\n\n${message}\n\nIm Portal öffnen:\n${portalUrl}${plainFooter('team')}`
  }
}

export function testEmail(input: { recipient: string, provider: string, server: string, from: string }): EmailContent {
  const body = [
    heading('Verbindung erfolgreich', 'Dein Mailserver funktioniert', 'success'),
    p('Diese Testmail bestätigt, dass MezoHelpdesk über deinen Mailserver E-Mails versenden kann. So sehen ab jetzt auch die Mails an deine Kund:innen aus.'),
    details([
      ['Versandart', escapeHtml(input.provider)],
      ['Server', escapeHtml(input.server)],
      ['Absender', escapeHtml(input.from)],
      ['Empfänger', escapeHtml(input.recipient)],
      ['Gesendet', escapeHtml(dateDe(new Date().toISOString()))]
    ])
  ].join('')

  return {
    subject: 'Testmail · MezoHelpdesk ist bereit',
    html: layout({ preheader: 'Dein Mailserver ist richtig eingerichtet.', body, audience: 'team' }),
    text: `Dein Mailserver funktioniert.\n\nVersandart: ${input.provider}\nServer: ${input.server}\nAbsender: ${input.from}\nEmpfänger: ${input.recipient}${plainFooter('team')}`
  }
}

export function ticketAssignedEmail(ticket: TicketInfo, agent: string, ticketUrl: string): EmailContent {
  const body = [
    heading('In Bearbeitung', `${agent} kümmert sich um dein Anliegen`),
    p(`Gute Nachrichten, ${escapeHtml(firstName(ticket.customer))}: Dein Ticket <strong>${escapeHtml(ticket.subject)}</strong> wurde von unserem Support-Team übernommen und wird jetzt bearbeitet.`),
    details([
      ['Ticketnummer', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(ticket.id)}</span>`],
      ['Bearbeitet von', escapeHtml(agent)],
      ['Status', badge('In Bearbeitung', 'warning')]
    ]),
    button('Ticket ansehen', ticketUrl),
    note(`Du musst nichts weiter tun. Wenn du noch Informationen ergänzen möchtest, kannst du das jederzeit über den Button tun.`)
  ].join('')

  return {
    subject: `In Bearbeitung · ${ticket.id} · ${ticket.subject}`,
    html: layout({ preheader: `${agent} bearbeitet jetzt dein Ticket ${ticket.id}.`, body, audience: 'customer' }),
    text: `Hallo ${firstName(ticket.customer)},\n\n${agent} aus unserem Support-Team hat dein Ticket ${ticket.id} (${ticket.subject}) übernommen und bearbeitet es jetzt.\n\nTicket ansehen:\n${ticketUrl}${plainFooter('customer')}`
  }
}

export function ticketClosedEmail(ticket: TicketInfo & { messages: { length: number } }, closedBy: string, ticketUrl: string, transcript: EmailAttachment): EmailContent {
  const body = [
    heading('Ticket abgeschlossen', 'Dein Anliegen ist erledigt', 'success'),
    p(`Hallo ${escapeHtml(firstName(ticket.customer))}, wir haben dein Ticket <strong>${escapeHtml(ticket.subject)}</strong> abgeschlossen. Danke für deine Geduld!`),
    details([
      ['Ticketnummer', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(ticket.id)}</span>`],
      ['Abgeschlossen von', escapeHtml(closedBy)],
      ['Nachrichten', String(ticket.messages.length)],
      ['Status', badge('Gelöst', 'success')]
    ]),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
      <tr><td style="padding:14px 16px;border-radius:12px;background:${c.page};border:1px solid ${c.border};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" style="width:38px;height:44px;border-radius:6px;background:#ffffff;border:1px solid ${c.border};text-align:center;font-size:10px;font-weight:700;color:${c.primary};">PDF</td>
          <td valign="middle" style="padding-left:12px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:${c.text};">${escapeHtml(transcript.filename)}</p>
            <p style="margin:2px 0 0;font-size:12px;color:${c.muted};">Vollständiger Gesprächsverlauf, im Anhang dieser E-Mail</p>
          </td>
        </tr></table>
      </td></tr>
    </table>`,
    button('Ticket ansehen', ticketUrl),
    note(`Ist doch noch etwas offen? Schreib einfach über den Button eine Nachricht in dein Ticket, dann öffnen wir es wieder.`)
  ].join('')

  return {
    subject: `Abgeschlossen · ${ticket.id} · ${ticket.subject}`,
    html: layout({ preheader: `Dein Ticket ${ticket.id} ist abgeschlossen. Das Transkript findest du im Anhang.`, body, audience: 'customer' }),
    text: `Hallo ${firstName(ticket.customer)},\n\nwir haben dein Ticket ${ticket.id} (${ticket.subject}) abgeschlossen. Den vollständigen Gesprächsverlauf findest du als PDF im Anhang (${transcript.filename}).\n\nIst doch noch etwas offen? Schreib eine Nachricht in dein Ticket:\n${ticketUrl}${plainFooter('customer')}`,
    attachments: [transcript]
  }
}
