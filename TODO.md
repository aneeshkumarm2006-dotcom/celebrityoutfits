# CELEBRITY OUTFITS — Build Handoff

A shoppable archive of what celebrities actually wear. Each celebrity gets a permanent page that grows with every new photograph; each garment is identified down to the brand and linked to a buyable product via affiliate links. Editorial writing on the celebrities and brands drives organic search traffic.

**Market:** US + Canada. **Team:** 3, one developer (building in-house). **Cadence:** research-first, not breaking-news.

## Core product principle: nothing is hardcoded

Every piece of the public site is editable from the admin panel by a non-developer. This is a hard requirement, not a nice-to-have, and it drives most of the technical decisions below.

- **All copy** — headlines, standfirsts, section titles, the "How we identify an item" blocks, footer text. No string lives only in a `.tsx` file.
- **Navigation and footer** — links, labels, and order editable.
- **Images** — uploaded from the admin, stored centrally, reusable across pages. No FTP, no committing files to the repo.
- **Blogs** — written, edited, drafted, scheduled and published entirely from the admin.
- **SEO** — per-page title, meta description, OG image, canonical URL and `noindex` toggle, all editable per document. Plus site-wide defaults and admin-managed redirects.

Practical consequence: a developer is needed to add a *new kind of thing*, never to change the content of an existing one.

---

## 0. Read this before writing code

Three constraints decide the architecture. None of them are negotiable.

### 0.1 Image licensing is the hardest problem, not the code

Paparazzi and event photography is copyrighted, and the agencies that own it (BackGrid, Splash, Getty, Shutterstock Editorial) litigate aggressively and profitably. "It was published on a news site" is not a licence. Embedding a hotlinked image is still reproduction.

Three viable routes, in order of preference:

1. **Licensed agency feed** — a subscription with an editorial photo agency. Real cost (typically four figures/month), and the only route that scales safely.
2. **Instagram / X official embeds** — the celebrity's own post, embedded via the platform's official embed API. Free and permitted, but you don't control crop, the post can be deleted, and it won't cover candid street shots.
3. **Creative Commons** — what the current prototype uses. Fine for demos, unusable as a primary source: coverage is thin, quality is inconsistent, and ShareAlike terms have real obligations.

**Product images are a separate and much easier problem** — they come from the merchant's affiliate feed (see §4), so you never source those yourself.

**Action before launch:** get a written quote from at least two agencies and budget for it.

### 0.2 FTC affiliate disclosure is mandatory

US law. Disclosure must be *clear and conspicuous* and *near the links* — a line buried in the footer is not sufficient on its own. Put a disclosure line at the top of any page with affiliate links, plus the full statement in the footer.

### 0.3 Right of publicity

Editorial commentary about a public figure is protected. Using a celebrity's name or likeness to *imply endorsement* of a product is not. Keep the framing editorial ("worn at", "closest match"), never "Tom Cruise recommends". Add a non-affiliation line to the footer.

---

## 1. Tech stack

Chosen for: one developer maintaining it, SEO as the primary growth channel, and an AI pipeline bolted on later without a rewrite.

| Layer | Choice | Why this and not the alternative |
|---|---|---|
| Framework | **Next.js 15+ (App Router), TypeScript** | Server Components render the archive pages as static HTML — critical for SEO. ISR lets you publish a look without a full rebuild. |
| Hosting | **Vercel** | Zero-config for Next.js, edge caching, preview deploys. Move to self-hosted only if bandwidth cost becomes real. |
| Database | **Supabase Postgres (Pro)** | Already paid for. Relational is the right shape — celebrities → looks → items → products. No MongoDB. |
| ORM | **None separate — Payload owns the schema** | Payload's Postgres adapter uses Drizzle internally. Adding a second ORM on the same tables would fight it. Query from Server Components via Payload's Local API. |
| Vector search | **pgvector** (same Postgres) | Image embeddings for near-duplicate detection and "seen this garment before" lookup. Don't add a separate vector DB. |
| CMS / admin | **Payload CMS 3** | Runs *inside* the Next.js app, Postgres-backed, TypeScript. Gives the two non-developers a real editing UI and, crucially, the **identification review queue**. Alternative: hand-roll an admin — only if Payload fights you. |
| Images | **Vercel Blob** (upload layer abstracted) | Simplest with Vercel Pro. Note: Supabase Pro already includes 100 GB storage you're paying for — the storage adapter is one file, so switching later is cheap. Serve AVIF/WebP via `next/image`. |
| Background jobs | **Inngest** | The AI pipeline is a multi-step, retryable, long-running workflow. Do not run it in API routes. |
| Styling | **Tailwind + shadcn/ui** | shadcn for admin UI. The public site is custom-designed — don't let component defaults flatten it. |
| Search | **Postgres full-text → Typesense later** | Don't add search infrastructure before there's content to search. |
| Analytics | **PostHog** + Vercel Analytics | PostHog for the funnel that matters: page → item view → outbound click. |
| Error tracking | **Sentry** | |
| AI | **Anthropic API** — see §5 | |

### Fonts

