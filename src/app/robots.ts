import type { MetadataRoute } from 'next'

const base = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin and the affiliate redirect must never be indexed.
      disallow: ['/admin', '/go/', '/api/'],
    },
    sitemap: `${base()}/sitemap.xml`,
  }
}
