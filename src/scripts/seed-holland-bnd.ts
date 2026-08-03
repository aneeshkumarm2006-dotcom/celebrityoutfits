import { existsSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Look } from '@/payload-types'

/**
 * Tom Holland at the Spider-Man: Brand New Day premiere, Los Angeles.
 *
 *   pnpm seed:holland
 *
 * The jacket is custom Jacquemus and has no retail equivalent — the house's
 * current men's blazers run black, navy, beige and one neon green, and none has
 * the lapel-less wrap front. Four sellers list a "Brand New Day Tom Holland
 * blazer"; every one turned out to be a different outfit from the same tour,
 * relabelled. Linking any of them would have sold a dark brown double-breasted
 * suit as a crimson wrap-front jacket.
 *
 * So the alternatives here are the real house, at retail, with the colour said
 * out loud in the product name. An honest "close, but navy" beats a dishonest
 * "exact match".
 */
type LexicalNode = { [key: string]: unknown; type?: string; version?: number }

const text = (value: string) => ({
  type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: value, version: 1,
})
const node = (children: LexicalNode[], type = 'paragraph', tag?: string) => ({
  type, ...(tag ? { tag } : {}), format: '', indent: 0, version: 1,
  direction: 'ltr' as const, children,
})
const p = (value: string) => node([text(value)])
const h2 = (value: string) => node([text(value)], 'heading', 'h2')
const quote = (value: string) => ({
  type: 'block', format: '', version: 2,
  fields: { blockType: 'pullQuote', blockName: '', quote: value, attribution: '' },
})
const doc = (children: LexicalNode[]): Look['story'] =>
  ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }) as unknown as Look['story']

const LOOK_PHOTO = 'seed-assets/looks/tom-holland-bnd-look.jpg'
const FARFETCH = 'https://www.farfetch.com/shopping/men'

/**
 * Colour is in the name on purpose. These are the right house and the right
 * designer, and the wrong colour — a reader deciding whether to spend a
 * thousand dollars should not have to click through to discover that.
 */
const PRODUCTS = [
  {
    name: 'La Veste Cabri blazer — navy',
    description:
      'Jacquemus tailoring at retail, in navy rather than crimson. Softer shoulder and shorter body than a conventional blazer, which is the part of the premiere look you can actually buy.',
    priceCents: 147700,
    merchant: 'Farfetch',
    affiliateUrl: `${FARFETCH}/jacquemus-la-veste-cabri-blazer-item-22564448.aspx`,
    imageUrl: 'https://cdn-images.farfetch-contents.com/22/56/44/48/22564448_52595812_480.jpg',
  },
  {
    name: 'The Cuadrada blazer — black',
    description:
      'The closest thing in the current line to the premiere jacket’s rounded, squared-off shape. Black, double-breasted, and the cheapest route into the house’s tailoring.',
    priceCents: 96600,
    merchant: 'Farfetch',
    affiliateUrl: `${FARFETCH}/jacquemus-the-cuadrada-blazer-item-24667080.aspx`,
    imageUrl: 'https://cdn-images.farfetch-contents.com/24/66/70/80/24667080_54899574_480.jpg',
  },
  {
    name: 'Canvas blazer — sand',
    description:
      'Same relaxed construction in a warm neutral. Nothing like the colour, but the nearest match for the cut if crimson was never the point.',
    priceCents: 132600,
    merchant: 'Farfetch',
    affiliateUrl: `${FARFETCH}/jacquemus-canvas-blazer-item-27372586.aspx`,
    imageUrl: 'https://cdn-images.farfetch-contents.com/27/37/25/86/27372586_58032659_480.jpg',
  },
]

