import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { slugify } from '@/fields/slug'

/**
 * Folds duplicate celebrities and brands into one record each, without
 * deleting anything.
 *
 *   pnpm merge:duplicates            # dry run: prints the plan, writes nothing
 *   pnpm merge:duplicates --apply    # does it
 *
 * The duplicates are almost all looks that were saved as a new person ("Selena
 * Gomez" with the slug of an outfit headline), so the looks are the content and
 * the spare profile is the mistake. For each group:
 *
 *  - the keeper is the record whose slug is the plain name (`selena-gomez`),
 *    otherwise the one with the most looks;
 *  - every look and article pointing at a spare moves to the keeper (products,
 *    for brands);
 *  - the spare is unpublished, never deleted, and a redirect sends its old URL
 *    to the keeper;
 *  - the keeper gets the plain-name slug if it does not already have it, with a
 *    redirect from the old one.
 *
 * Names are compared trimmed, case-folded and with accents stripped, so
 * "Khloé Kardashian" and "Khloe Kardashian " are the same person. Blank names
 * are left alone: there is nothing to match them on.
 */

const apply = process.argv.includes('--apply')

const normalise = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()

type Record = { id: number; name: string; slug: string; _status?: string | null; count: number }

const groupDuplicates = (records: Record[]) => {
  const groups = new Map<string, Record[]>()
  for (const record of records) {
    const key = normalise(record.name ?? '')
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), record])
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const plain = slugify(group[0].name.trim())
      const keeper =
        group.find((r) => r.slug === plain) ?? [...group].sort((a, b) => b.count - a.count)[0]
      return { keeper, spares: group.filter((r) => r !== keeper), plain }
    })
}

const addRedirect = async (
  payload: Payload,
  from: string,
  relationTo: 'celebrities' | 'brands',
  value: number,
) => {
  const existing = await payload.count({ collection: 'redirects', where: { from: { equals: from } } })
  if (existing.totalDocs > 0) return
  await payload.create({
    collection: 'redirects',
    data: { from, to: { type: 'reference', reference: { relationTo, value } } },
  })
}

const mergeCelebrities = async (payload: Payload) => {
  const { docs } = await payload.find({ collection: 'celebrities', limit: 1000, depth: 0, draft: false })
  const records: Record[] = await Promise.all(
    docs.map(async (d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      _status: d._status,
      count: (await payload.count({ collection: 'looks', where: { celebrity: { equals: d.id } } })).totalDocs,
    })),
  )

  for (const { keeper, spares, plain } of groupDuplicates(records)) {
    payload.logger.info(`Celebrity "${keeper.name.trim()}": keep #${keeper.id} /${keeper.slug}`)

    for (const spare of spares) {
      const looks = await payload.find({
        collection: 'looks',
        limit: 1000,
        depth: 0,
        where: { celebrity: { equals: spare.id } },
      })
      const articles = await payload.find({
        collection: 'articles',
        limit: 1000,
        depth: 0,
        where: { relatedCelebrity: { equals: spare.id } },
      })
      payload.logger.info(
        `  merge #${spare.id} /${spare.slug}: ${looks.totalDocs} look(s), ${articles.totalDocs} article(s); unpublish; redirect`,
      )
      for (const look of looks.docs) payload.logger.info(`    look: ${look.title || `#${look.id}`}`)
      if (!apply) continue

      for (const look of looks.docs) {
        await payload.update({ collection: 'looks', id: look.id, data: { celebrity: keeper.id } })
      }
      for (const article of articles.docs) {
        await payload.update({ collection: 'articles', id: article.id, data: { relatedCelebrity: keeper.id } })
      }
      await payload.update({ collection: 'celebrities', id: spare.id, data: { _status: 'draft' } })
      await addRedirect(payload, `/celebrities/${spare.slug}`, 'celebrities', keeper.id)
    }

    const tidyName = keeper.name.trim()
    const slugTaken = (
      await payload.count({ collection: 'celebrities', where: { slug: { equals: plain }, id: { not_equals: keeper.id } } })
    ).totalDocs
    const renameSlug = keeper.slug !== plain && !slugTaken
    if (renameSlug) payload.logger.info(`  rename /${keeper.slug} -> /${plain}; redirect`)
    if (!apply) continue

    if (renameSlug || tidyName !== keeper.name) {
      await payload.update({
        collection: 'celebrities',
        id: keeper.id,
        data: { name: tidyName, ...(renameSlug ? { slug: plain } : {}) },
      })
      if (renameSlug) await addRedirect(payload, `/celebrities/${keeper.slug}`, 'celebrities', keeper.id)
    }
  }
}

const mergeBrands = async (payload: Payload) => {
  const { docs } = await payload.find({ collection: 'brands', limit: 1000, depth: 0, draft: false })
  const records: Record[] = await Promise.all(
    docs.map(async (d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      _status: d._status,
      count: (await payload.count({ collection: 'products', where: { brand: { equals: d.id } } })).totalDocs,
    })),
  )

  for (const { keeper, spares } of groupDuplicates(records)) {
    payload.logger.info(`Brand "${keeper.name.trim()}": keep #${keeper.id} /${keeper.slug}`)

    for (const spare of spares) {
      const products = await payload.find({
        collection: 'products',
        limit: 1000,
        depth: 0,
        where: { brand: { equals: spare.id } },
      })
      const articles = await payload.find({
        collection: 'articles',
        limit: 1000,
        depth: 0,
        where: { relatedBrand: { equals: spare.id } },
      })
      payload.logger.info(
        `  merge #${spare.id} /${spare.slug}: ${products.totalDocs} product(s), ${articles.totalDocs} article(s); unpublish; redirect`,
      )
      if (!apply) continue

      for (const product of products.docs) {
        await payload.update({ collection: 'products', id: product.id, data: { brand: keeper.id } })
      }
      for (const article of articles.docs) {
        await payload.update({ collection: 'articles', id: article.id, data: { relatedBrand: keeper.id } })
      }
      await payload.update({ collection: 'brands', id: spare.id, data: { _status: 'draft' } })
      await addRedirect(payload, `/brands/${spare.slug}`, 'brands', keeper.id)
    }

    if (apply && keeper.name !== keeper.name.trim()) {
      await payload.update({ collection: 'brands', id: keeper.id, data: { name: keeper.name.trim() } })
    }
  }
}

const run = async () => {
  const payload = await getPayload({ config })
  payload.logger.info(apply ? 'Applying merge.' : 'Dry run. Nothing is written; pass --apply to merge.')
  await mergeCelebrities(payload)
  await mergeBrands(payload)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
