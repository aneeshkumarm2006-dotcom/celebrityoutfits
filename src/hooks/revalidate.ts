import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

type PathsFor = (args: { doc: Record<string, unknown> }) => string[]

/**
 * `revalidatePath` needs Next's per-request store, which only exists inside a
 * request. Seed and maintenance scripts write through the same hooks with no
 * request around them, so it throws — expected, and not worth a stack trace per
 * document. There is nothing to purge in a script: no server is serving a cache.
 */
const isOutsideRequest = (error: unknown): boolean =>
  error instanceof Error && error.message.includes('static generation store missing')

const purge = (
  paths: Set<string>,
  logger: { error: (obj: unknown, msg: string) => void; debug: (msg: string) => void },
  label: string,
): void => {
  try {
    paths.forEach((path) => revalidatePath(path))
  } catch (error) {
    if (isOutsideRequest(error)) {
      logger.debug(`${label}: no request context, skipping cache purge`)
      return
    }
    // Never let a cache purge failure block a save — the content is already
    // committed at this point, and the page will refresh on its own timer.
    logger.error({ err: error }, `${label} failed`)
  }
}

/**
 * This is what makes publishing instant.
 *
 * Public pages are statically rendered for speed and SEO. Without this hook a
 * publish would only appear after a redeploy. Here we purge exactly the routes
 * the changed document appears on, so the team clicks Publish and the live site
 * updates within a second — no redeploy, no code.
 */
export const revalidate =
  (pathsFor: PathsFor): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    purge(
      new Set(['/', ...pathsFor({ doc: doc as Record<string, unknown> })]),
      req.payload.logger,
      'revalidate hook',
    )
    return doc
  }

export const revalidateOnDelete =
  (pathsFor: PathsFor): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    purge(
      new Set(['/', ...pathsFor({ doc: doc as Record<string, unknown> })]),
      req.payload.logger,
      'revalidate-on-delete hook',
    )
    return doc
  }