const ITEMS = [
  {
    description: 'Crimson wrap-front blazer, no lapels',
    category: 'tailoring' as const,
    confidence: 'closest_match' as const,
    product: 'La Veste Cabri blazer — navy',
    more: ['The Cuadrada blazer — black', 'Canvas blazer — sand'],
    note:
      'Custom Jacquemus, built off the Le Palmier collection — reported, not read off a label, so it stays a closest match. No retail version exists in crimson: the current men’s line is black, navy, beige and one neon green, and none has the lapel-less wrap front. Alternatives are the same house in the colours actually sold.',
  },
  {
    description: 'Matching crimson trousers, straight leg',
    category: 'trousers' as const,
    confidence: 'closest_match' as const,
    note: 'Part of the same custom suit.',
  },
  {
    description: 'Poppy-red shirt',
    category: 'shirting' as const,
    confidence: 'open' as const,
  },
  {
    description: 'Navy silk tie',
    category: 'other' as const,
    confidence: 'open' as const,
    note: 'The only blue in the outfit, and the reason the whole thing reads as Spider-Man.',
  },
  {
    description: 'Oxblood leather derby shoes',
    category: 'footwear' as const,
    confidence: 'open' as const,
  },
]

const STORY: LexicalNode[] = [
  p(
    'The trick with dressing for a superhero premiere is that the obvious move is always available and always wrong. Wear the logo and you are in merchandise. Wear the colours literally and you are in costume. Most people take the safe way out and wear black.',
  ),
  p(
    'Holland wore the colours. All of them. And somehow avoided both traps.',
  ),
  h2('The setting'),
  p(
    'The Dolby Theatre in Hollywood, 27 July, closing out a press tour that had already run through New York, Madrid and Amsterdam. Blue carpet rather than red — the film’s own palette, laid on the floor.',
  ),
  p(
    'By this point in a tour the looks are usually running out of ideas. This was the last big one before London, and it was the best of them.',
  ),
  h2('The outfit'),
  p(
    'A crimson suit, custom Jacquemus, built off the house’s Le Palmier collection. Under it, a poppy-red shirt in a slightly brighter, warmer red. Then a navy tie. Oxblood derbies.',
  ),
  p(
    'The jacket is the interesting part. No lapels, no visible fastening — the front simply wraps and closes on an asymmetric curve, so the only line on the whole garment is that soft diagonal edge. It is Simon Porte Jacquemus’ signature move: take the structure out of tailoring and let the shape do the work.',
  ),
  quote('Red suit, red shirt, blue tie. Nobody says Spider-Man and everybody sees it.'),
  h2('Why it works'),
  p(
    'Red on red should be a mess. It holds here because the two reds are deliberately different temperatures — the suit deep and slightly brown, the shirt bright and clean — so they read as a considered pair rather than a failed match.',
  ),
  p(
    'And the tie is the whole joke. One narrow strip of navy against all that red, and the reference lands. No logo, no crest, nothing a stranger on the street would clock. Someone who has never seen a Spider-Man film just sees a man in a very good red suit.',
  ),
  p(
    'That is the difference between method dressing and fancy dress, and it is a narrower line than it looks.',
  ),
  h2('What you can actually buy'),
  p(
    'Not this. It was made for him, and Jacquemus does not sell it. The current men’s blazers run black, navy, beige and one alarming neon green — no crimson, and nothing with the wrap front.',
  ),
  p(
    'Several shops list a "Brand New Day Tom Holland blazer". Every one we checked turned out to be a different outfit from the same press tour, relabelled — one is a dark brown double-breasted suit from another city entirely. The alternatives below are the real house at retail, with the colour in the name, so you can see what you are and are not getting.',
  ),
]

