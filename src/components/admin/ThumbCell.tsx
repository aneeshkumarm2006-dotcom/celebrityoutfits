import Link from 'next/link'
import type { DefaultServerCellComponentProps } from 'payload'

import { mediaUrl } from '@/lib/media'
import type { Media } from '@/payload-types'

/**
 * The title column of a list, with the record's picture beside it: portraits
 * on celebrities, logos on brands, the first photo on looks, the product shot
 * on products. Payload's own upload column shows a filename, not the image, so
 * this replaces the title cell instead and keeps it the link into the record.
 */
export const ThumbCell = async ({
  cellData,
  rowData,
  collectionSlug,
  payload,
  imageField,
  fit = 'cover',
}: DefaultServerCellComponentProps & { imageField: string; fit?: 'cover' | 'contain' }) => {
  const raw = rowData?.[imageField]
  const value = Array.isArray(raw) ? raw[0] : raw

  let media: Media | null = null
  if (value && typeof value === 'object') media = value as Media
  else if (value) media = await payload.findByID({ collection: 'media', id: value, depth: 0 }).catch(() => null)

  const src = media ? mediaUrl(media, fit === 'contain' ? 'logo' : 'thumb') : null
  const label = typeof cellData === 'string' && cellData.trim() ? cellData : '(untitled)'

  return (
    <Link href={`/admin/collections/${collectionSlug}/${rowData.id}`} className="desk-thumb-cell">
      <span className={`desk-thumb-cell__img desk-thumb-cell__img--${fit}`} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin list thumbnails, already sized */}
        {src ? <img src={src} alt="" loading="lazy" /> : null}
      </span>
      <span className="desk-thumb-cell__label">{label}</span>
    </Link>
  )
}
