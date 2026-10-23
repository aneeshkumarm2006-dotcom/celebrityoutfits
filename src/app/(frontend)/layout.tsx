import type { Metadata } from 'next'

import { themeScript } from '@/components/site/ThemeToggle'
import { DisclosureBar, SiteBottomNav, SiteFooter, SiteHeader } from '@/components/site/chrome'
import { getPageSeo } from '@/lib/payload'

import { bodoni, hanken } from './fonts'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Celebrity Spotted Outfits: What celebrities actually wear',
    template: '%s · Celebrity Spotted Outfits',
  },
  description:
    'A shoppable archive of what celebrities actually wear, identified item by item and updated as new photographs are published.',
  openGraph: {
    type: 'website',
    siteName: 'Celebrity Spotted Outfits',
    url: siteUrl,
  },
}

/**
 * Indexing is a switch in Settings → Page SEO rather than a code change, so it
 * can be turned on the day the archive is ready without a deploy. Off by
 * default: every page asks search engines not to list it.
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const seo = await getPageSeo()
  return {
    ...baseMetadata,
    robots: seo?.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  }
}

export default function FrontendLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${hanken.variable} h-full`}
      // themeScript sets data-theme before React hydrates, so the attribute is
      // legitimately different from what the server rendered.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <DisclosureBar />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        {/*
          Reserves the bar's height so the footer is never trapped underneath
          it, and the bar itself, which is fixed and mobile-only.
        */}
        <div aria-hidden="true" className="h-[4.25rem] lg:hidden" />
        <SiteBottomNav />
      </body>
    </html>
  )
}
