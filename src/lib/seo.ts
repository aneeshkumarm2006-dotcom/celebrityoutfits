import type { Metadata } from 'next'

import { mediaUrl } from '@/lib/media'

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

type SeoGroup = {
  title?: string | null
  description?: string | null
  image?: unknown
  keywords?: string | null
  noIndex?: boolean | null
}

/**
 * Build page metadata from the SEO tab, falling back to the document's own
 * fields. Editors only fill the SEO tab when they want to override — pages are
 * never left without a title or description.
 */
export const buildMetadata = ({
  doc,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  path,
}: {
  /** Absent on static pages that have no CMS document behind them. */
  doc?: { meta?: SeoGroup | null }
  fallbackTitle?: string | null
  fallbackDescription?: string | null
  fallbackImage?: unknown
  path: string
}): Metadata => {
  const meta = doc?.meta ?? {}
  const title = meta.title || fallbackTitle || undefined
  const description = meta.description || fallbackDescription || undefined
  const image = mediaUrl((meta.image ?? fallbackImage) as never, 'og')
  const keywords = meta.keywords
    ?.split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const url = `${siteUrl()}${path}`

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    // Only when the page opts out. Next merges metadata key by key, so even
    // `robots: undefined` here would replace the site-wide setting from the layout.
    ...(meta.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: title ?? undefined,
      description: description ?? undefined,
      url,
      type: 'article',
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? undefined,
      description: description ?? undefined,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export const breadcrumbSchema = (crumbs: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: crumb.name,
    item: `${siteUrl()}${crumb.path}`,
  })),
})

/**
 * Metadata for a page with no document behind it, from Settings → Page SEO.
 * `fallback` is the copy the page shipped with, used for any field left blank.
 */
export const buildPageMetadata = async (
  page: 'home' | 'celebrities' | 'brands' | 'journal' | 'request',
  fallback: { title?: string; description: string; path: string },
): Promise<Metadata> => {
  const { getPageSeo } = await import('@/lib/payload')
  const seo = await getPageSeo()
  const entry = seo?.[page] ?? {}
  const metadata = buildMetadata({
    doc: { meta: entry },
    fallbackTitle: fallback.title,
    fallbackDescription: fallback.description,
    path: fallback.path,
  })
  // The homepage keeps the layout's full default title rather than a templated one.
  if (page === 'home' && !entry.title) delete metadata.title
  return metadata
}
