import type { Metadata } from 'next'

import { Container } from '@/components/site/primitives'
import { buildPageMetadata } from '@/lib/seo'

import { RequestForm } from './RequestForm'

export const generateMetadata = (): Promise<Metadata> =>
  buildPageMetadata('request', {
    title: 'Ask us to identify an outfit',
    description:
      'Send us a photo of an outfit you cannot place and we will identify it: the brand, the piece, and where to buy it or the closest thing to it.',
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
    body: 'We publish what we find and email you the link, with the exact piece, or the closest thing still in stock.',
  },
]

/**
 * The privacy and cost terms, previously one paragraph of grey small print
 * below the submit button. Same commitments, said where they answer the
 * question someone is actually asking as they type.
 */
const assurances = [
  {
    term: 'It is free',
    detail: 'No charge and no queue to jump. We work through them in the order they arrive.',
  },
  {
    term: 'Your address is only used to answer you',
    detail: 'No list, no forwarding, no newsletter you did not ask for.',
  },
  {
    term: 'Your photo stays private',
    detail:
      'We look at it to do the research. We do not publish an image unless we have licensed it ourselves.',
  },
  {
    term: 'We will admit it if we cannot tell',
    detail: 'An honest "we could not confirm this" is worth more to you than a brand we guessed.',
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
          Saw something you cannot place? Send it to us. We will work out what it is: the brand, the
          piece, and where to buy it. If we cannot confirm it, we will say so plainly rather than
          guess.
        </p>

        {/*
          The three things people want to know before they start typing, said
          before they start typing rather than in the small print underneath.
        */}
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-[0.8125rem] text-muted">
          {['Free, and no queue to jump', 'Answered by a person, not a bot', 'Usually a few days'].map(
            (fact) => (
              <li key={fact} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
                {fact}
              </li>
            ),
          )}
        </ul>
      </section>

      <section className="border-t border-rule py-12 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-3 lg:gap-14">
          {steps.map((step) => (
            <div key={step.n} className="relative sm:pt-6">
              {/* Hairline above each step, so the three read as one sequence. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 hidden h-px bg-rule sm:block"
              />
              <p className="eyebrow m-0">{step.n}</p>
              <h2 className="mt-3 mb-2 font-display text-[var(--text-step-2)] font-normal">
                {step.title}
              </h2>
              <p className="m-0 text-[0.9375rem] leading-relaxed text-ink-2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/*
        The form sat alone in a wide column with the reassurances set as grey
        small print underneath it, which is the one place nobody reads them.
        They are worth more beside the fields they are reassuring about.
      */}
      <section className="border-t border-rule py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,42rem)_minmax(0,19rem)] lg:gap-16">
          <RequestForm />

          {/* Clears the sticky header (70px at this breakpoint) plus a margin. */}
          <aside className="lg:sticky lg:top-[86px] lg:self-start">
            <div className="border border-rule bg-raised p-6">
              <p className="eyebrow m-0">Before you send</p>
              <dl className="mt-5 grid gap-5">
                {assurances.map((item) => (
                  <div key={item.term}>
                    <dt className="text-[0.875rem] text-ink">{item.term}</dt>
                    <dd className="m-0 mt-1 text-[0.8125rem] leading-relaxed text-ink-2">
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </section>
    </Container>
  )
}
