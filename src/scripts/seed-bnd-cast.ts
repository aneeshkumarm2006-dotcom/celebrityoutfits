import { existsSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Look } from '@/payload-types'

/**
 * The rest of the Spider-Man: Brand New Day press tour.
 *
 *   pnpm seed:bnd-cast
 *
 * `seed:holland` already covers the crimson Jacquemus at the Los Angeles
 * premiere. This adds the five looks around it: Holland again in London two
 * days later, Zendaya twice on the same night, Pugh on the same carpet, and
 * Michael B. Jordan in Los Angeles.
 *
 * Sourcing: every designer credit below comes from r/whatthefrockk, which
 * publishes house, collection, season and stylist per look. That is a credit
 * line rather than a label read off the photograph, so the identifications sit
 * at `confirmed` only where the crediting is specific and consistent, and the
 * `evidenceNote` says where it came from in each case.
 *
 * Almost nothing here is buyable, and the seed does not pretend otherwise.
 * Three of these looks are couture or bespoke, made once, for one person. The
 * only garment on the whole tour with a retail SKU is Michael B. Jordan's
 * trousers, which is why he is in a script otherwise full of gowns.
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

const FARFETCH = 'https://www.farfetch.com/shopping'

/**
 * One verified product on the entire tour.
 *
 * Michael B. Jordan's trousers are the exception that makes the rest of this
 * script readable: a named, current-season, in-stock garment with a price. The
 * gowns below are couture and the suit is bespoke, so they get no product at
 * all rather than a plausible-looking substitute.
 */
const PRODUCTS = [
  {
    name: 'Fernando pleated wool trousers in black',
    description:
      'The trousers from the Los Angeles carpet, at retail. Pleated, tapered, 100% wool, button fly, with two side slit pockets and two rear flap pockets.',
    priceCents: 82100,
    merchant: 'Farfetch',
    affiliateUrl: `${FARFETCH}/men/jacquemus-fernando-trousers-item-27372590.aspx`,
    brandSlug: 'jacquemus',
  },
]

/**
 * A photograph is only attached when the file exists AND carries a real credit
 * and licence. Both are required by the Media collection, and inventing either
 * to satisfy the schema would defeat the reason the schema requires them.
 *
 * Red carpet frames are agency property. The routes that are actually available
 * are an agency licence (`agency`), the cast or house's own Instagram post via
 * the official embed (`instagram-embed`), or a brand's press asset
 * (`promotional`). A credit line on its own is not one of them.
 *
 * Fill `credit`, `licence` and `sourceAgency` in once the file is licensed and
 * sitting at `path`. Until then the look seeds as a draft: the writing, the
 * items and the confidence calls all land in the CMS and can be reviewed, and
 * nothing reaches a reader without its picture.
 */
type Photo = {
  path: string
  alt: string
  caption: string
  focalX: number
  focalY: number
  credit?: string
  licence?: 'agency' | 'instagram-embed' | 'cc' | 'own' | 'promotional'
  sourceAgency?: string
}

type ItemSeed = {
  description: string
  category:
    | 'outerwear' | 'knitwear' | 'shirting' | 'tailoring' | 'denim' | 'trousers'
    | 'footwear' | 'eyewear' | 'watch' | 'bag' | 'jewellery' | 'other'
  confidence: 'confirmed' | 'closest_match' | 'get_the_look' | 'open'
  product?: string
  note?: string
}

type LookSeed = {
  celebritySlug: string
  slug: string
  title: string
  date: string
  location: string
  occasion: 'airport' | 'premiere' | 'press' | 'on-set' | 'street' | 'event'
  event: string
  description: string
  featured?: boolean
  photo: Photo
  story: LexicalNode[]
  items: ItemSeed[]
}

