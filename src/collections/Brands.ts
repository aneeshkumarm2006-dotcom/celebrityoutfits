import type { CollectionConfig } from 'payload'

import { admins, publishedOrAdmin } from '@/access'
import { rankingFields, slugField, versionsConfig } from '@/fields/slug'
import { revalidate } from '@/hooks/revalidate'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Brand', plural: 'Brands' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'affiliateNetwork', 'commissionRate', '_status'],
    group: 'Archive',
  },
  access: { read: publishedOrAdmin, create: admins, update: admins, delete: admins },
  versions: versionsConfig,
  hooks: {
    afterChange: [revalidate(({ doc }) => [`/brands`, `/brands/${doc.slug}`])],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'website',
      type: 'text',
      admin: {
        description:
          'The brand’s own site. Rendered as a plain external link — never an affiliate one, so the page still says something useful for brands we have no programme with.',
        placeholder: 'https://www.ray-ban.com',
      },
      validate: (value: unknown) =>
        !value ||
        (typeof value === 'string' && /^https?:\/\//.test(value)) ||
        'Must start with http:// or https://',
    },
    {
      name: 'founded',
      type: 'text',
      admin: {
        width: '50%',
        description: 'Year or era, shown under the brand name. Free text — “1937”, “1980s”.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: { description: 'Shown on the brand page. Good place to rank for the brand name.' },
    },
    {
      type: 'collapsible',
      label: 'Affiliate',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'affiliateNetwork',
          type: 'select',
          options: [
            { label: 'Impact', value: 'impact' },
            { label: 'CJ Affiliate', value: 'cj' },
            { label: 'Rakuten Advertising', value: 'rakuten' },
            { label: 'ShareASale / Awin', value: 'shareasale' },
            { label: 'Amazon Associates', value: 'amazon' },
            { label: 'Sovrn / Skimlinks', value: 'sovrn' },
            { label: 'Direct with brand', value: 'direct' },
            { label: 'Not yet approved', value: 'none' },
          ],
          defaultValue: 'none',
        },
        {
          name: 'commissionRate',
          type: 'number',
          admin: { description: 'Percent. Informational — used to prioritise which brands to chase.' },
        },
      ],
    },
    ...rankingFields,
  ],
}
