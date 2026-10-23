import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import { mediaUrl } from '@/lib/media'
import type { Celebrity, Item, Look, Media, Product } from '@/payload-types'

import { CATEGORY_LABEL } from './data'
import { DeskView } from './DeskView'

const FILTERS = [
  { key: 'all', label: 'All', where: ['open', 'closest_match'] },
  { key: 'open', label: 'Open', where: ['open'] },
  { key: 'closest', label: 'Closest match', where: ['closest_match'] },
] as const

const lookOf = (item: Item) => (typeof item.look === 'object' ? (item.look as Look | null) : null)
const celebrityOf = (look: Look | null) =>
  look && typeof look.celebrity === 'object' ? (look.celebrity as Celebrity | null) : null

/**
 * Items to identify, worked as a queue: everything still open or matched to a
 * closest alternative down the left, the selected one on the right with the
 * photograph it came from and the way into each next step. Selection lives in
 * the URL (?item=), so the page is plain server-rendered links.
 */
export const IdentifyView = async (props: AdminViewServerProps) => {
  const { initPageResult, searchParams } = props
  const payload = initPageResult.req.payload
  const filter = FILTERS.find((f) => f.key === searchParams?.filter) ?? FILTERS[0]

  const queue = await payload.find({
    collection: 'items',
    limit: 100,
    depth: 2,
    where: { confidence: { in: [...filter.where] } },
    sort: '-createdAt',
  })

  const selectedId = searchParams?.item
  const selected = queue.docs.find((item) => String(item.id) === selectedId) ?? queue.docs[0]
  const look = selected ? lookOf(selected) : null
  const celebrity = celebrityOf(look)
  const photo = look && Array.isArray(look.photos) ? (look.photos[0] as Media | undefined) : undefined
  const photoSrc = photo ? mediaUrl(photo, 'portrait') : null
  const product = selected && typeof selected.product === 'object' ? (selected.product as Product | null) : null

  const href = (params: Record<string, string>) => {
    const query = new URLSearchParams({ ...(filter.key !== 'all' ? { filter: filter.key } : {}), ...params })
    return `/admin/identify${query.size ? `?${query}` : ''}`
  }

  return (
    <DeskView props={props}>
      <header className="desk-page__header">
        <div className="desk-page__heading">
          <span className="desk-eyebrow">Today</span>
          <h1 className="desk-title">
            Items to identify <span className="desk-title__count">{queue.totalDocs}</span>
          </h1>
        </div>
        <nav className="desk-segmented" aria-label="Filter">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === 'all' ? '/admin/identify' : `/admin/identify?filter=${f.key}`}
              className={f.key === filter.key ? 'is-current' : undefined}
              aria-current={f.key === filter.key ? 'page' : undefined}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </header>

      {queue.docs.length === 0 ? (
        <p className="desk-empty">Nothing left to identify. Every item has a confirmed product.</p>
      ) : (
        <div className="desk-columns">
          <section className="desk-card desk-queue" aria-label="Queue">
            {queue.docs.map((item) => {
              const itemLook = lookOf(item)
              const person = celebrityOf(itemLook)
              const current = item.id === selected?.id
              return (
                <Link
                  key={item.id}
                  href={href({ item: String(item.id) })}
                  className={`desk-queue__row${current ? ' is-current' : ''}`}
                  aria-current={current ? 'true' : undefined}
                >
                  <span className={`desk-queue__desc${item.description ? '' : ' desk-muted-italic'}`}>
                    {item.description || 'No description yet'}
                  </span>
                  <span className="desk-queue__meta">
                    {person?.name ?? itemLook?.title ?? 'No look'} · {CATEGORY_LABEL[item.category] ?? item.category}
                  </span>
                </Link>
              )
            })}
          </section>

          {selected ? (
            <section className="desk-card desk-card--wide desk-detail" aria-label="Selected item">
              <div className="desk-detail__photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, already sized */}
                {photoSrc ? <img src={photoSrc} alt={photo?.alt ?? ''} /> : <span>No photograph on this look</span>}
              </div>
              <div className="desk-detail__body">
                <span className="desk-eyebrow">
                  {[celebrity?.name, CATEGORY_LABEL[selected.category] ?? selected.category].filter(Boolean).join(' · ')}
                </span>
                <h2 className="desk-detail__title">{selected.description || 'No description yet'}</h2>
                {look ? <p className="desk-card__sub">In look: {look.title}</p> : null}

                <dl className="desk-facts">
                  <div>
                    <dt>Confidence</dt>
                    <dd>
                      <span className={`desk-chip desk-chip--${selected.confidence}`}>
                        {selected.confidence === 'closest_match' ? 'Closest match' : 'Open'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Linked product</dt>
                    <dd>{product?.name ?? 'None yet'}</dd>
                  </div>
                  {selected.evidenceNote ? (
                    <div>
                      <dt>Evidence</dt>
                      <dd>{selected.evidenceNote}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="desk-actions">
                  <Link className="desk-btn desk-btn--primary" href={`/admin/collections/items/${selected.id}`}>
                    Identify this item
                  </Link>
                  <Link
                    className="desk-btn"
                    href={`/admin/collections/products?search=${encodeURIComponent(selected.description ?? '')}`}
                  >
                    Search products
                  </Link>
                  {look ? (
                    <Link className="desk-btn" href={`/admin/collections/looks/${look.id}`}>
                      Open look
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </DeskView>
  )
}
