import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArticleCard, ItemCard } from '@/components/site/cards'
import { Container, Frame, SectionHead } from '@/components/site/primitives'
import { buildMetadata } from '@/lib/seo'
import { formatDate } from '@/lib/media'
import {
  getArticles,
  getCelebrityBySlug,
  getItemsForLook,
  getLooks,
} from '@/lib/payload'
import type { Media } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const celebrity = await getCelebrityBySlug(slug)
  if (!celebrity) return {}
  return buildMetadata({
    doc: celebrity,
    fallbackTitle: celebrity.name,
    fallbackDescription: celebrity.standfirst,
    path: `/celebrities/${celebrity.slug}`,
  })
}

export default async function CelebrityPage({ params }: Props) {
  const { slug } = await params
  const celebrity = await getCelebrityBySlug(slug)
  if (!celebrity) notFound()

  const [looks, articles] = await Promise.all([
    getLooks({ celebrityId: celebrity.id }),
    getArticles({ celebrityId: celebrity.id, limit: 3 }),
  ])

  const itemsByLook = await Promise.all(looks.map((look) => getItemsForLook(look.id)))
  const totalItems = itemsByLook.reduce((sum, items) => sum + items.length, 0)

  return (
    <>
      {/* Person schema — helps Google understand this is a page *about* someone. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: celebrity.name,
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/celebrities/${celebrity.slug}`,
          }),
        }}
      />

      <Container>
        <section className="py-12 sm:py-16">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
            <div>
              <p className="eyebrow">Style archive</p>
              <h1 className="mt-5 font-display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.94] font-normal tracking-[-0.015em]">
                {celebrity.name}
              </h1>
            </div>
            {celebrity.standfirst ? (
              <p className="mb-1.5 max-w-[28rem] text-[clamp(1rem,1.3vw,1.1875rem)] leading-relaxed text-ink-2">
                {celebrity.standfirst}
              </p>
            ) : null}
          </div>

          <div className="mt-9 flex flex-wrap gap-x-7 border-t border-rule pt-5 text-[var(--text-step--1)] text-muted">
            <span>
              <b className="font-medium tabular-nums text-ink">{looks.length}</b> looks logged
            </span>
            <span>
              <b className="font-medium tabular-nums text-ink">{totalItems}</b> items identified
            </span>
            <span>
              Updated <b className="font-medium text-ink">{formatDate(celebrity.updatedAt)}</b>
            </span>
          </div>
        </section>
      </Container>

      {celebrity.heroImage ? (
        <>
          <div className="w-screen ml-[calc(50%-50vw)]">
            <Frame
              media={celebrity.heroImage as Media}
              ratio="16x9"
              size="hero"
              position="top"
              priority
              sizes="100vw"
            />
          </div>
          <Container>
            <p className="mt-2.5 text-[0.6875rem] text-muted">
              {(celebrity.heroImage as Media)?.credit}
            </p>
          </Container>
        </>
      ) : null}

      <Container>
        <section className="py-12 sm:py-20">
          <SectionHead heading="Looks" />
          {looks.length === 0 ? (
            <p className="text-muted">No looks published yet.</p>
          ) : (
            looks.map((look, i) => {
              const items = itemsByLook[i]
              const photo = Array.isArray(look.photos) ? (look.photos[0] as Media) : null
              return (
                <article key={look.id} className="border-t border-rule py-10 first:border-t-0 sm:py-16">
                  <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
                    <Link
                      href={`/celebrities/${celebrity.slug}/${look.slug}`}
                      className="group block no-underline"
                    >
                      <Frame
                        media={photo}
                        ratio="3x2"
                        size="landscape"
                        position="top"
                        showCredit
                        sizes="(min-width: 1024px) 55vw, 100vw"
                      />
                    </Link>
                    <div>
                      <p className="eyebrow">
                        {formatDate(look.date)}
                        {look.location ? ` · ${look.location}` : ''}
                        {look.occasion ? ` · ${look.occasion}` : ''}
                      </p>
                      <h3 className="mt-3.5 mb-4 font-display text-[var(--text-step-3)] leading-[1.15] font-normal tracking-[-0.01em]">
                        <Link
                          href={`/celebrities/${celebrity.slug}/${look.slug}`}
                          className="no-underline"
                        >
                          {look.title}
                        </Link>
                      </h3>
                      {look.description ? (
                        <p className="m-0 max-w-[36rem] text-ink-2">{look.description}</p>
                      ) : null}
                    </div>
                  </div>

                  {items.length > 0 ? (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                      {items.map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </section>

        {articles.length > 0 ? (
          <section className="border-t border-rule py-12 sm:py-20">
            <SectionHead heading={`More on ${celebrity.name}`} href="/journal" />
            <div className="grid gap-6 sm:grid-cols-3 lg:gap-9">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </>
  )
}
