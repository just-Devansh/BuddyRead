import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Scales a fixed-width child down to fit the available column (never up), and
 * reserves the scaled height so layout doesn't jump. Lets the keepsake stay a
 * fixed pixel size (so PNG export is deterministic) while still fitting a phone.
 */
export function FitToWidth({ width, children }: { width: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const avail = outer.current?.clientWidth ?? width
      const s = Math.min(1, avail / width)
      setScale(s)
      setHeight((inner.current?.offsetHeight ?? 0) * s)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (outer.current) ro.observe(outer.current)
    if (inner.current) ro.observe(inner.current)
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={outer} className="w-full">
      <div className="mx-auto" style={{ width: width * scale, height: height || undefined }}>
        <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
