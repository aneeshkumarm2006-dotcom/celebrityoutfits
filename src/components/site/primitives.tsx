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

const ratioClass = {
  '21x9': 'aspect-[21/9]',
  '2x1': 'aspect-[2/1]',
  '4x3': 'aspect-[4/3]',
  '3x4': 'aspect-[3/4]',
  '1x1': 'aspect-square',
  '3x2': 'aspect-[3/2]',
} as const

/**
 * Every image on the site goes through here so aspect ratio is reserved before
 * load (no layout shift) and the credit line is never accidentally dropped —
 * omitting it would breach the licence on most agency images.
 */
export const Frame = ({
  media,
  ratio = '4x3',
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
  className = '',
}: {
  media: MediaLike
  ratio?: keyof typeof ratioClass
  size?: 'thumb' | 'square' | 'portrait' | 'landscape' | 'wide' | 'og'
  sizes?: string
  priority?: boolean
  showCredit?: boolean
  fit?: 'cover' | 'contain'
  position?: 'center' | 'top'
  className?: string
}) => {
  const url = mediaUrl(media, size)
  const credit = mediaCredit(media)

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
            className={`${fit === 'contain' ? 'object-contain p-6' : 'object-cover'} ${
              position === 'top' ? 'object-top' : ''
            } transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[0.625rem] tracking-[0.16em] text-faint uppercase">
            No image
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
