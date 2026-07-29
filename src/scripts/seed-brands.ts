import { existsSync, readFileSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Brand } from '@/payload-types'

/**
 * Seeds the brand directory from seed-assets/brands/manifest.json.
 *
 *   pnpm seed:brands
 *
 * Logos come from Wikimedia Commons and are almost all {{PD-textlogo}} — plain
 * wordmarks that sit below the threshold of originality, so no copyright
 * attaches. Trademark still does: they are here to identify the brand, which is
 * what a directory is for. Anything without a freely-licensed logo seeds
 * without one rather than borrowing a file we have no right to.
 *
 * Idempotent: matches on slug, so re-running updates rather than duplicating.
 */
type Entry = {
  slug: string
  name: string
  website: string
  founded: string
  description: string
  file?: string
  credit?: string
  licence?: string
  source?: string
}

const MANIFEST = 'seed-assets/brands/manifest.json'

/** Map a Commons licence string onto the Media collection's vocabulary. */
const toLicence = (raw?: string): 'cc' | 'promotional' =>
  raw && /^(cc|public domain)/i.test(raw) ? 'cc' : 'promotional'

/** Minimal Lexical document — the description field is rich text. */
const richText = (paragraphs: string[]): Brand['description'] =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((value) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: value, version: 1 },
        ],
      })),
    },
  }) as unknown as Brand['description']

const run = async () => {
  if (!existsSync(MANIFEST)) {
    console.error(`No manifest at ${MANIFEST}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const entries: Entry[] = JSON.parse(readFileSync(MANIFEST, 'utf8'))

  let created = 0
  let updated = 0
  let withLogo = 0

  for (const entry of entries) {
    const slug = entry.slug || slugify(entry.name)

    // Upload the logo first so the brand can reference it, matching on filename
    // so a re-run reuses the existing media document.
    let logoId: number | undefined
    if (entry.file && existsSync(entry.file)) {
      const filename = basename(entry.file)
      const { docs: existingMedia } = await payload.find({
        collection: 'media',
        limit: 1,
        where: { filename: { equals: filename } },
      })

      const media =
        existingMedia[0] ??
        (await payload.create({
          collection: 'media',
          filePath: entry.file,
          data: {
            alt: `${entry.name} logo`,
            credit: entry.credit || 'Wikimedia Commons',
            licence: toLicence(entry.licence),
            caption: `${entry.name} · ${entry.licence ?? 'Wikimedia Commons'}`,
          },
        }))

      logoId = media.id as number
      withLogo++
    }

    const data = {
      name: entry.name,
      slug,
      website: entry.website,
      founded: entry.founded,
      description: richText([entry.description]),
      ...(logoId ? { logo: logoId } : {}),
      _status: 'published' as const,
    }

    const { docs } = await payload.find({
      collection: 'brands',
      limit: 1,
      where: { slug: { equals: slug } },
      draft: true,
    })

    if (docs[0]) {
      await payload.update({ collection: 'brands', id: docs[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'brands', data })
      created++
    }
    console.log(`  ${docs[0] ? 'updated' : 'created'}  ${entry.name.padEnd(22)} ${logoId ? 'logo' : '—'}`)
  }

  payload.logger.info(
    `Brands seeded — ${created} created, ${updated} updated, ${withLogo} with logos.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
