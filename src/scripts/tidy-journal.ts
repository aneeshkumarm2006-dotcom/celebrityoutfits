import { existsSync, readFileSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Removes duplicate journal entries and gives every surviving article a hero.
 *
 *   pnpm tidy:journal
 *
 * Two pages covering the same subject compete with each other for the same
 * query and both rank worse than one would have. On a site whose entire
 * argument is organic search, that is not untidiness — it is the failure mode.
 *
 * Safe to re-run: deletion is by exact slug, and heroes are only attached to
 * articles that do not already have one.
 */

/** Superseded by a longer piece on the same subject, listed by slug. */
const SUPERSEDED = [
  // Same title and body as `same-four-things-for-forty-years`, created because
  // an earlier seed set that slug by hand and the title lookup missed it.
  'tom-cruise-has-worn-the-same-four-things-for-forty-years',
  // Same subject and same person as `method-dressing-is-a-discipline-not-a-gimmick`.
  'method-dressing-and-why-it-actually-works',
]

/** Articles with no celebrity of their own borrow a hero from a relevant one. */
const FALLBACK_HERO: Record<string, string> = {
  'five-things-that-make-red-carpet-tailoring-work': 'margot-robbie',
  'two-approaches-to-the-same-navy-suit': 'chris-hemsworth',
  'the-case-for-a-suit-that-actually-fits': 'tom-holland',
}

type HeroEntry = { slug: string; name: string; file: string; credit: string; licence: string }
const HEROES = 'seed-assets/heroes/manifest.json'
const toLicence = (raw: string): 'cc' | 'own' => (/^(cc|public domain)/i.test(raw) ? 'cc' : 'own')

const run = async () => {
  const payload = await getPayload({ config })

  const heroes: Record<string, HeroEntry> = existsSync(HEROES)
    ? Object.fromEntries(
        (JSON.parse(readFileSync(HEROES, 'utf8')) as HeroEntry[]).map((h) => [h.slug, h]),
      )
    : {}

  // ── Remove superseded duplicates ────────────────────────────────────────
  let removed = 0
  for (const slug of SUPERSEDED) {
    const { docs } = await payload.find({
      collection: 'articles',
      limit: 1,
      where: { slug: { equals: slug } },
      draft: true,
    })
    if (!docs[0]) continue
    await payload.delete({ collection: 'articles', id: docs[0].id })
    console.log(`  removed duplicate  /journal/${slug}`)
    removed++
  }

  // ── Give every remaining article a hero ─────────────────────────────────
  const { docs } = await payload.find({ collection: 'articles', limit: 500, depth: 0, draft: true })
  let attached = 0
  let stillMissing = 0

  for (const article of docs) {
    if ((article as { heroImage?: unknown }).heroImage) continue

    const slug = (article as { slug?: string }).slug ?? ''
    let celebSlug: string | undefined = FALLBACK_HERO[slug]

    if (!celebSlug) {
      const rel = (article as { relatedCelebrity?: number | { slug?: string } }).relatedCelebrity
      if (typeof rel === 'number') {
        const celeb = await payload.findByID({ collection: 'celebrities', id: rel, depth: 0 })
        celebSlug = (celeb as { slug?: string }).slug
      }
    }

    const hero = celebSlug ? heroes[celebSlug] : undefined
    if (!hero || !existsSync(hero.file)) {
      console.warn(`  no hero available  /journal/${slug}`)
      stillMissing++
      continue
    }

    const filename = basename(hero.file)
    const { docs: media } = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { equals: filename } },
    })
    const image =
      media[0] ??
      (await payload.create({
        collection: 'media',
        filePath: hero.file,
        data: {
          alt: `${hero.name}, photographed at a public appearance`,
          credit: hero.credit,
          licence: toLicence(hero.licence),
          caption: `${hero.name} · ${hero.licence}`,
        },
      }))

    await payload.update({
      collection: 'articles',
      id: article.id,
      data: { heroImage: image.id },
    })
    console.log(`  hero attached      /journal/${slug}  ← ${filename}`)
    attached++
  }

  payload.logger.info(
    `Journal tidied — ${removed} duplicates removed, ${attached} heroes attached, ${stillMissing} still without one.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
