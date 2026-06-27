/**
 * The catalog layer (M3). A thin, typed client over the Google Books API plus
 * cover handling with an Open Library fallback. No Firebase here — search and
 * book detail are read-only browsing; snapshotting a chosen book into a read
 * comes in M4.
 *
 * The API key is optional: keyless volume queries work at a lower quota, which
 * is plenty for two friends. Set VITE_GOOGLE_BOOKS_API_KEY to raise it.
 */

const API = 'https://www.googleapis.com/books/v1/volumes'

// Treat the .env.example placeholder as "unset" so a half-filled env doesn't
// send a bogus key.
const rawKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
const KEY =
  rawKey && rawKey !== 'your-google-books-api-key' ? rawKey : undefined

/** A book, normalized down to just what BuddyRead shows. */
export interface Book {
  id: string
  title: string
  subtitle: string | null
  authors: string[]
  description: string | null // plain text — Google's HTML is flattened
  publishedDate: string | null
  year: number | null
  pageCount: number | null
  categories: string[]
  publisher: string | null
  isbn13: string | null
  isbn10: string | null
  language: string | null
  coverUrl: string | null // Google's cover, https + de-curled
}

// --- Google Books wire shapes (only the fields we read) --------------------

interface ImageLinks {
  smallThumbnail?: string
  thumbnail?: string
  small?: string
  medium?: string
  large?: string
  extraLarge?: string
}

interface GoogleVolume {
  id: string
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    pageCount?: number
    categories?: string[]
    language?: string
    industryIdentifiers?: { type: string; identifier: string }[]
    imageLinks?: ImageLinks
  }
}

/** Google's cover URLs come http + curled-edge; tidy them for crisp display. */
function improveCover(url: string): string {
  return url.replace(/^http:/, 'https:').replace(/&edge=curl/, '')
}

/** Biggest cover Google offers, https-ified. */
function bestGoogleCover(links?: ImageLinks): string | null {
  if (!links) return null
  // Prefer `thumbnail`: it's the reliable colourful cover (and what search uses).
  // Google's larger sizes are sometimes a different, plainer scan of the same
  // book — a white page of black text — so we only fall back to them.
  const raw =
    links.thumbnail ??
    links.small ??
    links.medium ??
    links.large ??
    links.smallThumbnail
  return raw ? improveCover(raw) : null
}

/**
 * Flatten Google's HTML description to plain text. We render it as a quiet
 * prose block, so paragraph and break tags become newlines and everything else
 * is dropped. Using textContent (never innerHTML) keeps this injection-safe.
 */
function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html')
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim()
}

function normalizeVolume(v: GoogleVolume): Book {
  const info = v.volumeInfo ?? {}
  const ids = info.industryIdentifiers ?? []
  const findId = (type: string) =>
    ids.find((i) => i.type === type)?.identifier ?? null
  const year = info.publishedDate
    ? Number(info.publishedDate.slice(0, 4)) || null
    : null

  return {
    id: v.id,
    title: info.title ?? 'Untitled',
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    description: info.description ? htmlToText(info.description) : null,
    publishedDate: info.publishedDate ?? null,
    year,
    pageCount: info.pageCount ?? null,
    categories: info.categories ?? [],
    publisher: info.publisher ?? null,
    isbn13: findId('ISBN_13'),
    isbn10: findId('ISBN_10'),
    language: info.language ?? null,
    coverUrl: bestGoogleCover(info.imageLinks),
  }
}

/** Search the catalog. Returns [] for a blank query; throws on a failed fetch. */
export async function searchBooks(
  query: string,
  signal?: AbortSignal,
): Promise<Book[]> {
  const q = query.trim()
  if (!q) return []

  const url = new URL(API)
  url.searchParams.set('q', q)
  url.searchParams.set('maxResults', '20')
  url.searchParams.set('printType', 'books')
  if (KEY) url.searchParams.set('key', KEY)

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json()) as { items?: GoogleVolume[] }
  return (data.items ?? []).map(normalizeVolume)
}

/** Fetch a single book by its Google volume id. */
export async function getBook(id: string, signal?: AbortSignal): Promise<Book> {
  const url = new URL(`${API}/${encodeURIComponent(id)}`)
  if (KEY) url.searchParams.set('key', KEY)

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Couldn't load that book (${res.status})`)
  return normalizeVolume((await res.json()) as GoogleVolume)
}

/** Cover by ISBN from Open Library — the fallback when Google has no image. */
export function openLibraryCover(
  book: Pick<Book, 'isbn13' | 'isbn10'>,
): string | null {
  const isbn = book.isbn13 ?? book.isbn10
  // `default=false` makes Open Library 404 (rather than serve a blank) when it
  // has no cover, so the <img> onError chain can fall through to a placeholder.
  return isbn
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
    : null
}

/** Ordered cover URLs to try, best first; BookCover walks these on error. */
export function coverCandidates(
  book: Pick<Book, 'coverUrl' | 'isbn13' | 'isbn10'>,
): string[] {
  return [book.coverUrl, openLibraryCover(book)].filter(
    (url): url is string => Boolean(url),
  )
}

/** "Donna Tartt", "Neil Gaiman & Terry Pratchett", or a quiet fallback. */
export function authorLine(authors: string[]): string {
  if (authors.length === 0) return 'Unknown author'
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`
  return `${authors[0]} & ${authors.length - 1} others`
}
