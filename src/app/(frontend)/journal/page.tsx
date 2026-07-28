import type { Metadata } from 'next'

import { ArticleCard } from '@/components/site/cards'
import { Container } from '@/components/site/primitives'
import { getArticles } from '@/lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Style analysis, buying guides and brand files from the Celebrity Outfits desk.',
}

export default async function JournalPage() {
  const articles = await getArticles({ limit: 48 })

  return (
    <Container>
      <section className="py-12 sm:py-16">
        <p className="eyebrow">Writing</p>
        <h1 className="mt-4 mb-5 font-display text-[clamp(2.75rem,6vw,5rem)] leading-none font-normal tracking-[-0.02em]">
          Journal
        </h1>
        <p className="mb-10 max-w-[38rem] text-ink-2">
          Style analysis, buying guides and brand files.
        </p>

        {articles.length === 0 ? (
          <p className="text-muted">
            Nothing published yet. Write the first post in the admin under Journal → Articles.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-9">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </Container>
  )
}
