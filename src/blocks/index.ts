import type { Block } from 'payload'

/**
 * Blocks the team can drop into an article body.
 *
 * ShoppableProduct is the commercially important one: an inline buy module
 * placed mid-article converts far better than a list of links at the bottom.
 */
export const ShoppableProduct: Block = {
  slug: 'shoppableProduct',
  interfaceName: 'ShoppableProductBlock',
  labels: { singular: 'Shoppable product', plural: 'Shoppable products' },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Small label above the product, e.g. "The item, current version".' },
    },
  ],
}

export const PullQuote: Block = {
  slug: 'pullQuote',
  interfaceName: 'PullQuoteBlock',
  labels: { singular: 'Pull quote', plural: 'Pull quotes' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'attribution', type: 'text' },
  ],
}

export const ImageBlock: Block = {
  slug: 'imageBlock',
  interfaceName: 'ImageBlockType',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'measure',
      options: [
        { label: 'Text width', value: 'measure' },
        { label: 'Wider than text', value: 'wide' },
        { label: 'Full bleed', value: 'bleed' },
      ],
    },
  ],
}

export const Gallery: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, required: true },
    { name: 'caption', type: 'text' },
  ],
}

export const Embed: Block = {
  slug: 'embed',
  interfaceName: 'EmbedBlock',
  labels: { singular: 'Embed', plural: 'Embeds' },
  fields: [
    {
      name: 'platform',
      type: 'select',
      required: true,
      defaultValue: 'instagram',
      options: [
        { label: 'Instagram', value: 'instagram' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'X / Twitter', value: 'x' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description:
          'Official post URL. Embeds are the one way to show a celebrity photo without licensing it — the platform serves it, we do not host it.',
      },
    },
  ],
}

export const Callout: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: 'Callout', plural: 'Callouts' },
  fields: [
    {
      name: 'tone',
      type: 'select',
      defaultValue: 'note',
      options: [
        { label: 'Note', value: 'note' },
        { label: 'Get the look', value: 'get-the-look' },
      ],
    },
    { name: 'body', type: 'textarea', required: true },
  ],
}

export const articleBlocks = [
  ShoppableProduct,
  PullQuote,
  ImageBlock,
  Gallery,
  Embed,
  Callout,
]
