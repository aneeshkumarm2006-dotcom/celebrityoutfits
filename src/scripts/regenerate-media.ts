import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import { del, list } from '@vercel/blob'
import config from '@payload-config'
import { getPayload } from 'payload'

/** Enough of a lookup for an image library; the stored mimeType wins anyway. */
const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
}

const mimeFor = (filename: string): string =>
  MIME[filename.split('.').pop()?.toLowerCase() ?? ''] ?? 'image/jpeg'

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The committed originals, so a lost object can be put back rather than mourned. */
const SEED_DIRS = ['portraits', 'heroes', 'looks', 'brands', 'products'].map((dir) =>
  join('seed-assets', dir),
)

const findInSeedAssets = (filename: string): string | null => {
  for (const dir of SEED_DIRS) {
    const candidate = join(dir, filename)
    if (existsSync(candidate)) return candidate
  }
  return null
}

/**
 * Re-processes existing uploads against the current `imageSizes`.
 *
 *   pnpm regenerate:media [limit]
 *
 * Changing `imageSizes` does not touch anything already uploaded — Payload
 * generates crops on write, so every existing image keeps whatever sizes it had
 * when it was saved. After a ratio change the new crop simply is not there and
 * the page falls back to the full original, which is the double-crop the ratio
 * change was meant to fix.
 *
 * Two things make this harder than it sounds, both found the hard way:
 *
 *  - Payload treats a document's own filename as taken and appends `-1`, so a
 *    plain re-upload renames the whole library. `overwriteExistingFiles` plus an
 *    explicit filename keeps it stable.
 *  - Vercel Blob refuses to overwrite an existing object and the storage plugin
 *    never passes `allowOverwrite`, so the old objects must be deleted first.
 *
 * The original is downloaded before anything is deleted, so a failure mid-run
 * cannot lose an image that is not already on disk in seed-assets.
 */
const run = async () => {
  const limit = Number(process.argv[2] ?? 0)
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'media', limit: 1000, depth: 0 })
  const targets = limit > 0 ? docs.slice(0, limit) : docs

  let done = 0
  let failed = 0
  let restored = 0
  const renamed: string[] = []

  for (const doc of targets) {
    const record = doc as {
      filename?: string
      url?: string
      mimeType?: string
      sizes?: Record<string, { url?: string | null }>
    }
    const { filename, url } = record
    if (!filename || !url) {
      console.warn(`  skipped #${doc.id} — no filename or url`)
      failed++
      continue
    }

    const absolute = url.startsWith('http')
      ? url
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${url}`

    try {
      // 1. Get the original before touching anything: from storage normally,
      //    from seed-assets when storage no longer has it. The local copy makes
      //    this recoverable rather than merely repeatable.
      let data: Buffer
      const response = await fetch(absolute).catch(() => null)
      if (response?.ok) {
        data = Buffer.from(await response.arrayBuffer())
      } else {
        const local = findInSeedAssets(filename)
        if (!local) throw new Error(`HTTP ${response?.status ?? 'fetch failed'}, no local copy`)
        data = readFileSync(local)
        restored++
      }

      // 2. Clear every object belonging to *this* image and nothing else.
      //
      //    Listing by prefix finds derivatives the record never learned about
      //    after a failed run, which is why we list rather than read the doc.
      //    But a prefix is not a name: `tom-holland` also matches
      //    `tom-holland-look.jpg` and `tom-holland-hero.jpg`, and deleting on
      //    the raw prefix destroys two unrelated images. Only the original and
      //    its own `-WIDTHxHEIGHT` derivatives may be removed.
      if (token) {
        const stem = filename.replace(/\.[^.]+$/, '')
        const extension = filename.slice(stem.length)
        const ownDerivative = new RegExp(
          `^${escapeRegex(stem)}(-\\d+x\\d+)?${escapeRegex(extension)}$`,
        )
        const { blobs } = await list({ prefix: stem, token })
        const mine = blobs.filter((blob) => ownDerivative.test(blob.pathname))
        if (mine.length) await del(mine.map((blob) => blob.url), { token })
      }

      // 3. Write it back with the filename pinned.
      //
      //    Blob deletion is eventually consistent: the object can still answer
      //    for a moment after `del` resolves, and the upload then fails with
      //    "this blob already exists". Retrying after a pause is the whole fix.
      const write = () =>
        payload.update({
          collection: 'media',
          id: doc.id,
          data: {},
          file: {
            data,
            mimetype: record.mimeType || mimeFor(filename),
            name: filename,
            size: data.byteLength,
          },
          overwriteExistingFiles: true,
        })

      let updated
      try {
        await pause(400)
        updated = await write()
      } catch (error) {
        if (!/already exists/i.test((error as Error).message)) throw error
        await pause(4000)
        updated = await write()
      }

      const after = (updated as { filename?: string }).filename
      if (after !== filename) renamed.push(`${filename} → ${after}`)
      done++
      console.log(`  ${String(done).padStart(3)}/${targets.length}  ${after}`)
    } catch (error) {
      console.warn(`  failed ${filename}: ${(error as Error).message}`)
      failed++
    }
  }

  if (renamed.length) {
    console.warn(`\n  ${renamed.length} filename(s) drifted — seeds match on filename:`)
    for (const entry of renamed.slice(0, 10)) console.warn(`    ${entry}`)
  }

  payload.logger.info(
    `Media regenerated — ${done} done, ${restored} restored from seed-assets, ${failed} failed, ${renamed.length} renamed.`,
  )
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
