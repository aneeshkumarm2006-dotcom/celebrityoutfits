import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Seeds enough content to exercise every page template.
 *
 * Idempotent — re-running updates the globals and skips documents whose slug
 * already exists, so it is safe to run against a database you have edited.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const exists = async (collection: 'celebrities' | 'looks' | 'brands' | 'articles' | 'products', slugOrName: string, field = 'slug') => {
    const { docs } = await payload.find({
      collection,
      limit: 1,
      where: { [field]: { equals: slugOrName } },
      // include drafts so re-running never creates a duplicate
      draft: true,
    })
    return docs[0] ?? null
  }

  // ── Globals ────────────────────────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'siteSettings',
    data: {
      siteName: 'Celebrity Outfits',
      tagline: 'What celebrities actually wear',
      defaultDescription:
        'A shoppable archive of what celebrities actually wear, identified item by item and updated as new photographs are published.',
      affiliateDisclosure:
        'Celebrity Outfits participates in affiliate programmes and earns a commission on qualifying purchases made through links on this page. This never affects the price you pay, and it never determines which items we identify or how we label them.',
      nonAffiliationNotice:
        'Celebrity Outfits is not affiliated with, endorsed by, or sponsored by any celebrity or brand featured. All photographs are licensed; credits appear beside each image.',
    },
  })

  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      items: [
        { label: 'Celebrities', href: '/celebrities' },
        { label: 'Journal', href: '/journal' },
        { label: 'Brands', href: '/brands' },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      blurb:
        'A shoppable archive of what celebrities actually wear, identified item by item and updated as new photographs are published.',
      columns: [
        {
          heading: 'Browse',
          links: [
            { label: 'All celebrities', href: '/celebrities' },
            { label: 'Journal', href: '/journal' },
            { label: 'Brands', href: '/brands' },
          ],
        },
        {
          heading: 'About',
          links: [
            { label: 'How we identify items', href: '/journal' },
            { label: 'Image credits & licensing', href: '/journal' },
          ],
        },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      sections: [
        {
          blockType: 'hero',
          enabled: true,
          eyebrow: 'Every look, identified',
          headline: 'What they wore, and',
          headlineEmphasis: 'where to buy it',
          body: 'We track what celebrities actually wear — on the carpet, at press calls, in transit — then identify each garment down to the brand and link you to the current version. No guesswork dressed up as fact.',
          ctaLabel: 'Browse celebrities',
          ctaHref: '/celebrities',
        },
        { blockType: 'latestLooks', enabled: true, heading: 'Latest looks', viewAllHref: '/celebrities', count: 4 },
        { blockType: 'celebrityGrid', enabled: true, heading: 'Browse by celebrity', count: 5 },
        {
          blockType: 'standards',
          enabled: true,
          heading: 'How we identify an item',
          items: [
            { title: 'Confirmed', body: 'Brand confirmed by a visible logo, a hardware detail, a brand statement or credited stylist notes. We name the exact product.' },
            { title: 'Closest match', body: 'The item is unbranded in the photograph. We name the nearest current product by cut, colour, hardware and fabric — and say so plainly.' },
            { title: 'Get the look', body: 'Where the original is discontinued or above $500, we pair it with a lower-priced alternative at the same silhouette.' },
            { title: 'Never guessed', body: 'If the detail is not there, the item stays open until a better photograph closes it. We do not invent a brand to fill a gap.' },
          ],
        },
        { blockType: 'journalPreview', enabled: true, heading: 'From the journal', viewAllHref: '/journal', count: 3 },
      ],
    },
  })

  // ── Brand + products ───────────────────────────────────────────────────
  const brand =
    (await exists('brands', 'ray-ban')) ??
    (await payload.create({
      collection: 'brands',
      data: {
        name: 'Ray-Ban',
        slug: 'ray-ban',
        affiliateNetwork: 'none',
        _status: 'published',
      },
    }))

  const product =
    (await exists('products', 'Aviator Classic, gold / G-15 green', 'name')) ??
    (await payload.create({
      collection: 'products',
      data: {
        name: 'Aviator Classic, gold / G-15 green',
        brand: brand.id,
        description: 'Gold frame, G-15 green lens, 58mm.',
        priceCents: 17100,
        currency: 'USD',
        merchant: 'Ray-Ban',
        affiliateUrl: 'https://www.ray-ban.com/',
        inStock: true,
      },
    }))

  // ── Celebrity + look + items ───────────────────────────────────────────
  const celebrity =
    (await exists('celebrities', 'tom-cruise')) ??
    (await payload.create({
      collection: 'celebrities',
      data: {
        name: 'Tom Cruise',
        slug: 'tom-cruise',
        category: 'film',
        standfirst:
          'Four decades of the same disciplined uniform — dark tailoring worn open, knit collars instead of shirts, a steel sports watch, and never a tie.',
        featured: true,
        rank: 1,
        _status: 'published',
      },
    }))

  const look =
    (await exists('looks', 'forest-green-two-piece')) ??
    (await payload.create({
      collection: 'looks',
      data: {
        celebrity: celebrity.id,
        title: 'The forest-green two-piece, worn open all night',
        slug: 'forest-green-two-piece',
        date: new Date('2023-07-03').toISOString(),
        location: 'Sydney',
        occasion: 'premiere',
        description:
          'A single-breasted suit in a deep green that photographs almost black under carpet lighting, worn open over a black shirt buttoned to the collar. No tie — there has not been one in years.',
        featured: true,
        _status: 'published',
      },
    }))

  const { totalDocs: itemCount } = await payload.count({
    collection: 'items',
    where: { look: { equals: look.id } },
  })

  if (itemCount === 0) {
    await payload.create({
      collection: 'items',
      data: {
        look: look.id,
        category: 'eyewear',
        confidence: 'confirmed',
        evidenceNote: 'Logo visible on the temple in two frames.',
        product: product.id,
        position: 0,
      },
    })
    await payload.create({
      collection: 'items',
      data: {
        look: look.id,
        category: 'tailoring',
        confidence: 'closest_match',
        evidenceNote: 'No visible maker mark; matched on lapel width and welt pocket.',
        position: 1,
      },
    })
    await payload.create({
      collection: 'items',
      data: { look: look.id, category: 'footwear', confidence: 'open', position: 2 },
    })
  }

  // ── Article ────────────────────────────────────────────────────────────
  if (!(await exists('articles', 'same-four-things-for-forty-years'))) {
    await payload.create({
      collection: 'articles',
      data: {
        title: 'Tom Cruise has worn the same four things for forty years',
        slug: 'same-four-things-for-forty-years',
        template: 'generic',
        excerpt:
          'Pull any three appearances from the last four decades and the same handful of garments are doing the same handful of jobs. A look at why the uniform never changed.',
        author: 'The Celebrity Outfits desk',
        relatedCelebrity: celebrity.id,
        publishedAt: new Date().toISOString(),
        featured: true,
        keywords: [
          { keyword: 'aviator', url: 'https://www.ray-ban.com/', rel: 'auto' },
          { keyword: 'style archive', url: '/celebrities/tom-cruise', rel: 'auto' },
        ],
        body: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'There is a version of celebrity style that runs on novelty — a new designer every red carpet, a new silhouette every season. Tom Cruise has never played that game. The aviator, the flight jacket, the white crew tee, straight denim. That is the whole vocabulary, and you can trace it through the style archive back to 1986.',
                    version: 1,
                  },
                ],
              },
              {
                type: 'heading',
                tag: 'h2',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'The sunglasses did the heaviest lifting',
                    version: 1,
                  },
                ],
              },
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'It is not a fashion sunglass — it is a piece of military optical equipment, designed for pilots, that happened to photograph well. It moved from equipment to costume to permanent wardrobe inside a year and has never left.',
                    version: 1,
                  },
                ],
              },
              {
                type: 'block',
                format: '',
                version: 2,
                fields: {
                  blockType: 'shoppableProduct',
                  blockName: '',
                  product: product.id,
                  eyebrow: 'The item, current version',
                },
              },
            ],
          },
        },
        _status: 'published',
      },
    })
  }

  payload.logger.info('Seed complete')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
