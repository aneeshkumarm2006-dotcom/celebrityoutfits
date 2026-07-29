import Link from 'next/link'

import { ConfidenceTag, Frame } from '@/components/site/primitives'
import { formatDate, formatPrice } from '@/lib/media'
import type { Article, Celebrity, Item, Look, Media, Product } from '@/payload-types'

const asDoc = <T,>(value: unknown): T | null =>
  value && typeof value === 'object' ? (value as T) : null

export const CelebrityCard = ({ celebrity }: { celebrity: Celebrity }) => (
  <Link href={`/celebrities/${celebrity.slug}`} className="group block no-underline">
    <Frame
      media={celebrity.portraitImage as Media}
      ratio="3x4"
      size="portrait"
      position="top"
      sizes="(min-width: 1024px) 20vw, 50vw"
      className="mb-3.5"
    />
    <h3 className="m-0 font-display text-[var(--text-step-2)] leading-tight font-normal">
      {celebrity.name}
    </h3>
    <p className="mt-1 mb-0 text-[0.75rem] text-muted capitalize">{celebrity.category}</p>
  </Link>
)

export const LookCard = ({ look }: { look: Look }) => {
  const celebrity = asDoc<Celebrity>(look.celebrity)
  const photo = Array.isArray(look.photos) ? (look.photos[0] as Media) : null

  return (
    <Link
      href={celebrity ? `/celebrities/${celebrity.slug}/${look.slug}` : '#'}
      className="group block no-underline"
    >
      <Frame
        media={photo}
        ratio="3x4"
        size="portrait"
        position="top"
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="mb-3.5"
      />
      <p className="eyebrow m-0">
        {celebrity?.name}
        {look.occasion ? ` · ${look.occasion}` : ''}
      </p>
      <h3 className="mt-1.5 mb-1.5 font-display text-[var(--text-step-1)] leading-[1.22] font-normal">
        {look.title}
      </h3>
      <p className="m-0 text-[0.8125rem] text-muted">{formatDate(look.date)}</p>
    </Link>
  )
}

export const ArticleCard = ({ article }: { article: Article }) => (
  <Link href={`/journal/${article.slug}`} className="group block no-underline">
    <Frame
      media={article.heroImage as Media}
      ratio="3x2"
      size="landscape"
      position="top"
      sizes="(min-width: 1024px) 30vw, 100vw"
      className="mb-3.5"
    />
    {/* "Generic" is an internal template name, not something a reader should see. */}
    {article.template && article.template !== 'generic' ? (
      <p className="eyebrow m-0">{article.template.replace(/-/g, ' ')}</p>
    ) : null}
    <h3 className="mt-1.5 mb-1.5 font-display text-[var(--text-step-1)] leading-[1.22] font-normal">
      {article.title}
    </h3>
    <p className="m-0 text-[0.8125rem] text-muted">{formatDate(article.publishedAt)}</p>
  </Link>
)

/**
 * One identified garment. The `/go/[id]` href is deliberate — the raw affiliate
 * URL never appears in the markup, which gives us first-party click data and
 * lets a merchant be swapped without touching content.
 */
export const ItemCard = ({ item }: { item: Item }) => {
  const primary = asDoc<Product>(item.product)
  const alternative = asDoc<Product>(item.alternativeProduct)

  // An out-of-stock link earns nothing and annoys the reader, so fall back to
  // the cheaper stand-in the editor already chose.
  const substituted = Boolean(primary && primary.inStock === false && alternative)
  const product = substituted ? alternative : (primary ?? alternative)
  if (!product) {
    return (
      <div className="flex flex-col gap-3">
        <Frame media={null} ratio="1x1" />
        <span className="text-[0.6875rem] font-medium tracking-[0.15em] text-muted uppercase">
          {item.category}
        </span>
        <ConfidenceTag confidence={item.confidence} />
      </div>
    )
  }

  const brand = asDoc<{ name?: string }>(product.brand)?.name
  const price = formatPrice(product.priceCents, product.currency ?? 'USD')

  return (
    <div className="group flex flex-col gap-3">
      <Frame
        media={product.image as Media}
        ratio="1x1"
        size="square"
        sizes="(min-width: 1024px) 22vw, 50vw"
      />
      {brand ? (
        <span className="text-[0.6875rem] font-medium tracking-[0.15em] text-muted uppercase">
          {brand}
        </span>
      ) : null}
      <p className="-mt-1.5 mb-0 text-[0.9375rem] leading-snug text-ink">{product.name}</p>
      <ConfidenceTag confidence={substituted ? 'get_the_look' : item.confidence} />
      {substituted ? (
        <span className="-mt-1 text-[0.6875rem] text-muted">
          Original is out of stock — showing the closest available.
        </span>
      ) : null}
      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-rule-2 pt-2.5">
        <span className="text-[0.9375rem] tabular-nums">{price ?? '—'}</span>
        <Link
          href={`/go/${product.id}`}
          rel="sponsored noopener"
          className="text-[0.75rem] tracking-[0.06em] whitespace-nowrap text-accent underline decoration-transparent underline-offset-[3px] transition-colors group-hover:decoration-current"
        >
          Shop →
        </Link>
      </div>
    </div>
  )
}
