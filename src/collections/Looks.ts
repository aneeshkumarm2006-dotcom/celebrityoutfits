import type { CollectionConfig } from 'payload'

import { admins, publishedOrAdmin } from '@/access'
import { rankingFields, slugField, versionsConfig } from '@/fields/slug'
import { revalidate } from '@/hooks/revalidate'

/**
 * One outfit, on one occasion.
 *
 * Each look gets its own URL and its own SEO fields. That is deliberate: it is
 * what makes an individual *outfit* rankable in Google, rather than only the
 * celebrity page it sits on.
 */
export const Looks: CollectionConfig = {
  slug: 'looks',
  labels: { singular: 'Look', plural: 'Looks' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'celebrity', 'date', 'occasion', '_status'],
    group: 'Archive',
  },
  access: { read: publishedOrAdmin, create: admins, update: admins, delete: admins },
  versions: versionsConfig,
  hooks: {
    afterChange: [
      revalidate(({ doc }) => {
        const celeb = doc.celebrity as { slug?: string } | string | undefined
        const celebSlug = typeof celeb === 'object' && celeb ? celeb.slug : undefined
        return [
          '/celebrities',
          ...(celebSlug ? [`/celebrities/${celebSlug}`, `/celebrities/${celebSlug}/${doc.slug}`] : []),
        ]
      }),
    ],
  },
  fields: [
    {
      name: 'celebrity',
      type: 'relationship',
      relationTo: 'celebrities',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Write a thesis, not a label. "The knit polo has quietly replaced the shirt".' },
    },
    slugField('title'),
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: {
            width: '34%',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
          },
        },
        { name: 'location', type: 'text', admin: { width: '33%', placeholder: 'Leicester Square' } },
        {
          name: 'occasion',
          type: 'select',
          admin: { width: '33%' },
          defaultValue: 'premiere',
          options: [
            { label: 'Airport', value: 'airport' },
            { label: 'Premiere', value: 'premiere' },
            { label: 'Press call', value: 'press' },
            { label: 'On set', value: 'on-set' },
            { label: 'Street', value: 'street' },
            { label: 'Event', value: 'event' },
          ],
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'What is actually being worn, and what gives it away.' },
    },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'First image is the lead.' },
    },
    {
      name: 'items',
      type: 'join',
      collection: 'items',
      on: 'look',
      admin: { description: 'Garments identified in this look. Add them from the Items collection.' },
    },
    ...rankingFields,
  ],
}
