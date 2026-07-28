import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

/** Increment an article's view count. Fire-and-forget from ViewBeacon. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ articleId: string }> },
) {
  const { articleId } = await params

  try {
    const payload = await getPayloadClient()
    const article = await payload.findByID({
      collection: 'articles',
      id: articleId,
      depth: 0,
    })

    await payload.update({
      collection: 'articles',
      id: articleId,
      data: { views: (article.views ?? 0) + 1 },
      // A view is not an edit — don't spawn a draft version for it.
      draft: false,
      context: { skipRevalidate: true },
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never surface analytics failures to a reader.
    return NextResponse.json({ ok: false }, { status: 204 })
  }
}
