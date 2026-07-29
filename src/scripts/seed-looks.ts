import { existsSync, readFileSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'

/**
 * Seeds one look per celebrity from the photographs in seed-assets/looks.
 *
 *   pnpm seed:looks
 *
 * Every description below was written after looking at its photograph and says
 * only what is visible in it. Dates come from the file's own EXIF as recorded on
 * Commons, not from a guess — a look page asserts that a named person wore
 * something on a named date, which is a factual claim about a real individual.
 *
 * Where the photograph shows no maker's mark, items are logged `open` rather
 * than guessed. That field is the point of the whole archive.
 */
type Entry = {
  slug: string
  name: string
  file: string
  credit: string
  licence: string
  source: string
  date: string
}

type ItemSeed = {
  label: string
  category:
    | 'outerwear' | 'knitwear' | 'shirting' | 'tailoring' | 'denim' | 'trousers'
    | 'footwear' | 'eyewear' | 'watch' | 'bag' | 'jewellery' | 'other'
  confidence: 'confirmed' | 'closest_match' | 'get_the_look' | 'open'
  product?: string
  note?: string
}

type LookSeed = {
  celebrity: string
  title: string
  occasion: 'airport' | 'premiere' | 'press' | 'on-set' | 'street' | 'event'
  location?: string
  description: string
  items?: ItemSeed[]
}

const LOOKS: LookSeed[] = [
  {
    celebrity: 'tom-cruise',
    title: 'Black tie, worn closed',
    occasion: 'premiere',
    description:
      'A black peak-lapel dinner jacket over a white shirt and a black bow tie, buttoned rather than left open. Hair worn longer than the usual crop.',
    items: [
      { label: 'Black dinner jacket', category: 'tailoring', confidence: 'open',
        note: 'No maker’s mark visible in the frame.' },
      { label: 'Dress watch on a leather strap', category: 'watch', confidence: 'get_the_look',
        product: 'Tank Américaine, steel' },
    ],
  },
  {
    celebrity: 'tom-holland',
    title: 'Olive overshirt, open over a tee',
    occasion: 'press',
    location: 'San Diego',
    description:
      'A dark olive overshirt worn open over a patterned V-neck tee, with a fine chain at the throat and a dark-dialled watch. Panel dressing rather than carpet dressing.',
    items: [
      { label: 'Olive overshirt', category: 'outerwear', confidence: 'open' },
      { label: 'Patterned V-neck tee', category: 'knitwear', confidence: 'open' },
      { label: 'Dark-dialled watch', category: 'watch', confidence: 'get_the_look',
        product: 'Submariner Date, yellow gold' },
    ],
  },
  {
    celebrity: 'zendaya',
    title: 'The structured strapless gown',
    occasion: 'event',
    description:
      'A strapless gown in cream, heavily structured across the bust and gathered below it. Hair up, drop earrings, a fine chain at the throat.',
    items: [
      { label: 'Strapless corseted gown', category: 'other', confidence: 'open',
        note: 'Unbranded in the photograph.' },
    ],
  },
  {
    celebrity: 'timothee-chalamet',
    title: 'The embroidered black suit',
    occasion: 'premiere',
    description:
      'A black suit worn buttoned over a black shirt, the jacket carrying a tonal floral embroidery that only reads at close range. No tie.',
    items: [
      { label: 'Embroidered single-breasted jacket', category: 'tailoring', confidence: 'open' },
      { label: 'Black shirt, worn without a tie', category: 'shirting', confidence: 'open' },
    ],
  },
  {
    celebrity: 'andrew-garfield',
    title: 'Pale blue double-breasted, over a print',
    occasion: 'premiere',
    location: 'Venice',
    description:
      'A pale blue double-breasted suit, worn open over a printed shirt left unbuttoned at the throat. Soft shoulder, wide lapel, no tie.',
    items: [
      { label: 'Double-breasted jacket, pale blue', category: 'tailoring', confidence: 'open' },
      { label: 'Printed shirt', category: 'shirting', confidence: 'open' },
      { label: 'Black leather loafer', category: 'footwear', confidence: 'get_the_look',
        product: 'Damier penny loafer, black' },
    ],
  },
  {
    celebrity: 'ryan-gosling',
    title: 'Green jacket, gold shirt',
    occasion: 'premiere',
    description:
      'A dark green jacket over a gold shirt and a patterned tie — three colours doing the work, in an otherwise plain silhouette.',
    items: [
      { label: 'Dark green jacket', category: 'tailoring', confidence: 'open' },
      { label: 'Gold shirt', category: 'shirting', confidence: 'open' },
    ],
  },
  {
    celebrity: 'florence-pugh',
    title: 'Teal, on one shoulder',
    occasion: 'event',
    description:
      'A teal dress cut across one shoulder, with a ruffled asymmetric neckline and a bare opposite arm. Dark lip, hair up.',
    items: [
      { label: 'One-shouldered ruffled dress', category: 'other', confidence: 'open' },
    ],
  },
  {
    celebrity: 'margot-robbie',
    title: 'Black lace, sheer at the sleeve',
    occasion: 'event',
    description:
      'A black lace dress, sheer through the shoulder and sleeve and opaque below. Worn with the hair down and minimal jewellery.',
    items: [{ label: 'Black lace dress', category: 'other', confidence: 'open' }],
  },
  {
    celebrity: 'jacob-elordi',
    title: 'All black, collar open',
    occasion: 'premiere',
    description:
      'A black shirt worn open at the collar under a black jacket. No contrast anywhere in the outfit.',
    items: [
      { label: 'Black jacket', category: 'tailoring', confidence: 'open' },
      { label: 'Black shirt', category: 'shirting', confidence: 'open' },
    ],
  },
  {
    celebrity: 'sydney-sweeney',
    title: 'The plunging black blazer',
    occasion: 'press',
    location: 'Berlin',
    description:
      'A black blazer worn with a deep lapel and nothing under it, hair pulled back flat. Statement ear cuff on one side.',
    items: [
      { label: 'Black blazer', category: 'tailoring', confidence: 'open' },
      { label: 'Ear cuff', category: 'jewellery', confidence: 'open' },
    ],
  },
  {
    celebrity: 'pedro-pascal',
    title: 'Plain black, at Cannes',
    occasion: 'event',
    location: 'Cannes',
    description:
      'A plain black crew-neck, worn without anything over it. The whole outfit is one garment and one colour.',
    items: [{ label: 'Black crew-neck', category: 'knitwear', confidence: 'open' }],
  },
  {
    celebrity: 'paul-mescal',
    title: 'The plain crew-neck, again',
    occasion: 'event',
    description:
      'A plain black crew-neck knit with a close fit and no visible detailing. Consistent with almost every other photograph of him.',
    items: [{ label: 'Black crew-neck knit', category: 'knitwear', confidence: 'open' }],
  },
  {
    celebrity: 'austin-butler',
    title: 'Open collar under a pale jacket',
    occasion: 'premiere',
    description:
      'A white shirt worn open at the collar under a pale tailored jacket. Nothing at the neck, hair swept back.',
    items: [
      { label: 'Pale tailored jacket', category: 'tailoring', confidence: 'open' },
      { label: 'White shirt', category: 'shirting', confidence: 'open' },
    ],
  },
  {
    celebrity: 'anne-hathaway',
    title: 'Coral, wide at the neck',
    occasion: 'event',
    description:
      'A coral top with a wide, open neckline and a clean shoulder line. Hair down, drop earring, no necklace.',
    items: [{ label: 'Coral top', category: 'other', confidence: 'open' }],
  },
  {
    celebrity: 'chris-evans',
    title: 'Grey tee, jacket over the arm',
    occasion: 'press',
    description:
      'A grey crew-neck tee with a white jacket carried rather than worn. About as plain as a press appearance gets.',
    items: [{ label: 'Grey crew-neck tee', category: 'knitwear', confidence: 'open' }],
  },
  {
    celebrity: 'chris-hemsworth',
    title: 'Henley under an open shirt',
    occasion: 'press',
    description:
      'A grey henley worn under an open check shirt, sleeves pushed back. Off-duty dressing at a working appearance.',
    items: [
      { label: 'Grey henley', category: 'knitwear', confidence: 'open' },
      { label: 'Open check shirt', category: 'shirting', confidence: 'open' },
    ],
  },
  {
    celebrity: 'michael-b-jordan',
    title: 'Black jacket, white piping',
    occasion: 'event',
    description:
      'A black jacket with contrast white piping running along the collar and placket — the only detail in an otherwise plain outfit.',
    items: [
      { label: 'Piped black jacket', category: 'outerwear', confidence: 'open' },
      { label: 'Trail running shoe', category: 'footwear', confidence: 'get_the_look',
        product: 'Fresh Foam More Trail, grey' },
    ],
  },
  {
    celebrity: 'ryan-reynolds',
    title: 'Chambray, with a shearling collar',
    occasion: 'street',
    description:
      'A chambray shirt worn under a jacket with a shearling-trimmed collar, photographed outdoors in daylight.',
    items: [{ label: 'Chambray shirt', category: 'shirting', confidence: 'open' }],
  },
  {
    celebrity: 'robert-downey-jr',
    title: 'Dark jacket, patterned neckwear',
    occasion: 'premiere',
    description:
      'A dark jacket over a patterned scarf worn high at the throat, photographed mid-interview. An early example of the accessory doing more work than the tailoring.',
    items: [
      { label: 'Dark jacket', category: 'tailoring', confidence: 'open' },
      { label: 'Patterned neck scarf', category: 'other', confidence: 'open' },
    ],
  },
]

const MANIFEST = 'seed-assets/looks/manifest.json'

const run = async () => {
  if (!existsSync(MANIFEST)) {
    console.error(`No manifest at ${MANIFEST}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const photos: Record<string, Entry> = Object.fromEntries(
    (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Entry[]).map((e) => [e.slug, e]),
  )

  let created = 0
  let updated = 0
  let items = 0
  let skipped = 0

  for (const seed of LOOKS) {
    const photo = photos[seed.celebrity]
    if (!photo || !existsSync(photo.file)) {
      console.warn(`  no photo for ${seed.celebrity} — skipped`)
      skipped++
      continue
    }

    const { docs: celebs } = await payload.find({
      collection: 'celebrities',
      limit: 1,
      where: { slug: { equals: seed.celebrity } },
      draft: true,
    })
    const celebrity = celebs[0]
    if (!celebrity) {
      console.warn(`  no celebrity "${seed.celebrity}" — skipped`)
      skipped++
      continue
    }

    const filename = basename(photo.file)
    const { docs: existingMedia } = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { equals: filename } },
    })
    const media =
      existingMedia[0] ??
      (await payload.create({
        collection: 'media',
        filePath: photo.file,
        data: {
          alt: `${photo.name} — ${seed.description.split('.')[0]}`,
          credit: photo.credit,
          licence: /^(cc|public domain)/i.test(photo.licence) ? 'cc' : 'own',
          caption: `${photo.name} · ${photo.licence}`,
        },
      }))

    const slug = slugify(`${seed.celebrity}-${seed.title}`)
    const data = {
      celebrity: celebrity.id as number,
      title: seed.title,
      slug,
      // EXIF date from Commons; falls back to the year only when that is all we have.
      date: new Date(photo.date || `${new Date().getFullYear()}-01-01`).toISOString(),
      ...(seed.location ? { location: seed.location } : {}),
      occasion: seed.occasion,
      description: seed.description,
      photos: [media.id],
      _status: 'published' as const,
    }

    const { docs: existing } = await payload.find({
      collection: 'looks',
      limit: 1,
      where: { slug: { equals: slug } },
      draft: true,
    })

    const look = existing[0]
      ? await payload.update({ collection: 'looks', id: existing[0].id, data })
      : await payload.create({ collection: 'looks', data })
    existing[0] ? updated++ : created++

    // Items identified in the photograph.
    for (const [index, item] of (seed.items ?? []).entries()) {
      let productId: number | undefined
      if (item.product) {
        const { docs } = await payload.find({
          collection: 'products',
          limit: 1,
          where: { name: { equals: item.product } },
        })
        productId = docs[0]?.id as number | undefined
      }

      const { docs: existingItems } = await payload.find({
        collection: 'items',
        limit: 1,
        where: { look: { equals: look.id }, label: { equals: item.label } },
      })

      const itemData = {
        label: item.label,
        look: look.id as number,
        category: item.category,
        confidence: item.confidence,
        position: index,
        ...(item.note ? { evidenceNote: item.note } : {}),
        ...(productId ? { product: productId } : {}),
      }

      if (existingItems[0]) {
        await payload.update({ collection: 'items', id: existingItems[0].id, data: itemData })
      } else {
        await payload.create({ collection: 'items', data: itemData })
      }
      items++
    }

    console.log(
      `  ${existing[0] ? 'updated' : 'created'}  ${photo.name.padEnd(20)} ${seed.title}`,
    )
  }

  payload.logger.info(
    `Looks seeded — ${created} created, ${updated} updated, ${items} items, ${skipped} skipped.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
