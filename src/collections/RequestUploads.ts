import type { CollectionConfig } from 'payload'

import { admins } from '@/access'

/**
 * Images submitted by the public with a research request.
 *
 * Deliberately separate from Media. Media requires `alt`, `credit` and
 * `licence` because everything in it is publishable; a stranger's upload is
 * none of those things — we do not know who shot it, and we have no right to
 * republish it. Keeping the two apart means a submission can never drift into
 * the licensed library by accident, which is the only way that library stays
 * trustworthy.
 *
 * Nothing here is ever rendered on the public site. If a submitted photograph
 * turns out to be worth publishing, it gets licensed properly and uploaded to
 * Media as a separate, deliberate act.
 */
export const RequestUploads: CollectionConfig = {
  slug: 'requestUploads',
  labels: { singular: 'Request upload', plural: 'Request uploads' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'createdAt'],
    group: 'Requests',
    description: 'Reference images sent in with research requests. Never published.',
  },
  access: {
    // Written by the request form through the Local API, which bypasses access
    // control deliberately — so the REST endpoint stays shut to the public.
    read: admins,
    create: admins,
    update: admins,
    delete: admins,
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    // One small derivative is enough: these are only ever looked at in the
    // admin queue, so generating six crops of a stranger's snapshot is waste.
    imageSizes: [{ name: 'preview', width: 900, position: 'centre' }],
  },
  fields: [
    {
      name: 'note',
      type: 'text',
      admin: { description: 'Optional internal note about this image.' },
    },
  ],
  timestamps: true,
}
