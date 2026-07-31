import type { Metadata } from 'next'

import { Container } from '@/components/site/primitives'
import { buildMetadata } from '@/lib/seo'

import { RequestForm } from './RequestForm'

export const metadata: Metadata = buildMetadata({
  fallbackTitle: 'Ask us to identify an outfit',
  fallbackDescription:
    'Send us a photo of an outfit you cannot place and we will identify it — the brand, the piece, and where to buy it or the closest thing to it.',
  path: '/request',
})

/**
 * Static: the form posts to a Server Action, so nothing on this page needs
 * rendering per request.
 */
export const dynamic = 'force-static'

const steps = [
  {
    n: '01',
    title: 'Send it over',
    body: 'A photo or a link, and a line about which piece you mean. The more specific, the faster this goes.',
  },
  {
    n: '02',
    title: 'We do the work',
    body: 'Reverse image search, runway and lookbook archives, stylist credits, and the brand’s own catalogue.',
  },
  {
    n: '03',
    title: 'You get the answer',
    body: 'We publish what we find and email you the link — with the exact piece, or the closest thing still in stock.',
  },
]

export default function RequestPage() {
  return (
    <Container>
      <section className="py-12 sm:py-16">
        <p className="eyebrow">Ask the desk</p>
        <h1 className="mt-4 mb-6 max-w-[18ch] font-display text-[clamp(2.75rem,6vw,5rem)] leading-[1.02] font-normal tracking-[-0.02em]">
          Find me this outfit
        </h1>
        <p className="max-w-[54ch] text-[var(--text-step-1)] leading-relaxed text-ink-2">
          Saw something you cannot place? Send it to us. We will work out what it is — the brand, the
          piece, and where to buy it. If we cannot confirm it, we will say so plainly rather than
          guess.
        </p>
      </section>

      <section className="border-t border-rule py-12 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-3 lg:gap-14">
          {steps.map((step) => (
            <div key={step.n}>
              <p className="eyebrow m-0">{step.n}</p>
              <h2 className="mt-3 mb-2 font-display text-[var(--text-step-2)] font-normal">
                {step.title}
              </h2>
              <p className="m-0 text-[0.9375rem] leading-relaxed text-ink-2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-rule py-12 sm:py-16">
        <RequestForm />

        <p className="mt-10 max-w-[52ch] text-[0.8125rem] leading-relaxed text-muted">
          It is free, and there is no queue to jump. We use your address to answer this request and
          nothing else — no list, no forwarding. Images you send stay private: we look at them to do
          the research, and we do not publish one unless we have licensed it ourselves.
        </p>
      </section>
    </Container>
  )
}
