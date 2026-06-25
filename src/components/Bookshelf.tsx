import { Component, lazy, Suspense, type ReactNode } from 'react'
import { BookshelfFlat } from './BookshelfFlat'
import type { BookshelfProps } from '../library/bookshelf'

/**
 * Bookshelf renderer selector. The 3D shelf is an opt-in enhancement, loaded
 * lazily (so three.js never touches the main bundle) with the flat CSS shelf as
 * both the loading fallback and an automatic crash fallback. To roll the 3D
 * experiment back: flip USE_3D to false (instant), then delete `src/library3d/`
 * and the three/@react-three deps.
 */
const USE_3D = true

const Bookshelf3D = lazy(() => import('../library3d/Bookshelf3D'))

/** Catches any 3D/WebGL failure and shows the flat shelf instead. */
class ThreeBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function Bookshelf(props: BookshelfProps) {
  const flat = <BookshelfFlat {...props} />
  if (!USE_3D) return flat
  return (
    <ThreeBoundary fallback={flat}>
      <Suspense fallback={flat}>
        <Bookshelf3D {...props} />
      </Suspense>
    </ThreeBoundary>
  )
}
