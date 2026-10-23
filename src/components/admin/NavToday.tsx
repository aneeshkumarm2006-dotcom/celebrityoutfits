import type { ServerProps } from 'payload'

import { getDeskCounts } from './data'
import { NavTodayLinks } from './NavTodayLinks'

/**
 * Sits above Payload's own collection groups in the sidebar: the desk's mark,
 * then the queues that need a person today, each with a live count. The
 * collection links below it stay Payload's, so permissions, collapsing groups
 * and the mobile drawer all keep working.
 */
export const NavToday = async ({ payload }: ServerProps) => {
  const counts = await getDeskCounts(payload)

  return (
    <div className="desk-nav">
      <div className="desk-nav__brand">
        <span className="desk-mark" aria-hidden="true">
          CSO
        </span>
        <span className="desk-nav__brand-text">
          <span className="desk-nav__name">Spotted</span>
          <span className="desk-nav__sub">Editor desk</span>
        </span>
      </div>

      <div className="desk-nav__group">
        <span className="desk-nav__label">Today</span>
        <NavTodayLinks
          links={[
            { href: '/admin', label: 'Dashboard', exact: true },
            { href: '/admin/identify', label: 'Items to identify', count: counts.identify },
            { href: '/admin/requests-board', label: 'Reader requests', count: counts.requests },
            { href: '/admin/reporting', label: 'Reporting' },
          ]}
        />
      </div>
    </div>
  )
}
