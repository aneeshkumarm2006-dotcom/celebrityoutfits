import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import type { SharpDependency } from 'payload'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { Brands } from './collections/Brands'
import { Celebrities } from './collections/Celebrities'
import { Items } from './collections/Items'
import { Looks } from './collections/Looks'
import { Media } from './collections/Media'
import { OutboundClicks } from './collections/OutboundClicks'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { globals } from './globals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Collections that get their own editable meta title / description / OG image. */
const seoCollections = ['articles', 'celebrities', 'looks', 'brands'] as const

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Celebrity Outfits' },
    components: {
      views: {
        dashboard: {
          Component: '@/components/admin/Dashboard#Dashboard',
        },
      },
    },
  },

  collections: [
    Celebrities,
    Looks,
    Items,
    Products,
    Brands,
    Articles,
    Media,
    OutboundClicks,
    Users,
  ],

  globals,

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  // sharp is declared with `export =` and two overloads; Payload's
  // SharpDependency is a single call signature, so TS matches the wrong
  // overload. The runtime value is correct — assert only this binding.
  sharp: sharp as unknown as SharpDependency,

  plugins: [
    seoPlugin({
      collections: [...seoCollections],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) =>
        doc?.title || doc?.name
          ? `${doc.title || doc.name} · Celebrity Outfits`
          : 'Celebrity Outfits',
      generateDescription: ({ doc }) => doc?.excerpt || doc?.standfirst || doc?.description || '',
    }),

    // Needed the first time a slug changes — without it, every inbound link
    // and every ranking pointing at the old URL 404s.
    redirectsPlugin({
      collections: [...seoCollections],
      overrides: {
        admin: { group: 'Settings' },
      },
    }),

    // Falls back to local disk when no Blob token is present, so `pnpm dev`
    // works before Vercel Blob is provisioned.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { [Media.slug]: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
