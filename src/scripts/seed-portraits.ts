import { existsSync, readFileSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Uploads celebrity portraits into the media library and attaches them.
 *
 *   pnpm seed:portraits [path-to-manifest.json]
 *
 * Defaults to the manifest committed under `seed-assets/`, so a fresh database
 * on any machine can be repopulated without re-scraping Commons.
 *
 * Every image carries its real photographer credit and licence, because the
 * media collection refuses to save without them — which is the whole point of
 * making those fields required.
 *
 * Idempotent: media is matched by filename, so re-running replaces nothing.
 */
const DEFAULT_MANIFEST = 'seed-assets/portraits/manifest.json'

type Entry = {
  slug: string
  name: string
  file: string
  credit: string
  licence: string
  source: string
}

/** Map a Commons licence string onto our own controlled vocabulary. */
const toLicence = (raw: string): 'cc' | 'own' => (/^(cc|public domain)/i.test(raw) ? 'cc' : 'own')

const run = async () => {
  const manifestPath = process.argv[2] ?? DEFAULT_MANIFEST
  if (!existsSync(manifestPath)) {
    console.error(`No manifest at ${manifestPath}`)
    console.error('Usage: pnpm seed:portraits [path-to-manifest.json]')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const entries: Entry[] = JSON.parse(readFileSync(manifestPath, 'utf8'))

  let attached = 0
  let skipped = 0

  for (const entry of entries) {
    if (!existsSync(entry.file)) {
      console.warn(`  missing file for ${entry.name}`)
      skipped++
      continue
    }

    const { docs: celebs } = await payload.find({
      collection: 'celebrities',
      limit: 1,
      where: { slug: { equals: entry.slug } },
      draft: true,
    })
    const celebrity = celebs[0]
    if (!celebrity) {
      console.warn(`  no celebrity for slug "${entry.slug}"`)
      skipped++
      continue
    }

    const filename = basename(entry.file)
    const { docs: existing } = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { equals: filename } },
    })

    const media =
      existing[0] ??
      (await payload.create({
        collection: 'media',
        filePath: entry.file,
        data: {
          alt: `${entry.name}, photographed at a public appearance`,
          credit: entry.credit,
          licence: toLicence(entry.licence),
          caption: `${entry.name} · ${entry.licence}`,
        },
      }))

    await payload.update({
      collection: 'celebrities',
      id: celebrity.id,
      data: { portraitImage: media.id },
    })

    attached++
    console.log(`  ${entry.name.padEnd(20)} ← ${filename}  (${entry.licence})`)
  }

  payload.logger.info(`Portraits attached: ${attached}, skipped: ${skipped}`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
