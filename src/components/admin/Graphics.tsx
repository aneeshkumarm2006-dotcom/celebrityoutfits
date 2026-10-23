/** The small square mark, used in the header breadcrumb in place of Payload's. */
export const Icon = () => (
  <span className="desk-mark desk-mark--small" aria-label="Celebrity Spotted Outfits">
    CSO
  </span>
)

/** The full lockup, used above the sign-in form. */
export const Logo = () => (
  <span className="desk-logo">
    <span className="desk-mark" aria-hidden="true">
      CSO
    </span>
    <span className="desk-logo__name">Celebrity Spotted Outfits</span>
  </span>
)
