'use client'

import { TextField, useDocumentInfo, useField } from '@payloadcms/ui'
import Link from 'next/link'
import type { TextFieldClientComponent } from 'payload'
import { useEffect, useMemo, useState } from 'react'

import { foldName } from '@/fields/slug'
import type { Celebrity, Media } from '@/payload-types'

type Existing = { id: number | string; name: string; slug: string; thumb: string | null }

/**
 * "Selena", "selena gomez" and "Selena Gomez's in Ugg slippers" should all
 * surface Selena Gomez: a prefix of any word in her name, or her whole name at
 * the start of what was typed, which is how an outfit headline gets pasted into
 * the name box.
 */
const isMatch = (typed: string, name: string) => {
  const t = foldName(typed)
  const n = foldName(name)
  if (t.length < 2 || !n) return false
  return n.startsWith(t) || n.split(' ').some((word) => word.startsWith(t)) || t === n || t.startsWith(`${n} `)
}

/**
 * The celebrity name box, with the people already in the archive listed under
 * it as you type. Most duplicates were an outfit added as a new person, so each
 * suggestion offers the two things the editor actually wanted: add a look for
 * that person, or open their profile. A name with no match saves as normal.
 */
export const CelebrityNameField: TextFieldClientComponent = (props) => {
  const { value } = useField<string>({ path: props.path })
  const { id } = useDocumentInfo()
  const [existing, setExisting] = useState<Existing[]>([])

  useEffect(() => {
    const query = new URLSearchParams({
      limit: '1000',
      depth: '1',
      'where[_status][equals]': 'published',
      'select[name]': 'true',
      'select[slug]': 'true',
      'select[portraitImage]': 'true',
    })
    fetch(`/api/celebrities?${query}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { docs: [] }))
      .then(({ docs }) =>
        setExisting(
          ((docs ?? []) as Pick<Celebrity, 'id' | 'name' | 'slug' | 'portraitImage'>[]).map((doc) => {
            const portrait = typeof doc.portraitImage === 'object' ? (doc.portraitImage as Media | null) : null
            return {
              id: doc.id,
              name: (doc.name ?? '').trim(),
              slug: doc.slug,
              thumb: portrait?.sizes?.thumb?.url ?? portrait?.url ?? null,
            }
          }),
        ),
      )
      .catch(() => setExisting([]))
  }, [])

  const matches = useMemo(
    () =>
      value
        ? existing.filter((person) => person.id !== id && isMatch(value, person.name)).slice(0, 6)
        : [],
    [existing, id, value],
  )

  return (
    <div className="desk-name-field">
      <TextField {...props} />
      {matches.length > 0 ? (
        <div className="desk-suggest" role="region" aria-label="Celebrities already in the archive">
          <p className="desk-suggest__head">Already in the archive. Adding an outfit? Add a look instead.</p>
          <ul>
            {matches.map((person) => (
              <li key={person.id}>
                <span className="desk-suggest__img" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, already sized */}
                  {person.thumb ? <img src={person.thumb} alt="" /> : null}
                </span>
                <span className="desk-suggest__name">
                  {person.name}
                  <span>/{person.slug}</span>
                </span>
<Link
                  className="desk-btn desk-btn--small desk-btn--primary"
                  href={`/admin/collections/looks/create?celebrity=${person.id}`}
                >
                  Add a look
                </Link>
                <Link className="desk-btn desk-btn--small" href={`/admin/collections/celebrities/${person.id}`}>
                  Open profile
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
