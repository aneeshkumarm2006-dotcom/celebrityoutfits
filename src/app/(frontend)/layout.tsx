import type { Metadata } from 'next'

import { DisclosureBar, SiteFooter, SiteHeader } from '@/components/site/chrome'

import { bodoni, hanken } from './fonts'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Celebrity Spotted Outfits — What celebrities actually wear',
    template: '%s · Celebrity Spotted Outfits',
  },
  description:
    'A shoppable archive of what celebrities actually wear, identified item by item and updated as new photographs are published.',
  openGraph: {
    type: 'website',
    siteName: 'Celebrity Spotted Outfits',
    url: siteUrl,
  },
  robots: {
    // Flipped to index once there is real content to index.
    index: false,
    follow: false,
  },
}

export default function FrontendLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodoni.variable} ${hanken.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <DisclosureBar />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
