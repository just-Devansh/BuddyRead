import { useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { SPINES } from '../lib/spines'
import { booksOnShelf, SHELVES, spineToneFor, type LibraryItem } from '../lib/library'
import type { BookshelfProps } from '../library/bookshelf'

/**
 * The 3D bookshelf — an isolated, lazily-loaded enhancement over the flat CSS
 * shelf. Real spines stand on three shelves (To Read · Read · Favorites); the
 * case eases toward the pointer for a little parallax, a spine lifts on hover,
 * and a tap hands the book up to the Library screen, which brings its cover
 * forward. Self-contained: react-three-fiber + three only, no external assets,
 * so it loads offline and rolls back cleanly (delete this folder + the deps).
 */

const W = 6.2 // case inner width
const D = 1.3 // shelf depth
const FRAME = '#5a3d27'
const BACK = '#211509'
const TOP = 3.15
// y of each shelf surface (where a book's foot rests), top shelf first.
const SURFACES = [1.45, -0.35, -2.15]

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}
function spineHeight(pages: number | null) {
  return clamp(0.9 + (pages ?? 280) / 600, 1.0, 1.6)
}

/** One upright book. Eases its lift on hover; reports a tap. */
function Spine3D({
  item,
  x,
  surfaceY,
  onSelect,
}: {
  item: LibraryItem
  x: number
  surfaceY: number
  onSelect: (i: LibraryItem) => void
}) {
  const ref = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const h = spineHeight(item.book.pageCount)
  const baseY = surfaceY + h / 2
  const color = SPINES[spineToneFor(item.id)].from

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const target = baseY + (hovered ? 0.22 : 0)
    g.position.y += (target - g.position.y) * 0.18
  })

  return (
    <group
      ref={ref}
      position={[x, baseY, 0.1]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onSelect(item)
      }}
    >
      <mesh>
        <boxGeometry args={[0.24, h, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.78} metalness={0.04} />
      </mesh>
    </group>
  )
}

/** A shelf's worth of spines, spaced to fit the case width. */
function ShelfRow({
  books,
  surfaceY,
  onSelect,
}: {
  books: LibraryItem[]
  surfaceY: number
  onSelect: (i: LibraryItem) => void
}) {
  const n = books.length
  if (n === 0) return null
  const spacing = Math.min(0.36, (W - 0.6) / n)
  const startX = -((n - 1) * spacing) / 2
  return (
    <>
      {books.map((b, i) => (
        <Spine3D
          key={b.id}
          item={b}
          x={startX + i * spacing}
          surfaceY={surfaceY}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

/** The wooden case: back, sides, top, and the three planks. */
function Case() {
  const plankY = SURFACES.map((y) => y - 0.06)
  return (
    <group>
      <mesh position={[0, 0.45, -D / 2]}>
        <boxGeometry args={[W + 0.24, 5.9, 0.1]} />
        <meshStandardMaterial color={BACK} roughness={0.95} />
      </mesh>
      <mesh position={[-(W / 2 + 0.06), 0.45, 0]}>
        <boxGeometry args={[0.12, 5.9, D]} />
        <meshStandardMaterial color={FRAME} roughness={0.85} />
      </mesh>
      <mesh position={[W / 2 + 0.06, 0.45, 0]}>
        <boxGeometry args={[0.12, 5.9, D]} />
        <meshStandardMaterial color={FRAME} roughness={0.85} />
      </mesh>
      <mesh position={[0, TOP, 0]}>
        <boxGeometry args={[W + 0.24, 0.14, D]} />
        <meshStandardMaterial color={FRAME} roughness={0.85} />
      </mesh>
      {plankY.map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[W + 0.1, 0.13, D]} />
          <meshStandardMaterial color={FRAME} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/** The scene root — eases toward the pointer for gentle parallax. */
function Scene({ items, onSelect }: BookshelfProps) {
  const root = useRef<Group>(null)
  useFrame((state) => {
    const g = root.current
    if (!g) return
    const tx = state.pointer.x * 0.22
    const ty = -state.pointer.y * 0.1
    g.rotation.y += (tx - g.rotation.y) * 0.05
    g.rotation.x += (ty - g.rotation.x) * 0.05
  })
  return (
    <group ref={root}>
      <Case />
      {SHELVES.map((s, i) => (
        <ShelfRow
          key={s.key}
          books={booksOnShelf(items, s.key)}
          surfaceY={SURFACES[i]}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

export default function Bookshelf3D({ items, onSelect }: BookshelfProps) {
  return (
    <div className="h-[62vh] min-h-[420px] overflow-hidden rounded-2xl border border-[#3a2817] shadow-[0_24px_48px_-28px_rgba(20,12,4,0.8)]">
      <Canvas camera={{ position: [0, 0.3, 7.2], fov: 34 }} dpr={[1, 2]}>
        <color attach="background" args={['#1a1109']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[2.5, 4, 5]} intensity={1.15} />
        <pointLight position={[-3, 2.5, 3]} intensity={28} color="#c79a4e" distance={16} />
        <Scene items={items} onSelect={onSelect} />
      </Canvas>
    </div>
  )
}
