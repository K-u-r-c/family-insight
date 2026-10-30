/**
 * GEDCOM line grammar and record tree, for 5.5, 5.5.1 and 7.0:
 * `level [@xref@] TAG [value]`, continued with `CONT` (new line) and `CONC` (same line).
 * Malformed lines become warnings with their line number; parsing never throws.
 */

export interface GedcomNode {
  level: number
  xref?: string
  tag: string
  value?: string
  children: GedcomNode[]
  /** 1-based line number in the file. */
  line: number
}

export interface GedcomWarning {
  line: number
  code: 'malformed-line' | 'level-jump' | 'orphan-continuation' | 'missing-head' | 'missing-trailer'
  text?: string
}

export interface GedcomDocument {
  /** Top-level records (`HEAD`, `INDI`, `FAM`, … `TRLR`). */
  records: GedcomNode[]
  /** `HEAD.GEDC.VERS`, e.g. `5.5.1` or `7.0`. */
  version?: string
  warnings: GedcomWarning[]
}

const LINE = /^\s*(\d{1,2})\s+(?:(@[^@\s][^@]*@)\s+)?([A-Za-z0-9_]+)(?: (.*))?$/

/** Unescapes `@@`: a leading `@@` always, inner ones in 5.5.x (7.0 only escapes the start). */
function unescape(value: string, v7: boolean): string {
  if (v7) return value.startsWith('@@') ? value.slice(1) : value
  return value.replace(/@@/g, '@')
}

export function parseGedcom(text: string): GedcomDocument {
  const warnings: GedcomWarning[] = []
  const records: GedcomNode[] = []
  const stack: GedcomNode[] = []
  const lines = text.split(/\r\n|\r|\n/)
  const v7 = /^\s*2\s+VERS\s+7/m.test(text.slice(0, 2000))
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    if (!raw.trim()) continue
    const lineNo = i + 1
    const m = LINE.exec(raw)
    if (!m) {
      warnings.push({ line: lineNo, code: 'malformed-line', text: raw.slice(0, 120) })
      continue
    }
    let level = Number(m[1])
    const tag = m[3]!.toUpperCase()
    const rawValue = m[4]
    if (tag === 'CONT' || tag === 'CONC') {
      const parent = stack[level - 1]
      if (!parent || level === 0) {
        warnings.push({ line: lineNo, code: 'orphan-continuation', text: raw.slice(0, 120) })
        continue
      }
      const part = rawValue === undefined ? '' : unescape(rawValue, v7)
      parent.value = (parent.value ?? '') + (tag === 'CONT' ? '\n' : '') + part
      continue
    }
    if (level > stack.length) {
      warnings.push({ line: lineNo, code: 'level-jump', text: raw.slice(0, 120) })
      level = stack.length
    }
    const node: GedcomNode = { level, tag, children: [], line: lineNo }
    if (m[2]) node.xref = m[2]
    if (rawValue !== undefined && rawValue !== '') {
      node.value = /^@[^@\s][^@]*@$/.test(rawValue) ? rawValue : unescape(rawValue, v7)
    }
    stack.length = level
    if (level === 0) records.push(node)
    else stack[level - 1]!.children.push(node)
    stack.push(node)
  }
  const head = records.find((r) => r.tag === 'HEAD')
  if (!head) warnings.push({ line: 1, code: 'missing-head' })
  if (!records.some((r) => r.tag === 'TRLR')) {
    warnings.push({ line: lines.length, code: 'missing-trailer' })
  }
  const version = child(child(head, 'GEDC'), 'VERS')?.value?.trim()
  return { records, version, warnings }
}

/** First child with the tag. */
export function child(node: GedcomNode | undefined, tag: string): GedcomNode | undefined {
  return node?.children.find((c) => c.tag === tag)
}

/** All children with the tag. */
export function children(node: GedcomNode | undefined, tag: string): GedcomNode[] {
  return node?.children.filter((c) => c.tag === tag) ?? []
}

/** Value of the first child with the tag. */
export function value(node: GedcomNode | undefined, tag: string): string | undefined {
  return child(node, tag)?.value
}

export interface WriteOptions {
  /** Longest line before values are split with `CONC` (GEDCOM: 255). */
  maxLineLength?: number
  /** GEDCOM 7: only a leading `@` is escaped, and `CONC` doesn't exist. */
  version7?: boolean
  newline?: string
}

function escape(value: string, v7: boolean): string {
  if (/^@[^@\s][^@]*@$/.test(value)) return value // a pointer
  if (v7) return value.startsWith('@') ? `@${value}` : value
  return value.replace(/@/g, '@@')
}

/**
 * Splits `text` into chunks no longer than `max`, never between a space and the next character
 * (so readers that trim lines don't lose spaces) unless a chunk has no other break.
 */
function splitConc(text: string, max: number): string[] {
  const parts: string[] = []
  let rest = text
  while (rest.length > max) {
    let cut = max
    while (cut > 1 && (rest[cut - 1] === ' ' || rest[cut] === ' ')) cut--
    if (cut <= 1) cut = max
    parts.push(rest.slice(0, cut))
    rest = rest.slice(cut)
  }
  parts.push(rest)
  return parts
}

/** Serialises records to GEDCOM text with `CONT` for new lines and `CONC` for long values. */
export function writeGedcom(records: GedcomNode[], options: WriteOptions = {}): string {
  const max = options.maxLineLength ?? 255
  const v7 = options.version7 ?? false
  const nl = options.newline ?? '\n'
  const out: string[] = []
  const write = (node: GedcomNode, level: number): void => {
    const prefix = `${level}${node.xref ? ` ${node.xref}` : ''} ${node.tag}`
    const lines = node.value === undefined ? [undefined] : node.value.split(/\r\n|\r|\n/)
    lines.forEach((text, i) => {
      const head = i === 0 ? prefix : `${level + 1} CONT`
      if (text === undefined || text === '') {
        out.push(head)
        return
      }
      const escaped = escape(text, v7)
      const room = Math.max(20, max - head.length - 1)
      const chunks = v7 ? [escaped] : splitConc(escaped, room)
      out.push(`${head} ${chunks[0]}`)
      for (const chunk of chunks.slice(1)) out.push(`${level + 1} CONC ${chunk}`)
    })
    for (const c of node.children) write(c, level + 1)
  }
  for (const record of records) write(record, 0)
  return out.join(nl) + nl
}

/** Builds a node (for writers and tests). */
export function node(
  tag: string,
  value?: string,
  childNodes: GedcomNode[] = [],
  xref?: string
): GedcomNode {
  const n: GedcomNode = { level: 0, tag, children: childNodes, line: 0 }
  if (value !== undefined) n.value = value
  if (xref) n.xref = xref
  return n
}