const LOOKS: LookSeed[] = [
  {
    celebritySlug: 'tom-holland',
    slug: 'tom-holland-burgundy-anderson-sheppard-brand-new-day-london',
    title: 'Burgundy from Savile Row, and a spider on the lapel',
    date: '2026-07-29',
    location: 'London',
    occasion: 'premiere',
    event: 'Spider-Man: Brand New Day UK premiere · Odeon Luxe Leicester Square',
    description:
      'A custom burgundy double-breasted suit from Anderson & Sheppard, worn with an articulating brooch by Pragnell. Two days after the crimson Jacquemus in Los Angeles, and a deliberate step in the opposite direction.',
    featured: true,
    photo: {
      path: 'seed-assets/looks/tom-holland-bnd-london.jpg',
      alt: 'Tom Holland at the Spider-Man: Brand New Day UK premiere in a burgundy double-breasted suit with a jewelled brooch on the lapel',
      caption: 'Tom Holland · Spider-Man: Brand New Day UK premiere, Leicester Square',
      focalX: 50,
      focalY: 18,
    },
    story: [
      p(
        'Two days earlier in Los Angeles he had worn crimson head to foot, a custom Jacquemus suit with no lapels and no visible fastening. It was the loudest thing on the carpet and it worked.',
      ),
      p(
        'London got the opposite argument, made in the same colour family.',
      ),
      h2('The setting'),
      p(
        'Odeon Luxe Leicester Square, 29 July. The UK premiere, and the closest thing this tour had to a home fixture.',
      ),
      h2('The outfit'),
      p(
        'A custom burgundy double-breasted suit from Anderson & Sheppard. Not a designer house: a Savile Row tailor, on Old Burlington Street since 1906, which makes this the only garment on the entire press tour that was cut rather than designed.',
      ),
      p(
        'The difference matters. Jacquemus put him in a shape nobody had seen before. Anderson & Sheppard put him in a shape everybody has seen for a century, cut to fit one person exactly. The house is known for a soft drape and almost no padding, so a double-breasted from them holds its line without armouring the shoulder.',
      ),
      p(
        'On the lapel, an articulating brooch by Pragnell. That is the whole reference: no red and blue, no crest, one piece of jewellery with moving parts.',
      ),
      quote('Los Angeles got the costume argument. London got the tailoring one.'),
      h2('Why it works'),
      p(
        'Burgundy is the grown-up register of red. It reads as tailoring rather than as signal, so the suit carries no character reference at all until you reach the brooch, and by then you have already accepted it as a suit.',
      ),
      p(
        'Doing this two days after the crimson is the actual move. One look says the film, the other says the actor, and running them back to back on the same tour is how you get credited with range rather than with a stylist.',
      ),
      h2('What you can actually buy'),
      p(
        'Nothing, and that is a different kind of nothing from the usual. Jacquemus does not sell the crimson suit because it was made for him. Anderson & Sheppard does not sell this one because they do not sell suits at all: they take a commission, cut a pattern to one body, and it takes months.',
      ),
      p(
        'So there is no closest match here worth listing. A ready-to-wear burgundy double-breasted is a burgundy double-breasted, and that is a shape, not this garment. We would rather say so than sell you the shape.',
      ),
    ],
    items: [
      {
        description: 'Burgundy double-breasted suit jacket',
        category: 'tailoring',
        confidence: 'confirmed',
        note:
          'Credited to Anderson & Sheppard, Savile Row, as bespoke. Sourced from the r/whatthefrockk credit line rather than read off a label. Bespoke by definition, so there is no retail equivalent and no product is linked.',
      },
      {
        description: 'Matching burgundy trousers',
        category: 'trousers',
        confidence: 'confirmed',
        note: 'Part of the same commission.',
      },
      {
        description: 'Articulating jewelled lapel brooch',
        category: 'jewellery',
        confidence: 'confirmed',
        note:
          'Credited to Pragnell. Articulating, meaning the piece has moving parts. The only reference to the film in the entire outfit.',
      },
      { description: 'White dress shirt', category: 'shirting', confidence: 'open' },
      { description: 'Black leather derby shoes', category: 'footwear', confidence: 'open' },
    ],
  },

  {
    celebritySlug: 'zendaya',
    slug: 'zendaya-tamara-ralph-couture-brand-new-day-london',
    title: 'Couture, and a spider you have to look for',
    date: '2026-07-29',
    location: 'London',
    occasion: 'premiere',
    event: 'Spider-Man: Brand New Day UK premiere · Odeon Luxe Leicester Square',
    description:
      'Tamara Ralph FW26 Couture with Mouawad high jewellery, finished with a gold spider brooch by Keren Wolf. Styled by Law Roach.',
    featured: true,
    photo: {
      path: 'seed-assets/looks/zendaya-bnd-london.jpg',
      alt: 'Zendaya at the Spider-Man: Brand New Day UK premiere in Tamara Ralph couture with a gold spider brooch',
      caption: 'Zendaya · Spider-Man: Brand New Day UK premiere, Leicester Square',
      focalX: 50,
      focalY: 20,
    },
    story: [
      p(
        'Zendaya and Law Roach have spent a decade building the case that a press tour is a body of work rather than a series of outfits. Method dressing is their term for it, and by now it is everybody else\'s too.',
      ),
      p(
        'The London look is the restrained end of it, which on this tour counts as a decision.',
      ),
      h2('The setting'),
      p(
        'Odeon Luxe Leicester Square, 29 July, alongside Holland in Savile Row burgundy and Pugh in silver fringe.',
      ),
      h2('The outfit'),
      p(
        'Tamara Ralph FW26 Couture. Ralph is Australian, was half of Ralph & Russo, and now shows couture under her own name in Paris, which is a short way of saying this was made by hand for this evening.',
      ),
      p(
        'The jewellery is Mouawad. The reference is a single gold spider brooch by Keren Wolf, and the detail worth knowing is that the charm was not made for the film.',
      ),
      quote('The whole superhero reference is one gold spider, and you have to be looking.'),
      h2('Why it works'),
      p(
        'Because it withholds. Every other stop on this tour had a costume argument to make, and the London gown makes none: it is couture first, and the character arrives as a brooch you could easily miss.',
      ),
      p(
        'That is the harder version of method dressing. Anyone can put the colours on. Reducing the entire reference to one small gold object, on a carpet where everybody is looking for the reference, takes more nerve.',
      ),
      h2('What you can actually buy'),
      p(
        'None of it. Couture is made to measure, once, and does not go into production. There is no retail Tamara Ralph, so nothing is listed below rather than something adjacent being passed off as close.',
      ),
    ],
    items: [
      {
        description: 'Tamara Ralph FW26 couture gown',
        category: 'other',
        confidence: 'confirmed',
        note:
          'Credited as Tamara Ralph FW26 Couture, styled by Law Roach. Sourced from the r/whatthefrockk credit line. Couture, so made once and never sold at retail: no product linked.',
      },
      {
        description: 'Gold spider brooch',
        category: 'jewellery',
        confidence: 'confirmed',
        note:
          'Credited to Keren Wolf. Reported to be an existing piece rather than one commissioned for the film, which is the detail that makes the reference work.',
      },
      {
        description: 'High jewellery earrings and rings',
        category: 'jewellery',
        confidence: 'confirmed',
        note: 'Credited to Mouawad. High jewellery, so unique pieces rather than stock.',
      },
    ],
  },

  {
    celebritySlug: 'zendaya',
    slug: 'zendaya-laquan-smith-brand-new-day-afterparty',
    title: 'The wedding dress Marvel commissioned in 1987',
    date: '2026-07-29',
    location: 'London',
    occasion: 'event',
    event: 'Spider-Man: Brand New Day premiere after-party',
    description:
      'Custom LaQuan Smith, recreating the dress Willi Smith designed for Marvel in 1987 for Mary Jane Watson\'s wedding to Peter Parker.',
    photo: {
      path: 'seed-assets/looks/zendaya-bnd-afterparty.jpg',
      alt: 'Zendaya at the Spider-Man: Brand New Day after-party in a custom white LaQuan Smith dress recreating a 1987 Willi Smith design',
      caption: 'Zendaya · Spider-Man: Brand New Day after-party, London',
      focalX: 50,
      focalY: 20,
    },
    story: [
      p(
        'This is the best-researched outfit of the entire press tour, and the reference is nearly forty years old.',
      ),
      h2('The reference'),
      p(
        'In 1987, for Spider-Man\'s 25th anniversary, Marvel had Mary Jane Watson marry Peter Parker in the comics and staged the wedding for real at Shea Stadium. They commissioned an actual designer to make the actual dress: Willi Smith, the most commercially successful Black designer in America at the time, whose label WilliWear was doing around 25 million dollars a year.',
      ),
      p(
        'Smith died of AIDS-related illness in 1987, aged 39, months after the dress. He is not a footnote in American fashion and for a long time he was treated as one.',
      ),
      h2('The outfit'),
      p(
        'A custom recreation of that dress by LaQuan Smith, no relation, a New York designer who has spent his career being told his clothes are too much and has been proved right on a fairly regular schedule.',
      ),
      quote('One Black American designer\'s work, rebuilt by another, for a comic book wedding that happened in a baseball stadium.'),
      h2('Why it works'),
      p(
        'Because the reference is real rather than decorative. Most method dressing points at the film. This one points at a specific garment, made by a specific person, for a specific publicity stunt in 1987, and in doing so puts Willi Smith\'s name back in front of a few million people.',
      ),
      p(
        'The after-party look is usually where the effort drops off. This one carried more research than the carpet.',
      ),
      h2('What you can actually buy'),
      p(
        'The dress was made for the night. LaQuan Smith does sell ready-to-wear, and it is the same hand, so the house is worth knowing even though this piece is not for sale.',
      ),
    ],
    items: [
      {
        description: 'Custom white column dress',
        category: 'other',
        confidence: 'confirmed',
        product: 'LaQuan Smith ready-to-wear',
        note:
          'Credited as custom LaQuan Smith, recreating Willi Smith\'s 1987 dress for Marvel. Sourced from the r/whatthefrockk credit line. Made for the evening, so the link below is the designer\'s retail line rather than this dress.',
      },
    ],
  },

  {
    celebritySlug: 'florence-pugh',
    slug: 'florence-pugh-tamara-ralph-couture-brand-new-day-london',
    title: 'Silver fringe, and a neckline with wings',
    date: '2026-07-29',
    location: 'London',
    occasion: 'premiere',
    event: 'Spider-Man: Brand New Day UK premiere · Odeon Luxe Leicester Square',
    description:
      'Tamara Ralph SS26 Couture: a silver bugle bead fringe gown with a sculptural wing neckline, embellished with crystal in a waterfall effect, worn with Bulgari high jewellery.',
    featured: true,
    photo: {
      path: 'seed-assets/looks/florence-pugh-bnd-london.jpg',
      alt: 'Florence Pugh at the Spider-Man: Brand New Day UK premiere in a silver bugle bead fringe Tamara Ralph couture gown',
      caption: 'Florence Pugh · Spider-Man: Brand New Day UK premiere, Leicester Square',
      focalX: 50,
      focalY: 20,
    },
    story: [
      p(
        'Two Tamara Ralph couture gowns on one carpet, on two different leads, from two different collections. That is either a coincidence or a very good week for a Paris atelier.',
      ),
      h2('The outfit'),
      p(
        'Tamara Ralph SS26 Couture. Silver bugle beads, worked as fringe, so the whole surface moves independently of the wearer and the dress reads differently in every frame.',
      ),
      p(
        'The neckline is the engineered part: sculptural, built out into a wing shape that holds its own line away from the shoulder. Under it, crystal xillions set in a waterfall effect down the body.',
      ),
      p(
        'The jewellery is Bulgari High Jewelry.',
      ),
      quote('Bugle bead fringe does not photograph as a texture. It photographs as movement.'),
      h2('Why it works'),
      p(
        'Fringe on a red carpet is a calculated risk: it looks extraordinary in motion and can look like a lampshade standing still. It holds here because the wing neckline gives the eye a hard architectural line at the top, so there is something structural to read the movement against.',
      ),
      p(
        'Pugh has generally used premieres to do the opposite of whatever the film is doing. A superhero tour, and she arrives dressed for a very different kind of evening.',
      ),
      h2('What you can actually buy'),
      p(
        'Nothing. Couture, made once, no retail line.',
      ),
    ],
    items: [
      {
        description: 'Silver bugle bead fringe gown with sculptural wing neckline',
        category: 'other',
        confidence: 'confirmed',
        note:
          'Credited as Tamara Ralph SS26 Couture, embellished with silver crystal xillions in a waterfall effect. Sourced from the r/whatthefrockk credit line. Couture, so no product is linked.',
      },
      {
        description: 'High jewellery necklace and earrings',
        category: 'jewellery',
        confidence: 'confirmed',
        note: 'Credited to Bulgari High Jewelry.',
      },
    ],
  },

  {
    celebritySlug: 'michael-b-jordan',
    slug: 'michael-b-jordan-vintage-tee-jacquemus-brand-new-day',
    title: 'A vintage tee, and 800 dollar trousers',
    date: '2026-07-27',
    location: 'Los Angeles',
    occasion: 'premiere',
    event: 'Spider-Man: Brand New Day premiere · Dolby Theatre',
    description:
      'A vintage graphic tee with Jacquemus "Fernando" pleated wool tapered trousers. The one look on the entire press tour with a garment you can actually add to a basket.',
    photo: {
      path: 'seed-assets/looks/michael-b-jordan-bnd.jpg',
      alt: 'Michael B. Jordan at the Spider-Man: Brand New Day Los Angeles premiere in a vintage graphic tee and pleated Jacquemus trousers',
      caption: 'Michael B. Jordan · Spider-Man: Brand New Day premiere, Los Angeles',
      focalX: 50,
      focalY: 18,
    },
    story: [
      p(
        'Everybody else on this tour wore something made for them. Michael B. Jordan wore a t-shirt.',
      ),
      h2('The outfit'),
      p(
        'A vintage graphic tee, tucked, with Jacquemus "Fernando" trousers: pleated, tapered, wool, cut high on the waist.',
      ),
      p(
        'The proportion is doing all the work. A tee is a shapeless garment, so the only way it reads as considered rather than as laundry is if the trousers below it are severe enough to hold the outline, which pleated high-waisted wool does.',
      ),
      quote('The rule is not "dress down". The rule is that exactly one item gets to be casual.'),
      h2('Why it works'),
      p(
        'It is the most copyable look of the tour and the only one that survives contact with an ordinary evening. Nobody is commissioning Savile Row burgundy. Everybody owns a t-shirt.',
      ),
      p(
        'The vintage tee also does something the couture cannot: it is unrepeatable in the other direction. Anyone can buy the trousers. Nobody can buy that exact shirt, because there is one.',
      ),
      h2('What you can actually buy'),
      p(
        'The trousers, exactly. Same house, same name, same season, currently in stock. This is the only garment on the whole Brand New Day tour where that sentence is true.',
      ),
    ],
    items: [
      {
        description: 'Pleated wool tapered trousers',
        category: 'trousers',
        confidence: 'confirmed',
        product: 'Fernando pleated wool trousers in black',
        note:
          'Credited as Jacquemus "Fernando" pleated wool tapered trousers. Sourced from the r/whatthefrockk credit line, and the style name matches a current-season Farfetch listing, so the product below is the garment itself rather than an equivalent.',
      },
      {
        description: 'Vintage graphic t-shirt',
        category: 'shirting',
        confidence: 'open',
        note:
          'Described in the credit line only as vintage, with no print or year identified. One-off by definition, so it stays open.',
      },
    ],
  },
]

