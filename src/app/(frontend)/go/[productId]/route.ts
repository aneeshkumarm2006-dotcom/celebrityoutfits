import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Outbound affiliate redirect.
 *
 * The raw affiliate URL never appears in page markup — every buy link points
 * here. That gives us first-party click data on the same day (networks report
 * 24–48h late) and lets a merchant be swapped without touching content.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params
  const payload = await getPayloadClient()

  let destination: string | null = null

  try {
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
    })
    destination = product?.affiliateUrl ?? null

    if (destination) {
      // Logged after the destination is resolved so a logging failure can never
      // strand the visitor.
      await payload.create({
        collection: 'outboundClicks',
        data: {
          product: product.id,
          referrer: request.headers.get('referer') ?? undefined,
        },
      })
    }
  } catch {
    // fall through to the homepage redirect below
  }

  if (!destination) {
    return NextResponse.redirect(new URL('/', request.url), 302)
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: { 'X-Robots-Tag': 'noindex, nofollow' },
  })
}
