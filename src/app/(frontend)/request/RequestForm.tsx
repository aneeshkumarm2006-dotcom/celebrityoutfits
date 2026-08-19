'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { type RequestState, submitRequest } from './actions'

const field =
  'w-full border border-rule bg-paper px-3.5 py-3 text-[0.9375rem] text-ink outline-none transition-[border-color,background-color] duration-200 ease-out placeholder:text-faint focus:border-ink'
/* `flex-wrap` so the grey hint drops to its own line on a narrow screen
   instead of compressing the label it belongs to. */
const label = 'mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-ink-2'
const error = 'mt-1.5 text-[0.8125rem] text-accent'

/**
 * The server requires a summary of at least ten characters, a valid address,
 * consent, and either a photo or a link. Every one of those is mirrored here as
 * a live state rather than left to be discovered on submit: the photo-or-link
 * rule in particular was invisible until it failed, which is the worst place to
 * learn about a requirement.
 *
 * These checks are for encouragement only. `actions.ts` re-validates all of it,
 * because anything decided in the browser can be edited in the browser.
 */
const MIN_SUMMARY = 10

const Tick = () => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    className="h-3.5 w-3.5 shrink-0 text-accent"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13.5 4.5 6.5 11.5 2.5 7.5" />
  </svg>
)

/** Shown against a label once that field is satisfied. */
const Done = ({ show }: { show: boolean }) =>
  show ? (
    <span className="ml-auto flex items-center gap-1.5 text-[0.75rem] text-accent motion-safe:animate-[rise_240ms_ease-out]">
      <Tick />
    </span>
  ) : null

/**
 * Three openers, taken from the shape of requests that turn out to be easy to
 * answer: a garment, a distinguishing detail, and where it was seen. A blank
 * textarea asks someone to invent a format. These hand them one.
 */
const EXAMPLES = [
  'The red denim jacket with the corduroy collar, the one from the Comic-Con panel.',
  'The gold spider brooch on the lapel at the London premiere, bottom left of the photo.',
  'The pleated wool trousers, high waisted, worn with a plain white tee at the LA premiere.',
]

const Submit = ({ ready }: { ready: boolean }) => {
  const { pending } = useFormStatus()
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
      <button
        type="submit"
        disabled={pending}
        className="group relative border border-ink bg-ink px-7 py-3 text-[0.875rem] tracking-[0.04em] text-paper transition-[opacity,transform] duration-200 ease-out disabled:opacity-50 motion-safe:active:scale-[0.98] hover:opacity-85"
      >
        {pending ? 'Sending…' : 'Send the request'}
      </button>
      <p
        className="m-0 text-[0.8125rem] text-muted transition-colors duration-300"
        aria-live="polite"
      >
        {pending
          ? 'One moment.'
          : ready
            ? 'Ready when you are.'
            : 'A photo or a link is all we still need.'}
      </p>
    </div>
  )
}

