import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import { getPayloadClient } from '@/lib/payload'

const card: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-100)',
  padding: '1.25rem',
  borderRadius: 4,
}

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '0.5rem 0',
  borderTop: '1px solid var(--theme-elevation-100)',
  textDecoration: 'none',
}

/**
 * Replaces Payload's default "list of collections" dashboard with the two
 * questions that actually govern this business day to day:
 *
 *   1. Which items are unresolved and need a human call?
 *   2. Which image licences are about to expire?
 *
 * Both are queries the team would otherwise have to remember to run.
 */
export const Dashboard = async (_props: AdminViewServerProps) => {
  const payload = await getPayloadClient()

  const soon = new Date()
  soon.setDate(soon.getDate() + 30)

  const [openItems, expiring, draftLooks, draftArticles, clicks, newRequests] = await Promise.all([
    payload.find({
      collection: 'items',
      limit: 8,
      depth: 2,
      where: { confidence: { in: ['open', 'closest_match'] } },
      sort: 'createdAt',
    }),
    payload.find({
      collection: 'media',
      limit: 8,
      where: { licenceExpiresAt: { less_than_equal: soon.toISOString() } },
      sort: 'licenceExpiresAt',
    }),
    payload.count({ collection: 'looks', where: { _status: { equals: 'draft' } } }),
    payload.count({ collection: 'articles', where: { _status: { equals: 'draft' } } }),
    payload.count({ collection: 'outboundClicks' }),
    payload.find({
      collection: 'requests',
      limit: 8,
      depth: 0,
      where: { status: { in: ['new', 'researching'] } },
      sort: 'createdAt',
    }),
  ])

  const stats = [
    { label: 'Open research requests', value: newRequests.totalDocs },
    { label: 'Items needing review', value: openItems.totalDocs },
    { label: 'Licences expiring in 30 days', value: expiring.totalDocs },
    { label: 'Draft looks', value: draftLooks.totalDocs },
    { label: 'Draft articles', value: draftArticles.totalDocs },
    { label: 'Outbound clicks', value: clicks.totalDocs },
  ]

  return (
    <div style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0 }}>Celebrity Spotted Outfits</h1>
        <p style={{ margin: '0.25rem 0 0', opacity: 0.65 }}>
          What needs a decision today.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} style={card}>
            <div style={{ fontSize: '2rem', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
              {stat.value}
            </div>
            <div style={{ opacity: 0.65, fontSize: '0.8125rem', marginTop: '0.375rem' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))',
        }}
      >
        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Research requests</h2>
          <p style={{ opacity: 0.65, fontSize: '0.8125rem', marginTop: 0 }}>
            Someone is waiting on each of these, the only queue here where that is true. Answer it,
            publish it, then mark it answered.
          </p>
          {newRequests.docs.length === 0 ? (
            <p style={{ opacity: 0.6, margin: 0 }}>Nothing waiting.</p>
          ) : (
            newRequests.docs.map((request) => (
              <Link
                key={request.id}
                href={`/admin/collections/requests/${request.id}`}
                style={linkStyle}
              >
                <strong>{request.summary?.slice(0, 60)}</strong>
                <span style={{ opacity: 0.6 }}> · {request.status}</span>
                {request.personGuess ? (
                  <span style={{ opacity: 0.6 }}> · {request.personGuess}</span>
                ) : null}
              </Link>
            ))
          )}
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Review queue</h2>
          <p style={{ opacity: 0.65, fontSize: '0.8125rem', marginTop: 0 }}>
            Items marked open or closest match. Confirm them, or leave them open, but never guess a
            brand to close one.
          </p>
          {openItems.docs.length === 0 ? (
            <p style={{ opacity: 0.6, margin: 0 }}>Nothing waiting. </p>
          ) : (
            openItems.docs.map((item) => {
              const look = typeof item.look === 'object' ? item.look : null
              return (
                <Link key={item.id} href={`/admin/collections/items/${item.id}`} style={linkStyle}>
                  <strong>{item.category}</strong>
                  <span style={{ opacity: 0.6 }}> · {item.confidence?.replace(/_/g, ' ')}</span>
                  {look ? <span style={{ opacity: 0.6 }}> · {look.title}</span> : null}
                </Link>
              )
            })
          )}
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Licences expiring</h2>
          <p style={{ opacity: 0.65, fontSize: '0.8125rem', marginTop: 0 }}>
            Renew or replace these images before the licence lapses. An expired agency image is the
            most expensive kind of mistake on this site.
          </p>
          {expiring.docs.length === 0 ? (
            <p style={{ opacity: 0.6, margin: 0 }}>Nothing expiring in the next 30 days.</p>
          ) : (
            expiring.docs.map((media) => (
              <Link key={media.id} href={`/admin/collections/media/${media.id}`} style={linkStyle}>
                <strong>{media.filename}</strong>
                <span style={{ opacity: 0.6 }}> · {media.credit}</span>
                <span style={{ opacity: 0.6 }}>
                  {' '}
                  · expires {new Date(media.licenceExpiresAt as string).toLocaleDateString('en-GB')}
                </span>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