The prototype uses **Bodoni Moda** (display) + **Hanken Grotesk** (body), self-hosted via `next/font/local`. Keep them self-hosted — no CDN request, no layout shift.

---

## 2. Data model

```
celebrity        id, slug, name, category, bio, hero_image_id, is_published,
                 looks_count, items_count, brands_count, updated_at

look             id, celebrity_id, slug, date, location, occasion,
                 title, description, is_published

photo            id, look_id, storage_key, width, height, aspect,
                 credit, licence, source_agency, licence_expires_at   ← licensing is a first-class field
                 embedding vector(1024)                               ← pgvector, for dedupe

item             id, look_id, photo_id, category, position,
                 confidence ('confirmed'|'closest_match'|'get_the_look'|'open'),
                 evidence_note                                        ← why we believe it; shown to editors, not users
                 product_id, alternative_product_id

product          id, brand_id, name, description, price_cents, currency,
                 merchant, affiliate_url, image_url, sku,
                 in_stock, price_checked_at                           ← from the affiliate feed, refreshed nightly

brand            id, slug, name, description, affiliate_network, commission_rate

article          id, slug, title, standfirst, body, author,
                 celebrity_id?, brand_id?, published_at, seo_title, seo_description

outbound_click   id, item_id, product_id, session_id, created_at, referrer
```

**Notes for the implementer:**

- `confidence` is load-bearing. It is the honesty mechanism *and* what makes the AI pipeline viable — the model doesn't have to be right about everything, it has to know when it isn't sure. Surface it in the UI (filled dot / hollow dot in the prototype).
- `photo.licence` and `licence_expires_at` are not optional. You need to be able to answer "can we still show this image" as a query.
- `item.evidence_note` records *why* a call was made ("logo visible on temple", "hardware matches SS24 lookbook"). Editors need it; it's also the audit trail if a brand complains.
- `outbound_click` is your revenue proxy before affiliate network reporting catches up (networks report on 24–48h delay).

---

## 3. Build phases

### Phase 1 — Foundation (week 1–2)

- [ ] `create-next-app` — TypeScript, App Router, Tailwind
- [ ] Neon Postgres + Drizzle, schema from §2, first migration
- [ ] Payload CMS 3 mounted in the same app, Postgres adapter
- [ ] Cloudflare R2 bucket + upload pipeline (admin uploads → R2 → `next/image`)
- [ ] Self-host Bodoni Moda + Hanken Grotesk via `next/font/local`
- [ ] Port the design system from the prototype: tokens, type scale, light/dark, `.frame` aspect-ratio image wrappers
- [ ] Deploy to Vercel, wire the domain

### Phase 2 — Public site (week 2–4)

Port the three prototype pages to real routes. **Static-render everything; ISR on publish.**

- [ ] `/` — home: hero, latest looks, browse by celebrity, standards, journal preview
- [ ] `/celebrities` — index with category filter
- [ ] `/celebrities/[slug]` — the celebrity page: hero, meta strip, looks with shoppable item grids, standards, related
- [ ] `/celebrities/[slug]/[look]` — individual look permalink
- [ ] `/brands`, `/brands/[slug]`
- [ ] `/journal`, `/journal/[slug]` — articles
- [ ] `/go/[itemId]` — **outbound click handler**: log to `outbound_click`, then 302 to the affiliate URL. Never put the raw affiliate URL in the `href`.
- [ ] FTC disclosure component — top-of-page on any page with affiliate links, full text in footer
- [ ] SEO: per-page metadata, OG images, `sitemap.xml`, `robots.txt`, JSON-LD (`Person` for celebrities, `Product` + `Offer` for items, `Article` for journal)
- [ ] Accessibility pass: focus states, alt text on every image, keyboard nav, `prefers-reduced-motion`

### Phase 3 — Editorial workflow (week 4–5)

This is what the two non-developers use every day. Get it right or the site doesn't get updated.

- [ ] Payload collections for every model in §2
- [ ] **Look builder**: upload photo → draw boxes on garments → each box becomes an `item` → search products → attach → set confidence
- [ ] **Review queue**: items where AI confidence is below threshold, sorted by celebrity popularity. One-click confirm / correct / mark open.
- [ ] Publish/unpublish with ISR revalidation
- [ ] Licence expiry dashboard — photos approaching `licence_expires_at`

### Phase 4 — Affiliate integration (week 5–6)

Apply to networks **early** — approval takes 1–3 weeks and some require a live site with traffic.

- [ ] **Amazon Associates** + Product Advertising API (needs 3 qualifying sales in 180 days to stay active — plan for it)
- [ ] **Impact**, **CJ Affiliate**, **Rakuten Advertising**, **ShareASale** — where the fashion brands actually are
- [ ] **Sovrn Commerce** or **Skimlinks** as the catch-all for merchants you're not directly approved with
- [ ] **LTK** if you can get creator access — strongest for fashion specifically
- [ ] Nightly job: refresh price, stock status, and image from each merchant feed. Mark out-of-stock items rather than deleting them.
- [ ] Auto-substitute: when an item goes out of stock, surface the `alternative_product_id`

### Phase 5 — AI pipeline (week 6–10)

See §5. Build it *after* the manual workflow works — the pipeline's job is to pre-fill the review queue, not replace it.

