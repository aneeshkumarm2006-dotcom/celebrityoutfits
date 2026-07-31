import { existsSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Article, Brand } from '@/payload-types'

/**
 * The red RRL trucker Ryan Gosling wore at San Diego Comic-Con 2026.
 *
 *   pnpm seed:gosling
 *
 * A worked example of the archive's whole argument: a real garment, a named
 * brand, an original nobody can buy, and three honest ways to get near it.
 *
 * The jacket is logged `closest_match` rather than `confirmed` because the
 * identification rests on Esquire Australia's reporting, not on a visible
 * label. Recreations are logged as recreations — the sellers describe them
 * that way themselves, and passing one off as the original is precisely the
 * thing this site exists not to do.
 */

// ── Lexical helpers ────────────────────────────────────────────────────────
type LexicalNode = { [key: string]: unknown; type?: string; version?: number }

const text = (value: string, format = 0) => ({
  type: 'text', detail: 0, format, mode: 'normal', style: '', text: value, version: 1,
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

const doc = (children: LexicalNode[]): Article['body'] =>
  ({ root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }) as unknown as Article['body']

const richText = (paragraphs: string[]): Brand['description'] =>
  ({
    root: {
      type: 'root', format: '', indent: 0, version: 1, direction: 'ltr',
      children: paragraphs.map((value) => ({
        type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr',
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: value, version: 1 }],
      })),
    },
  }) as unknown as Brand['description']

// ── The garment ────────────────────────────────────────────────────────────
const LOOK_PHOTO = 'seed-assets/looks/ryan-gosling-sdcc-look.jpg'

const PRODUCTS = [
  {
    name: 'Vintage trucker jacket, red — 1980s',
    brand: 'rrl',
    description:
      'The jacket itself: an eighties RRL trucker in faded red denim with a camel corduroy collar. Long out of production, so the only route is the resale market — search the brand and the collar detail rather than the film or the actor, or you will land in a wall of recreations.',
    priceCents: 45000,
    merchant: 'Resale — eBay, Grailed, Poshmark',
    affiliateUrl: 'https://www.ebay.com/b/RRL-Denim-Jackets-for-Men/57988/bn_7110292175',
    inStock: false,
  },
  {
    name: 'Denim corduroy-collar trucker jacket',
    brand: 'rrl',
    description:
      'Still in production, same house, same collar detail. Indigo rather than red, so what you are matching is the cut and the corduroy — which is most of what makes the original read the way it does.',
    priceCents: 39800,
    merchant: 'Ralph Lauren',
    affiliateUrl:
      'https://www.ralphlauren.com/men-clothing-jackets-coats-vests/denim-corduroy-collar-trucker-jacket/0080542517.html',
    inStock: true,
  },
  {
    name: 'Red denim trucker — Comic-Con recreation',
    brand: undefined,
    description:
      'Not the jacket, and the seller says so: “we recreated this jacket for you.” Denim with a viscose lining, cut to echo the Comic-Con look at a fraction of resale money. Judge it as an inspired-by piece, which is what it is.',
    priceCents: 12900,
    merchant: 'NY Jacket',
    affiliateUrl: 'https://www.nyjacket.com/product/ryan-gosling-2026-san-diego-comic-con-jacket/',
    inStock: true,
  },
]

const ITEMS = [
  {
    label: 'Red denim trucker jacket, corduroy collar',
    category: 'outerwear' as const,
    confidence: 'closest_match' as const,
    product: 'Vintage trucker jacket, red — 1980s',
    alternative: 'Denim corduroy-collar trucker jacket',
    note: 'Identified as an eighties RRL by Esquire Australia. No label is visible in the photograph, so this stays a closest match rather than confirmed.',
  },
  {
    label: 'Plain white crew-neck tee',
    category: 'knitwear' as const,
    confidence: 'open' as const,
  },
  {
    label: 'Navy pleated trousers',
    category: 'trousers' as const,
    confidence: 'open' as const,
  },
  {
    label: 'Dark leather belt, silver buckle',
    category: 'other' as const,
    confidence: 'open' as const,
  },
]

