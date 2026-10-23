import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

import { DeskView } from './DeskView'

const COLUMNS = [
  { status: 'new', label: 'New' },
  { status: 'researching', label: 'Researching' },
  { status: 'answered', label: 'Answered' },
  { status: 'unidentified', label: 'Could not identify' },
] as const

const daysSince = (value: string) => Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)

/**
 * "Find my outfit" submissions as a board, one column per status. A reader is
 * waiting on everything in the first two columns, so those cards carry how long
 * they have waited. Declined and spam requests are left off the board.
 */
export const RequestsBoardView = async (props: AdminViewServerProps) => {
  const payload = props.initPageResult.req.payload
  const { docs } = await payload.find({
    collection: 'requests',
    limit: 200,
    depth: 0,
    where: { status: { not_equals: 'declined' } },
    sort: 'createdAt',
  })

  return (
    <DeskView props={props}>
      <header className="desk-page__header">
        <div className="desk-page__heading">
          <span className="desk-eyebrow">Today</span>
          <h1 className="desk-title">Reader requests</h1>
          <p className="desk-lede">
            “Find my outfit” submissions. Someone is waiting on every card in the first two columns.
          </p>
        </div>
        <Link className="desk-btn" href="/admin/collections/requests">
          Table view
        </Link>
      </header>

      <div className="desk-board">
        {COLUMNS.map((column) => {
          const cards = docs.filter((doc) => doc.status === column.status)
          const waiting = column.status === 'new' || column.status === 'researching'
          return (
            <section key={column.status} className="desk-board__column" aria-label={column.label}>
              <div className="desk-board__head">
                <h2>{column.label}</h2>
                <span>{cards.length}</span>
              </div>
              {cards.length === 0 ? <p className="desk-board__empty">Nothing here</p> : null}
              {cards.map((request) => (
                <Link key={request.id} href={`/admin/collections/requests/${request.id}`} className="desk-board__card">
                  <strong>{request.summary || 'Untitled request'}</strong>
                  {request.personGuess ? <span>Thinks it is {request.personGuess}</span> : null}
                  <span>{request.email ? 'Left an email for the answer' : 'No email left'}</span>
                  {waiting ? (
                    <span className="desk-chip desk-chip--alert">Waiting {daysSince(request.createdAt)} days</span>
                  ) : null}
                </Link>
              ))}
            </section>
          )
        })}
      </div>
    </DeskView>
  )
}
