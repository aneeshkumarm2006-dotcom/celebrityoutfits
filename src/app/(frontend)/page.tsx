import Link from 'next/link'

import { ArticleCard, CelebrityCard, LookCard } from '@/components/site/cards'
import { Container, Frame, SectionHead } from '@/components/site/primitives'
import { getArticles, getCelebrities, getHomepage, getLooks } from '@/lib/payload'
import type { Media } from '@/payload-types'

export const revalidate = 3600

/**
 * The homepage is assembled from the `homepage` global, so the team can
 * reorder or switch off any section without a developer.
 */
export default async function HomePage() {
  const homepage = await getHomepage()
  const sections = (homepage?.sections ?? []).filter(
    (s) => (s as { enabled?: boolean }).enabled !== false,
  )

  // Nothing configured yet — show a holding state rather than a blank page.
  if (sections.length === 0) {
    return (
      <Container className="flex flex-1 flex-col justify-center py-24">
        <p className="eyebrow">Every look, identified</p>
        <h1 className="mt-5 max-w-[16ch] font-display text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.98] font-normal tracking-[-0.02em]">
          What they wore, and <em className="italic">where to buy it</em>
        </h1>
        <p className="mt-7 max-w-[34rem] text-ink-2">
          The homepage is built from sections in the admin. Add a hero under{' '}
          <strong className="font-medium">Settings → Homepage</strong> to replace this.
        </p>
        <Link
          href="/admin/globals/homepage"
          className="mt-9 self-start border-b border-ink pb-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
        >
          Configure the homepage →
        </Link>
      </Container>
    )
  }

  return (
    <>
      {sections.map(async (section, index) => {
        const key = `${section.blockType}-${index}`

        if (section.blockType === 'hero') {
          return (
            <Container key={key}>
              <div className="grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
                <div>
                  {section.eyebrow ? <p className="eyebrow">{section.eyebrow}</p> : null}
                  <h1 className="mt-5 mb-6 font-display text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.98] font-normal tracking-[-0.02em] text-balance">
                    {section.headline}{' '}
                    {section.headlineEmphasis ? (
                      <em className="italic">{section.headlineEmphasis}</em>
                    ) : null}
                  </h1>
                  {section.body ? (
                    <p className="mb-8 max-w-[34rem] text-ink-2">{section.body}</p>
                  ) : null}
                  {section.ctaLabel && section.ctaHref ? (
                    <Link
                      href={section.ctaHref}
                      className="inline-flex items-center gap-2.5 border-b border-ink pb-1.5 text-sm tracking-[0.04em] transition-colors hover:border-accent hover:text-accent"
                    >
                      {section.ctaLabel} →
                    </Link>
                  ) : null}
                </div>
                {section.image ? (
                  <Frame
                    media={section.image as Media}
                    ratio="3x4"
                    size="portrait"
                    priority
                    showCredit
                    sizes="(min-width: 1024px) 40vw, 100vw"
                  />
                ) : null}
              </div>
            </Container>
          )
        }

        if (section.blockType === 'latestLooks') {
          const looks = await getLooks({ limit: section.count ?? 4 })
          if (looks.length === 0) return null
          return (
            <Container key={key}>
              <section className="border-t border-rule py-12 sm:py-20">
                <SectionHead heading={section.heading ?? 'Latest looks'} href={section.viewAllHref} />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-9">
                  {looks.map((look) => (
                    <LookCard key={look.id} look={look} />
                  ))}
                </div>
              </section>
            </Container>
          )
        }

        if (section.blockType === 'celebrityGrid') {
          const celebrities = await getCelebrities(section.count ?? 5)
          if (celebrities.length === 0) return null
          return (
            <Container key={key}>
              <section className="border-t border-rule py-12 sm:py-20">
                <SectionHead heading={section.heading ?? 'Browse by celebrity'} href="/celebrities" />
                <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-9">
                  {celebrities.map((celebrity) => (
                    <CelebrityCard key={celebrity.id} celebrity={celebrity} />
                  ))}
                </div>
              </section>
            </Container>
          )
        }

        if (section.blockType === 'standards') {
          const items = section.items ?? []
          if (items.length === 0) return null
          return (
            <Container key={key}>
              <section className="border-t border-rule py-12 sm:py-20">
                <SectionHead heading={section.heading ?? 'How we identify an item'} />
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
                  {items.map((item, i) => (
                    <div key={i}>
                      <p className="eyebrow">{String(i + 1).padStart(2, '0')}</p>
                      <h4 className="mt-2.5 mb-2 font-display text-[var(--text-step-1)] font-normal">
                        {item.title}
                      </h4>
                      <p className="m-0 text-[0.9375rem] text-ink-2">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            </Container>
          )
        }

        if (section.blockType === 'journalPreview') {
          const articles = await getArticles({ limit: section.count ?? 3 })
          if (articles.length === 0) return null
          return (
            <Container key={key}>
              <section className="border-t border-rule py-12 sm:py-20">
                <SectionHead heading={section.heading ?? 'From the journal'} href={section.viewAllHref} />
                <div className="grid gap-6 sm:grid-cols-3 lg:gap-9">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            </Container>
          )
        }

        return null
      })}
    </>
  )
}
