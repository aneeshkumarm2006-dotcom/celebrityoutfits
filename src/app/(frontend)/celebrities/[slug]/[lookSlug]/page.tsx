import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArticleBody } from '@/components/site/ArticleBody'
import { ItemRow } from '@/components/site/cards'
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

  const products = items
    .map((item) => (typeof item.product === 'object' ? (item.product as Product) : null))
    .filter(Boolean) as Product[]

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
           * Photograph and shopping list side by side.
           *
           * A look photograph is portrait, so run full width it stands over a
           * thousand pixels tall on a laptop and leaves half the page empty
           * beside it — while the items, which are the point of the page, sit
           * below the fold. Putting the list in that empty space fixes both at
           * once.
           *
           * Below `lg` it stacks back to photo-then-items. Same markup in the
           * same order either way, so nothing is duplicated for crawlers.
           */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
            <div className="max-w-[34rem] lg:max-w-none">
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

            {/**
             * Deliberately not sticky. A sticky column taller than the viewport
             * can never be scrolled to its end, and the usual fix — capping its
             * height and giving it its own scrollbar — buried the retail total
             * inside a nested scroll area nobody would find. A plain column
             * costs a little whitespace under short lists and hides nothing.
             */}
            <div>
              <SectionHead
                heading={`${items.length} item${items.length === 1 ? '' : 's'} in this look`}
              />
              {items.length === 0 ? (
                <p className="text-muted">Nothing identified yet.</p>
              ) : (
                <div className="grid gap-5">
                  {items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}

              {products.length > 0 ? (
                <p className="mt-8 border-t border-rule pt-5 text-[0.8125rem] text-muted">
                  Assembled at full retail this look runs{' '}
                  <b className="font-medium text-ink">
                    {formatPrice(
                      products.reduce((sum, p) => sum + (p.priceCents ?? 0), 0),
                      products[0]?.currency ?? 'USD',
                    )}
                  </b>
                  .
                </p>
              ) : null}
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
