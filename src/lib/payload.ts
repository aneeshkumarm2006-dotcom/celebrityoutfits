import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Payload's Local API — runs in-process against the database with no HTTP hop,
 * so Server Components query directly and stay fully typed.
 */
export const getPayloadClient = async () => getPayload({ config: configPromise })

/** Featured items first (by rank), then newest. Used everywhere lists appear. */
export const rankedSort = ['-featured', 'rank', '-createdAt'] as const

export const getSiteSettings = async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'siteSettings', depth: 1 })
}

export const getNavigation = async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'navigation', depth: 0 })
}

export const getFooter = async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'footer', depth: 0 })
}

export const getPageSeo = async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'pageSeo', depth: 1 })
}

export const getHomepage = async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'homepage', depth: 2 })
}

export const getCelebrities = async (limit = 100) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'celebrities',
    limit,
    depth: 1,
    sort: ['-featured', 'rank', 'name'],
    where: { _status: { equals: 'published' } },
  })
  return docs
}

export const getCelebrityBySlug = async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'celebrities',
    limit: 1,
    depth: 2,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
  })
  return docs[0] ?? null
}

export const getLooks = async ({
  limit = 24,
  celebrityId,
}: { limit?: number; celebrityId?: string | number } = {}) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'looks',
    limit,
    depth: 2,
    sort: ['-featured', 'rank', '-date'],
    where: {
      _status: { equals: 'published' },
      ...(celebrityId ? { celebrity: { equals: celebrityId } } : {}),
    },
  })
  return docs
}

export const getLookBySlug = async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'looks',
    limit: 1,
    depth: 2,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
  })
  return docs[0] ?? null
}

/** Items belong to a look; sorted by the editor's chosen display order. */
export const getItemsForLook = async (lookId: string | number) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'items',
    limit: 50,
    depth: 2,
    sort: 'position',
    where: { look: { equals: lookId } },
  })
  return docs
}

export const getArticles = async ({
  limit = 12,
  celebrityId,
}: { limit?: number; celebrityId?: string | number } = {}) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    limit,
    depth: 1,
    sort: ['-featured', 'rank', '-publishedAt'],
    where: {
      _status: { equals: 'published' },
      ...(celebrityId ? { relatedCelebrity: { equals: celebrityId } } : {}),
    },
  })
  return docs
}

export const getArticleBySlug = async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    limit: 1,
    depth: 2,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
  })
  return docs[0] ?? null
}

export const getBrands = async (limit = 100) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'brands',
    limit,
    depth: 1,
    sort: ['-featured', 'rank', 'name'],
    where: { _status: { equals: 'published' } },
  })
  return docs
}

export const getBrandBySlug = async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'brands',
    limit: 1,
    depth: 2,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
  })
  return docs[0] ?? null
}

/** Everything we have logged from one brand — the substance of a brand page. */
export const getProductsByBrand = async (brandId: string | number, limit = 24) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    limit,
    depth: 1,
    sort: 'priceCents',
    where: { brand: { equals: brandId } },
  })
  return docs
}

export const getArticlesByBrand = async (brandId: string | number, limit = 12) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    limit,
    depth: 1,
    sort: '-publishedAt',
    where: { relatedBrand: { equals: brandId }, _status: { equals: 'published' } },
  })
  return docs
}

/**
 * Where an old URL now lives, from the Redirects collection in the admin, or
 * null. Pages call this before giving up with a 404: when two records for the
 * same person are merged the spare one is unpublished, and every link already
 * pointing at it should land on the page that survived rather than on nothing.
 */
export const resolveRedirect = async (from: string): Promise<string | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'redirects',
    limit: 1,
    depth: 2,
    where: { from: { equals: from } },
  })
  const to = docs[0]?.to
  if (!to) return null
  if (to.type === 'custom') return to.url || null

  const ref = to.reference
  if (!ref || typeof ref.value !== 'object') return null
  switch (ref.relationTo) {
    case 'celebrities':
      return `/celebrities/${ref.value.slug}`
    case 'brands':
      return `/brands/${ref.value.slug}`
    case 'articles':
      return `/journal/${ref.value.slug}`
    case 'looks': {
      const celeb = ref.value.celebrity
      return typeof celeb === 'object' && celeb ? `/celebrities/${celeb.slug}/${ref.value.slug}` : null
    }
  }
}
