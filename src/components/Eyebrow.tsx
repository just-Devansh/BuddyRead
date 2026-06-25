import { createElement, type ElementType, type ReactNode } from 'react'

/**
 * The quiet mono micro-label that sits above headings and beside section rules
 * all over the app — "Reading together", "Your edition", "Today". Uppercase
 * IBM Plex Mono with wide tracking, in the faintest text tone by default.
 *
 * Rendered via createElement rather than `<Tag>` so the polymorphic `as` prop
 * doesn't trip TS's JSX children inference (react-three-fiber augments the JSX
 * namespace, which otherwise breaks the typing of polymorphic intrinsic tags).
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
  return createElement(
    Tag,
    {
      className: `font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint ${className}`,
    },
    children,
  )
}
