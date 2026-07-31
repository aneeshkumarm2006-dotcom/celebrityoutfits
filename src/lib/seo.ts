import type { Metadata } from 'next'

import { mediaUrl } from '@/lib/media'

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

type SeoGroup = {
  title?: string | null
  description?: string | null
  image?: unknown
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
  path,
}: {
  /** Absent on static pages that have no CMS document behind them. */
  doc?: { meta?: SeoGroup | null }
  fallbackTitle?: string | null
  fallbackDescription?: string | null
  path: string
}): Metadata => {
  const meta = doc?.meta ?? {}
  const title = meta.title || fallbackTitle || undefined
  const description = meta.description || fallbackDescription || undefined
  const image = mediaUrl(meta.image as never, 'og')
  const url = `${siteUrl()}${path}`

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: meta.noIndex ? { index: false, follow: false } : undefined,
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
