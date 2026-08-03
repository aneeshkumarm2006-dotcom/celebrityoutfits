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
 * Shared by both item layouts: works out which product to actually show, and
 * what else is worth listing under it.
 *
 * The out-of-stock swap and the alternatives ordering are editorial rules, not
 * presentation, so they belong in one place rather than duplicated across the
 * grid card and the row.
 */
const resolveItem = (item: Item) => {
  const primary = asDoc<Product>(item.product)
  const alternative = asDoc<Product>(item.alternativeProduct)

  // An out-of-stock link earns nothing and annoys the reader, so fall back to
  // the cheaper stand-in the editor already chose.
  const substituted = Boolean(primary && primary.inStock === false && alternative)
  const product = substituted ? alternative : (primary ?? alternative)

  const more = product
    ? (Array.isArray(item.moreOptions) ? item.moreOptions : [])
        .map((entry) => asDoc<Product>(entry))
        .filter((entry): entry is Product => Boolean(entry) && entry!.id !== product.id)
        .sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0))
    : []

  return { product, substituted, more }
}

/**
 * Two different lists share the extras slot, and calling them the same thing
 * would mislead.
 *
 * On a confirmed garment the extras are the same thing sold elsewhere, so the
 * shop name is what distinguishes them. On anything less than confirmed they
 * are near misses — a different cut, or the right house in the wrong colour —
 * and the shop name tells a reader nothing. Naming the product instead is the
 * only version that survives contact with a three-way Farfetch listing.
 */
const MoreOptions = ({ item, more }: { item: Item; more: Product[] }) => {
  if (more.length === 0) return null
  const confirmed = item.confidence === 'confirmed'

  return (
    <div className="grid gap-1.5">
      <span className="text-[0.625rem] font-medium tracking-[0.13em] text-muted uppercase">
        {confirmed ? 'Also available' : 'Alternatives'}
      </span>
      {more.map((option) => (
        <Link
          key={option.id}
          href={`/go/${option.id}`}
          rel="sponsored noopener"
          className="flex items-baseline justify-between gap-3 border-t border-rule-2 pt-1.5 text-[0.8125rem] text-ink-2 no-underline transition-colors hover:text-accent"
        >
          <span className="truncate">
            {confirmed ? option.merchant || option.name : option.name || option.merchant}
          </span>
          {/* `shrink-0` or a long product name squeezes the price and clips it. */}
          <span className="shrink-0 tabular-nums whitespace-nowrap">
            {formatPrice(option.priceCents, option.currency ?? 'USD') ?? 'Price on request'}
          </span>
        </Link>
      ))}
    </div>
  )
}

/**
 * An item with nothing buyable attached. Reserving an image slot for it fills
 * the layout with empty boxes and makes a working page look broken, so it
 * states itself in text instead.
 */
const UnmatchedItem = ({ item, className = '' }: { item: Item; className?: string }) => (
  <div className={`flex flex-col justify-center gap-2 border border-rule-2 bg-raised/40 p-4 ${className}`}>
    <span className="text-[0.6875rem] font-medium tracking-[0.15em] text-muted uppercase">
      {item.category}
    </span>
    {item.description ? (
      <p className="m-0 text-[0.9375rem] leading-snug text-ink-2">{item.description}</p>
    ) : null}
    <ConfidenceTag confidence={item.confidence} />
  </div>
)

/**
 * The look page's shopping list: one garment per row, thumbnail left, detail
 * right.
 *
 * The grid card below stacks a large square image over its text, which is right
 * when four sit side by side and wrong in a column beside the photograph —
 * there it becomes a single tower of enormous squares and the reader has to
 * scroll the whole outfit to see what is in it. Laid out as rows, the same
 * items fit the space the portrait photograph leaves empty.
 */
export const ItemRow = ({ item }: { item: Item }) => {
  const { product, substituted, more } = resolveItem(item)

  if (!product) return <UnmatchedItem item={item} />

  const brand = asDoc<{ name?: string }>(product.brand)?.name
  const price = formatPrice(product.priceCents, product.currency ?? 'USD')

  return (
    <div className="group flex gap-4 border-b border-rule-2 pb-5 last:border-b-0 last:pb-0">
      <Link
        href={`/go/${product.id}`}
        rel="sponsored noopener"
        aria-hidden="true"
        tabIndex={-1}
        className="w-[5.5rem] shrink-0 sm:w-24"
      >
        <Frame
          media={product.image as Media}
          fallbackUrl={product.imageUrl}
          ratio="1x1"
          size="square"
          sizes="96px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[0.6875rem] font-medium tracking-[0.15em] text-muted uppercase">
          {brand || item.category}
        </span>
        <p className="m-0 text-[0.9375rem] leading-snug text-ink">{product.name}</p>
        <ConfidenceTag confidence={substituted ? 'get_the_look' : item.confidence} />
        {substituted ? (
          <span className="text-[0.6875rem] text-muted">
            Original is out of stock. Showing the closest available.
          </span>
        ) : null}

        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-[0.9375rem] tabular-nums">{price ?? 'Price on request'}</span>
          <Link
            href={`/go/${product.id}`}
            rel="sponsored noopener"
            className="text-[0.75rem] tracking-[0.06em] whitespace-nowrap text-accent underline decoration-transparent underline-offset-[3px] transition-colors group-hover:decoration-current"
          >
            Shop →
          </Link>
        </div>

        <MoreOptions item={item} more={more} />
      </div>
    </div>
  )
}

/**
 * One identified garment. The `/go/[id]` href is deliberate — the raw affiliate
 * URL never appears in the markup, which gives us first-party click data and
 * lets a merchant be swapped without touching content.
 */
export const ItemCard = ({ item }: { item: Item }) => {
  const { product, substituted, more } = resolveItem(item)

  if (!product) return <UnmatchedItem item={item} />

  const brand = asDoc<{ name?: string }>(product.brand)?.name
  const price = formatPrice(product.priceCents, product.currency ?? 'USD')

  return (
    <div className="group flex flex-col gap-3">
      <Frame
        media={product.image as Media}
        fallbackUrl={product.imageUrl}
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
          Original is out of stock. Showing the closest available.
        </span>
      ) : null}
      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-rule-2 pt-2.5">
        <span className="text-[0.9375rem] tabular-nums">{price ?? 'Price on request'}</span>
        <Link
          href={`/go/${product.id}`}
          rel="sponsored noopener"
          className="text-[0.75rem] tracking-[0.06em] whitespace-nowrap text-accent underline decoration-transparent underline-offset-[3px] transition-colors group-hover:decoration-current"
        >
          Shop →
        </Link>
      </div>

      <MoreOptions item={item} more={more} />
    </div>
  )
}
