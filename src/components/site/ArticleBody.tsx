import {
  type JSXConvertersFunction,
  RichText,
} from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Frame } from '@/components/site/primitives'
import { type KeywordLink, linkKeywordsInText } from '@/lib/keywords'
import { formatPrice } from '@/lib/media'
import type {
  CalloutBlock,
  EmbedBlock,
  GalleryBlock,
  ImageBlockType,
  Media,
  Product,
  PullQuoteBlock,
  ShoppableProductBlock,
} from '@/payload-types'

/** The converter map is generic; name the block payload for each entry. */
type BlockNode<T> = { node: { fields: T } }

type Props = {
  data: SerializedEditorState
  keywords?: KeywordLink[] | null
}

const asProduct = (value: unknown): Product | null =>
  value && typeof value === 'object' ? (value as Product) : null

/** Inline buy module. Mid-article placement is where article revenue comes from. */
const ShoppableProduct = ({ product, eyebrow }: { product: Product | null; eyebrow?: string }) => {
  if (!product) return null
  const price = formatPrice(product.priceCents, product.currency ?? 'USD')
  const brand = typeof product.brand === 'object' && product.brand ? product.brand.name : null

  return (
    <div className="my-11 flex flex-wrap items-center gap-6 border-y border-rule py-6">
      <div className="w-[92px] flex-none">
        <Frame media={product.image as Media} ratio="1x1" size="thumb" sizes="92px" />
      </div>
      <div className="min-w-[12rem] flex-1">
        {eyebrow ? <p className="eyebrow m-0">{eyebrow}</p> : null}
        {brand ? (
          <p className="m-0 text-[0.6875rem] font-medium tracking-[0.15em] text-muted uppercase">
            {brand}
          </p>
        ) : null}
        <p className="m-0 mt-1 text-[0.9375rem] text-ink-2">{product.name}</p>
      </div>
      <div className="flex items-baseline gap-5">
        {price ? <span className="text-[0.9375rem] tabular-nums">{price}</span> : null}
        <Link
          href={`/go/${product.id}`}
          rel="sponsored noopener"
          className="text-[0.75rem] tracking-[0.06em] text-accent underline decoration-from-font underline-offset-[3px]"
        >
          Shop →
        </Link>
      </div>
    </div>
  )
}

export const ArticleBody = ({ data, keywords }: Props) => {
  // One shared set across the whole document, so a keyword links on its first
  // occurrence in the article — not once per paragraph.
  const used = new Set<string>()
  const links = (keywords ?? []).filter((k) => k?.keyword && k?.url)

  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,

    // Text nodes only. Headings, links and code are handled by other converters,
    // so keyword linking can never nest an anchor inside an anchor.
    text: ({ node }) => {
      const text = node.text ?? ''
      let out: ReactNode = links.length > 0 ? linkKeywordsInText(text, links, used) : text
      if (node.format & 1) out = <strong>{out}</strong>
      if (node.format & 2) out = <em>{out}</em>
      if (node.format & 8) out = <u>{out}</u>
      return out
    },

    blocks: {
      shoppableProduct: ({ node }: BlockNode<ShoppableProductBlock>) => (
        <ShoppableProduct
          product={asProduct(node.fields.product)}
          eyebrow={node.fields.eyebrow ?? undefined}
        />
      ),

      pullQuote: ({ node }: BlockNode<PullQuoteBlock>) => (
        <blockquote className="my-11 text-center font-display text-[clamp(1.375rem,2.4vw,1.75rem)] leading-[1.35] italic">
          “{node.fields.quote}”
          {node.fields.attribution ? (
            <footer className="mt-3 text-[0.8125rem] not-italic opacity-70">
              {node.fields.attribution}
            </footer>
          ) : null}
        </blockquote>
      ),

      imageBlock: ({ node }: BlockNode<ImageBlockType>) => (
        <div
          className={
            node.fields.width === 'bleed'
              ? 'my-11 w-screen ml-[calc(50%-50vw)]'
              : node.fields.width === 'wide'
                ? 'my-11 lg:-mx-24'
                : 'my-11'
          }
        >
          <Frame
            media={node.fields.image as Media}
            ratio="3x2"
            size="landscape"
            showCredit
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
          {node.fields.caption ? (
            <p className="mt-2.5 text-[0.8125rem] text-muted">{node.fields.caption}</p>
          ) : null}
        </div>
      ),

      gallery: ({ node }: BlockNode<GalleryBlock>) => (
        <div className="my-11 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {((node.fields.images ?? []) as Media[]).map((image, i) => (
            <Frame key={i} media={image} ratio="3x4" size="portrait" sizes="33vw" />
          ))}
        </div>
      ),

      embed: ({ node }: BlockNode<EmbedBlock>) => (
        <p className="my-11 border border-rule p-5 text-[0.875rem] text-ink-2">
          <a
            href={node.fields.url}
            target="_blank"
            rel="noopener nofollow"
            className="text-accent underline underline-offset-[3px]"
          >
            View this {node.fields.platform} post →
          </a>
        </p>
      ),

      callout: ({ node }: BlockNode<CalloutBlock>) => (
        <aside className="my-11 border-l-2 border-accent py-1 pl-5 text-ink">
          {node.fields.body}
        </aside>
      ),
    },
  })

  return (
    <div className="prose-article">
      <RichText data={data} converters={converters} />
    </div>
  )
}
