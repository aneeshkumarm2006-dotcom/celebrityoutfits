import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

type PathsFor = (args: { doc: Record<string, unknown> }) => string[]

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
    try {
      const paths = new Set(['/', ...pathsFor({ doc: doc as Record<string, unknown> })])
      paths.forEach((path) => revalidatePath(path))
    } catch (error) {
      // Never let a cache purge failure block a save — the content is already
      // committed at this point, and the page will refresh on its own timer.
      req.payload.logger.error({ err: error }, 'revalidate hook failed')
    }
    return doc
  }

export const revalidateOnDelete =
  (pathsFor: PathsFor): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    try {
      const paths = new Set(['/', ...pathsFor({ doc: doc as Record<string, unknown> })])
      paths.forEach((path) => revalidatePath(path))
    } catch (error) {
      req.payload.logger.error({ err: error }, 'revalidate-on-delete hook failed')
    }
    return doc
  }
