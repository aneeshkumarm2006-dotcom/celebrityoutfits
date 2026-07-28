import type { ReactNode } from 'react'
import { createElement, Fragment } from 'react'

export type KeywordLink = {
  keyword?: string | null
  url?: string | null
  rel?: ('auto' | 'dofollow' | 'nofollow' | 'sponsored') | null
}

const siteOrigin = () => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin
  } catch {
    return 'http://localhost:3000'
  }
}

export const isInternal = (url: string): boolean => {
  if (url.startsWith('/')) return true
  try {
    return new URL(url).origin === siteOrigin()
  } catch {
    return false
  }
}

/**
 * Resolve the rel attribute actually written to the page.
 *
 * `auto` deliberately means nofollow for external links. If an external link is
 * ever paid or exchanged, a dofollow risks a manual action against *this* site
 * — the one whose whole model is organic search. The editor can still override
 * per link; the default just stops it happening by accident.
 */
export const resolveRel = (link: KeywordLink): string | undefined => {
  const url = link.url || ''
  const internal = isInternal(url)
  const choice = link.rel && link.rel !== 'auto' ? link.rel : internal ? 'dofollow' : 'nofollow'

  if (internal && choice === 'dofollow') return undefined
  const parts = new Set<string>(['noopener'])
  if (choice === 'nofollow') parts.add('nofollow')
  if (choice === 'sponsored') parts.add('sponsored')
  return Array.from(parts).join(' ')
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Link the first occurrence of each keyword inside a run of plain text.
 *
 * Deliberately first-occurrence-only: linking every mention reads as
 * over-optimisation to both readers and search engines. Callers must only pass
 * text nodes — never text already inside an anchor, heading or code block.
 */
export const linkKeywordsInText = (
  text: string,
  links: KeywordLink[],
  used: Set<string>,
): ReactNode => {
  const candidates = links.filter(
    (link) => link.keyword && link.url && !used.has(link.keyword.toLowerCase()),
  )
  if (candidates.length === 0) return text

  // Longest keyword first, so "leather flight jacket" wins over "jacket".
  const ordered = [...candidates].sort(
    (a, b) => (b.keyword?.length ?? 0) - (a.keyword?.length ?? 0),
  )

  for (const link of ordered) {
    const keyword = link.keyword as string
    const pattern = new RegExp(`\\b(${escapeRegExp(keyword)})\\b`, 'i')
    const match = pattern.exec(text)
    if (!match || match.index === undefined) continue

    used.add(keyword.toLowerCase())

    const before = text.slice(0, match.index)
    const matched = match[0]
    const after = text.slice(match.index + matched.length)
    const rel = resolveRel(link)
    const external = !isInternal(link.url as string)

    return createElement(
      Fragment,
      null,
      // Keep scanning the text before and after this hit for other keywords.
      linkKeywordsInText(before, links, used),
      createElement(
        'a',
        {
          href: link.url as string,
          rel,
          ...(external ? { target: '_blank' } : {}),
          className: 'text-accent underline decoration-from-font underline-offset-[3px]',
        },
        matched,
      ),
      linkKeywordsInText(after, links, used),
    )
  }

  return text
}
