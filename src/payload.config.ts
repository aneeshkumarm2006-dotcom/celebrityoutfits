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
import { RequestUploads } from './collections/RequestUploads'
import { Requests } from './collections/Requests'
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
    meta: { titleSuffix: ' · Celebrity Spotted Outfits' },
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
    Requests,
    RequestUploads,
    OutboundClicks,
    Users,
  ],

  globals,

  editor: lexicalEditor(),

  db: postgresAdapter({
    /**
     * `next build` prerenders pages in one worker per CPU, and each worker
     * builds its own pool — so the ceiling that matters is workers × max, not
     * max. node-postgres defaults to 10, which on an 8-core build container
     * asks Supabase for 80 connections and gets `EMAXCONNSESSION` instead.
     *
     * Keep this low and let queries queue. The pages are small and the pool
     * turns them over faster than the extra sockets would have.
     */
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      max: Number(process.env.DATABASE_POOL_MAX ?? 4),
    },
    /**
     * Push diffs the schema on boot and rewrites it to match the config. That
     * is what we want while iterating locally and emphatically not what we
     * want a serverless function doing to the production database.
     */
    push: process.env.NODE_ENV !== 'production',
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
          ? `${doc.title || doc.name} · Celebrity Spotted Outfits`
          : 'Celebrity Spotted Outfits',
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
      collections: {
        /**
         * Serve straight off the Blob CDN instead of streaming every image
         * through a serverless function. Without this Payload keeps its own
         * access control in front of the file, which for a public archive buys
         * nothing and costs an invocation per portrait per visitor.
         *
         * The URLs this produces are matched by the `remotePatterns` entry for
         * *.public.blob.vercel-storage.com in next.config.
         */
        [Media.slug]: { disablePayloadAccessControl: true },
        /**
         * Submissions keep Payload's access control in front of them. These are
         * strangers' photographs sent to us privately; serving them from a
         * public CDN URL would publish every one the moment it arrived.
         */
        [RequestUploads.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
