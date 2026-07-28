import { readFileSync } from 'fs'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Product feed importer.
 *
 * Affiliate networks each publish a CSV or JSON feed with different column
 * names, so the mapping lives in one place (FIELD_MAP) rather than being
 * hardcoded per network. Point it at a file and a merchant name:
 *
 *   pnpm import:feed ./feeds/impact-nordstrom.csv Nordstrom
 *
 * Matching is by SKU, so re-running updates prices and stock rather than
 * creating duplicates. That is what makes this safe to run nightly.
 */

const FIELD_MAP: Record<string, string[]> = {
  sku: ['sku', 'SKU', 'product_id', 'ID', 'MPN'],
  name: ['name', 'Name', 'product_name', 'title', 'Title'],
  description: ['description', 'Description', 'short_description'],
  price: ['price', 'Price', 'sale_price', 'current_price'],
  currency: ['currency', 'Currency', 'currency_code'],
  affiliateUrl: ['affiliate_url', 'link', 'Link', 'url', 'URL', 'tracking_url'],
  imageUrl: ['image_url', 'image', 'Image URL', 'image_link'],
  brand: ['brand', 'Brand', 'manufacturer'],
  inStock: ['availability', 'in_stock', 'stock_status', 'Availability'],
}

const pick = (row: Record<string, string>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== '') return value
  }
  return undefined
}

/** Minimal CSV parser that survives quoted fields containing commas. */
const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') field += char
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows
  if (!header) return []
  return body
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

const toCents = (value?: string): number | undefined => {
  if (!value) return undefined
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : undefined
}

const toStock = (value?: string): boolean => {
  if (!value) return true
  return !/out.?of.?stock|unavailable|discontinued|^0$|^false$/i.test(value)
}

const run = async () => {
  const [filePath, merchant] = process.argv.slice(2)
  if (!filePath) {
    console.error('Usage: pnpm import:feed <path-to-feed.csv|json> [merchant]')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const raw = readFileSync(filePath, 'utf8')
  const rows: Record<string, string>[] = filePath.endsWith('.json')
    ? JSON.parse(raw)
    : parseCsv(raw)

  let created = 0
  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const sku = pick(row, FIELD_MAP.sku)
    const name = pick(row, FIELD_MAP.name)
    const affiliateUrl = pick(row, FIELD_MAP.affiliateUrl)

    // A product without a name or a tracking URL cannot be sold or linked.
    if (!name || !affiliateUrl) {
      skipped++
      continue
    }

    const data = {
      name,
      description: pick(row, FIELD_MAP.description),
      priceCents: toCents(pick(row, FIELD_MAP.price)),
      currency: (pick(row, FIELD_MAP.currency) || 'USD') as 'USD' | 'CAD' | 'GBP' | 'EUR',
      affiliateUrl,
      imageUrl: pick(row, FIELD_MAP.imageUrl),
      merchant: merchant ?? pick(row, ['merchant', 'Merchant']),
      sku,
      inStock: toStock(pick(row, FIELD_MAP.inStock)),
      priceCheckedAt: new Date().toISOString(),
    }

    const existing = sku
      ? await payload.find({ collection: 'products', limit: 1, where: { sku: { equals: sku } } })
      : { docs: [] as { id: number | string }[] }

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'products', id: existing.docs[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'products', data })
      created++
    }
  }

  payload.logger.info(
    `Feed import complete — ${created} created, ${updated} updated, ${skipped} skipped (missing name or URL)`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