export const RequestForm = () => {
  const [state, action] = useActionState<RequestState, FormData>(submitRequest, { status: 'idle' })
  const [summary, setSummary] = useState('')
  const [email, setEmail] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [consent, setConsent] = useState(false)
  /**
   * The file and its preview URL are one value, created together. Deriving the
   * URL in an effect instead would mean a second render before the preview
   * appears, and a revoke that has to chase the previous value.
   */
  const [attachment, setAttachment] = useState<{ file: File; url: string } | null>(null)
  const [previewBroken, setPreviewBroken] = useState(false)
  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<string | null>(null)
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

  /** Unmount only. Replacement is revoked in `takeFile`, where it happens. */
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  /**
   * Object URLs are revoked the moment they are replaced. Leaving them alive
   * pins the whole image in memory for the life of the tab, which on a page
   * where people try three photos in a row is three photos held for nothing.
   */
  const takeFile = (next: File | null) => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    if (!next) {
      setAttachment(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const url = URL.createObjectURL(next)
    urlRef.current = url
    setAttachment({ file: next, url })
    setPreviewBroken(false)
  }

  /**
   * A dropped file has to be written back onto the input, or the form posts
   * without it: the drop event and the input's file list are not connected by
   * the browser.
   */
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (!dropped || !dropped.type.startsWith('image/')) return
    if (fileInputRef.current) {
      const transfer = new DataTransfer()
      transfer.items.add(dropped)
      fileInputRef.current.files = transfer.files
    }
    takeFile(dropped)
  }

  const summaryDone = summary.trim().length >= MIN_SUMMARY
  const emailDone = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const proofDone = Boolean(attachment) || sourceUrl.trim().length > 0
  const ready = summaryDone && emailDone && proofDone && consent

  if (state.status === 'ok') {
    return (
      <div className="border border-rule bg-raised p-8 motion-safe:animate-[rise_400ms_ease-out]">
        <p className="eyebrow m-0 flex items-center gap-2">
          <Tick />
          Received
        </p>
        <h2 className="mt-3 mb-3 font-display text-[var(--text-step-2)] font-normal">
          We have it. Give us a few days.
        </h2>
        <p className="m-0 max-w-[46ch] text-[0.9375rem] text-ink-2">
          We work through these by hand, so it is not instant. When we have identified it we will
          publish the answer and email you the link. If it turns out to be unidentifiable, we will
          tell you that too. We would rather say so than invent a brand.
        </p>
        <p className="mt-5 mb-0 text-[0.8125rem] text-muted">
          Spotted something else?{' '}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-accent underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Send another
          </button>
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="grid max-w-[42rem] gap-7">
      <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />

      {/* Honeypot. Hidden from sight and from screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className={label} htmlFor="summary">
          What are we looking for? <span className="text-faint">Required</span>
          <Done show={summaryDone} />
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={4}
          required
          maxLength={1200}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className={field}
          placeholder="The red denim jacket with the corduroy collar, the one from the Comic-Con panel."
        />
        {state.fieldErrors?.summary ? <p className={error}>{state.fieldErrors.summary}</p> : null}

        {!summary ? (
          <div className="mt-3">
            <p className="m-0 mb-2 text-[0.8125rem] text-muted">
              Not sure how to put it? Start from one of these.
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example, index) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setSummary(example)}
                  className="border border-rule bg-raised px-3 py-1.5 text-left text-[0.8125rem] text-ink-2 transition-[border-color,color] duration-200 ease-out hover:border-ink hover:text-ink"
                >
                  {['A garment', 'A detail', 'A whole outfit'][index]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-1.5 mb-0 text-[0.8125rem] text-muted">
            {summaryDone
              ? 'That is plenty to go on.'
              : `A few more words and we can start. ${MIN_SUMMARY - summary.trim().length} to go.`}
          </p>
        )}
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
        <p className="mt-1.5 mb-0 text-[0.8125rem] text-muted">
          A wrong guess still helps. It narrows the search more than a blank does.
        </p>
      </div>

      {/*
        The server rejects a request carrying neither a photo nor a link, so the
        two are grouped into one requirement and satisfied together rather than
        presented as two independent optional fields.
      */}
      <fieldset
        className={`border p-5 transition-colors duration-300 ease-out sm:p-6 ${
          proofDone ? 'border-accent/35 bg-accent/[0.03]' : 'border-rule bg-raised/40'
        }`}
      >
        <legend className="flex items-center gap-2 px-2 text-[0.8125rem] text-ink-2">
          Show us the piece <span className="text-faint">Either one is enough</span>
          <Done show={proofDone} />
        </legend>

        <div className="mt-2 grid gap-5">
          <div>
            <label className={label} htmlFor="sourceUrl">
              Where did you see it?
            </label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              className={field}
              placeholder="https://…"
            />
            <p className="mt-1.5 mb-0 text-[0.8125rem] text-muted">
              A link to the post or article often tells us more than the photo does.
            </p>
          </div>

          <div>
            <label className={label} htmlFor="image">
              Or attach a photo <span className="text-faint">JPEG, PNG, WebP or HEIC · max 5MB</span>
            </label>

            {attachment ? (
              <div className="flex items-center gap-4 border border-rule bg-paper p-3 motion-safe:animate-[rise_240ms_ease-out]">
                <div className="h-20 w-20 shrink-0 overflow-hidden border border-rule bg-raised">
                  {!previewBroken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={attachment.url}
                      alt=""
                      onError={() => setPreviewBroken(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    /* HEIC does not render in most browsers. Say so rather than
                       show a broken frame and let it read as a failed upload. */
                    <span className="flex h-full w-full items-center justify-center px-1 text-center text-[0.6875rem] leading-tight text-muted">
                      No preview
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[0.875rem] text-ink">{attachment.file.name}</p>
                  <p
                    className={`m-0 mt-0.5 text-[0.8125rem] ${
                      attachment.file.size > 5 * 1024 * 1024 ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {(attachment.file.size / 1024 / 1024).toFixed(1)}MB
                    {attachment.file.size > 5 * 1024 * 1024
                      ? ' · over the 5MB limit, try a screenshot'
                      : ' · attached'}
                  </p>
                  <button
                    type="button"
                    onClick={() => takeFile(null)}
                    className="mt-1.5 text-[0.8125rem] text-accent underline underline-offset-4 transition-opacity hover:opacity-70"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex w-full cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-7 text-center transition-[border-color,background-color] duration-200 ease-out ${
                  dragging ? 'border-accent bg-accent/5' : 'border-rule bg-paper hover:border-ink'
                }`}
              >
                <p className="m-0 text-[0.875rem] text-ink-2">
                  {dragging ? 'Drop it here' : 'Drag a photo in, or choose a file'}
                </p>
                <p className="m-0 mt-1 text-[0.8125rem] text-muted">
                  A screenshot is usually plenty
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={(event) => takeFile(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
            {state.fieldErrors?.image ? <p className={error}>{state.fieldErrors.image}</p> : null}
          </div>
        </div>
      </fieldset>

      <div>
        <label className={label} htmlFor="email">
          Your email <span className="text-faint">Required</span>
          <Done show={emailDone} />
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={field}
          placeholder="you@example.com"
        />
        {state.fieldErrors?.email ? <p className={error}>{state.fieldErrors.email}</p> : null}
        <p className="mt-1.5 mb-0 text-[0.8125rem] text-muted">
          Used to send you the answer. Nothing else, ever.
        </p>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[0.8125rem] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="peer sr-only"
          />
          {/*
            The tick is a descendant rather than a sibling of the checkbox, and
            `peer-checked:` only reaches siblings, so the state is applied to
            the box and re-targeted at the svg from there.
          */}
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-rule bg-paper transition-colors duration-200 ease-out peer-checked:border-accent peer-checked:bg-accent peer-checked:[&_svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-[1.5px] peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3 text-paper opacity-0 transition-opacity duration-200 ease-out"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.5 4.5 6.5 11.5 2.5 7.5" />
            </svg>
          </span>
          <span>
            You can email me about this request. I have the right to share any image I have attached,
            and I understand it will not be published unless it has been licensed.
          </span>
        </label>
      </div>

      {state.status === 'error' && state.message ? (
        <p className="border border-accent/40 bg-accent/5 px-4 py-3 text-[0.875rem] text-accent motion-safe:animate-[rise_240ms_ease-out]">
          {state.message}
        </p>
      ) : null}

      <Submit ready={ready} />
    </form>
  )
}
