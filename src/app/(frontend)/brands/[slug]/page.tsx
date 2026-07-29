import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArticleBody } from '@/components/site/ArticleBody'
import { Container, Frame, SectionHead } from '@/components/site/primitives'
import { formatDate, formatPrice } from '@/lib/media'
import { getArticlesByBrand, getBrandBySlug, getProductsByBrand } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'
import type { Media } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)
  if (!brand) return {}
  return buildMetadata({
    doc: brand,
    fallbackTitle: brand.name,
    path: `/brands/${brand.slug}`,
  })
}

/**
 * Strip the scheme and any trailing slash so the link reads as a domain rather
 * than a URL — `ray-ban.com`, not `https://www.ray-ban.com/`.
 */
const displayHost = (url: string): string =>
  url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)
  if (!brand) notFound()

  const [products, articles] = await Promise.all([
    getProductsByBrand(brand.id),
    getArticlesByBrand(brand.id),
  ])

  return (
    <Container>
      <section className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-start lg:gap-16">
          {brand.logo ? (
            <Frame
              media={brand.logo as Media}
              ratio="3x2"
              size="landscape"
              fit="contain"
              sizes="(min-width: 1024px) 30vw, 100vw"
              priority
            />
          ) : null}

          <div>
            <p className="eyebrow">Brand file</p>
            <h1 className="mt-4 mb-5 font-display text-[clamp(2.75rem,6vw,5rem)] leading-none font-normal tracking-[-0.02em]">
              {brand.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.8125rem]">
              {brand.founded ? (
                <span className="text-muted">
                  Founded <span className="text-ink">{brand.founded}</span>
                </span>
              ) : null}
              {brand.website ? (
                <a
                  href={brand.website}
                  target="_blank"
                  /**
                   * Plain external link, never an affiliate one. `nofollow`
                   * because we are not vouching for a commercial site we have
                   * no relationship with, and passing rank to one we might
                   * later be paid by is how sites earn manual actions.
                   */
                  rel="nofollow noopener noreferrer"
                >
                  {displayHost(brand.website)} ↗
                </a>
              ) : null}
            </div>

            {brand.description ? (
              <div className="mt-8 max-w-[62ch]">
                <ArticleBody data={brand.description as SerializedEditorState} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {products.length > 0 ? (
        <section className="border-t border-rule py-12 sm:py-16">
          <SectionHead heading={`${brand.name} in the archive`} />
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-9">
            {products.map((product) => (
              <article key={product.id}>
                <Frame media={product.image as Media} ratio="3x4" size="portrait" className="mb-3" />
                <h3 className="m-0 text-[0.9375rem] leading-snug font-normal">{product.name}</h3>
                <div className="mt-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[0.8125rem] text-muted">
                    {product.priceDisplay ??
                      formatPrice(product.priceCents, product.currency ?? 'USD') ??
                      ''}
                  </span>
                  <Link href={`/go/${product.id}`} rel="nofollow sponsored" className="text-[0.8125rem]">
                    Shop →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section className="border-t border-rule py-12 sm:py-16">
          <SectionHead heading={`Written about ${brand.name}`} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-9">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/journal/${article.slug}`}
                className="group block no-underline"
              >
                <Frame
                  media={article.heroImage as Media}
                  ratio="3x2"
                  size="landscape"
                  position="top"
                  className="mb-3"
                />
                <h3 className="m-0 font-display text-[var(--text-step-1)] leading-snug font-normal">
                  {article.title}
                </h3>
                <p className="mt-1.5 text-[0.8125rem] text-muted">{formatDate(article.publishedAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {products.length === 0 && articles.length === 0 ? (
        <section className="border-t border-rule py-12 sm:py-16">
          <p className="max-w-[52ch] text-muted">
            Nothing from {brand.name} has been logged yet. Items appear here as they are identified
            in looks across the archive.
          </p>
        </section>
      ) : null}
    </Container>
  )
}
