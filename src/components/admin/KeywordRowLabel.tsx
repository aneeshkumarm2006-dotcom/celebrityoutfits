'use client'

import { useRowLabel } from '@payloadcms/ui'

type KeywordRow = {
  keyword?: string
  url?: string
  rel?: string
}

const isExternal = (url?: string) => Boolean(url && /^https?:\/\//i.test(url))

/**
 * Collapsed rows in the keyword array otherwise read "Keyword link 01",
 * which tells the editor nothing. This shows the keyword, the destination and
 * — importantly — the rel that will actually be applied.
 */
export const KeywordRowLabel = () => {
  const { data, rowNumber } = useRowLabel<KeywordRow>()

  if (!data?.keyword) return <span>Keyword link {String((rowNumber ?? 0) + 1).padStart(2, '0')}</span>

  const resolved =
    data.rel && data.rel !== 'auto' ? data.rel : isExternal(data.url) ? 'nofollow' : 'dofollow'

  return (
    <span>
      <strong>{data.keyword}</strong>
      {data.url ? <span style={{ opacity: 0.6 }}> → {data.url}</span> : null}
      <span style={{ opacity: 0.6 }}> · {resolved}</span>
    </span>
  )
}
