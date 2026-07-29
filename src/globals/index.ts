import type { GlobalConfig } from 'payload'

import { admins, anyone } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate-global'

/** Site-wide identity, defaults and legal copy. Nothing hardcoded in the app. */
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: admins },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Celebrity Spotted Outfits' },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'What celebrities actually wear',
      admin: { description: 'Used in the default page title.' },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      required: true,
      defaultValue:
        'A shoppable archive of what celebrities actually wear, identified item by item and updated as new photographs are published.',
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Fallback social share image, 1200×630.' },
    },
    {
      type: 'collapsible',
      label: 'Legal',
      fields: [
        {
          name: 'affiliateDisclosure',
          type: 'textarea',
          required: true,
          defaultValue:
            'Celebrity Spotted Outfits participates in affiliate programmes and earns a commission on qualifying purchases made through links on this page. This never affects the price you pay, and it never determines which items we identify or how we label them.',
          admin: {
            description:
              'Required by the FTC and shown near the links, not only in the footer. Keep it plain.',
          },
        },
        {
          name: 'nonAffiliationNotice',
          type: 'textarea',
          required: true,
          defaultValue:
            'Celebrity Spotted Outfits is not affiliated with, endorsed by, or sponsored by any celebrity or brand featured. All photographs are licensed; credits appear beside each image.',
        },
      ],
    },
  ],
}

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: { group: 'Settings' },
  access: { read: anyone, update: admins },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'items',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      admin: { description: 'Header links, in order.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'href', type: 'text', required: true, admin: { width: '50%' } },
          ],
        },
      ],
    },
  ],
}

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: { group: 'Settings' },
  access: { read: anyone, update: admins },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'blurb',
      type: 'textarea',
      defaultValue:
        'A shoppable archive of what celebrities actually wear, identified item by item and updated as new photographs are published.',
    },
    {
      name: 'columns',
      type: 'array',
      labels: { singular: 'Column', plural: 'Columns' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                { name: 'href', type: 'text', required: true, admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },
  ],
}

/**
 * The homepage as ordered, toggleable blocks.
 *
 * Deliberately not a free-form page builder: you can reorder and switch
 * sections off, but not invent arbitrary layouts. Free-form builders reliably
 * degrade a designed site — the layout drifts and it stops looking art-directed.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: { group: 'Settings' },
  access: { read: anyone, update: admins },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'sections',
      type: 'blocks',
      blocks: [
        {
          slug: 'hero',
          interfaceName: 'HomeHeroBlock',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            { name: 'eyebrow', type: 'text', defaultValue: 'Every look, identified' },
            { name: 'headline', type: 'text', required: true },
            {
              name: 'headlineEmphasis',
              type: 'text',
              admin: { description: 'Rendered in italic at the end of the headline.' },
            },
            { name: 'body', type: 'textarea' },
            {
              type: 'row',
              fields: [
                { name: 'ctaLabel', type: 'text', admin: { width: '50%' } },
                { name: 'ctaHref', type: 'text', admin: { width: '50%' } },
              ],
            },
            { name: 'image', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          slug: 'latestLooks',
          interfaceName: 'LatestLooksBlock',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            { name: 'heading', type: 'text', defaultValue: 'Latest looks' },
            { name: 'viewAllHref', type: 'text', defaultValue: '/celebrities' },
            { name: 'count', type: 'number', defaultValue: 4 },
          ],
        },
        {
          slug: 'celebrityGrid',
          interfaceName: 'CelebrityGridBlock',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            { name: 'heading', type: 'text', defaultValue: 'Browse by celebrity' },
            { name: 'count', type: 'number', defaultValue: 5 },
          ],
        },
        {
          slug: 'standards',
          interfaceName: 'StandardsBlock',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            { name: 'heading', type: 'text', defaultValue: 'How we identify an item' },
            {
              name: 'items',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          slug: 'journalPreview',
          interfaceName: 'JournalPreviewBlock',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            { name: 'heading', type: 'text', defaultValue: 'From the journal' },
            { name: 'viewAllHref', type: 'text', defaultValue: '/journal' },
            { name: 'count', type: 'number', defaultValue: 3 },
          ],
        },
      ],
    },
  ],
}

export const globals = [SiteSettings, Navigation, Footer, Homepage]
