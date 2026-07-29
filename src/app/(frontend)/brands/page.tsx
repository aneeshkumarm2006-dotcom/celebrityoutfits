import type { Metadata } from 'next'
import Link from 'next/link'

import { Container, Frame } from '@/components/site/primitives'
import { getBrands } from '@/lib/payload'
import type { Media } from '@/payload-types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Brands',
  description: 'Every brand we have identified across the archive.',
}

export default async function BrandsPage() {
  const brands = await getBrands()

  return (
    <Container>
      <section className="py-12 sm:py-16">
        <p className="eyebrow">The archive</p>
        <h1 className="mt-4 mb-10 font-display text-[clamp(2.75rem,6vw,5rem)] leading-none font-normal tracking-[-0.02em]">
          Brands
        </h1>

        {brands.length === 0 ? (
          <p className="text-muted">No brands published yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-9">
            {brands.map((brand) => (
              <Link key={brand.id} href={`/brands/${brand.slug}`} className="group block no-underline">
                <Frame media={brand.logo as Media} ratio="3x2" size="logo" fit="contain" className="mb-3" />
                <h3 className="m-0 font-display text-[var(--text-step-1)] font-normal">{brand.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Container>
  )
}
