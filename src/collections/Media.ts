import type { CollectionConfig } from 'payload'

/**
 * Every image on the site lives here.
 *
 * `alt`, `credit` and `licence` are required by design — an image cannot be
 * saved without them. Licensing is the single largest legal risk to this
 * business, so it is enforced by the schema rather than by discipline.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'credit', 'licence', 'licenceExpiresAt'],
    group: 'Library',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the image for screen readers and search engines.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption shown beneath the image.',
      },
    },
    {
      name: 'credit',
      type: 'text',
      required: true,
      admin: {
        description: 'Photographer or agency, exactly as the licence requires it.',
      },
    },
    {
      name: 'licence',
      type: 'select',
      required: true,
      defaultValue: 'own',
      options: [
        { label: 'Agency licence', value: 'agency' },
        { label: 'Official embed (Instagram / X)', value: 'instagram-embed' },
        { label: 'Creative Commons', value: 'cc' },
        { label: 'Our own / commissioned', value: 'own' },
        { label: 'Brand promotional asset', value: 'promotional' },
        { label: 'Merchant product feed', value: 'merchant-feed' },
      ],
    },
    {
      name: 'sourceAgency',
      type: 'text',
      admin: {
        condition: (data) => data?.licence === 'agency',
        description: 'Which agency the licence is with.',
      },
    },
    {
      name: 'licenceExpiresAt',
      type: 'date',
      admin: {
        description: 'Leave empty if the licence does not expire.',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 400, height: 400, position: 'centre' },
      { name: 'square', width: 900, height: 900, position: 'centre' },
      { name: 'portrait', width: 900, height: 1200, position: 'centre' },
      { name: 'landscape', width: 1200, height: 900, position: 'centre' },
      { name: 'wide', width: 1800, height: 900, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
}
