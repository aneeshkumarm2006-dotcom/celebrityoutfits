import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container } from '@/components/site/primitives'
import { getBrandBySlug } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

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

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)
  if (!brand) notFound()

  return (
    <Container>
      <section className="py-12 sm:py-16">
        <p className="eyebrow">Brand file</p>
        <h1 className="mt-4 mb-6 font-display text-[clamp(2.75rem,6vw,5rem)] leading-none font-normal tracking-[-0.02em]">
          {brand.name}
        </h1>
      </section>
    </Container>
  )
}
