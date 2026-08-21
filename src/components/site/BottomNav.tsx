'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Mobile bottom navigation.
 *
 * The four destinations are the site's own nav, read from the Navigation
 * global, so editing the header edits this too and the two can never drift.
 * More than four would not fit at a readable size on a narrow phone, so the
 * list is capped rather than allowed to squeeze.
 *
 * Icons are drawn here rather than pulled from a set: four marks is not worth a
 * dependency, and these are keyed to what the sections actually are.
 */
const ICONS: Record<string, React.ReactNode> = {
  celebrities: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
    </>
  ),
  journal: (
    <>
      <path d="M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" />
      <path d="M8.5 9h6M8.5 12.5h6" />
    </>
  ),
  brands: (
    <>
      <path d="M4 9.5 12 4l8 5.5V20H4z" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  request: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
}

/** Matches a nav href onto an icon without needing an extra CMS field. */
const iconFor = (href: string) => {
  const key = href.replace(/\//g, '').toLowerCase()
  if (key.startsWith('celebrit')) return ICONS.celebrities
  if (key.startsWith('journal')) return ICONS.journal
  if (key.startsWith('brand')) return ICONS.brands
  return ICONS.request
}

export const BottomNav = ({ items }: { items: { label: string; href: string }[] }) => {
  const pathname = usePathname()
  const four = items.slice(0, 4)

  if (four.length === 0) return null

  return (
    <nav
      aria-label="Sections"
      /*
       * `pb-[max(...)]` clears the iPhone home indicator. The height is fixed
       * so the spacer that reserves room for it in the layout can match.
       */
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper pb-[max(0px,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="m-0 grid list-none grid-cols-4 p-0">
        {four.map((item) => {
          /* `/celebrities/tom-holland` should still light up Celebrities. */
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 no-underline transition-colors ${
                  active ? 'text-accent' : 'text-ink-2'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 1.9 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {iconFor(item.href)}
                </svg>
                <span className="text-center text-[0.625rem] leading-tight tracking-[0.04em]">
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
