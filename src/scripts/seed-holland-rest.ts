import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'

/**
 * Fills in the four garments on the Brand New Day premiere look that had
 * nothing buyable attached.
 *
 *   pnpm seed:holland-rest
 *
 * None of these is the actual piece. The suit is custom Jacquemus and the
 * shirt, tie and shoes were never credited anywhere, so every product here is
 * a "get the look" equivalent and is labelled as one. Nothing is upgraded to
 * closest match to make the page look better resolved than it is.
 *
 * Colour was checked by eye against the premiere photograph rather than taken
 * from the product title, because the titles lie: Farfetch's search for "red
 * shirt" returns tartan, and one listing called "Polo Ralph Lauren Shirts Red"
 * is a check flannel. Every image below was viewed as a contact sheet first.
 */
const LOOK_SLUG = 'tom-holland-crimson-jacquemus-brand-new-day-premiere'

const FF = 'https://www.farfetch.com/shopping/men'
const SS = 'https://www.ssense.com/en-us/men/product'
const FFI = 'https://cdn-images.farfetch-contents.com'
const SSI =
  'https://img.ssensemedia.com/image/upload/b_white,c_lpad,g_south,ar_2:3/f_auto,c_limit,w_1920,q_85'

type Seed = {
  name: string
  brand: string
  description: string
  priceCents: number
  merchant: string
  affiliateUrl: string
  imageUrl: string
}

/**
 * Brands not already on the site.
 *
 * `website` and `founded` only, because those are the two things that can be
 * stated without research. An invented founding decade on a brand page is the
 * same failure as an invented garment identification.
 */
const NEW_BRANDS: { name: string; website: string; founded?: string }[] = [
  { name: 'AllSaints', website: 'allsaints.com', founded: '1994' },
  { name: 'Karl Lagerfeld', website: 'karl.com', founded: '1984' },
  { name: 'ETRO', website: 'etro.com', founded: '1968' },
  { name: 'Our Legacy', website: 'ourlegacy.com', founded: '2005' },
  { name: 'Homme Plissé Issey Miyake', website: 'isseymiyake.com', founded: '2013' },
  { name: 'Canali', website: 'canali.com', founded: '1934' },
  { name: "Doucal's", website: 'doucals.com', founded: '1973' },
  { name: 'Scarosso', website: 'scarosso.com', founded: '2010' },
]

const PRODUCTS: Seed[] = [
  // Crimson trousers
  {
    name: 'Raides tailored trousers in brick red',
    brand: 'AllSaints',
    description:
      'The nearest thing at a sane price to the trousers of the premiere suit: a warm brick red rather than a blue-toned wine, which is the half of the colour most red trousers get wrong.',
    priceCents: 20400,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/allsaints-raides-tailored-trousers-item-35792116.aspx`,
    imageUrl: `${FFI}/35/79/21/16/35792116_69983064_480.jpg`,
  },
  {
    name: 'Pleated side-pocket trousers in wine',
    brand: 'Karl Lagerfeld',
    description: 'Deeper and cooler than the premiere colour, and by far the cheapest way in.',
    priceCents: 8700,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/karl-lagerfeld-pleated-side-pocket-trousers-item-31058720.aspx`,
    imageUrl: `${FFI}/31/05/87/20/31058720_60757709_480.jpg`,
  },
  {
    name: 'Button pleated trousers in deep burgundy',
    brand: 'ETRO',
    description: 'Better cloth and a proper pleat, in a burgundy that reads darker on camera.',
    priceCents: 43900,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/etro-button-pleated-trousers-item-32557765.aspx`,
    imageUrl: `${FFI}/32/55/77/65/32557765_63427388_480.jpg`,
  },

  // Poppy-red shirt
  {
    name: 'Above Shirt in red',
    brand: 'Our Legacy',
    description:
      'A plain red shirt with a proper spread collar and a full button front, which is the construction the premiere shirt actually has. Slightly deeper than poppy.',
    priceCents: 43000,
    merchant: 'SSENSE',
    affiliateUrl: `${SS}/our-legacy/red-above-shirt/18122861`,
    imageUrl: `${SSI}/252803M192016_1.jpg`,
  },
  {
    name: 'Streamline Shirt in poppy red',
    brand: 'Homme Plissé Issey Miyake',
    description:
      'The closer colour of the two, a bright poppy red rather than a crimson. Cut as a half-placket pullover, so the front is not the same.',
    priceCents: 56000,
    merchant: 'SSENSE',
    affiliateUrl: `${SS}/homme-plisse-issey-miyake/red-streamline-shirt/18997441`,
    imageUrl: `${SSI}/261729M192022_1.jpg`,
  },

  // Navy tie
  {
    name: 'Silk tie in navy',
    brand: 'Prada',
    description:
      'Plain navy silk, no pattern. The premiere tie does one job and one only, which is to put a single strip of blue against all that red.',
    priceCents: 39000,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/prada-silk-tie-item-37344266.aspx`,
    imageUrl: `${FFI}/37/34/42/66/37344266_70011654_480.jpg`,
  },
  {
    name: 'Textured silk tie in dark navy',
    brand: 'Canali',
    description: 'Same idea with a faint texture, at well under half the price.',
    priceCents: 23400,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/canali-textured-silk-tie-item-17968241.aspx`,
    imageUrl: `${FFI}/17/96/82/41/17968241_37916279_480.jpg`,
  },
  {
    name: 'Silk tie in blue',
    brand: 'Canali',
    description: 'A lighter, greyer blue. Cheapest of the three and the furthest from the original.',
    priceCents: 17500,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/canali-blue-silk-tie-item-34731312.aspx`,
    imageUrl: `${FFI}/34/73/13/12/34731312_65904558_480.jpg`,
  },

  // Oxblood derbies
  {
    name: 'Lace-up leather Derby shoes in oxblood',
    brand: "Doucal's",
    description:
      'Plain-toed, polished oxblood, no brogueing. The premiere shoe is deliberately quiet, and a wingtip would have added a pattern the outfit does not want.',
    priceCents: 60300,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/doucals-lace-up-leather-derby-shoes-item-37648025.aspx`,
    imageUrl: `${FFI}/37/64/80/25/37648025_70751659_480.jpg`,
  },
  {
    name: 'Harry leather derby shoes in oxblood',
    brand: 'Scarosso',
    description: 'The same shape for a hundred dollars less.',
    priceCents: 50800,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/scarosso-harry-leather-derby-shoes-item-22362116.aspx`,
    imageUrl: `${FFI}/22/36/21/16/22362116_52555022_480.jpg`,
  },
  {
    name: 'Leather Derby shoes in burgundy',
    brand: "Doucal's",
    description: 'A rounder toe and a slightly redder finish.',
    priceCents: 68700,
    merchant: 'Farfetch',
    affiliateUrl: `${FF}/doucals-leather-derby-shoes-item-37646737.aspx`,
    imageUrl: `${FFI}/37/64/67/37/37646737_70751218_480.jpg`,
  },
]

