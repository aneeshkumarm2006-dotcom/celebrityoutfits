import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Puts "Find my outfit" into the navigation and the footer.
 *
 *   pnpm links:request
 *
 * Nav and footer are editable globals, so adding a route in code does not put
 * it in front of anyone — the link has to exist in the database too. Idempotent:
 * it checks for the href before adding, so re-running will not duplicate it.
 */
const HREF = '/request'
const LABEL = 'Find my outfit'

const run = async () => {
  const payload = await getPayload({ config })

  // ── Primary navigation ──────────────────────────────────────────────────
  const nav = (await payload.findGlobal({ slug: 'navigation' })) as {
    items?: { label: string; href: string }[]
  }
  const navItems = nav.items ?? []
  if (navItems.some((item) => item.href === HREF)) {
    console.log('  navigation  already linked')
  } else {
    await payload.updateGlobal({
      slug: 'navigation',
      data: { items: [...navItems, { label: LABEL, href: HREF }] },
    })
    console.log(`  navigation  added "${LABEL}"`)
  }

  // ── Footer, under Browse ────────────────────────────────────────────────
  const footer = (await payload.findGlobal({ slug: 'footer' })) as {
    blurb?: string
    columns?: { heading: string; links?: { label: string; href: string }[] }[]
  }
  const columns = footer.columns ?? []
  const already = columns.some((column) =>
    (column.links ?? []).some((link) => link.href === HREF),
  )

  if (already) {
    console.log('  footer      already linked')
  } else {
    const target = columns.findIndex((column) => /browse/i.test(column.heading))
    const index = target === -1 ? 0 : target
    const updated = columns.map((column, i) =>
      i === index
        ? { ...column, links: [...(column.links ?? []), { label: LABEL, href: HREF }] }
        : column,
    )
    await payload.updateGlobal({ slug: 'footer', data: { ...footer, columns: updated } })
    console.log(`  footer      added "${LABEL}" under "${columns[index]?.heading ?? 'first column'}"`)
  }

  payload.logger.info('Request links in place.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