const run = async () => {
  const payload = await getPayload({ config })

  const { docs: brands } = await payload.find({
    collection: 'brands', limit: 1, where: { slug: { equals: 'jacquemus' } }, draft: true,
  })
  const brand = brands[0]
  if (!brand) {
    console.error('  Jacquemus brand missing — run pnpm seed:brands first')
    process.exit(1)
  }

  const { docs: celebs } = await payload.find({
    collection: 'celebrities', limit: 1, where: { slug: { equals: 'tom-holland' } }, draft: true,
  })
  const celebrity = celebs[0]
  if (!celebrity) {
    console.error('  Tom Holland missing — run pnpm seed:celebrities first')
    process.exit(1)
  }

  // Photograph
  let photoId: number | undefined
  if (existsSync(LOOK_PHOTO)) {
    const filename = basename(LOOK_PHOTO)
    const { docs: media } = await payload.find({
      collection: 'media', limit: 1, where: { filename: { equals: filename } },
    })
    /**
     * The focal point goes in at creation, not as a follow-up update.
     *
     * Updating it separately trips `clearStaleDerivatives`, which frees the
     * blob paths so a re-crop can be written — but an update carrying no file
     * gives Payload nothing to write, so the paths are freed and left empty.
     * Doing it in one call means the sizes are generated once, already
     * anchored, and never deleted.
     */
    const image =
      media[0] ??
      (await payload.create({
        collection: 'media',
        filePath: LOOK_PHOTO,
        data: {
          alt: 'Tom Holland at the Spider-Man: Brand New Day Los Angeles premiere in a crimson Jacquemus suit with a red shirt and navy tie',
          credit: 'Amy Sussman / Getty Images',
          licence: 'agency',
          sourceAgency: 'Getty Images',
          caption: 'Tom Holland · Spider-Man: Brand New Day premiere, Los Angeles',
          // Full-length shot: keeps the head in frame when cropped to a banner.
          focalX: 50,
          focalY: 18,
        },
      }))
    photoId = image.id as number
  } else {
    console.warn(`  no photo at ${LOOK_PHOTO}`)
  }

  // Products
  const productIds: Record<string, number> = {}
  for (const seed of PRODUCTS) {
    const data = {
      name: seed.name,
      description: seed.description,
      priceCents: seed.priceCents,
      currency: 'USD' as const,
      merchant: seed.merchant,
      affiliateUrl: seed.affiliateUrl,
      imageUrl: seed.imageUrl,
      inStock: true,
      brand: brand.id as number,
      priceCheckedAt: new Date().toISOString(),
    }
    const { docs } = await payload.find({
      collection: 'products', limit: 1, where: { name: { equals: seed.name } },
    })
    const product = docs[0]
      ? await payload.update({ collection: 'products', id: docs[0].id, data })
      : await payload.create({ collection: 'products', data })
    productIds[seed.name] = product.id as number
    console.log(`  product   ${docs[0] ? 'updated' : 'created'}  ${seed.name}`)
  }

  // Look
  const lookSlug = slugify('tom-holland-crimson-jacquemus-brand-new-day-premiere')
  const lookData = {
    celebrity: celebrity.id as number,
    title: 'Crimson Jacquemus, and a navy tie',
    slug: lookSlug,
    date: new Date('2026-07-27').toISOString(),
    location: 'Los Angeles',
    occasion: 'premiere' as const,
    event: 'Spider-Man: Brand New Day premiere · Dolby Theatre',
    description:
      'A custom crimson Jacquemus suit over a poppy-red shirt, finished with a navy tie. The jacket has no lapels and no visible fastening — just an asymmetric curve across the wrap front.',
    story: doc(STORY),
    ...(photoId ? { photos: [photoId] } : {}),
    featured: true,
    _status: 'published' as const,
  }
  const { docs: existingLook } = await payload.find({
    collection: 'looks', limit: 1, where: { slug: { equals: lookSlug } }, draft: true,
  })
  const look = existingLook[0]
    ? await payload.update({ collection: 'looks', id: existingLook[0].id, data: lookData })
    : await payload.create({ collection: 'looks', data: lookData })
  console.log(`  look      ${existingLook[0] ? 'updated' : 'created'}  ${lookData.title}`)

  // Items
  for (const [index, item] of ITEMS.entries()) {
    const data = {
      description: item.description,
      look: look.id as number,
      category: item.category,
      confidence: item.confidence,
      position: index,
      ...(item.note ? { evidenceNote: item.note } : {}),
      ...(item.product ? { product: productIds[item.product] } : {}),
      ...(item.more?.length
        ? { moreOptions: item.more.map((name) => productIds[name]).filter(Boolean) }
        : {}),
    }
    const { docs } = await payload.find({
      collection: 'items', limit: 1,
      where: { look: { equals: look.id }, description: { equals: item.description } },
    })
    if (docs[0]) await payload.update({ collection: 'items', id: docs[0].id, data })
    else await payload.create({ collection: 'items', data })
    console.log(`  item      ${docs[0] ? 'updated' : 'created'}  ${item.description}`)
  }

  payload.logger.info(
    `Holland premiere seeded. Look: /celebrities/tom-holland/${lookSlug}`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
