import type { Payload } from 'payload'

import { foldName } from '@/fields/slug'

/**
 * The numbers the editor desk is built around, in one place so the sidebar
 * badges and the dashboard tiles can never disagree.
 */

/**
 * Published celebrities sharing a name once case, accents and stray spaces are
 * ignored. Only published records count: a merged spare is unpublished on
 * purpose and is not a problem any more.
 */
export const findDuplicateCelebrities = async (payload: Payload) => {
  const { docs } = await payload.find({
    collection: 'celebrities',
    pagination: false,
    depth: 0,
    select: { name: true, slug: true },
    where: { _status: { equals: 'published' } },
  })
  const groups = new Map<string, { name: string; ids: (string | number)[] }>()
  for (const doc of docs) {
    const key = foldName(doc.name)
    if (!key) continue
    const group = groups.get(key) ?? { name: (doc.name ?? '').trim(), ids: [] }
    group.ids.push(doc.id)
    groups.set(key, group)
  }
  return [...groups.values()].filter((group) => group.ids.length > 1)
}

export const getDeskCounts = async (payload: Payload) => {
  const [identify, requests, clicks, duplicates] = await Promise.all([
    payload.count({ collection: 'items', where: { confidence: { in: ['open', 'closest_match'] } } }),
    payload.count({ collection: 'requests', where: { status: { in: ['new', 'researching'] } } }),
    payload.count({ collection: 'outboundClicks' }),
    findDuplicateCelebrities(payload),
  ])
  return {
    identify: identify.totalDocs,
    requests: requests.totalDocs,
    clicks: clicks.totalDocs,
    duplicates: duplicates.length,
    duplicateGroups: duplicates,
  }
}

/** Item categories as people say them; the stored values are lower-case slugs. */
export const CATEGORY_LABEL: Record<string, string> = {
  tailoring: 'Tailoring',
  outerwear: 'Outerwear',
  knitwear: 'Knitwear',
  shirting: 'Shirting',
  trousers: 'Trousers',
  denim: 'Denim',
  footwear: 'Footwear',
  bag: 'Bag',
  jewellery: 'Jewellery',
  eyewear: 'Eyewear',
  watch: 'Watch',
  other: 'Other',
}
