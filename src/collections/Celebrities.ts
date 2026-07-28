import type { CollectionConfig } from 'payload'

import { admins, publishedOrAdmin } from '@/access'
import { rankingFields, slugField, versionsConfig } from '@/fields/slug'
import { revalidate } from '@/hooks/revalidate'

export const Celebrities: CollectionConfig = {
  slug: 'celebrities',
  labels: { singular: 'Celebrity', plural: 'Celebrities' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'featured', '_status', 'updatedAt'],
    group: 'Archive',
  },
  access: { read: publishedOrAdmin, create: admins, update: admins, delete: admins },
  versions: versionsConfig,
  hooks: {
    afterChange: [revalidate(({ doc }) => ['/celebrities', `/celebrities/${doc.slug}`])],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'film',
      options: [
        { label: 'Film & TV', value: 'film' },
        { label: 'Music', value: 'music' },
        { label: 'Sport', value: 'sport' },
        { label: 'Creator', value: 'creator' },
      ],
    },
    {
      name: 'standfirst',
      type: 'textarea',
      admin: {
        description:
          'The one-paragraph thesis under the name. What is distinctive about how this person dresses?',
      },
    },
    { name: 'bio', type: 'richText' },
    {
      type: 'row',
      fields: [
        {
          name: 'portraitImage',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '50%', description: '3:4 portrait, used on cards and the hero.' },
        },
        {
          name: 'heroImage',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '50%', description: 'Wide image for the full-bleed band.' },
        },
      ],
    },
    ...rankingFields,
  ],
}
