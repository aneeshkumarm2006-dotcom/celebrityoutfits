'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type DeskLink = { href: string; label: string; count?: number; exact?: boolean }

/** Client only for the pathname: the current page is highlighted like Payload's own links. */
export const NavTodayLinks = ({ links }: { links: DeskLink[] }) => {
  const pathname = usePathname()

  return (
    <>
      {links.map(({ href, label, count, exact }) => {
        const current = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`desk-nav__link${current ? ' desk-nav__link--current' : ''}`}
            aria-current={current ? 'page' : undefined}
          >
            <span>{label}</span>
            {count ? <span className="desk-badge">{count}</span> : null}
          </Link>
        )
      })}
    </>
  )
}
