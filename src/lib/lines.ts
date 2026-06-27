/** A few lines from beloved books — used to hold a quiet moment (the splash
 *  while auth resolves, and the home nook's fallback when there's nothing of
 *  yours or your circle's to surface yet). Honest atmosphere, never fake data. */
export interface Line {
  line: string
  source: string
}

export const LINES: Line[] = [
  { line: 'Not all those who wander are lost.', source: 'The Lord of the Rings' },
  { line: 'It does not do to dwell on dreams and forget to live.', source: 'Harry Potter' },
  { line: 'It is our choices that show what we truly are.', source: 'Harry Potter' },
  { line: 'All we have to decide is what to do with the time that is given us.', source: 'The Lord of the Rings' },
  { line: 'There is some good in this world, and it’s worth fighting for.', source: 'The Lord of the Rings' },
  { line: 'Happiness can be found, even in the darkest of times.', source: 'Harry Potter' },
  { line: 'Whatever our souls are made of, his and mine are the same.', source: 'Wuthering Heights' },
  { line: 'It is a truth universally acknowledged…', source: 'Pride and Prejudice' },
  { line: 'So we beat on, boats against the current.', source: 'The Great Gatsby' },
  { line: 'The night is darkest just before the dawn.', source: 'A Tale of Two Cities' },
  { line: 'We read to know we are not alone.', source: 'C. S. Lewis' },
  { line: 'A reader lives a thousand lives before he dies.', source: 'A Dance with Dragons' },
  { line: 'Until I feared I would lose it, I never loved to read. One does not love breathing.', source: 'To Kill a Mockingbird' },
]

/** A random line. Call once per mount and hold it — keeps render pure. */
export function pickLine(): Line {
  return LINES[Math.floor(Math.random() * LINES.length)]
}
