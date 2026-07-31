import { del, list } from '@vercel/blob'
import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Makes the admin's focal point and crop tools actually work on Vercel Blob.
 *
 * Payload regenerates every derivative when a focal point or crop changes, and
 * writes each one back to the same path. Blob refuses to overwrite an existing
 * object, and the storage plugin never passes `allowOverwrite` — so the write
 * fails, the old crop stays, and the editor sees their change do nothing at all.
 * No error surfaces anywhere.
 *
 * Deleting the derivatives first clears the way. This runs `beforeChange`, which
 * is early enough: the storage plugin uploads in `afterChange`, so by the time
 * it writes, the paths are free.
 *
 * Only the original and its own `-WIDTHxHEIGHT` children are removed. Matching
 * on the raw prefix would also catch `<name>-look.jpg` and `<name>-hero.jpg`,
 * which are different images — that mistake cost 40 files once already.
 */
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const focalOrCropChanged = (
  data: Record<string, unknown>,
  original?: Record<string, unknown>,
): boolean => {
  if (!original) return false
  const keys = ['focalX', 'focalY', 'cropX', 'cropY', 'cropWidth', 'cropHeight'] as const
  return keys.some((key) => key in data && data[key] !== original[key])
}

export const clearStaleDerivatives: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const filename = (originalDoc as { filename?: string } | undefined)?.filename

  // Nothing to clear without Blob (local disk overwrites happily), without an
  // existing file, or when the crop has not moved.
  if (!token || !filename) return data
  if (!focalOrCropChanged(data as Record<string, unknown>, originalDoc)) return data

  try {
    const stem = filename.replace(/\.[^.]+$/, '')
    const extension = filename.slice(stem.length)
    const own = new RegExp(`^${escapeRegex(stem)}(-\\d+x\\d+)?${escapeRegex(extension)}$`)

    const { blobs } = await list({ prefix: stem, token })
    const mine = blobs.filter((blob) => own.test(blob.pathname))
    if (mine.length) await del(mine.map((blob) => blob.url), { token })

    req.payload.logger.info(
      `Cleared ${mine.length} derivative(s) for ${filename} so the new crop can be written.`,
    )
  } catch (error) {
    // A failed cleanup must not block the save. The crop simply will not take
    // until `pnpm regenerate:media` runs, which is recoverable; losing the
    // editor's other changes is not.
    req.payload.logger.error({ err: error }, 'could not clear stale derivatives')
  }

  return data
}
