import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { mediaAlt, mediaCredit, mediaUrl, type MediaLike } from '@/lib/media'

export const Container = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={`mx-auto w-full max-w-[var(--container-wide)] px-6 sm:px-10 lg:px-14 ${className}`}
  >
    {children}
  </div>
)

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="eyebrow m-0">{children}</p>
)

/**
 * Four ratios, and each one has a generated crop of exactly the same shape in
 * the Media collection. Adding a fifth means adding a matching `imageSize`;
 * without that the browser re-crops what the server already cropped.
 */
const ratioClass = {
  '16x9': 'aspect-video', // heroes and banners  → size="hero"
  '3x2': 'aspect-[3/2]', // card grids          → size="landscape"
  '3x4': 'aspect-[3/4]', // portrait tiles      → size="portrait"
  '1x1': 'aspect-square', // chips and inline    → size="square" | "thumb"
} as const

/**
 * Every image on the site goes through here so aspect ratio is reserved before
 * load (no layout shift) and the credit line is never accidentally dropped —
 * omitting it would breach the licence on most agency images.
 */
export const Frame = ({
  media,
  ratio = '3x2',
  size,
  sizes = '(min-width: 1024px) 40vw, 100vw',
  priority = false,
  showCredit = false,
  /**
   * Photographs are cropped to fill the frame; logos must not be. A wordmark
   * with its edges shaved off stops being the brand's mark.
   */
  fit = 'cover',
  /**
   * Photographs of people are cropped from the top, because faces sit near the
   * top of a frame and a centred crop of a standing figure removes the head.
   */
  position = 'center',
  /**
   * Merchant feeds ship a URL rather than a file, on hosts we cannot enumerate
   * in advance — so these bypass next/image, which needs every remote host
   * allow-listed up front. Used only when there is no uploaded image.
   */
  fallbackUrl,
  className = '',
}: {
  media: MediaLike
  ratio?: keyof typeof ratioClass
  size?: 'thumb' | 'square' | 'portrait' | 'landscape' | 'hero' | 'og' | 'logo' | 'wide'
  sizes?: string
  priority?: boolean
  showCredit?: boolean
  fit?: 'cover' | 'contain'
  position?: 'center' | 'top'
  fallbackUrl?: string | null
  className?: string
}) => {
  const url = mediaUrl(media, size)
  const credit = mediaCredit(media)
  const objectFit = `${fit === 'contain' ? 'object-contain p-6' : 'object-cover'} ${
    position === 'top' ? 'object-top' : ''
  }`

  return (
    <figure className={`m-0 ${className}`}>
      <div
        className={`relative overflow-hidden bg-raised ${ratioClass[ratio]}`}
        data-frame
      >
        {url ? (
          <Image
            src={url}
            alt={mediaAlt(media)}
            fill
            sizes={sizes}
            priority={priority}
            className={`${objectFit} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
          />
        ) : fallbackUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- host is unknown until the feed is connected
          <img
            src={fallbackUrl}
            alt={mediaAlt(media)}
            loading="lazy"
            className={`absolute inset-0 h-full w-full ${objectFit} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
          />
        ) : (
          /**
           * An item we have not identified yet legitimately has no photograph,
           * and that is a normal state for this archive rather than an error.
           * Shouting NO IMAGE at the reader makes a working page look broken,
           * so this is a quiet ruled panel instead.
           */
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-45deg, var(--rule-2) 0 1px, transparent 1px 9px)',
            }}
          >
            <span className="h-px w-7 bg-faint/50" />
          </span>
        )}
      </div>
      {showCredit && credit ? (
        <figcaption className="mt-2.5 text-[0.6875rem] text-muted">{credit}</figcaption>
      ) : null}
    </figure>
  )
}

export const SectionHead = ({
  heading,
  href,
  linkLabel = 'View all',
}: {
  heading: string
  href?: string | null
  linkLabel?: string
}) => (
  <div className="mb-7 flex flex-wrap items-baseline justify-between gap-6 sm:mb-11">
    <h2 className="m-0 font-display text-[var(--text-step-3)] font-normal tracking-[-0.01em]">
      {heading}
    </h2>
    {href ? (
      <Link
        href={href}
        className="border-b border-rule pb-0.5 text-[var(--text-step--1)] text-ink-2 transition-colors hover:border-accent hover:text-accent"
      >
        {linkLabel}
      </Link>
    ) : null}
  </div>
)

/** Confidence indicator: filled dot = confirmed, hollow = everything else. */
export const ConfidenceTag = ({ confidence }: { confidence?: string | null }) => {
  const label =
    confidence === 'confirmed'
      ? 'Confirmed match'
      : confidence === 'closest_match'
        ? 'Closest match'
        : confidence === 'get_the_look'
          ? 'Get the look'
          : 'Open — not yet identified'

  return (
    <span className="flex items-center gap-1.5 text-[0.625rem] font-medium tracking-[0.13em] text-muted uppercase">
      <span
        aria-hidden
        className={`size-[5px] flex-none rounded-full border ${
          confidence === 'confirmed' ? 'border-ink bg-ink' : 'border-faint'
        }`}
      />
      {label}
    </span>
  )
}
