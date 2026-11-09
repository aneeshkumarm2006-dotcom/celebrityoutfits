import type { Metadata } from 'next'
import Script from 'next/script'

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
  // Google Search Console ownership check.
  verification: { google: 'YfA9yJ1zTPLr7_-FdHy_Hkb0fjUH3mQ349UmwFnk1i4' },
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
        {/*
          Microsoft Clarity (session recordings and heatmaps), public site only:
          this layout does not wrap the admin. Loaded after the page is
          interactive so it never delays the first paint.
        */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "zawpme4atw");`}
        </Script>
      </body>
    </html>
  )
}
