/** A few lines from beloved books — used to hold a quiet moment (the splash
 *  while auth resolves, and the home nook's fallback when there's nothing of
 *  yours or your circle's to surface yet). Honest atmosphere, never fake data. */
export interface Line {
  line: string
  source: string
}

export const LINES: Line[] = [
  // — Lines to live by —
  { line: 'Not all those who wander are lost.', source: 'The Lord of the Rings' },
  { line: 'It does not do to dwell on dreams and forget to live.', source: 'Harry Potter' },
  { line: 'It is our choices that show what we truly are.', source: 'Harry Potter' },
  { line: 'All we have to decide is what to do with the time that is given us.', source: 'The Lord of the Rings' },
  { line: 'There is some good in this world, and it’s worth fighting for.', source: 'The Lord of the Rings' },
  { line: 'Happiness can be found, even in the darkest of times.', source: 'Harry Potter' },
  { line: 'Whatever our souls are made of, his and mine are the same.', source: 'Wuthering Heights' },
  { line: 'So we beat on, boats against the current.', source: 'The Great Gatsby' },
  { line: 'The night is darkest just before the dawn.', source: 'A Tale of Two Cities' },
  { line: 'We read to know we are not alone.', source: 'C. S. Lewis' },
  { line: 'A reader lives a thousand lives before he dies.', source: 'A Dance with Dragons' },
  { line: 'Until I feared I would lose it, I never loved to read. One does not love breathing.', source: 'To Kill a Mockingbird' },
  { line: 'We accept the love we think we deserve.', source: 'The Perks of Being a Wallflower' },
  { line: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.', source: 'The Little Prince' },
  { line: 'And, when you want something, all the universe conspires in helping you to achieve it.', source: 'The Alchemist' },
  { line: 'Fear is the mind-killer.', source: 'Dune' },
  { line: 'The world breaks everyone, and afterward many are strong at the broken places.', source: 'A Farewell to Arms' },
  { line: 'There is no greater agony than bearing an untold story inside you.', source: 'I Know Why the Caged Bird Sings' },
  { line: 'The only way out of the labyrinth of suffering is to forgive.', source: 'Looking for Alaska' },
  { line: 'I am no bird; and no net ensnares me: I am a free human being with an independent will.', source: 'Jane Eyre' },
  { line: 'It is a far, far better thing that I do, than I have ever done.', source: 'A Tale of Two Cities' },
  { line: 'Beware; for I am fearless, and therefore powerful.', source: 'Frankenstein' },
  { line: 'We’re all mad here.', source: 'Alice’s Adventures in Wonderland' },
  { line: 'Time is not a line but a dimension, like the dimensions of space.', source: 'Cat’s Eye' },
  { line: 'Isn’t it pretty to think so?', source: 'The Sun Also Rises' },
  { line: 'Stay gold, Ponyboy.', source: 'The Outsiders' },
  { line: 'After all, tomorrow is another day.', source: 'Gone with the Wind' },
  { line: 'So it goes.', source: 'Slaughterhouse-Five' },

  // — Famous first lines —
  { line: 'Call me Ishmael.', source: 'Moby-Dick' },
  { line: 'It was a bright cold day in April, and the clocks were striking thirteen.', source: 'Nineteen Eighty-Four' },
  { line: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', source: 'Pride and Prejudice' },
  { line: 'All happy families are alike; each unhappy family is unhappy in its own way.', source: 'Anna Karenina' },
  { line: 'In a hole in the ground there lived a hobbit.', source: 'The Hobbit' },
  { line: 'It was a pleasure to burn.', source: 'Fahrenheit 451' },
  { line: 'Mother died today. Or maybe yesterday; I can’t be sure.', source: 'The Stranger' },
  { line: '124 was spiteful.', source: 'Beloved' },
  { line: 'Last night I dreamt I went to Manderley again.', source: 'Rebecca' },
  { line: 'As Gregor Samsa awoke one morning from uneasy dreams, he found himself transformed in his bed into a gigantic insect.', source: 'The Metamorphosis' },
  { line: 'Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice.', source: 'One Hundred Years of Solitude' },
  { line: 'The sky above the port was the color of television, tuned to a dead channel.', source: 'Neuromancer' },
  { line: 'Marley was dead, to begin with.', source: 'A Christmas Carol' },
  { line: 'It was a queer, sultry summer, the summer they electrocuted the Rosenbergs.', source: 'The Bell Jar' },
  { line: 'Where’s Papa going with that axe?', source: 'Charlotte’s Web' },
  { line: 'The man in black fled across the desert, and the gunslinger followed.', source: 'The Gunslinger' },
  { line: 'Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small, unregarded yellow sun.', source: 'The Hitchhiker’s Guide to the Galaxy' },
  { line: 'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow.', source: 'To Kill a Mockingbird' },
  { line: 'Ships at a distance have every man’s wish on board.', source: 'Their Eyes Were Watching God' },
  { line: 'It was the day my grandmother exploded.', source: 'The Crow Road' },
  { line: 'The past is a foreign country: they do things differently there.', source: 'The Go-Between' },
]

/** A random line. Call once per mount and hold it — keeps render pure. */
export function pickLine(): Line {
  return LINES[Math.floor(Math.random() * LINES.length)]
}
