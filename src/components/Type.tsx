import type { ElementType, ReactNode } from 'react'

/** each line sits in its own overflow mask so it can rise into view */
export function MaskLines({ lines, as: Tag = 'span', className = '' }: { lines: readonly string[]; as?: ElementType; className?: string }) {
  return (
    <Tag className={`mlines ${className}`}>
      {lines.map((line, i) => (
        <span className="mline" key={i}>
          <span className="mline__inner">{line}</span>
        </span>
      ))}
    </Tag>
  )
}

/** splits a word into per-letter spans: an outer one for scroll, an inner one for reveals */
export function Letters({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`letters ${className}`} aria-hidden="true">
      {Array.from(text).map((ch, i) => (
        <span className="letter" key={i} style={{ ['--i' as string]: i }}>
          <span className="letter__inner">{ch}</span>
        </span>
      ))}
    </span>
  )
}

export function ChapterHead({ no, title, children }: { no: string; title: string; children?: ReactNode }) {
  return (
    <header className="chead">
      <span className="chead__no mono">{no}</span>
      <span className="chead__rule" />
      <span className="chead__title mono">{title}</span>
      {children}
    </header>
  )
}
