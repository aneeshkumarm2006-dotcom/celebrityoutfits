import type { Metadata } from 'next'

import { CelebrityCard } from '@/components/site/cards'
import { Container } from '@/components/site/primitives'
import { getCelebrities } from '@/lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Celebrities',
  description:
    'Every person we track has a permanent page that grows with each new photograph.',
}

export default async function CelebritiesPage() {
  const celebrities = await getCelebrities()

  return (
    <Container>
      <section className="py-12 sm:py-16">
        <p className="eyebrow">The archive</p>
        <h1 className="mt-4 mb-5 font-display text-[clamp(2.75rem,6vw,5rem)] leading-none font-normal tracking-[-0.02em]">
          Celebrities
        </h1>
        <p className="mb-10 max-w-[38rem] text-ink-2">
          Every person we track has a permanent page that grows with each new photograph.
        </p>

        {celebrities.length === 0 ? (
          <p className="text-muted">
            No celebrities published yet. Add one in the admin under Archive → Celebrities.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-9">
            {celebrities.map((celebrity) => (
              <CelebrityCard key={celebrity.id} celebrity={celebrity} />
            ))}
          </div>
        )}
      </section>
    </Container>
  )
}
