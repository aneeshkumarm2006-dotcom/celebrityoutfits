'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { type RequestState, submitRequest } from './actions'

const field =
  'w-full border border-rule bg-paper px-3.5 py-3 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-faint focus:border-ink'
const label = 'mb-2 block text-[0.8125rem] text-ink-2'
const error = 'mt-1.5 text-[0.8125rem] text-accent'

const Submit = () => {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 border border-ink bg-ink px-7 py-3 text-[0.875rem] tracking-[0.04em] text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
    >
      {pending ? 'Sending…' : 'Send the request'}
    </button>
  )
}

export const RequestForm = () => {
  const [state, action] = useActionState<RequestState, FormData>(submitRequest, { status: 'idle' })
  const [filename, setFilename] = useState<string | null>(null)
  /**
   * Stamped on mount so the action can measure how long the form was open — a
   * script that posts the moment it loads takes well under a second.
   *
   * Written to the DOM after mount rather than read during render: `Date.now()`
   * is impure, and reading a ref while rendering is not allowed. Mount time is
   * also the more honest number, since it is when the form reached a person.
   */
  const startedAtRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now())
  }, [])

  if (state.status === 'ok') {
    return (
      <div className="border border-rule bg-raised p-8">
        <p className="eyebrow m-0">Received</p>
        <h2 className="mt-3 mb-3 font-display text-[var(--text-step-2)] font-normal">
          We have it. Give us a few days.
        </h2>
        <p className="m-0 max-w-[46ch] text-[0.9375rem] text-ink-2">
          We work through these by hand, so it is not instant. When we have identified it we will
          publish the answer and email you the link. If it turns out to be unidentifiable, we will
          tell you that too. We would rather say so than invent a brand.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="grid max-w-[42rem] gap-6">
      <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />

      {/* Honeypot. Hidden from sight and from screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className={label} htmlFor="summary">
          What are we looking for? <span className="text-faint">Required</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={4}
          required
          maxLength={1200}
          className={field}
          placeholder="The red denim jacket with the corduroy collar, the one from the Comic-Con panel."
        />
        {state.fieldErrors?.summary ? <p className={error}>{state.fieldErrors.summary}</p> : null}
      </div>

      <div>
        <label className={label} htmlFor="personGuess">
          Who is wearing it? <span className="text-faint">Optional</span>
        </label>
        <input
          id="personGuess"
          name="personGuess"
          type="text"
          className={field}
          placeholder="Ryan Gosling, or a guess if you are not sure"
        />
      </div>

      <div>
        <label className={label} htmlFor="sourceUrl">
          Where did you see it? <span className="text-faint">A link often helps more than a photo</span>
        </label>
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          className={field}
          placeholder="https://…"
        />
      </div>

      <div>
        <label className={label} htmlFor="image">
          Or attach a photo <span className="text-faint">JPEG, PNG, WebP or HEIC · max 5MB</span>
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(event) => setFilename(event.target.files?.[0]?.name ?? null)}
          className="block w-full text-[0.875rem] text-ink-2 file:mr-4 file:border file:border-rule file:bg-raised file:px-4 file:py-2.5 file:text-[0.8125rem] file:text-ink hover:file:border-ink"
        />
        {filename ? <p className="mt-1.5 text-[0.8125rem] text-muted">{filename}</p> : null}
        {state.fieldErrors?.image ? <p className={error}>{state.fieldErrors.image}</p> : null}
      </div>

      <div>
        <label className={label} htmlFor="email">
          Your email <span className="text-faint">Required</span>
        </label>
        <input id="email" name="email" type="email" required className={field} placeholder="you@example.com" />
        {state.fieldErrors?.email ? <p className={error}>{state.fieldErrors.email}</p> : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-[0.8125rem] leading-relaxed text-ink-2">
        <input type="checkbox" name="consent" className="mt-1 shrink-0" />
        <span>
          You can email me about this request. I have the right to share any image I have attached,
          and I understand it will not be published unless it has been licensed.
        </span>
      </label>

      {state.status === 'error' && state.message ? (
        <p className="border border-accent/40 bg-accent/5 px-4 py-3 text-[0.875rem] text-accent">
          {state.message}
        </p>
      ) : null}

      <Submit />
    </form>
  )
}
