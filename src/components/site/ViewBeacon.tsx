'use client'

import { useEffect } from 'react'

/**
 * Fires once per mount to increment the article's view count.
 *
 * Counting during render would mutate on every ISR regeneration and defeat
 * caching, so it happens client-side against a tiny route handler instead.
 */
export const ViewBeacon = ({ articleId }: { articleId: string }) => {
  useEffect(() => {
    const key = `viewed:${articleId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    void fetch(`/api/views/${articleId}`, { method: 'POST', keepalive: true }).catch(() => {})
  }, [articleId])

  return null
}
