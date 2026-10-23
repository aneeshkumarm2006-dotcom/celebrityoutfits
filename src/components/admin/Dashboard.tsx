import { Gutter } from '@payloadcms/ui'
import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'
import type { Celebrity, Look, Media } from '@/payload-types'

import { CATEGORY_LABEL, getDeskCounts } from './data'

const dateLine = () =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

const shortDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(value)) : ''

const daysSince = (value: string) => Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)

/**
 * Replaces Payload's default "list of collections" dashboard with what needs a
 * decision today: items nobody has identified, people saved twice, readers
 * waiting on an answer, and image licences about to lapse. Every number is a
 * link into the screen where it gets resolved.
 */
export const Dashboard = async ({ initPageResult }: AdminViewServerProps) => {
  const payload = await getPayloadClient()
  const user = initPageResult?.req.user as { name?: string | null; email?: string } | null

  const soon = new Date()
  soon.setDate(soon.getDate() + 30)

  const [counts, queue, requests, expiring, recent] = await Promise.all([
    getDeskCounts(payload),
    payload.find({
      collection: 'items',
      limit: 6,
      depth: 2,
      where: { confidence: { in: ['open', 'closest_match'] } },
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'requests',
      limit: 3,
      depth: 0,
      where: { status: { in: ['new', 'researching'] } },
      sort: 'createdAt',
    }),
    payload.count({ collection: 'media', where: { licenceExpiresAt: { less_than_equal: soon.toISOString() } } }),
    payload.find({
      collection: 'looks',
      limit: 4,
      depth: 1,
      where: { _status: { equals: 'published' } },
      sort: '-date',
    }),
  ])

  const handle = user?.name?.split(' ')[0] || user?.email?.split('@')[0]
  const firstName = handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : null
  const decisions = [counts.identify, counts.duplicates, counts.requests, expiring.totalDocs].filter(Boolean).length

  const stats = [
    { label: 'Items to identify', value: counts.identify, note: 'Open or closest match', href: '/admin/identify' },
    {
      label: 'Possible duplicates',
      value: counts.duplicates,
      note: counts.duplicates ? 'Celebrities saved twice' : 'None, all merged',
      href: '/admin/collections/celebrities',
      accent: counts.duplicates > 0,
    },
    { label: 'Reader requests', value: counts.requests, note: 'New or researching', href: '/admin/requests-board' },
    { label: 'Outbound clicks', value: counts.clicks, note: 'All time, to retailers', href: '/admin/reporting' },
  ]

  return (
    <Gutter>
    <div className="desk-page">
      <header className="desk-page__header">
        <div className="desk-page__heading">
          <span className="desk-eyebrow">{dateLine()}</span>
          <h1 className="desk-title">{firstName ? `Hello, ${firstName}` : 'Today'}</h1>
          <p className="desk-lede">
            {decisions === 0
              ? 'Nothing needs a decision today.'
              : `${decisions} ${decisions === 1 ? 'thing needs' : 'things need'} a decision today.`}
          </p>
        </div>
        <div className="desk-actions">
          <Link className="desk-btn" href="/admin/collections/products/create">
            Add product
          </Link>
          <Link className="desk-btn desk-btn--primary" href="/admin/collections/looks/create">
            New look
          </Link>
        </div>
      </header>

      <section className="desk-stats" aria-label="Today at a glance">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="desk-stat">
            <span className="desk-stat__label">{stat.label}</span>
            <span className={`desk-stat__value${stat.accent ? ' desk-stat__value--accent' : ''}`}>{stat.value}</span>
            <span className="desk-stat__note">{stat.note}</span>
          </Link>
        ))}
      </section>

      <div className="desk-columns">
        <section className="desk-card desk-card--wide">
          <div className="desk-card__head">
            <div>
              <h2 className="desk-card__title">Items to identify</h2>
              <p className="desk-card__sub">Pieces spotted in a photo with no confirmed product yet</p>
            </div>
          </div>
          {queue.docs.length === 0 ? (
            <p className="desk-empty">Every item is identified.</p>
          ) : (
            <div className="desk-table-wrap">
              <table className="desk-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Look</th>
                    <th>Category</th>
                    <th className="desk-table__end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.docs.map((item) => {
                    const look = typeof item.look === 'object' ? (item.look as Look | null) : null
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className={item.description ? undefined : 'desk-muted-italic'}>
                            {item.description || 'No description yet'}
                          </span>
                        </td>
                        <td className="desk-table__secondary">{look?.title || 'No look'}</td>
                        <td>
                          <span className="desk-chip">{CATEGORY_LABEL[item.category ?? ''] ?? item.category}</span>
                        </td>
                        <td className="desk-table__end">
                          <Link className="desk-btn desk-btn--small" href={`/admin/collections/items/${item.id}`}>
                            Identify
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Link className="desk-card__foot" href="/admin/identify">
            See all {counts.identify} items to identify →
          </Link>
        </section>

        <div className="desk-rail">
          <section className={`desk-card${counts.duplicates ? ' desk-card--alert' : ''}`}>
            <h2 className="desk-card__title desk-card__title--small">Possible duplicates</h2>
            {counts.duplicateGroups.length === 0 ? (
              <p className="desk-card__sub">No celebrity is published twice.</p>
            ) : (
              <>
                <p className="desk-card__sub">
                  Same person published more than once. Move their looks onto one profile and unpublish the spare.
                </p>
                <ul className="desk-list">
                  {counts.duplicateGroups.map((group) => (
                    <li key={group.name}>
                      <span>{group.name}</span>
                      <Link
                        className="desk-btn desk-btn--small"
                        href={`/admin/collections/celebrities?search=${encodeURIComponent(group.name)}`}
                      >
                        Review {group.ids.length}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="desk-card">
            <h2 className="desk-card__title desk-card__title--small">Reader requests</h2>
            {requests.docs.length === 0 ? (
              <p className="desk-card__sub">Nobody is waiting.</p>
            ) : (
              requests.docs.map((request) => (
                <Link key={request.id} className="desk-request" href={`/admin/collections/requests/${request.id}`}>
                  <strong>{request.summary || 'Untitled request'}</strong>
                  <span>
                    {request.status === 'new' ? 'New' : 'Researching'} · waiting {daysSince(request.createdAt)} days
                  </span>
                </Link>
              ))
            )}
          </section>

          <section className="desk-card">
            <h2 className="desk-card__title desk-card__title--small">Image licences</h2>
            <p className="desk-status">
              <span className={`desk-dot${expiring.totalDocs ? ' desk-dot--warn' : ''}`} aria-hidden="true" />
              {expiring.totalDocs
                ? `${expiring.totalDocs} expire in the next 30 days`
                : 'None expire in the next 30 days'}
            </p>
          </section>
        </div>
      </div>

      <section className="desk-section">
        <div className="desk-section__head">
          <h2 className="desk-card__title">Recently published</h2>
          <Link href="/admin/collections/looks">All looks →</Link>
        </div>
        <div className="desk-looks">
          {recent.docs.map((look) => {
            const photo = Array.isArray(look.photos) ? (look.photos[0] as Media | undefined) : undefined
            const src = photo ? mediaUrl(photo, 'thumb') : null
            const celebrity = typeof look.celebrity === 'object' ? (look.celebrity as Celebrity | null) : null
            return (
              <Link key={look.id} href={`/admin/collections/looks/${look.id}`} className="desk-look">
                <span className="desk-look__photo">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails, already sized */}
                  {src ? <img src={src} alt="" /> : null}
                </span>
                <span className="desk-look__meta">
                  {celebrity?.name ?? 'No celebrity'} · {shortDate(look.date)}
                </span>
                <span className="desk-look__title">{look.title}</span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
    </Gutter>
  )
}