// ── The piece ──────────────────────────────────────────────────────────────
const ARTICLE_BODY: LexicalNode[] = [
  p(
    'Within about twelve hours of Ryan Gosling walking onto the Hall H stage, somebody had posted the photograph to Reddit with three words underneath it: ID on jacket? Nine replies, no answer. That is usually a sign the jacket is worth the trouble.',
  ),
  p(
    'It is a red denim trucker, worn open over a plain white tee, with navy pleated trousers and a dark belt. The collar is up. Underneath the collar, if you look at the right frame, there is a strip of camel corduroy — and that detail is the whole identification.',
  ),
  h2('What it is'),
  p(
    'An eighties RRL trucker. Ralph Lauren\'s Double RL line, the one that does American workwear as a period exercise rather than a seasonal theme. Esquire Australia pinned it down: a beaten-up red vintage RRL from the 1980s, corduroy collar, popped in a way that is pure James Dean and almost certainly deliberate.',
  ),
  p(
    'The corduroy is the tell. Plenty of brands have made a red denim jacket. Almost nobody trims the collar in a contrasting cotton cord, and RRL has been doing exactly that on and off for thirty years.',
  ),
  quote('The corduroy collar is the identification. Everything else about the jacket is common.'),
  h2('Why you cannot buy it'),
  p(
    'Because it is forty years old. This is a piece his stylist Mark Avery pulled from somewhere, and Avery has been dressing Gosling for over a decade — the whole Project Hail Mary run has been worn-in workwear, trucker hats and faded denim rather than tailoring. It is a sourced garment, not a gifted one, and there is no product page waiting at the end of it.',
  ),
  p(
    'Which is why searching the actor\'s name gets you nowhere useful. Every result is a recreation. Search the brand instead.',
  ),
  h2('Three honest ways to get close'),
  p(
    'The real thing, second hand. Vintage RRL turns up on eBay, Grailed and Poshmark, usually between two and seven hundred dollars depending on how hard it has been worn. The corduroy collar is common in the line; red is the difficult part. Set a saved search and be patient.',
  ),
  p(
    'The same house, in production. Ralph Lauren still makes a denim trucker with a corduroy point collar. It is indigo, not red — but the cut and the collar are the two things doing the work in the original photograph, and you can have both today without waiting for a listing.',
  ),
  p(
    'A recreation, if you want the colour more than the label. Several shops have already cut a red denim version off the Comic-Con photographs, at around a hundred and thirty dollars. They are explicit that this is what they are: one of them writes, in as many words, that they recreated the jacket. That is a different product from an eighties RRL and should be judged as one — but if what you actually want is a red trucker with a popped collar, it is the cheapest route to it.',
  ),
  h2('The part worth stealing'),
  p(
    'Strip the provenance away and this is four plain things: a red jacket, a white tee, navy trousers, a dark belt. No pattern. No logo. One colour doing all the work, against a neutral that refuses to compete with it.',
  ),
  p(
    'The popped collar is the only styling decision in the entire outfit, and it is doing more than it should be allowed to. That is the lesson, and it costs nothing: pick one element, commit to it completely, and let everything else stay quiet enough that the choice reads as a choice.',
  ),
]

