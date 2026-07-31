'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Item = { label: string; href: string }

/**
 * Primary navigation below the `md` breakpoint.
 *
 * The site name is three words long and the nav has four entries; side by side
 * they collide on any phone. A disclosure panel is the honest fix — the links
 * are still in the markup for crawlers, they are simply not laid out until
 * asked for.
 */
export const MobileNav = ({ items }: { items: Item[] }) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)

  /**
   * Navigating away should not leave the panel hanging open behind the new
   * page. Adjusted during render by comparing against the path the panel was
   * opened on — an effect would close it a frame later, after the new page had
   * already painted with the menu still over it.
   */
  const [openedOn, setOpenedOn] = useState(pathname)
  if (openedOn !== pathname) {
    setOpenedOn(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current && !panelRef.current.contains(target)) setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <div ref={panelRef} className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="grid size-9 place-items-center rounded-full border border-rule text-ink-2 transition-colors hover:border-ink hover:text-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <path d="M5 5l14 14M19 5L5 19" />
          ) : (
            <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
          )}
        </svg>
      </button>

      {/* Anchored to the header rather than the button, so it spans the width. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-rule bg-paper shadow-[0_12px_28px_-18px_rgb(0_0_0/0.45)]"
      >
        <nav aria-label="Primary" className="grid px-6 py-2">
          {items.map((item, i) => (
            <Link
              key={`${item.href}-${i}`}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-rule-2 py-3.5 text-[0.9375rem] tracking-[0.02em] text-ink no-underline last:border-b-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
