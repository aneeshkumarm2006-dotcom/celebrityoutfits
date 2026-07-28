import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArticleBody } from '@/components/site/ArticleBody'
import { ViewBeacon } from '@/components/site/ViewBeacon'
import { Container, Frame } from '@/components/site/primitives'
import { formatDate, mediaUrl } from '@/lib/media'
import { getArticleBySlug, getSiteSettings } from '@/lib/payload'
import { breadcrumbSchema, buildMetadata } from '@/lib/seo'
import type { Celebrity, Media } from '@/payload-types'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}
  return buildMetadata({
    doc: article,
    fallbackTitle: article.title,
    fallbackDescription: article.excerpt,
    path: `/journal/${article.slug}`,
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const [article, settings] = await Promise.all([getArticleBySlug(slug), getSiteSettings()])
  if (!article) notFound()

  const celebrity =
    typeof article.relatedCelebrity === 'object' ? (article.relatedCelebrity as Celebrity) : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.excerpt,
            image: mediaUrl(article.heroImage as Media, 'og') ?? undefined,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            author: { '@type': 'Person', name: article.author || settings?.siteName || 'Celebrity Outfits' },
            publisher: { '@type': 'Organization', name: settings?.siteName || 'Celebrity Outfits' },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Journal', path: '/journal' },
              { name: article.title, path: `/journal/${article.slug}` },
            ]),
          ),
        }}
      />

      {/* Counted client-side; incrementing during render would break ISR. */}
      <ViewBeacon articleId={String(article.id)} />

      <Container>
        <article className="py-12 sm:py-16">
          <header className="mx-auto mb-10 max-w-[var(--container-measure)] text-center sm:mb-14">
            <p className="eyebrow">
              Journal
              {article.template && article.template !== 'generic'
                ? ` — ${article.template.replace(/-/g, ' ')}`
                : ''}
            </p>
            <h1 className="mt-4 mb-5 font-display text-[var(--text-step-4)] leading-[1.08] font-normal tracking-[-0.015em] text-balance">
              {article.title}
            </h1>
            <p className="m-0 text-[var(--text-step--1)] text-muted">
              {article.author ? `By ${article.author} · ` : ''}
              {formatDate(article.publishedAt)}
            </p>
          </header>

          {article.heroImage ? (
            <div className="mb-10 sm:mb-14">
              <Frame
                media={article.heroImage as Media}
                ratio="2x1"
                size="wide"
                priority
                showCredit
                sizes="100vw"
              />
            </div>
          ) : null}

          {article.body ? (
            <ArticleBody
              data={article.body as SerializedEditorState}
              keywords={article.keywords}
            />
          ) : null}

          {celebrity ? (
            <p className="mx-auto mt-14 max-w-[var(--container-measure)] border-t border-rule pt-6 text-[0.9375rem]">
              More from{' '}
              <Link href={`/celebrities/${celebrity.slug}`} className="text-accent underline underline-offset-[3px]">
                {celebrity.name}&rsquo;s style archive
              </Link>
              .
            </p>
          ) : null}
        </article>
      </Container>
    </>
  )
}
