import { Fragment, type ReactNode } from 'react'

/**
 * A small, safe Markdown renderer for release notes: headings, paragraphs, lists, bold,
 * italics, inline code and links. Text is only ever rendered as React text (no raw HTML), and
 * only `https:` links are clickable – they open in the external browser.
 */

export type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string }

export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: string[] | null = null
  const flush = (): void => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
    if (list) blocks.push({ type: 'list', items: list })
    list = null
  }
  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    const item = /^\s*[-*+]\s+(.*)$/.exec(line)
    if (!line.trim()) flush()
    else if (heading) {
      flush()
      blocks.push({ type: 'heading', level: heading[1]!.length, text: heading[2]! })
    } else if (item) {
      if (paragraph.length) flush()
      list ??= []
      list.push(item[1]!)
    } else if (list && /^\s{2,}\S/.test(raw)) {
      list[list.length - 1] += ` ${line.trim()}`
    } else {
      if (list) flush()
      paragraph.push(line.trim())
    }
  }
  flush()
  return blocks
}

const INLINE =
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

export function renderInline(text: string, onLink: (url: string) => void): ReactNode[] {
  // HTML tags are shown as written text, never interpreted.
  return text.split(INLINE).map((part, i): ReactNode => {
    if (!part) return null
    if (/^(\*\*|__)/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^`/.test(part)) return <code key={i}>{part.slice(1, -1)}</code>
    if (/^[*_]/.test(part) && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const url = link[2]!
      if (!/^https:\/\//i.test(url)) return <Fragment key={i}>{link[1]}</Fragment>
      return (
        <a
          key={i}
          href={url}
          onClick={(e) => {
            e.preventDefault()
            onLink(url)
          }}
        >
          {link[1]}
        </a>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

export function Markdown({
  source,
  onLink
}: {
  source: string
  onLink: (url: string) => void
}): React.JSX.Element {
  return (
    <>
      {parseBlocks(source).map((block, i) => {
        if (block.type === 'heading') {
          const Tag = block.level <= 2 ? 'h3' : 'h4'
          return <Tag key={i}>{renderInline(block.text, onLink)}</Tag>
        }
        if (block.type === 'list') {
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, onLink)}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{renderInline(block.text, onLink)}</p>
      })}
    </>
  )
}
