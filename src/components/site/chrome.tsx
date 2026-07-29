import Link from 'next/link'

import { ThemeToggle } from '@/components/site/ThemeToggle'
import { Container } from '@/components/site/primitives'
import { getFooter, getNavigation, getSiteSettings } from '@/lib/payload'

export const SiteHeader = async () => {
  const [nav, settings] = await Promise.all([getNavigation(), getSiteSettings()])
  const items = nav?.items ?? []

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper">
      <Container className="flex h-[70px] items-center justify-between gap-8">
        <Link href="/" className="font-display text-2xl leading-none font-bold tracking-[0.02em]">
          {settings?.siteName || 'Celebrity Spotted Outfits'}
        </Link>
        <div className="flex items-center gap-x-6 sm:gap-x-9">
          {items.length > 0 ? (
            <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-9 gap-y-2">
              {items.map((item, i) => (
                <Link
                  key={`${item.href}-${i}`}
                  href={item.href}
                  className="border-b border-transparent py-1 text-[0.8125rem] tracking-[0.04em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  )
}

/**
 * The FTC requires affiliate disclosure to be clear, conspicuous and near the
 * links — a footer line alone is not enough, so this sits at the top of any
 * page carrying affiliate links.
 */
export const DisclosureBar = async () => {
  const settings = await getSiteSettings()
  if (!settings?.affiliateDisclosure) return null

  return (
    <div className="border-b border-rule bg-raised">
      <Container>
        <p className="m-0 py-2.5 text-[0.6875rem] leading-relaxed text-muted">
          {settings.affiliateDisclosure}
        </p>
      </Container>
    </div>
  )
}

export const SiteFooter = async () => {
  const [footer, settings] = await Promise.all([getFooter(), getSiteSettings()])

  return (
    <footer className="mt-auto border-t border-rule py-12 sm:py-16">
      <Container>
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1.4fr)_repeat(auto-fit,minmax(9rem,1fr))]">
          <div>
            <p className="eyebrow">{settings?.siteName || 'Celebrity Spotted Outfits'}</p>
            {footer?.blurb ? (
              <p className="mt-3 max-w-[26rem] text-[0.9375rem] text-ink-2">{footer.blurb}</p>
            ) : null}
          </div>

          {(footer?.columns ?? []).map((column, i) => (
            <div key={`${column.heading}-${i}`}>
              <p className="eyebrow">{column.heading}</p>
              <ul className="mt-3 grid list-none gap-2 p-0">
                {(column.links ?? []).map((link, j) => (
                  <li key={`${link.href}-${j}`}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-ink-2 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-[60rem] border-t border-rule-2 pt-6 text-[0.8125rem] leading-relaxed text-muted">
          {settings?.affiliateDisclosure ? (
            <p className="mb-3">
              <strong className="font-medium">Affiliate disclosure.</strong>{' '}
              {settings.affiliateDisclosure}
            </p>
          ) : null}
          {settings?.nonAffiliationNotice ? <p className="mb-0">{settings.nonAffiliationNotice}</p> : null}
        </div>
      </Container>
    </footer>
  )
}
