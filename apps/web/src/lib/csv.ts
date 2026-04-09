/** RFC 4180-style cell escaping for CSV rows. */
export function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function rowToCsvLine(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',')
}
