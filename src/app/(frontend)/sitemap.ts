import type { MetadataRoute } from 'next'

import { getArticles, getBrands, getCelebrities, getLooks } from '@/lib/payload'
import type { Celebrity } from '@/payload-types'

const base = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/** Generated from published content, so it refreshes on every publish. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [celebrities, looks, articles, brands] = await Promise.all([
    getCelebrities(1000),
    getLooks({ limit: 1000 }),
    getArticles({ limit: 1000 }),
    getBrands(1000),
  ])

  const staticRoutes = ['', '/celebrities', '/journal', '/brands'].map((path) => ({
    url: `${base()}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  return [
    ...staticRoutes,
    ...celebrities.map((c) => ({
      url: `${base()}/celebrities/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      priority: 0.9,
    })),
    ...looks.map((l) => {
      const celeb = typeof l.celebrity === 'object' ? (l.celebrity as Celebrity) : null
      return celeb
        ? {
            url: `${base()}/celebrities/${celeb.slug}/${l.slug}`,
            lastModified: new Date(l.updatedAt),
            priority: 0.7,
          }
        : null
    }).filter((x): x is NonNullable<typeof x> => Boolean(x)),
    ...articles.map((a) => ({
      url: `${base()}/journal/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      priority: 0.7,
    })),
    ...brands.map((b) => ({
      url: `${base()}/brands/${b.slug}`,
      lastModified: new Date(b.updatedAt),
      priority: 0.5,
    })),
  ]
}
