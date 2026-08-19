'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Sticky buy bar, phones only.
 *
 * The pattern is lifted from the large retail sites, but their version buys one
 * product and a look has several, so the button cannot say "Buy". It carries
 * the same information their bar does (what it costs, one obvious next step)
 * and sends the reader to the grid rather than to a checkout.
 *
 * It hides itself while the grid is on screen. A bar that points at something
 * already in front of you is just a bar covering the thing you are reading.
 */
export const ShopBar = ({
  targetId,
  itemCount,
  total,
}: {
  targetId: string
  itemCount: number
  total: string | null
}) => {
  const [visible, setVisible] = useState(false)
  const seen = useRef(false)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    /**
     * Two things are watched at once: whether the grid is on screen (hide), and
     * whether the reader has scrolled past the top of the page at all (show).
     * Appearing over the headline before anyone has scrolled reads as an ad.
     */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) seen.current = entry.isIntersecting
        setVisible(window.scrollY > 320 && !seen.current)
      },
      { rootMargin: '0px 0px -25% 0px' },
    )
    observer.observe(target)

    const onScroll = () => setVisible(window.scrollY > 320 && !seen.current)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [targetId])

  const go = () => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <div
      /*
       * `translate-y-full` rather than `hidden` so it slides rather than
       * appears, and stays out of the layout entirely when it is away.
       * `pb-[env(safe-area-inset-bottom)]` clears the iPhone home indicator.
       */
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper transition-transform duration-300 ease-out lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-4 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[0.6875rem] tracking-[0.13em] text-muted uppercase">
            {itemCount} item{itemCount === 1 ? '' : 's'} to shop
          </p>
          {total ? (
            <p className="m-0 mt-0.5 truncate text-[0.9375rem] tabular-nums text-ink">
              {total} at full retail
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={go}
          tabIndex={visible ? 0 : -1}
          className="shrink-0 border border-ink bg-ink px-5 py-2.5 text-[0.8125rem] tracking-[0.04em] text-paper transition-transform duration-200 ease-out motion-safe:active:scale-[0.98]"
        >
          Shop this look
        </button>
      </div>
    </div>
  )
}
