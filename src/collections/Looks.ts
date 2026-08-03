import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

import { admins, publishedOrAdmin } from '@/access'
import { articleBlocks } from '@/blocks'
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
      /**
       * Structured rather than left to the prose, so it can be shown in a
       * consistent line and filtered on later — "every look from Cannes" is a
       * query worth being able to answer.
       */
      name: 'event',
      type: 'text',
      admin: {
        description: 'The specific occasion, if it is known. Leave empty rather than guess.',
        placeholder: 'San Diego Comic-Con · Hall H panel',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description:
          'One or two sentences on what is being worn. Used on cards and as the search-result snippet, so keep it short: the long version goes in Story below.',
      },
    },
    {
      /**
       * The long form: where it was seen, what the occasion was, what the
       * outfit is doing. This is what makes an individual look worth its own
       * URL — a page carrying a title, a photograph and forty words gives
       * search nothing to index, which defeats the point of the route.
       *
       * Same editor as a journal article, blocks included, so a buy module can
       * sit inside the writing rather than only in the item grid below it.
       */
      name: 'story',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          HorizontalRuleFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
          BlocksFeature({ blocks: articleBlocks }),
        ],
      }),
      admin: {
        description:
          'Where it was spotted, what the event was, and what the outfit is actually doing.',
      },
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
