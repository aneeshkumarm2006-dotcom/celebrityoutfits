'use server'

import { createHash } from 'crypto'

import { headers } from 'next/headers'

import { getPayloadClient } from '@/lib/payload'

export type RequestState = {
  status: 'idle' | 'ok' | 'error'
  message?: string
  fieldErrors?: Partial<Record<'summary' | 'email' | 'image', string>>
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

/** Per-source submission ceiling, and the window it applies over. */
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

/**
 * Rate limiting has to survive serverless, where every request may land on a
 * fresh instance — an in-memory counter would reset constantly and protect
 * nothing. Counting rows is slower and actually works.
 *
 * The address is hashed with the app secret rather than stored. We need to
 * recognise a flood from one source; we do not need a log of who visited, and
 * keeping one would be a liability with no upside.
 */
const submitterHash = async (): Promise<string> => {
  const list = await headers()
  const address =
    list.get('x-forwarded-for')?.split(',')[0]?.trim() || list.get('x-real-ip') || 'unknown'
  return createHash('sha256')
    .update(`${address}:${process.env.PAYLOAD_SECRET ?? ''}`)
    .digest('hex')
    .slice(0, 40)
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const submitRequest = async (
  _previous: RequestState,
  formData: FormData,
): Promise<RequestState> => {
  // ── Spam gates, cheapest first ──────────────────────────────────────────
  // A field positioned off-screen and hidden from assistive tech. Humans never
  // see it; most bots fill in every input they find.
  if ((formData.get('company') as string)?.length) {
    // Answer as though it worked. Telling a bot it failed only teaches it.
    return { status: 'ok' }
  }

  // Nobody reads a form, finds a photo and types an email in under three
  // seconds. Scripts do it in well under one.
  const startedAt = Number(formData.get('startedAt') ?? 0)
  if (startedAt && Date.now() - startedAt < 3000) {
    return { status: 'ok' }
  }

  const summary = String(formData.get('summary') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const personGuess = String(formData.get('personGuess') ?? '').trim()
  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim()
  const consent = formData.get('consent') === 'on'
  const file = formData.get('image')

  const fieldErrors: RequestState['fieldErrors'] = {}
  if (summary.length < 10) {
    fieldErrors.summary = 'Tell us a little more. Ten characters at least.'
  }
  if (summary.length > 1200) {
    fieldErrors.summary = 'That is longer than we can use. Trim it to the essentials.'
  }
  if (!EMAIL.test(email)) {
    fieldErrors.email = 'We need a valid address to send the answer to.'
  }

  const hasFile = file instanceof File && file.size > 0
  if (hasFile) {
    if (file.size > MAX_UPLOAD_BYTES) {
      fieldErrors.image = 'That image is over 5MB. A screenshot is usually plenty.'
    } else if (!ALLOWED_TYPES.includes(file.type)) {
      fieldErrors.image = 'Images only: JPEG, PNG, WebP or HEIC.'
    }
  }

  if (!hasFile && !sourceUrl) {
    fieldErrors.image = 'Attach a photo or paste a link, so we know what we are looking for.'
  }

  if (!consent) {
    return {
      status: 'error',
      message: 'Please confirm you are happy for us to contact you about this request.',
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', fieldErrors }
  }

  try {
    const payload = await getPayloadClient()
    const hash = await submitterHash()

    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
    const recent = await payload.count({
      collection: 'requests',
      where: { submitterHash: { equals: hash }, createdAt: { greater_than: since } },
    })
    if (recent.totalDocs >= RATE_LIMIT) {
      return {
        status: 'error',
        message: 'That is a lot of requests in one go. Try again in an hour.',
      }
    }

    // Uploads go to their own quarantined collection, never to Media.
    let imageId: number | undefined
    if (hasFile) {
      const upload = await payload.create({
        collection: 'requestUploads',
        overrideAccess: true,
        file: {
          data: Buffer.from(await file.arrayBuffer()),
          mimetype: file.type,
          name: file.name,
          size: file.size,
        },
        data: {},
      })
      imageId = upload.id as number
    }

    await payload.create({
      collection: 'requests',
      // The collection is admin-only on purpose: writing through the Local API
      // keeps the REST endpoint shut, so nobody can list other people's
      // submissions or harvest the email addresses.
      overrideAccess: true,
      data: {
        summary,
        email,
        status: 'new',
        submitterHash: hash,
        ...(personGuess ? { personGuess } : {}),
        ...(sourceUrl ? { sourceUrl } : {}),
        ...(imageId ? { image: imageId } : {}),
      },
    })

    // Best effort. A failed notification must not lose the request — it is
    // already saved, and the queue is the source of truth, not the inbox.
    try {
      await payload.sendEmail({
        to: process.env.REQUESTS_NOTIFY_EMAIL || 'prem@davnoot.com',
        subject: `New research request: ${summary.slice(0, 60)}`,
        text: [
          summary,
          personGuess ? `Thinks it is: ${personGuess}` : null,
          sourceUrl ? `Source: ${sourceUrl}` : null,
          `From: ${email}`,
          `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/collections/requests`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      })
    } catch (error) {
      payload.logger.error({ err: error }, 'request notification failed')
    }

    return { status: 'ok' }
  } catch (error) {
    console.error('submitRequest failed', error)
    return {
      status: 'error',
      message: 'Something broke on our side. Try again in a moment.',
    }
  }
}
