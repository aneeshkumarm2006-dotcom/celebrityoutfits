import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import type { Brand } from '@/payload-types'

import { DeskView } from './DeskView'

const RANGES = [
  { key: '7', label: '7 days', days: 7 },
  { key: '30', label: '30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
] as const

/** "https://site/celebrities/tom-holland/a-look" → "/celebrities/tom-holland/a-look". */
const toPath = (referrer?: string | null) => {
  if (!referrer) return 'Unknown page'
  try {
    return new URL(referrer).pathname
  } catch {
    return referrer
  }
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

const top = (counts: Map<string, number>, n: number) =>
  [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)

/**
 * Where readers click through to retailers, by brand and by the page they were
 * on. Totals are counted here from the click log rather than stored, so the
 * numbers cannot drift from what was recorded.
 */
export const ReportingView = async (props: AdminViewServerProps) => {
  const payload = props.initPageResult.req.payload
  const range = RANGES.find((r) => r.key === props.searchParams?.range) ?? RANGES[2]
  const since = range.days ? daysAgo(range.days) : null

  const [{ docs: clicks }, affiliated] = await Promise.all([
    payload.find({
      collection: 'outboundClicks',
      pagination: false,
      depth: 2,
      select: { product: true, referrer: true },
      where: since ? { createdAt: { greater_than_equal: since } } : {},
    }),
    payload.count({ collection: 'brands', where: { affiliateNetwork: { not_equals: 'none' } } }),
  ])

  const byBrand = new Map<string, number>()
  const byPage = new Map<string, number>()
  let unattributed = 0
  for (const click of clicks) {
    const product = typeof click.product === 'object' ? click.product : null
    const brand = product && typeof product.brand === 'object' ? (product.brand as Brand | null) : null
    if (brand) byBrand.set(brand.name.trim(), (byBrand.get(brand.name.trim()) ?? 0) + 1)
    else unattributed += 1
    const page = toPath(click.referrer)
    byPage.set(page, (byPage.get(page) ?? 0) + 1)
  }

  const brands = top(byBrand, 8)
  const max = Math.max(1, ...brands.map(([, n]) => n))

  return (
    <DeskView props={props}>
      <header className="desk-page__header">
        <div className="desk-page__heading">
          <span className="desk-eyebrow">Reporting</span>
          <h1 className="desk-title">Outbound clicks</h1>
        </div>
        <nav className="desk-segmented" aria-label="Time range">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={r.key === 'all' ? '/admin/reporting' : `/admin/reporting?range=${r.key}`}
              className={r.key === range.key ? 'is-current' : undefined}
              aria-current={r.key === range.key ? 'page' : undefined}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="desk-stats" aria-label="Totals">
        <div className="desk-stat">
          <span className="desk-stat__label">Clicks to retailers</span>
          <span className="desk-stat__value">{clicks.length}</span>
          <span className="desk-stat__note">{range.label}</span>
        </div>
        <div className="desk-stat">
          <span className="desk-stat__label">With no brand attached</span>
          <span className="desk-stat__value">{unattributed}</span>
          <span className="desk-stat__note">The product has no brand set</span>
        </div>
        <div className="desk-stat">
          <span className="desk-stat__label">Brands earning commission</span>
          <span className="desk-stat__value">{affiliated.totalDocs}</span>
          <span className="desk-stat__note">With an affiliate network set</span>
        </div>
      </section>

      <div className="desk-columns">
        <figure className="desk-card desk-chart">
          <figcaption>
            <h2 className="desk-card__title">Clicks by brand</h2>
            <p className="desk-card__sub">Top {brands.length}, {range.label.toLowerCase()}</p>
          </figcaption>
          {brands.length === 0 ? <p className="desk-empty">No clicks in this period.</p> : null}
          {brands.map(([name, n]) => (
            <div key={name} className="desk-bar" title={`${name}: ${n} clicks`}>
              <span className="desk-bar__label">{name}</span>
              <span className="desk-bar__track">
                <span className="desk-bar__fill" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="desk-bar__value">{n}</span>
            </div>
          ))}
        </figure>

        <section className="desk-card">
          <h2 className="desk-card__title">Pages that send the most clicks</h2>
          <p className="desk-card__sub">Where the reader was when they clicked through</p>
          <div className="desk-table-wrap">
            <table className="desk-table">
              <tbody>
                {top(byPage, 8).map(([page, n]) => (
                  <tr key={page}>
                    <td className="desk-table__secondary">{page}</td>
                    <td className="desk-table__end">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DeskView>
  )
}
