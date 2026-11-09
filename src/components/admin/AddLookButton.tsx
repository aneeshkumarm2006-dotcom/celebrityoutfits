'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import Link from 'next/link'

/** On a celebrity's edit screen: start a new look with them already chosen. */
export const AddLookButton = () => {
  const { id } = useDocumentInfo()
  if (!id) return null

  return (
    <Link className="desk-btn desk-btn--small" href={`/admin/collections/looks/create?celebrity=${id}`}>
      + Add a look
    </Link>
  )
}