### Phase 6 — Growth features (post-launch)

- [ ] "Get the look for less" — auto-assembled budget alternative per look
- [ ] Price-drop alerts (email capture — this is the highest-value list you'll build)
- [ ] `/under-100` — price-filtered browse
- [ ] Celebrity style-twin quiz (shareable, cheap traffic)
- [ ] Reader submissions for `open` items — free labour and community
- [ ] Brand pages as landing pages for brand-name search
- [ ] Weekly newsletter

---

## 4. Where product images come from

**Do not source product photography yourself.** Every affiliate network's product feed includes an image URL, price, and stock status. Pull from the feed, cache to R2, refresh nightly. This is how every affiliate site gets consistent white-background product shots — it's a plumbing problem, not a photography problem.

---

## 5. The AI identification pipeline

### Set expectations honestly

No single tool identifies a garment's exact brand and SKU from a photograph. Visual search is good at *"black leather bomber, here are 40 similar"* and bad at *"Saint Laurent SS24 Teddy, style 605875"*. Logos help; unbranded pieces don't.

**Realistic target: 60–75% auto-identified at high confidence, the rest human-resolved.** That is good enough, because the human step is fast when the AI has already narrowed it to five candidates. Design for the human-in-the-loop, not around it.

### Pipeline stages

Run as an Inngest workflow, one run per photo.

**1. Ingest** — new photo lands (agency feed, manual upload). Compute a perceptual hash and an embedding; store in `photo.embedding`. Skip near-duplicates via pgvector similarity.

**2. Garment detection** — Claude vision call. Return a structured list of garments with bounding boxes and attributes (category, colour, material, silhouette, visible hardware, any legible logo text).

- Model: **`claude-opus-5`** — high-resolution vision (2576px long edge, coordinates map 1:1 to pixels, no scale-factor maths), $5/$25 per MTok.
- Use **structured outputs** (`output_config.format` with a JSON schema) so you get parseable results, not prose.
- Give it **tools to crop and re-examine its own work** — on Opus 5 that is markedly more cost-effective than raising thinking effort.

**3. Candidate retrieval** — for each detected garment:
- Query your own `product` table by attributes + vector similarity (you accumulate a proprietary catalogue over time — this gets better every month and is a real moat)
- Reverse image search on the cropped garment (SerpApi's Google Lens endpoint is the practical option)
- Merchant feed search by attribute

**4. Adjudication** — Claude call with the crop, the candidate list, and any brand-catalogue context. Returns: chosen product, `confidence` enum, and an `evidence_note`.

- Model: **`claude-opus-5`**, structured output.
- **Prompt-cache the brand catalogue context** — it's stable across calls and cache reads cost ~0.1× (minimum cacheable prefix on Opus 5 is 512 tokens).
- Instruct it explicitly to return `open` rather than guess. This is the single most important prompt instruction in the system.

**5. Routing** — `confirmed` above threshold publishes automatically; everything else lands in the Phase-3 review queue.

**6. Copy drafting** — Claude drafts the look description and item names from the identified garments. **Human edits before publish, always.** Never auto-publish generated prose.

### Cost control

- Use **`claude-haiku-4-5`** ($1/$5) for cheap triage — "is there a person in this photo, are garments visible, is it worth running the expensive pass". Kills a large fraction of frames before they cost real money.
- Use the **Batch API** for backfilling the archive — 50% off, results within a few hours. There's no reason to pay realtime prices for a 2019 photo.
- Sweep the `effort` parameter (`low` → `xhigh`). On Opus 5, `low` and `medium` are unusually strong; don't default to `xhigh` reflexively.

### Automation beyond identification

- Scheduled ingestion from the licensed feed
- Nightly price/stock refresh
- Auto-flag: celebrity wearing a brand we have no affiliate relationship with → apply
- Trend detection: item appearing across multiple celebrities in a short window → write about it

---

## 6. Definition of done for launch

- [ ] 10 celebrities, 5+ looks each, every item either identified or honestly marked `open`
- [ ] 5 journal articles published
- [ ] Affiliate links live and click-through tested end to end
- [ ] FTC disclosure on every affiliate page
- [ ] Every image traceable to a licence
- [ ] Lighthouse: performance > 90, accessibility 100
- [ ] `sitemap.xml` submitted to Google Search Console
- [ ] Analytics tracking the page → item → outbound funnel

---

## 7. Reference

- **Design prototype (3 pages, working nav):** https://claude.ai/code/artifact/548a8dc9-daa7-434f-bd84-66a46efb4d4c
- **Competitors to study:** Who What Wear, Shoplook, InStyle, Byrdie, StyleCaster
- **Design references:** Aesop (shoppable navigation), Bottega Veneta (editorial hero), Anine Bing (storytelling + commerce)

## 8. Open decisions for the founders

1. Which photo agency, and at what budget? *(blocks launch)*
2. Which 10 celebrities open the archive? Pick a lane — going broad on day one is the most common way these sites die with no ranking power anywhere.
3. Newsletter from day one, or after traffic?
4. Do reader submissions get a public credit? (Cheap community lever, small moderation cost.)
