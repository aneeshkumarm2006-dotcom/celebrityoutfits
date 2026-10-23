import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import type React from 'react'

/**
 * The frame for the desk's own screens (identify queue, requests board,
 * reporting). Payload's DefaultTemplate supplies the same sidebar and header
 * as every built-in screen. Custom views are not behind Payload's login on
 * their own, so a visitor without a session is sent to sign in.
 */
export const DeskView = ({
  props: { initPageResult, params, searchParams },
  children,
}: {
  props: AdminViewServerProps
  children: React.ReactNode
}) => {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect(`/admin/login?redirect=${encodeURIComponent(req.pathname ?? '/admin')}`)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <div className="desk-page">{children}</div>
      </Gutter>
    </DefaultTemplate>
  )
}
