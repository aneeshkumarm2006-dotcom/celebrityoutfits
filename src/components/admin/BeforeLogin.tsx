import type { ServerProps } from 'payload'

/**
 * The ink panel beside the sign-in form. Payload has no slot for a second
 * column, so this renders before the form and the theme pins it to the left
 * half of the screen; on narrow screens it falls back to a band above the form.
 * The counts are the archive's own, so the panel is never stale copy.
 */
export const BeforeLogin = async ({ payload }: ServerProps) => {
  const where = { _status: { equals: 'published' } } as const
  const [celebrities, looks, brands] = await Promise.all([
    payload.count({ collection: 'celebrities', where }),
    payload.count({ collection: 'looks', where }),
    payload.count({ collection: 'brands', where }),
  ])

  return (
    <aside className="desk-login-panel" aria-label="About the editor desk">
      <span className="desk-login-panel__eyebrow">The editor desk</span>
      <p className="desk-login-panel__line">Every piece, identified. Every look, sourced.</p>
      <dl className="desk-login-panel__stats">
        <div>
          <dt>Celebrities</dt>
          <dd>{celebrities.totalDocs}</dd>
        </div>
        <div>
          <dt>Looks</dt>
          <dd>{looks.totalDocs}</dd>
        </div>
        <div>
          <dt>Brands</dt>
          <dd>{brands.totalDocs}</dd>
        </div>
      </dl>
    </aside>
  )
}
