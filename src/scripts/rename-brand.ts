import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Renames the brand everywhere it was already saved into the database.
 *
 *   pnpm rename:brand "Old Name" "New Name"
 *
 * The name in the source tree is only a default — it applies to rows that do
 * not exist yet. Everything already stored (site name, disclosure text, the
 * article bylines) keeps whatever it was seeded with, so a rename that only
 * touches code leaves the live site still saying the old thing.
 *
 * Walks every string in each document, so it catches copy inside Lexical
 * bodies and nested blocks without needing to know their shape.
 */
const deepReplace = <T>(value: T, from: string, to: string): T => {
  if (typeof value === 'string') return value.split(from).join(to) as unknown as T
  if (Array.isArray(value)) return value.map((v) => deepReplace(v, from, to)) as unknown as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, deepReplace(v, from, to)]),
    ) as T
  }
  return value
}

/** Payload rejects these on write — they are derived, not authored. */
const STRIP = new Set(['id', 'createdAt', 'updatedAt', 'globalType', 'sizes', 'filename', 'url'])

const withoutDerived = <T extends object>(doc: T): Partial<T> =>
  Object.fromEntries(Object.entries(doc).filter(([k]) => !STRIP.has(k))) as Partial<T>

const GLOBALS = ['siteSettings', 'homepage', 'navigation', 'footer'] as const
const COLLECTIONS = ['articles', 'celebrities', 'looks', 'brands'] as const

const run = async () => {
  const from = process.argv[2]
  const to = process.argv[3]
  if (!from || !to) {
    console.error('Usage: pnpm rename:brand "Old Name" "New Name"')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  let changed = 0

  // Deliberately unguarded: a mistyped slug here silently leaves the old name
  // on the live site, which is exactly the failure we are trying to fix.
  for (const slug of GLOBALS) {
    const doc = await payload.findGlobal({ slug })
    if (!JSON.stringify(doc).includes(from)) continue
    await payload.updateGlobal({
      slug,
      data: deepReplace(withoutDerived(doc), from, to),
    })
    changed++
    console.log(`  global      ${slug}`)
  }

  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({ collection, limit: 500, depth: 0, draft: true })
    for (const doc of docs) {
      if (!JSON.stringify(doc).includes(from)) continue
      await payload.update({
        collection,
        id: doc.id,
        data: deepReplace(withoutDerived(doc), from, to),
      })
      changed++
      console.log(`  ${collection.padEnd(11)} ${(doc as { slug?: string }).slug ?? doc.id}`)
    }
  }

  payload.logger.info(`Renamed "${from}" → "${to}" in ${changed} document(s).`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
