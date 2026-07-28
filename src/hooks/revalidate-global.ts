import { revalidatePath } from 'next/cache'
import type { GlobalAfterChangeHook } from 'payload'

/**
 * Globals (nav, footer, site settings, homepage) appear on every page, so a
 * change to any of them purges the whole route tree rather than one path.
 */
export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  try {
    revalidatePath('/', 'layout')
  } catch (error) {
    req.payload.logger.error({ err: error }, 'global revalidate hook failed')
  }
  return doc
}
