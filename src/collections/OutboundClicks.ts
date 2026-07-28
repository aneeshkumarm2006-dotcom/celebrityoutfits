import type { CollectionConfig } from 'payload'

import { admins } from '@/access'

/**
 * Append-only click log written by /go/[itemId].
 *
 * Affiliate networks report on a 24–48h delay, so this is the only same-day
 * signal for which items and which celebrities actually drive revenue.
 */
export const OutboundClicks: CollectionConfig = {
  slug: 'outboundClicks',
  labels: { singular: 'Outbound click', plural: 'Outbound clicks' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['item', 'product', 'referrer', 'createdAt'],
    group: 'Reporting',
  },
  access: {
    read: admins,
    create: () => true, // written by the redirect route on behalf of visitors
    update: () => false,
    delete: admins,
  },
  fields: [
    { name: 'item', type: 'relationship', relationTo: 'items', index: true },
    { name: 'product', type: 'relationship', relationTo: 'products', index: true },
    { name: 'sessionId', type: 'text' },
    { name: 'referrer', type: 'text' },
  ],
  timestamps: true,
}
