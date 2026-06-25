import type { LibraryItem } from '../lib/library'

/**
 * The contract every bookshelf renderer fulfils, so the Library screen can swap
 * the flat (CSS) shelf and the 3D shelf freely. The renderer draws the three
 * shelves of spines and reports a tap; the screen owns the centred cover reveal.
 */
export interface BookshelfProps {
  items: LibraryItem[]
  onSelect: (item: LibraryItem) => void
}