/**
 * Products with no verified retail listing.
 *
 * LaQuan Smith is a real retail line and the after-party dress is not part of
 * it, so this points at the house rather than at a garment. No price: quoting
 * one for a landing page would be inventing it.
 */
const HOUSE_LINKS = [
  {
    name: 'LaQuan Smith ready-to-wear',
    description:
      'The designer\'s retail line. Not the after-party dress, which was custom, but the same hand.',
    merchant: 'Farfetch',
    affiliateUrl: `${FARFETCH}/women/designer-laquan-smith/clothing-1/items.aspx`,
  },
]

const run = async () => {
  const payload = await getPayload({ config })

  // Products
  const productIds: Record<string, number> = {}

  for (const seed of PRODUCTS) {
    const { docs: brands } = await payload.find({
      collection: 'brands', limit: 1, where: { slug: { equals: seed.brandSlug } }, draft: true,
    })
    if (!brands[0]) {
      console.error(`  brand ${seed.brandSlug} missing, run pnpm seed:brands first`)
      process.exit(1)
    }
    const data = {
      name: seed.name,
      description: seed.description,
      priceCents: seed.priceCents,
      currency: 'USD' as const,
      merchant: seed.merchant,
      affiliateUrl: seed.affiliateUrl,
      inStock: true,
      brand: brands[0].id as number,
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

  for (const seed of HOUSE_LINKS) {
    const data = {
      name: seed.name,
      description: seed.description,
      merchant: seed.merchant,
      affiliateUrl: seed.affiliateUrl,
      inStock: true,
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

  // Looks
  for (const seed of LOOKS) {
    const { docs: celebs } = await payload.find({
      collection: 'celebrities', limit: 1,
      where: { slug: { equals: seed.celebritySlug } }, draft: true,
    })
    const celebrity = celebs[0]
    if (!celebrity) {
      console.error(`  ${seed.celebritySlug} missing, run pnpm seed:celebrities first`)
      process.exit(1)
    }

    /**
     * No file, or a file with no licence recorded, means no photograph. The
     * look still seeds so the writing and the item calls are reviewable in the
     * CMS, but it stays a draft, because a look page with no picture is not
     * something to put in front of a reader.
     */
    let photoId: number | undefined
    const { path, credit, licence } = seed.photo
    if (!existsSync(path)) {
      console.warn(`  photo     missing at ${path}`)
    } else if (!credit || !licence) {
      console.warn(`  photo     ${basename(path)} has no credit or licence recorded, skipped`)
    } else {
      const filename = basename(path)
      const { docs: media } = await payload.find({
        collection: 'media', limit: 1, where: { filename: { equals: filename } },
      })
      const image =
        media[0] ??
        (await payload.create({
          collection: 'media',
          filePath: path,
          data: {
            alt: seed.photo.alt,
            caption: seed.photo.caption,
            credit,
            licence,
            ...(seed.photo.sourceAgency ? { sourceAgency: seed.photo.sourceAgency } : {}),
            focalX: seed.photo.focalX,
            focalY: seed.photo.focalY,
          },
        }))
      photoId = image.id as number
    }

    const lookSlug = slugify(seed.slug)
    const lookData = {
      celebrity: celebrity.id as number,
      title: seed.title,
      slug: lookSlug,
      date: new Date(seed.date).toISOString(),
      location: seed.location,
      occasion: seed.occasion,
      event: seed.event,
      description: seed.description,
      story: doc(seed.story),
      ...(photoId ? { photos: [photoId] } : {}),
      featured: Boolean(seed.featured && photoId),
      _status: (photoId ? 'published' : 'draft') as 'published' | 'draft',
    }
    const { docs: existing } = await payload.find({
      collection: 'looks', limit: 1, where: { slug: { equals: lookSlug } }, draft: true,
    })
    const look = existing[0]
      ? await payload.update({ collection: 'looks', id: existing[0].id, data: lookData })
      : await payload.create({ collection: 'looks', data: lookData })
    console.log(
      `  look      ${existing[0] ? 'updated' : 'created'}  ${lookData._status.padEnd(9)} ${seed.title}`,
    )

    for (const [index, item] of seed.items.entries()) {
      const data = {
        description: item.description,
        look: look.id as number,
        category: item.category,
        confidence: item.confidence,
        position: index,
        ...(item.note ? { evidenceNote: item.note } : {}),
        ...(item.product && productIds[item.product]
          ? { product: productIds[item.product] }
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
  }

  payload.logger.info('Brand New Day cast seeded.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
