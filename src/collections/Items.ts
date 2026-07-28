import type { CollectionConfig } from 'payload'

import { admins, anyone } from '@/access'

/**
 * One identified garment.
 *
 * `confidence` is the load-bearing field on this whole project. It is the
 * honesty mechanism shown to readers, and it is what will make the AI
 * identification pipeline viable later — the model does not have to be right
 * about everything, it has to know when it isn't sure.
 *
 * Items are their own collection rather than an array inside Looks so that the
 * review queue can query across every look at once.
 */
export const Items: CollectionConfig = {
  slug: 'items',
  labels: { singular: 'Item', plural: 'Items' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'look', 'category', 'confidence', 'product'],
    group: 'Archive',
  },
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated summary for list views.',
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const category = siblingData?.category || 'item'
            const confidence = siblingData?.confidence || 'open'
            return `${category} · ${confidence}`
          },
        ],
      },
    },
    {
      name: 'look',
      type: 'relationship',
      relationTo: 'looks',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        'outerwear',
        'knitwear',
        'shirting',
        'tailoring',
        'denim',
        'trousers',
        'footwear',
        'eyewear',
        'watch',
        'bag',
        'jewellery',
        'other',
      ],
    },
    {
      name: 'confidence',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Confirmed — logo, hardware or stylist-credited', value: 'confirmed' },
        { label: 'Closest match — unbranded in the photo', value: 'closest_match' },
        { label: 'Get the look — cheaper equivalent', value: 'get_the_look' },
        { label: 'Open — not enough detail to call', value: 'open' },
      ],
      admin: {
        description: 'Shown to readers. Never mark something confirmed to fill a gap.',
      },
    },
    {
      name: 'evidenceNote',
      type: 'textarea',
      admin: {
        description:
          'Why this call was made — "logo visible on temple". Internal only, never shown publicly, but it is the audit trail if a brand queries it.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      admin: { description: 'The product we link to.' },
    },
    {
      name: 'alternativeProduct',
      type: 'relationship',
      relationTo: 'products',
      admin: { description: 'Cheaper stand-in, shown when the original is over $500 or out of stock.' },
    },
    {
      name: 'position',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Display order within the look.' },
    },
  ],
}
