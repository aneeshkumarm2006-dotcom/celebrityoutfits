import type { CollectionConfig } from 'payload'

import { clearStaleDerivatives } from '@/hooks/clearStaleDerivatives'

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
  hooks: {
    beforeChange: [clearStaleDerivatives],
  },

  upload: {
    mimeTypes: ['image/*'],
    /**
     * `focalPoint` overrides the `position` set on each size below — when it is
     * enabled, every derivative is cropped around the focal point and defaults
     * to dead centre, which is why a portrait of a standing figure loses its
     * head in a 16:9 banner. `position` only applies to images whose focal
     * point has never been moved, so treat it as the fallback, not the rule.
     *
     * `crop` adds a source rectangle on top for the cases where no single point
     * gives the right answer. Both are per-image and non-destructive: the
     * original is untouched and clearing them restores the automatic behaviour.
     */
    focalPoint: true,
    crop: true,
    /**
     * One crop per display ratio, and the names match the ratios the site
     * actually renders. That correspondence is the whole point: asking for a
     * 3:2 box and loading a 4:3 crop makes the browser crop a second time, so
     * the image loses height twice and nobody can see where it went.
     *
     * The `position` values below only apply to images whose focal point has
     * never been moved — see the note on `focalPoint` above. Logos are never
     * cropped at all, only bounded, because a wordmark with its edges shaved
     * off has stopped being the brand's mark.
     */
    /**
     * `withoutEnlargement: false` matters more than it looks. Sharp refuses to
     * upscale by default, so any crop larger than the source is silently not
     * generated — and a missing size falls back to the original, whose ratio is
     * whatever the photographer chose. That fallback is precisely the
     * double-crop this table exists to prevent, so every ratio is guaranteed to
     * exist even when it costs a little interpolation.
     */
    imageSizes: [
      { name: 'thumb', width: 400, height: 400, position: 'centre', withoutEnlargement: false }, // 1:1
      { name: 'square', width: 900, height: 900, position: 'centre', withoutEnlargement: false }, // 1:1
      { name: 'portrait', width: 900, height: 1200, position: 'top', withoutEnlargement: false }, // 3:4
      { name: 'landscape', width: 1200, height: 800, position: 'top', withoutEnlargement: false }, // 3:2
      { name: 'hero', width: 1600, height: 900, position: 'top', withoutEnlargement: false }, // 16:9
      { name: 'og', width: 1200, height: 630, position: 'top', withoutEnlargement: false }, // 1.91:1, social
      { name: 'logo', width: 800, fit: 'inside' }, // bounded, never cropped
      /**
       * Retired — nothing renders 2:1 any more. Kept because deleting a size
       * drops its columns, and Drizzle's push stops to confirm a destructive
       * change; with no TTY that hang looks exactly like a network stall. It
       * costs one unused derivative per upload. Remove it with a real
       * migration, not by deleting this line.
       */
      { name: 'wide', width: 1800, height: 900, position: 'top' },
    ],
  },
}
