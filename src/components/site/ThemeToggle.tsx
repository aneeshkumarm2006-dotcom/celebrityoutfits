'use client'

import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

/**
 * Light/dark switch.
 *
 * The stylesheet already carries both palettes: `:root[data-theme='dark']` for
 * an explicit choice, and a `prefers-color-scheme` block for anyone who has not
 * made one. All this does is set the attribute and remember it, so the system
 * preference keeps working for everyone who never touches the button.
 *
 * The current theme lives in the DOM and in localStorage, not in React state.
 * `useSyncExternalStore` is the right tool for that: it renders `null` on the
 * server, hydrates against the same value, and then reconciles with the real
 * browser value — no reading `window` during render, and no setState in an
 * effect to trigger a second pass.
 */
const listeners = new Set<() => void>()

const subscribe = (onChange: () => void) => {
  listeners.add(onChange)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onChange)
  // Fires when another tab toggles the theme.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    media.removeEventListener('change', onChange)
    window.removeEventListener('storage', onChange)
  }
}

const getSnapshot = (): Theme => {
  const explicit = document.documentElement.getAttribute('data-theme')
  if (explicit === 'light' || explicit === 'dark') return explicit
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Nothing truthful to report before the browser has been asked. */
const getServerSnapshot = (): Theme | null => null

export const ThemeToggle = () => {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const isDark = theme === 'dark'

  const toggle = () => {
    const next: Theme = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      window.localStorage.setItem('theme', next)
    } catch {
      // Private browsing can refuse storage. The theme still applies for this
      // page view; only remembering it fails, which is not worth an error.
    }
    listeners.forEach((notify) => notify())
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme ? `Switch to ${isDark ? 'light' : 'dark'} theme` : 'Switch theme'}
      aria-pressed={theme ? isDark : undefined}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rule text-ink-2 transition-colors hover:border-ink hover:text-ink"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {isDark ? (
          // Sun — offering the light theme.
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
          </>
        ) : (
          // Moon — offering the dark theme.
          <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />
        )}
      </svg>
    </button>
  )
}

/**
 * Runs before first paint so the page never renders in one theme and flips to
 * the other. Inlined deliberately: a separate request would resolve too late to
 * prevent the flash.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`
