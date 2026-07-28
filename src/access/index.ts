import type { Access } from 'payload'

/** Anyone may read. Used for content the public site renders. */
export const anyone: Access = () => true

/** Only a logged-in admin may write. */
export const admins: Access = ({ req }) => Boolean(req.user)

/**
 * Public reads see published documents only; a logged-in admin sees drafts too,
 * which is what makes draft preview work without a second auth system.
 */
export const publishedOrAdmin: Access = ({ req }) => {
  if (req.user) return true
  return {
    _status: {
      equals: 'published',
    },
  }
}
