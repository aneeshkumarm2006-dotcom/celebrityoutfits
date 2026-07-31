import config from '@payload-config'
import { getPayload } from 'payload'

import { identifyGarments, isConfigured } from '@/lib/ai/identify'

/**
 * Pre-fills the review queue for one look.
 *
 *   pnpm identify <lookId>
 *
 * Every item it creates lands with the model's own confidence and an evidence
 * note, so a human can confirm or correct it. Nothing is auto-published.
 */
const run = async () => {
  const lookId = process.argv[2]
  if (!lookId) {
    console.error('Usage: pnpm identify <lookId>')
    process.exit(1)
  }

  if (!isConfigured()) {
    console.error(
      'ANTHROPIC_API_KEY is not set.\n' +
        'Add it to .env to enable identification:\n' +
        '  ANTHROPIC_API_KEY=sk-ant-…',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const look = await payload.findByID({ collection: 'looks', id: lookId, depth: 2 })
  const photo = Array.isArray(look.photos) ? look.photos[0] : null
  const url = photo && typeof photo === 'object' ? photo.url : null

  if (!url) {
    console.error('That look has no photo to analyse.')
    process.exit(1)
  }

  const absolute = url.startsWith('http')
    ? url
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${url}`

  payload.logger.info(`Identifying garments in: ${look.title}`)

  const { garments, refused } = await identifyGarments({
    imageUrl: absolute,
    context: [look.description, look.occasion, look.location].filter(Boolean).join(' · '),
  })

  if (refused) {
    payload.logger.warn('The request was declined by safety classifiers. Nothing was created.')
    process.exit(0)
  }

  let position = 0
  for (const garment of garments) {
    await payload.create({
      collection: 'items',
      data: {
        look: look.id,
        // The model already describes colour, material and silhouette; joining
        // them is a better public description than the category alone, and an
        // editor can rewrite it without touching the evidence note.
        description:
          [garment.colour, garment.material, garment.silhouette]
            .filter(Boolean)
            .join(' ')
            .trim() || garment.category,
        category: garment.category as never,
        confidence: garment.confidence,
        evidenceNote:
          `${garment.evidenceNote} — ${garment.colour} ${garment.material} ${garment.silhouette}` +
          (garment.suggestedBrand ? ` · suggested: ${garment.suggestedBrand}` : '') +
          ' · [AI suggestion, unverified]',
        position: position++,
      },
    })
  }

  const open = garments.filter((g) => g.confidence === 'open').length
  payload.logger.info(
    `Created ${garments.length} item(s) — ${garments.length - open} with a suggestion, ${open} left open. All need review.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
