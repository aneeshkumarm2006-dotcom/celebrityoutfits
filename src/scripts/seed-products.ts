import { existsSync, readFileSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seeds products from photographs that have been looked at individually.
 *
 *   pnpm seed:products
 *
 * Every name here describes what is actually in its photograph. That sounds
 * obvious and was the hard part: an automated pass produced a replica Omega
 * labelled as an Omega, a doll's coat as a trench, and Onitsuka Tigers as
 * Common Projects. A brand is attached only where the photograph shows that
 * brand, and images of identifiable private individuals were rejected outright
 * — a licence to reuse a photograph is not permission to use someone's likeness
 * to sell something.
 *
 * These stand in until the merchant affiliate feeds land, which is where real
 * product photography, live prices and stock status come from.
 */
type Entry = { key: string; file: string; credit: string; licence: string; source: string }

type ProductSeed = {
  key: string
  name: string
  brand?: string
  description: string
  priceCents: number
  merchant: string
}

const PRODUCTS: ProductSeed[] = [
  {
    key: 'dive-watch',
    name: 'Submariner Date, yellow gold',
    brand: 'rolex',
    description:
      'The reference dive watch, in gold rather than the usual steel. Photographed as the ref. 16618 with a blue bezel and diamond-set dial.',
    priceCents: 3450000,
    merchant: 'Secondary market',
  },
  {
    key: 'dress-watch',
    name: 'Tank Américaine, steel',
    brand: 'cartier',
    description:
      'The elongated Tank, worn on an alligator strap. Roman numerals, blued hands, and a case that reads as taste rather than expenditure.',
    priceCents: 540000,
    merchant: 'Secondary market',
  },
  {
    key: 'loafer',
    name: 'Damier penny loafer, black',
    brand: 'louis-vuitton',
    description:
      'Black calf penny loafer with a tonal damier panel across the vamp. Leather sole, no visible branding beyond the pattern.',
    priceCents: 109000,
    merchant: 'Louis Vuitton',
  },
  {
    key: 'running-shoe',
    name: 'Fresh Foam More Trail, grey',
    brand: 'new-balance',
    description:
      'High-stack trail runner in grey mesh with a multicolour outsole. The off-duty shoe that a lot of well-dressed people quietly default to.',
    priceCents: 13500,
    merchant: 'New Balance',
  },
  {
    key: 'chelsea-boot',
    name: 'Chelsea boot, black calf',
    brand: undefined, // The photograph carries no maker's mark; naming one would be a guess.
    description:
      'Plain black calf Chelsea boot with elastic side gussets and a low stacked heel. The most useful boot under tailoring.',
    priceCents: 32000,
    merchant: 'Various',
  },
]

const MANIFEST = 'seed-assets/products/manifest.json'

const run = async () => {
  if (!existsSync(MANIFEST)) {
    console.error(`No manifest at ${MANIFEST}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const photos: Record<string, Entry> = Object.fromEntries(
    (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Entry[]).map((e) => [e.key, e]),
  )

  let created = 0
  let updated = 0

  for (const seed of PRODUCTS) {
    const photo = photos[seed.key]
    if (!photo || !existsSync(photo.file)) {
      console.warn(`  no photo for ${seed.name} — skipped`)
      continue
    }

    // Brand, if the photograph actually shows one.
    let brandId: number | undefined
    let brandSite: string | undefined
    if (seed.brand) {
      const { docs } = await payload.find({
        collection: 'brands',
        limit: 1,
        where: { slug: { equals: seed.brand } },
        draft: true,
      })
      brandId = docs[0]?.id as number | undefined
      brandSite = (docs[0] as { website?: string } | undefined)?.website
    }

    const filename = basename(photo.file)
    const { docs: existingMedia } = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { equals: filename } },
    })
    const image =
      existingMedia[0] ??
      (await payload.create({
        collection: 'media',
        filePath: photo.file,
        data: {
          alt: seed.name,
          credit: photo.credit || 'Wikimedia Commons',
          licence: /^(cc|public domain)/i.test(photo.licence) ? 'cc' : 'promotional',
          caption: `${seed.name} · ${photo.licence}`,
        },
      }))

    const data = {
      name: seed.name,
      description: seed.description,
      priceCents: seed.priceCents,
      currency: 'USD' as const,
      merchant: seed.merchant,
      image: image.id,
      /**
       * No affiliate programmes are approved yet, so this points at the brand's
       * own site. `/go/[id]` cloaks it either way, which means swapping in a
       * tracked URL later changes nothing anywhere else on the site.
       */
      affiliateUrl: brandSite ?? 'https://www.example.com',
      inStock: true,
      priceCheckedAt: new Date().toISOString(),
      ...(brandId ? { brand: brandId } : {}),
    }

    const { docs: existing } = await payload.find({
      collection: 'products',
      limit: 1,
      where: { name: { equals: seed.name } },
    })

    if (existing[0]) {
      await payload.update({ collection: 'products', id: existing[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'products', data })
      created++
    }
    console.log(`  ${existing[0] ? 'updated' : 'created'}  ${seed.name}`)
  }

  payload.logger.info(`Products seeded — ${created} created, ${updated} updated.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
