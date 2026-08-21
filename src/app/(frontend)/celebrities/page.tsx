import type { Metadata } from 'next'

import { CelebrityCard } from '@/components/site/cards'
import { Container } from '@/components/site/primitives'
import { getCelebrities } from '@/lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Celebrities',
  description:
    'Every person we track has a permanent page that grows with each new photograph.',
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/**
 * Grouped on the first letter of the name as it is displayed, so "Tom Holland"
 * files under T. A surname index would put him under H, which is correct in a
 * library and wrong on a page where every card reads "Tom Holland": people look
 * for the string they can see.
 *
 * Anything not starting with A-Z lands in the trailing "#" group rather than
 * being dropped, which is the only way a name we have not thought of still
 * appears somewhere.
 */
const groupByLetter = <T extends { name?: string | null }>(people: T[]) => {
  const groups = new Map<string, T[]>()

  for (const person of people) {
    const first = (person.name ?? '').trim().charAt(0).toUpperCase()
    const key = LETTERS.includes(first) ? first : '#'
    const bucket = groups.get(key)
    if (bucket) bucket.push(person)
    else groups.set(key, [person])
  }

  return [...groups.entries()].sort(([a], [b]) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })
}

export default async function CelebritiesPage() {
  const celebrities = await getCelebrities()

  /**
   * Re-sorted by name here rather than in the query. The shared `getCelebrities`
   * sort puts featured people first, which is right on the homepage and wrong
   * in an alphabetical index: it would drop three names above the letter A.
   */
  const sorted = [...celebrities].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '', 'en', { sensitivity: 'base' }),
  )
  const groups = groupByLetter(sorted)
  const present = new Set(groups.map(([letter]) => letter))

  return (
    <Container>
      <section className="py-12 sm:py-16">
        <p className="eyebrow">The archive</p>
        <h1 className="mt-4 mb-5 font-display text-[clamp(2.75rem,6vw,5rem)] leading-none font-normal tracking-[-0.02em]">
          Celebrities
        </h1>
        <p className="mb-8 max-w-[38rem] text-ink-2">
          Every person we track has a permanent page that grows with each new photograph.
        </p>

        {celebrities.length === 0 ? (
          <p className="text-muted">
            No celebrities published yet. Add one in the admin under Archive → Celebrities.
          </p>
        ) : (
          <>
            {/**
             * The jump bar. Letters we have are links; the rest stay in place,
             * greyed, because a row that changes width as the archive grows is
             * harder to use than one that is always the same shape.
             */}
            <nav
              aria-label="Jump to a letter"
              className="sticky top-16 z-30 -mx-6 mb-10 border-y border-rule bg-paper/95 px-6 py-3 backdrop-blur sm:-mx-10 sm:px-10 sm:top-[70px] lg:-mx-14 lg:px-14"
            >
              <ul className="flex flex-wrap gap-x-1 gap-y-1.5">
                {[...LETTERS, '#'].map((letter) =>
                  present.has(letter) ? (
                    <li key={letter}>
                      <a
                        href={`#letter-${letter === '#' ? 'other' : letter}`}
                        className="block min-w-7 rounded-sm px-1.5 py-1 text-center text-[0.8125rem] text-ink no-underline transition-colors hover:bg-raised hover:text-accent"
                      >
                        {letter}
                      </a>
                    </li>
                  ) : (
                    <li
                      key={letter}
                      aria-hidden="true"
                      className="min-w-7 px-1.5 py-1 text-center text-[0.8125rem] text-faint"
                    >
                      {letter}
                    </li>
                  ),
                )}
              </ul>
            </nav>

            <div className="grid gap-14">
              {groups.map(([letter, people]) => (
                <section
                  key={letter}
                  id={`letter-${letter === '#' ? 'other' : letter}`}
                  /* Clears the header and the jump bar when linked to. */
                  className="scroll-mt-[8.5rem]"
                >
                  <div className="mb-6 flex items-baseline gap-4 border-b border-rule pb-2">
                    <h2 className="m-0 font-display text-[var(--text-step-3)] leading-none font-normal">
                      {letter}
                    </h2>
                    <span className="text-[0.8125rem] text-muted">
                      {people.length} {people.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-9">
                    {people.map((celebrity) => (
                      <CelebrityCard key={celebrity.id} celebrity={celebrity} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </section>
    </Container>
  )
}