// ── Seed ───────────────────────────────────────────────────────────────────
const run = async () => {
  const payload = await getPayload({ config })

  // Brand — the line, not the parent house, because the line is the answer.
  const { docs: existingBrand } = await payload.find({
    collection: 'brands', limit: 1, where: { slug: { equals: 'rrl' } }, draft: true,
  })
  const brandData = {
    name: 'RRL',
    slug: 'rrl',
    website: 'https://www.ralphlauren.com/brands-double-rl',
    founded: '1993',
    description: richText([
      'Ralph Lauren’s Double RL line: American workwear treated as a period exercise rather than a seasonal theme. Repro denim, faded dye lots, and details — the corduroy collar among them — that the rest of the market abandoned decades ago.',
    ]),
    _status: 'published' as const,
  }
  const brand = existingBrand[0]
    ? await payload.update({ collection: 'brands', id: existingBrand[0].id, data: brandData })
    : await payload.create({ collection: 'brands', data: brandData })
  console.log(`  brand     ${existingBrand[0] ? 'updated' : 'created'}  RRL`)

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
      inStock: seed.inStock,
      priceCheckedAt: new Date().toISOString(),
      ...(seed.brand === 'rrl' ? { brand: brand.id as number } : {}),
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

  // Celebrity
  const { docs: celebs } = await payload.find({
    collection: 'celebrities', limit: 1, where: { slug: { equals: 'ryan-gosling' } }, draft: true,
  })
  const celebrity = celebs[0]
  if (!celebrity) {
    console.error('  Ryan Gosling not found — run pnpm seed:celebrities first')
    process.exit(1)
  }

  // Look photo, if it has been dropped in.
  let photoId: number | undefined
  if (existsSync(LOOK_PHOTO)) {
    const filename = basename(LOOK_PHOTO)
    const { docs: media } = await payload.find({
      collection: 'media', limit: 1, where: { filename: { equals: filename } },
    })
    const image =
      media[0] ??
      (await payload.create({
        collection: 'media',
        filePath: LOOK_PHOTO,
        data: {
          alt: 'Ryan Gosling at San Diego Comic-Con in a red RRL denim trucker jacket with the collar up',
          credit: 'Press image — rights holder to be confirmed before publication',
          licence: 'agency',
          caption: 'Ryan Gosling · San Diego Comic-Con 2026',
        },
      }))
    photoId = image.id as number
  } else {
    console.warn(`  no photo at ${LOOK_PHOTO} — look seeds without one`)
  }

  // Look
  const lookSlug = slugify('ryan-gosling-the-red-rrl-trucker-collar-up')
  const lookData = {
    celebrity: celebrity.id as number,
    title: 'The red RRL trucker, collar up',
    slug: lookSlug,
    date: new Date('2026-07-26').toISOString(),
    location: 'San Diego',
    occasion: 'press' as const,
    description:
      'A faded red denim trucker worn open over a plain white tee, collar popped to show the camel corduroy underside, with navy pleated trousers and a dark leather belt. One colour, three neutrals, and a single styling decision.',
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
      label: item.label,
      look: look.id as number,
      category: item.category,
      confidence: item.confidence,
      position: index,
      ...(item.note ? { evidenceNote: item.note } : {}),
      ...(item.product ? { product: productIds[item.product] } : {}),
      ...(item.alternative ? { alternativeProduct: productIds[item.alternative] } : {}),
    }
    const { docs } = await payload.find({
      collection: 'items', limit: 1,
      where: { look: { equals: look.id }, label: { equals: item.label } },
    })
    if (docs[0]) await payload.update({ collection: 'items', id: docs[0].id, data })
    else await payload.create({ collection: 'items', data })
    console.log(`  item      ${docs[0] ? 'updated' : 'created'}  ${item.label}`)
  }

  // Article
  const title = 'Ryan Gosling’s red Comic-Con jacket, and why you can’t buy it'
  const articleSlug = slugify('ryan-gosling-red-comic-con-jacket')
  const articleData = {
    title,
    template: 'generic' as const,
    excerpt:
      'An eighties RRL trucker with a camel corduroy collar, pulled from somewhere by a stylist and worn onto the Hall H stage. Here is the identification, why the original is unbuyable, and three honest ways to get near it.',
    author: 'The Celebrity Spotted Outfits desk',
    publishedAt: new Date().toISOString(),
    featured: true,
    relatedCelebrity: celebrity.id as number,
    relatedBrand: brand.id as number,
    ...(photoId ? { heroImage: photoId } : {}),
    keywords: [
      { keyword: 'Ryan Gosling', url: '/celebrities/ryan-gosling', rel: 'auto' as const },
      { keyword: 'RRL', url: '/brands/rrl', rel: 'auto' as const },
    ],
    body: doc(ARTICLE_BODY),
    _status: 'published' as const,
  }
  const { docs: existingArticle } = await payload.find({
    collection: 'articles', limit: 1,
    where: { or: [{ slug: { equals: articleSlug } }, { title: { equals: title } }] },
    draft: true,
  })
  if (existingArticle[0]) {
    await payload.update({ collection: 'articles', id: existingArticle[0].id, data: articleData })
  } else {
    await payload.create({ collection: 'articles', data: { ...articleData, slug: articleSlug } })
  }
  console.log(`  article   ${existingArticle[0] ? 'updated' : 'created'}  ${title}`)

  payload.logger.info(
    `Gosling SDCC seeded. Look: /celebrities/ryan-gosling/${lookSlug} · Article: /journal/${articleSlug}`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
