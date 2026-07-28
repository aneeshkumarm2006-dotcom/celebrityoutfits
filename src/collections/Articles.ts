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
import { rankingFieldsSidebar, slugField, versionsConfig } from '@/fields/slug'
import { revalidate } from '@/hooks/revalidate'
import { articleTemplates } from '@/lib/templates'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article', plural: 'Articles' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'template', 'publishedAt', 'views', '_status'],
    group: 'Journal',
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/journal/${data?.slug}`,
    },
  },
  access: { read: publishedOrAdmin, create: admins, update: admins, delete: admins },
  versions: versionsConfig,
  hooks: {
    afterChange: [revalidate(({ doc }) => ['/journal', `/journal/${doc.slug}`])],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'template',
              type: 'select',
              required: true,
              defaultValue: 'generic',
              options: articleTemplates.map((t) => ({ label: t.label, value: t.value })),
              admin: {
                description:
                  'Picks the heading skeleton for this kind of post. Guidance only — you can write anything.',
              },
            },
            { name: 'title', type: 'text', required: true },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 320,
              admin: {
                description:
                  'Shown on cards and used as the meta description when the SEO tab is left blank. Aim for 150–160 characters.',
              },
            },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            {
              name: 'body',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  FixedToolbarFeature(),
                  HorizontalRuleFeature(),
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                  BlocksFeature({ blocks: articleBlocks }),
                ],
              }),
            },
          ],
        },
        {
          label: 'Keyword links',
          description:
            'Occurrences of each keyword in the body become links. First occurrence only, so a post never reads as over-optimised.',
          fields: [
            {
              name: 'keywords',
              type: 'array',
              labels: { singular: 'Keyword link', plural: 'Keyword links' },
              admin: {
                components: {
                  RowLabel: '@/components/admin/KeywordRowLabel#KeywordRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'keyword',
                      type: 'text',
                      required: true,
                      admin: { width: '40%', description: 'Matched case-insensitively, whole words only.' },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                      admin: { width: '40%', placeholder: 'https://…' },
                    },
                    {
                      name: 'rel',
                      type: 'select',
                      defaultValue: 'auto',
                      admin: { width: '20%' },
                      options: [
                        { label: 'Auto (recommended)', value: 'auto' },
                        { label: 'Dofollow', value: 'dofollow' },
                        { label: 'Nofollow', value: 'nofollow' },
                        { label: 'Sponsored', value: 'sponsored' },
                      ],
                    },
                  ],
                },
                {
                  name: 'note',
                  type: 'text',
                  admin: {
                    description:
                      'Auto = dofollow for our own pages, nofollow for external. Only override to dofollow an external link when it is genuinely editorial — a paid one risks the whole site.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'SEO checks',
          fields: [
            {
              name: 'seoChecks',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/SeoChecks#SeoChecks',
                },
              },
            },
          ],
        },
      ],
    },

    // ── sidebar ──────────────────────────────────────────────────────────
    slugField('title'),
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) =>
            siblingData?._status === 'published' && !value ? new Date() : value,
        ],
      },
    },
    { name: 'author', type: 'text', admin: { position: 'sidebar' } },
    {
      name: 'relatedCelebrity',
      type: 'relationship',
      relationTo: 'celebrities',
      admin: {
        position: 'sidebar',
        description: 'Surfaces this article on that celebrity page. Strong internal linking.',
      },
    },
    {
      name: 'relatedBrand',
      type: 'relationship',
      relationTo: 'brands',
      admin: { position: 'sidebar' },
    },
    {
      name: 'views',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    ...rankingFieldsSidebar,
  ],
}