/** Which product leads each item, and what sits under it. */
const WIRING: {
  item: string
  product: string
  more: string[]
  note: string
}[] = [
  {
    item: 'Matching crimson trousers, straight leg',
    product: 'Raides tailored trousers in brick red',
    more: ['Pleated side-pocket trousers in wine', 'Button pleated trousers in deep burgundy'],
    note:
      'Part of the same custom Jacquemus suit, so there is nothing to buy. These are equivalents chosen on colour, warm brick red rather than the blue-toned wine most red trousers come in.',
  },
  {
    item: 'Poppy-red shirt',
    product: 'Above Shirt in red',
    more: ['Streamline Shirt in poppy red'],
    note:
      'Never credited by the stylist and no label is visible in any frame, so the brand is genuinely unknown. Both options are plain red shirts, and neither is claimed to be the one he wore.',
  },
  {
    item: 'Navy silk tie',
    product: 'Silk tie in navy',
    more: ['Textured silk tie in dark navy', 'Silk tie in blue'],
    note: 'Uncredited. Plain navy silk is the whole specification, so these are matched on colour and finish.',
  },
  {
    item: 'Oxblood leather derby shoes',
    product: 'Lace-up leather Derby shoes in oxblood',
    more: ['Harry leather derby shoes in oxblood', 'Leather Derby shoes in burgundy'],
    note: 'Uncredited, and barely in frame. Matched on shape and colour: plain-toed oxblood derby, no brogueing.',
  },
]

const run = async () => {
  const payload = await getPayload({ config })

  // Brands
  const brandIds: Record<string, number> = {}
  const { docs: existing } = await payload.find({
    collection: 'brands', limit: 500, depth: 0, draft: true,
  })
  for (const doc of existing as { id: number; name: string }[]) brandIds[doc.name] = doc.id

  for (const seed of NEW_BRANDS) {
    if (brandIds[seed.name]) continue
    const slug = slugify(seed.name)
    const { docs } = await payload.find({
      collection: 'brands', limit: 1, where: { slug: { equals: slug } }, draft: true,
    })
    if (docs[0]) {
      brandIds[seed.name] = docs[0].id as number
      continue
    }
    const brand = await payload.create({
      collection: 'brands',
      data: {
        name: seed.name,
        slug,
        website: seed.website,
        founded: seed.founded,
        _status: 'published',
      },
    })
    brandIds[seed.name] = brand.id as number
    console.log(`  brand     created  ${seed.name}`)
  }

  // Products
  const productIds: Record<string, number> = {}
  for (const seed of PRODUCTS) {
    const brand = brandIds[seed.brand]
    if (!brand) {
      console.error(`  missing brand ${seed.brand}`)
      process.exit(1)
    }
    const data = {
      name: seed.name,
      description: seed.description,
      priceCents: seed.priceCents,
      currency: 'USD' as const,
      merchant: seed.merchant,
      affiliateUrl: seed.affiliateUrl,
      imageUrl: seed.imageUrl,
      inStock: true,
      brand,
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

  // Items
  const { docs: looks } = await payload.find({
    collection: 'looks', limit: 1, where: { slug: { equals: LOOK_SLUG } }, draft: true,
  })
  const look = looks[0]
  if (!look) {
    console.error('  look missing, run pnpm seed:holland first')
    process.exit(1)
  }

  for (const wire of WIRING) {
    const { docs } = await payload.find({
      collection: 'items',
      limit: 1,
      where: { look: { equals: look.id }, description: { equals: wire.item } },
    })
    if (!docs[0]) {
      console.warn(`  no item "${wire.item}"`)
      continue
    }
    await payload.update({
      collection: 'items',
      id: docs[0].id,
      data: {
        // Nothing here is the actual garment, so none of it earns a stronger
        // label than "get the look".
        confidence: 'get_the_look',
        evidenceNote: wire.note,
        product: productIds[wire.product],
        moreOptions: wire.more.map((name) => productIds[name]).filter(Boolean),
      },
    })
    console.log(`  item      wired    ${wire.item}`)
  }

  payload.logger.info(`Remaining Holland items wired. /celebrities/tom-holland/${LOOK_SLUG}`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
