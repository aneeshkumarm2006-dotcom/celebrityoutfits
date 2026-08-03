import type { CollectionConfig } from 'payload'

import { admins, anyone } from '@/access'

/**
 * A buyable product.
 *
 * Most rows arrive from an affiliate merchant feed rather than being typed by
 * hand — which is also where the product photography comes from, so nobody has
 * to shoot it. `priceCheckedAt` records the last successful feed refresh.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'brand', 'priceDisplay', 'inStock', 'priceCheckedAt'],
    group: 'Archive',
  },
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'brand', type: 'relationship', relationTo: 'brands' },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'One line. Cut, colour, material: what distinguishes it.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'priceCents',
          type: 'number',
          admin: { width: '50%', description: 'In minor units: 17100 for $171.00.' },
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'USD',
          options: ['USD', 'CAD', 'GBP', 'EUR'],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'priceDisplay',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Derived from price and currency.',
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const cents = siblingData?.priceCents
            if (typeof cents !== 'number') return null
            const currency = siblingData?.currency || 'USD'
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency,
              maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
            }).format(cents / 100)
          },
        ],
      },
    },
    {
      name: 'affiliateUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'The tracked merchant URL. Never rendered directly: the site links to /go/[id] and redirects.',
      },
    },
    { name: 'merchant', type: 'text', admin: { description: 'Where it is bought, e.g. Nordstrom.' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imageUrl',
      type: 'text',
      admin: { description: 'Fallback image straight from the merchant feed.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'sku', type: 'text', admin: { width: '50%' } },
        {
          name: 'inStock',
          type: 'checkbox',
          defaultValue: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'priceCheckedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Last successful feed refresh.',
      },
    },
  ],
}
