import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'

/**
 * Seeds the opening celebrity roster.
 *
 * The standfirsts are editorial starting points, not researched copy — they
 * describe broad, observable patterns so there is something on the page, and
 * they are meant to be rewritten once real looks are logged. Nothing here
 * asserts a specific brand or garment, because that would be inventing facts.
 *
 * Idempotent: matches on slug, so re-running updates rather than duplicating.
 */
type Seed = {
  name: string
  category: 'film' | 'music' | 'sport' | 'creator'
  standfirst: string
  rank?: number
  featured?: boolean
}

const roster: Seed[] = [
  {
    name: 'Tom Holland',
    category: 'film',
    standfirst:
      'Press-tour tailoring at one end, skate-adjacent basics at the other, with very little in between. The suits are cut close and worn young.',
    featured: true,
    rank: 2,
  },
  {
    name: 'Zendaya',
    category: 'film',
    standfirst:
      'The most method-dressed person on any red carpet — outfits chosen to argue with the film she is promoting rather than to flatter her.',
    featured: true,
    rank: 3,
  },
  {
    name: 'Robert Downey Jr.',
    category: 'film',
    standfirst:
      'Tailoring worn with deliberate friction: strong colour, heavy eyewear, and an accessory doing more work than the suit underneath it.',
    featured: true,
    rank: 4,
  },
  {
    name: 'Chris Hemsworth',
    category: 'film',
    standfirst:
      'Built-for-the-frame tailoring on the carpet, and an almost aggressively plain off-duty wardrobe of tees, shorts and caps.',
  },
  {
    name: 'Chris Evans',
    category: 'film',
    standfirst:
      'The most conservative dresser of the Marvel cohort, and the most consistent: navy, grey, a knit, a boot. Nothing that dates.',
  },
  {
    name: 'David Corenswet',
    category: 'film',
    standfirst:
      'Old-Hollywood proportions revived without irony — high-rise trousers, generous lapels, and a shoulder line most of his peers avoid.',
  },
  {
    name: 'Timothée Chalamet',
    category: 'film',
    standfirst:
      'Treats the red carpet as the point rather than the obligation. Harnesses, backless tailoring, colour worn head to toe.',
    featured: true,
    rank: 5,
  },
  {
    name: 'Ryan Gosling',
    category: 'film',
    standfirst:
      'A narrow, controlled palette worn with unusual discipline — then occasionally detonated entirely for a press tour.',
  },
  {
    name: 'Margot Robbie',
    category: 'film',
    standfirst:
      'Archive-literate dressing: specific decades referenced precisely rather than gestured at.',
  },
  {
    name: 'Florence Pugh',
    category: 'film',
    standfirst:
      'Volume, sheerness and colour used as argument. Very little interest in being flattering for its own sake.',
  },
  {
    name: 'Austin Butler',
    category: 'film',
    standfirst:
      'A leaner, dressier silhouette than most of his generation — jackets buttoned, boots pointed, tailoring taken seriously.',
  },
  {
    name: 'Jacob Elordi',
    category: 'film',
    standfirst:
      'Oversize everything, worn with the confidence of someone tall enough to carry it. Suiting cut generously, never tight.',
  },
  {
    name: 'Sydney Sweeney',
    category: 'film',
    standfirst:
      'Structured, corseted carpet dressing set against an off-duty wardrobe of denim and workwear.',
  },
  {
    name: 'Anya Taylor-Joy',
    category: 'film',
    standfirst:
      'The closest thing to a house muse on a modern carpet — sculptural, editorial, and rarely repeating a silhouette.',
  },
  {
    name: 'Michael B. Jordan',
    category: 'film',
    standfirst:
      'Tailoring with a sportswear posture: sharp jackets, relaxed trousers, and footwear doing the talking.',
  },
  {
    name: 'Pedro Pascal',
    category: 'film',
    standfirst:
      'Colour, print and comfort in equal measure — the rare A-lister who dresses like he is enjoying it.',
  },
  {
    name: 'Paul Mescal',
    category: 'film',
    standfirst:
      'Short shorts, plain knitwear and unfussy tailoring. An anti-stylist look that turned into an actual one.',
  },
  {
    name: 'Andrew Garfield',
    category: 'film',
    standfirst:
      'Softly-constructed tailoring in muted colour, worn slightly loose. Quiet, and consistent about it.',
  },
  {
    name: 'Anne Hathaway',
    category: 'film',
    standfirst:
      'A late-career reinvention into some of the most decisive red-carpet dressing of the moment.',
  },
  {
    name: 'Ryan Reynolds',
    category: 'film',
    standfirst:
      'Uncomplicated on purpose: a well-cut suit, a plain knit, and no interest in being the story.',
  },
]

const run = async () => {
  const payload = await getPayload({ config })

  let created = 0
  let updated = 0

  for (const person of roster) {
    const slug = slugify(person.name)
    const { docs } = await payload.find({
      collection: 'celebrities',
      limit: 1,
      where: { slug: { equals: slug } },
      draft: true,
    })

    const data = {
      name: person.name,
      slug,
      category: person.category,
      standfirst: person.standfirst,
      featured: person.featured ?? false,
      rank: person.rank ?? 0,
      _status: 'published' as const,
    }

    if (docs[0]) {
      await payload.update({ collection: 'celebrities', id: docs[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'celebrities', data })
      created++
    }
  }

  payload.logger.info(
    `Roster seeded — ${created} created, ${updated} updated. Standfirsts are placeholders: rewrite them as real looks are logged.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
