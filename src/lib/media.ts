import type { Media } from '@/payload-types'

export type MediaLike = Media | number | string | null | undefined

/** Relationship fields come back as an id when depth is 0 — narrow to the doc. */
export const asMedia = (value: MediaLike): Media | null =>
  value && typeof value === 'object' ? (value as Media) : null

type SizeName = 'thumb' | 'square' | 'portrait' | 'landscape' | 'wide' | 'og'

/**
 * Payload returns absolute URLs because `serverURL` is configured, which makes
 * `next/image` treat our own uploads as a remote host and refuse them. Strip
 * our origin back off so they stay same-origin and match the `localPatterns`
 * rule in next.config. Genuinely remote URLs (Vercel Blob) pass through.
 */
const toSameOrigin = (url: string): string => {
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site && url.startsWith(site)) return url.slice(site.length) || '/'
  return url
}

/**
 * Prefer the generated size, fall back to the original. Uploads made before a
 * size existed won't have it, and a missing crop shouldn't blank the page.
 */
export const mediaUrl = (value: MediaLike, size?: SizeName): string | null => {
  const media = asMedia(value)
  if (!media) return null
  if (size) {
    const sized = media.sizes?.[size]
    if (sized?.url) return toSameOrigin(sized.url)
  }
  return media.url ? toSameOrigin(media.url) : null
}

export const mediaAlt = (value: MediaLike): string => asMedia(value)?.alt ?? ''

/** Photographer/agency line rendered beneath images, as the licence requires. */
export const mediaCredit = (value: MediaLike): string | null => {
  const media = asMedia(value)
  if (!media?.credit) return null
  const licence = media.licence ? ` · ${String(media.licence).replace(/-/g, ' ')}` : ''
  return `${media.credit}${licence}`
}

export const formatPrice = (
  cents?: number | null,
  currency: string = 'USD',
): string | null => {
  if (typeof cents !== 'number') return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export const formatDate = (value?: string | null): string => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
