'use client'

import { useAllFormFields } from '@payloadcms/ui'

type Check = {
  label: string
  status: 'pass' | 'warn'
  detail: string
}

/** Pull plain text out of a Lexical value without pulling in the whole editor. */
const lexicalToText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  let out = typeof n.text === 'string' ? n.text + ' ' : ''
  const children = (n.children ?? (n.root as Record<string, unknown>)?.children) as unknown[] | undefined
  if (Array.isArray(children)) out += children.map(lexicalToText).join('')
  return out
}

const between = (n: number, min: number, max: number) => n >= min && n <= max

/**
 * On-page SEO checks, computed live in the browser. No external API, no key,
 * no rate limit — everything here is derived from what is already in the form,
 * so it stays accurate as the writer types.
 */
export const SeoChecks = () => {
  const [fields] = useAllFormFields()

  const get = (path: string): unknown => fields?.[path]?.value

  const title = String(get('meta.title') || get('title') || '')
  const description = String(get('meta.description') || get('excerpt') || '')
  const bodyText = lexicalToText(get('body')).replace(/\s+/g, ' ').trim()
  const words = bodyText ? bodyText.split(' ').length : 0
  const hasHero = Boolean(get('heroImage'))

  // Keyword rows live at keywords.0.keyword, keywords.1.keyword, …
  const keywords: string[] = Object.entries(fields || {})
    .filter(([path]) => /^keywords\.\d+\.keyword$/.test(path))
    .map(([, field]) => String((field as { value?: unknown })?.value || ''))
    .filter(Boolean)

  const missingKeywords = keywords.filter(
    (kw) => !new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(bodyText),
  )

  const checks: Check[] = [
    {
      label: 'Meta title length',
      status: between(title.length, 50, 60) ? 'pass' : 'warn',
      detail: `${title.length} characters — aim for 50–60`,
    },
    {
      label: 'Meta description length',
      status: between(description.length, 150, 160) ? 'pass' : 'warn',
      detail: `${description.length} characters — aim for 150–160`,
    },
    {
      label: 'Word count',
      status: words >= 300 ? 'pass' : 'warn',
      detail: words >= 300 ? `${words} words` : `${words} words — thin below 300`,
    },
    {
      label: 'Keywords appear in the body',
      status: keywords.length === 0 || missingKeywords.length === 0 ? 'pass' : 'warn',
      detail:
        keywords.length === 0
          ? 'No keyword links set'
          : missingKeywords.length === 0
            ? `All ${keywords.length} found`
            : `Not in body: ${missingKeywords.join(', ')}`,
    },
    {
      label: 'Hero image',
      status: hasHero ? 'pass' : 'warn',
      detail: hasHero ? 'Set' : 'Missing — cards and social shares will look empty',
    },
  ]

  const warnings = checks.filter((c) => c.status === 'warn').length

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <p style={{ margin: 0, fontWeight: 600 }}>
        {warnings === 0 ? 'Ready to publish' : `${warnings} thing${warnings === 1 ? '' : 's'} to look at`}
      </p>
      <p style={{ margin: '0 0 0.5rem', opacity: 0.65, fontSize: '0.8125rem' }}>
        Warnings are advice, not blockers — publish anyway if the piece is right.
      </p>

      {checks.map((check) => (
        <div
          key={check.label}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.75rem',
            padding: '0.5rem 0',
            borderTop: '1px solid var(--theme-elevation-100)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              flex: 'none',
              transform: 'translateY(-1px)',
              background:
                check.status === 'pass' ? 'var(--theme-success-500)' : 'var(--theme-warning-500)',
            }}
          />
          <span style={{ minWidth: '14rem', fontWeight: 500 }}>{check.label}</span>
          <span style={{ opacity: 0.7 }}>{check.detail}</span>
        </div>
      ))}
    </div>
  )
}
