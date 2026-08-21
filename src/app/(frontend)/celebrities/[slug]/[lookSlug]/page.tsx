import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArticleBody } from '@/components/site/ArticleBody'
import { ItemCard } from '@/components/site/cards'
import { Container, Frame, SectionHead } from '@/components/site/primitives'
import { formatDate, formatPrice, mediaUrl } from '@/lib/media'
import { getCelebrityBySlug, getItemsForLook, getLookBySlug } from '@/lib/payload'
import { breadcrumbSchema, buildMetadata } from '@/lib/seo'
import type { Celebrity, Media, Product } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; lookSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lookSlug } = await params
  const look = await getLookBySlug(lookSlug)
  if (!look) return {}
  return buildMetadata({
    doc: look,
    fallbackTitle: look.title,
    fallbackDescription: look.description,
    path: `/celebrities/${slug}/${look.slug}`,
  })
}

/**
 * An individual outfit, with its own URL, its own SEO and its own Product
 * schema. This is what makes a *look* rankable in Google rather than only the
 * celebrity page it sits on.
 */
export default async function LookPage({ params }: Props) {
  const { slug, lookSlug } = await params
  const [look, celebrity] = await Promise.all([getLookBySlug(lookSlug), getCelebrityBySlug(slug)])
  if (!look || !celebrity) notFound()

  const items = await getItemsForLook(look.id)
  const photo = Array.isArray(look.photos) ? (look.photos[0] as Media) : null

  /**
   * Only garments that resolve to something buyable belong in the shop grid.
   * An unidentified item has no image and no price, so as a card it is an empty
   * box stretched to the height of its row. It still appears in the list beside
   * the photograph, which is where the honest "we could not place this" belongs.
   */
  const shoppable = items.filter(
    (item) =>
      (item.product && typeof item.product === 'object') ||
      (item.alternativeProduct && typeof item.alternativeProduct === 'object'),
  )

  const unmatched = items.filter((item) => !shoppable.includes(item))

  const products = items
    .map((item) => (typeof item.product === 'object' ? (item.product as Product) : null))
    .filter(Boolean) as Product[]

  const retailTotal = products.reduce((sum, p) => sum + (p.priceCents ?? 0), 0)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Celebrities', path: '/celebrities' },
              { name: celebrity.name, path: `/celebrities/${celebrity.slug}` },
              { name: look.title, path: `/celebrities/${celebrity.slug}/${look.slug}` },
            ]),
          ),
        }}
      />
      {products.map((product) => (
        <script
          key={product.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.name,
              image: mediaUrl(product.image as Media, 'square') ?? undefined,
              brand:
                typeof product.brand === 'object' && product.brand
                  ? { '@type': 'Brand', name: product.brand.name }
                  : undefined,
              offers:
                typeof product.priceCents === 'number'
                  ? {
                      '@type': 'Offer',
                      price: (product.priceCents / 100).toFixed(2),
                      priceCurrency: product.currency ?? 'USD',
                      availability: product.inStock
                        ? 'https://schema.org/InStock'
                        : 'https://schema.org/OutOfStock',
                    }
                  : undefined,
            }),
          }}
        />
      ))}

      <Container>
        <nav aria-label="Breadcrumb" className="pt-8 text-[0.8125rem] text-muted">
          <Link href="/celebrities" className="hover:text-accent">
            Celebrities
          </Link>
          <span aria-hidden> · </span>
          <Link href={`/celebrities/${celebrity.slug}`} className="hover:text-accent">
            {celebrity.name}
          </Link>
        </nav>

        <section className="py-8 sm:py-12">
          <p className="eyebrow">
            {formatDate(look.date)}
            {look.location ? ` · ${look.location}` : ''}
            {look.occasion ? ` · ${look.occasion}` : ''}
            {look.event ? ` · ${look.event}` : ''}
          </p>
          <h1 className="mt-4 mb-6 max-w-[22ch] font-display text-[var(--text-step-4)] leading-[1.06] font-normal tracking-[-0.015em] text-balance">
            {look.title}
          </h1>
          {look.description ? (
            <p className="mb-10 max-w-[38rem] text-ink-2">{look.description}</p>
          ) : null}

          {/**
           * Photograph and shop grid side by side, two products per row.
           *
           * The grid was full width underneath for a while on the reasoning
           * that two cards would not fit in this column. That was measured at a
           * 1280px window, where each card lands at 220px. On the screens this
           * is actually read on it is 300px and upwards, so the objection was
           * wrong and the products belong next to the photograph they came out
           * of, which is where they were asked for.
           *
           * The products column is first in the markup and moved second by
           * `order` at `lg`. That way a phone stacks products above the
           * photograph, and a desktop still reads photo-left, products-right.
           * One set of markup, so nothing is duplicated for crawlers.
           */}
          <div
            id="shop-this-look"
            className="grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14"
          >
            <div className="lg:order-2">
              <SectionHead
                heading={`${items.length} item${items.length === 1 ? '' : 's'} in this look`}
              />

              {items.length === 0 ? <p className="text-muted">Nothing identified yet.</p> : null}

              {shoppable.length > 0 ? (
                /*
                 * `auto-rows-fr` divides the height above between the rows, and
                 * each card fills its row, so the boxes shrink or grow to suit
                 * rather than the column overrunning the photograph. Capped so
                 * a two-item look does not stretch one card to full height.
                 */
                <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-x-6">
                  {shoppable.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : null}

              {/**
               * The garments we could not place, kept out of the card grid.
               * They have no image and no price, so as cards they are empty
               * boxes stretched to the height of whatever sits beside them.
               * Stated in a line each instead, still on the page, still honest.
               */}
              {unmatched.length > 0 ? (
                <div className={shoppable.length > 0 ? 'mt-9' : ''}>
                  <p className="eyebrow m-0 mb-3">Not identified</p>
                  <ul className="m-0 grid list-none gap-2.5 p-0">
                    {unmatched.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-3 border-b border-rule-2 pb-2.5 text-[0.875rem] last:border-b-0"
                      >
                        <span className="min-w-0 text-ink-2">
                          {item.description || item.category}
                        </span>
                        <span className="shrink-0 text-[0.6875rem] tracking-[0.13em] text-muted uppercase">
                          {item.category}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/**
               * Only when something actually carries a price. Summing a list of
               * products that have none gives zero, and "this look runs $0" reads
               * as a broken page rather than as missing data.
               */}
              {retailTotal > 0 ? (
                <p className="mt-8 border-t border-rule pt-5 text-[0.8125rem] text-muted">
                  Assembled at full retail this look runs{' '}
                  <b className="font-medium text-ink">
                    {formatPrice(retailTotal, products[0]?.currency ?? 'USD')}
                  </b>
                  .
                </p>
              ) : null}
            </div>

            <div className="max-w-[34rem] lg:order-1 lg:max-w-none">
              <Frame
                media={photo}
                ratio="3x4"
                size="portrait"
                position="top"
                priority
                showCredit
                sizes="(min-width: 1024px) 55vw, (min-width: 640px) 34rem, 100vw"
              />
            </div>
          </div>
        </section>

        {/**
         * The write-up stays full width underneath, at a comfortable reading
         * measure. Squeezed into the column beside the photograph it would set
         * long prose about thirty characters wide.
         */}
        {look.story ? (
          <section className="border-t border-rule py-12 sm:py-16">
            <ArticleBody data={look.story as SerializedEditorState} />
          </section>
        ) : null}
      </Container>

    </>
  )
}
