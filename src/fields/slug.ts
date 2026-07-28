import type { CollectionConfig, Field } from 'payload'

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents: "Timothée" → "timothee"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Slug field that auto-fills from another field but stays editable.
 *
 * It only auto-fills when empty, so changing a title never silently changes a
 * published URL — that would break inbound links and rankings. Changing a slug
 * is a deliberate act, and should be paired with a redirect.
 */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'The URL segment. Auto-filled from the title; edit with care once published.',
  },
  hooks: {
    beforeValidate: [
      ({ data, value }) => {
        if (typeof value === 'string' && value.length > 0) return slugify(value)
        const source = data?.[from]
        if (typeof source === 'string' && source.length > 0) return slugify(source)
        return value
      },
    ],
  },
})

/** `featured` + `rank`, the manual ordering controls used across the site. */
export const rankingFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'featured',
        type: 'checkbox',
        defaultValue: false,
        admin: {
          width: '50%',
          description: 'Pin above everything else.',
        },
      },
      {
        name: 'rank',
        type: 'number',
        defaultValue: 0,
        admin: {
          width: '50%',
          description: 'Lower numbers come first among featured items.',
        },
      },
    ],
  },
]

/** Same controls, placed in the sidebar (articles put the body front and centre). */
export const rankingFieldsSidebar: Field[] = [
  {
    name: 'featured',
    type: 'checkbox',
    defaultValue: false,
    admin: { position: 'sidebar', description: 'Pin above everything else.' },
  },
  {
    name: 'rank',
    type: 'number',
    defaultValue: 0,
    admin: { position: 'sidebar', description: 'Lower numbers come first among featured items.' },
  },
]

/** Publish/draft support with scheduled publishing, applied consistently. */
export const versionsConfig: CollectionConfig['versions'] = {
  drafts: {
    autosave: { interval: 375 },
    schedulePublish: true,
  },
  maxPerDoc: 20,
}
