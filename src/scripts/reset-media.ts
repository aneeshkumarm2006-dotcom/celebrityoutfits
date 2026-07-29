import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Deletes every media document so the library can be rebuilt from seed-assets.
 *
 *   pnpm reset:media && pnpm seed:portraits
 *
 * Re-uploading a file onto the document that already owns its filename makes
 * Payload treat the name as taken and append `-1`, so migrating in place
 * quietly renames the whole library. Deleting first avoids the collision
 * entirely, and `seed:portraits` re-attaches every portrait by celebrity slug,
 * so nothing is left dangling.
 *
 * Only safe while media is portraits alone — it will detach anything else that
 * references an image, so check before reaching for it again.
 */
const run = async () => {
  const payload = await getPayload({ config })

  for (const collection of ['looks', 'articles'] as const) {
    const { docs } = await payload.find({ collection, limit: 500, depth: 0, draft: true })
    const referencing = docs.filter((d) => Boolean((d as { heroImage?: unknown }).heroImage))
    if (referencing.length) {
      console.error(
        `Refusing to run: ${referencing.length} ${collection} reference media and would be detached.`,
      )
      process.exit(1)
    }
  }

  const { docs } = await payload.find({ collection: 'media', limit: 500, depth: 0 })
  for (const doc of docs) {
    await payload.delete({ collection: 'media', id: doc.id })
    console.log(`  deleted  ${(doc as { filename?: string }).filename}`)
  }

  payload.logger.info(`Media cleared: ${docs.length} removed. Now run: pnpm seed:portraits`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
