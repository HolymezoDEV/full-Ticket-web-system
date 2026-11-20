import PDFDocument from 'pdfkit'
import type { StoredTicket } from './ticket-store'

// The built-in PDF fonts only cover Latin-1 (WinAnsi); replace anything else so the PDF never breaks.
// Anything outside printable ASCII, Latin-1 and the euro sign.
const UNSUPPORTED = new RegExp('[^\\n\\r\\t\\x20-\\x7E\\xA0-\\xFF\\u20AC]', 'gu')
// Emoji have no PDF glyph; dropping them reads better than a question mark.
const EMOJI = new RegExp('\\p{Extended_Pictographic}[\\uFE0F\\u200D]*', 'gu')

const pdfSafe = (value: string) => value
  .replace(/[‘’]/g, '\'').replace(/[“”„]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/→/g, '->')
  .replace(EMOJI, '')
  .replace(UNSUPPORTED, '?')

const dateDe = (iso: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(iso))

const blue = '#1d4ed8'
const text = '#241f26'
const muted = '#6e6672'
const line = '#e7e3e9'

/** Builds a PDF with the full conversation of a ticket. */
export function ticketTranscriptPdf(ticket: StoredTicket): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 }, bufferPages: true, info: { Title: `Transkript ${ticket.id}`, Author: 'Holymezo MezoHelpdesk' } })
    const chunks: Buffer[] = []
    doc.on('data', chunk => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const width = doc.page.width - 112

    // Header
    doc.roundedRect(56, 56, 26, 26, 6).fill(blue)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text('H', 56, 62, { width: 26, align: 'center' })
    doc.fillColor(text).font('Helvetica-Bold').fontSize(11).text('Holymezo', 92, 63, { continued: true }).font('Helvetica').fillColor(muted).text('  MezoHelpdesk')
    doc.moveDown(2.2)

    doc.x = 56
    doc.fillColor(muted).font('Helvetica').fontSize(9).text('GESPRÄCHSVERLAUF', { characterSpacing: 1 })
    doc.moveDown(0.3)
    doc.fillColor(text).font('Helvetica-Bold').fontSize(20).text(pdfSafe(ticket.subject), { width })
    doc.moveDown(0.8)

    // Summary table
    const rows: [string, string][] = [
      ['Ticketnummer', ticket.id],
      ['Kund:in', `${ticket.customer} <${ticket.email}>`],
      ['Thema', ticket.category],
      ['Bearbeitet von', ticket.assignee || 'Nicht zugewiesen'],
      ['Eröffnet', dateDe(ticket.createdAt)],
      ['Abgeschlossen', dateDe(ticket.closedAt ?? ticket.updatedAt)]
    ]
    let y = doc.y
    doc.roundedRect(56, y, width, rows.length * 22 + 8, 8).lineWidth(1).strokeColor(line).stroke()
    y += 8
    for (const [label, value] of rows) {
      doc.font('Helvetica').fontSize(9.5).fillColor(muted).text(label, 70, y, { width: 120 })
      doc.font('Helvetica-Bold').fillColor(text).text(pdfSafe(value), 190, y, { width: width - 148 })
      y += 22
    }
    doc.y = y + 18

    // Messages
    for (const message of ticket.messages) {
      const team = message.role === 'Team'
      const author = team ? `${message.author} · Holymezo Support` : `${message.author} · Kund:in`
      const body = pdfSafe(message.text)
      doc.font('Helvetica').fontSize(10.5)
      const bodyHeight = doc.heightOfString(body, { width: width - 28, lineGap: 2 })
      const boxHeight = bodyHeight + 44
      if (doc.y + boxHeight > doc.page.height - 70) doc.addPage()
      const top = doc.y
      doc.roundedRect(56, top, width, boxHeight, 8).fill(team ? '#eff6ff' : '#f5f3f6')
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(team ? blue : text).text(pdfSafe(author), 70, top + 12, { width: width - 200, continued: false })
      doc.font('Helvetica').fontSize(9).fillColor(muted).text(dateDe(message.createdAt), 56, top + 12, { width: width - 14, align: 'right' })
      doc.font('Helvetica').fontSize(10.5).fillColor(text).text(body, 70, top + 30, { width: width - 28, lineGap: 2 })
      doc.y = top + boxHeight + 10
    }

    // Footer on every page
    const range = doc.bufferedPageRange()
    for (let index = range.start; index < range.start + range.count; index++) {
      doc.switchToPage(index)
      // Writing below the bottom margin would otherwise start a new page.
      doc.page.margins.bottom = 0
      doc.font('Helvetica').fontSize(8).fillColor(muted).text(
        `Transkript ${ticket.id} · erstellt am ${dateDe(new Date().toISOString())} · Seite ${index + 1} von ${range.count}`,
        56, doc.page.height - 40, { width, align: 'center', lineBreak: false }
      )
    }
    doc.end()
  })
}
