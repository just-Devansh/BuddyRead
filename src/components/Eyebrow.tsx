import type { ElementType, ReactNode } from 'react'

/**
 * The quiet mono micro-label that sits above headings and beside section rules
 * all over the app — "Reading together", "Your edition", "Today". Uppercase
 * IBM Plex Mono with wide tracking, in the faintest text tone by default.
 */
export function Eyebrow({
  children,
  as: Tag = 'span',
  className = '',
}: {
  children: ReactNode
  as?: ElementType
  className?: string
}) {
  return (
    <Tag
      className={`font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint ${className}`}
    >
      {children}
    </Tag>
  )
}
