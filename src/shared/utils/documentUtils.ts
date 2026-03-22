export type DocumentType = 'ID_CARD' | 'PASSPORT'

export interface ParsedDocument {
  type: DocumentType
  number: string
}

export function parseDocument(pnOrIin: string | null | undefined): ParsedDocument | null {
  if (!pnOrIin) return null
  if (pnOrIin.startsWith('iin_')) return { type: 'ID_CARD', number: pnOrIin.slice(4) }
  if (pnOrIin.startsWith('pn_')) return { type: 'PASSPORT', number: pnOrIin.slice(3) }
  if (/^\d{12}$/.test(pnOrIin)) return { type: 'ID_CARD', number: pnOrIin }
  return { type: 'PASSPORT', number: pnOrIin }
}

export function formatDocumentForDisplay(pnOrIin: string | null | undefined): string {
  if (!pnOrIin) return '—'
  const parsed = parseDocument(pnOrIin)
  if (!parsed) return '—'
  const label = parsed.type === 'ID_CARD' ? 'УЛ РК' : 'Паспорт'
  return `${label}: ${parsed.number}`
}

export function documentTypeLabel(type: DocumentType): string {
  return type === 'ID_CARD' ? 'Удостоверение личности РК' : 'Паспорт'
}

export function isIinDocument(pnOrIin: string | null | undefined): boolean {
  if (!pnOrIin) return false
  return pnOrIin.startsWith('iin_') || /^\d{12}$/.test(pnOrIin)
}

export function buildPnOrIin(type: DocumentType, number: string): string {
  return type === 'ID_CARD' ? `iin_${number}` : `pn_${number}`
}
