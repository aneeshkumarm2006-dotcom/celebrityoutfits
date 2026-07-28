# CELEBRITY OUTFITS — Locked Build Spec

Execution detail. Strategy, market and constraints live in [TODO.md](TODO.md).

---

## 1. Locked decisions

| | Decision |
|---|---|
| Framework | Next.js 15+, App Router, TypeScript, Tailwind |
| Admin | **Payload CMS 3**, mounted in the same app at `/admin` |
| Database | Supabase Postgres (Pro) — `@payloadcms/db-postgres` |
| Storage | Vercel Blob — `@payloadcms/storage-vercel-blob` |
| Hosting | Vercel Pro |
| Rich text | Lexical — `@payloadcms/richtext-lexical` |
| SEO | `@payloadcms/plugin-seo` + custom check panel |
| Redirects | `@payloadcms/plugin-redirects` |
| Jobs | Inngest (Phase 5+, not needed at launch) |
| Access | **One admin account.** No roles, no per-user audit trail. |
| Journal route | `/journal` |
| Publishing | **Instant** — Payload `afterChange` hook → `revalidatePath`. No redeploy. |

**Payload owns the database schema.** Do not add a second ORM against the same tables. Query from Server Components with the Local API (`payload.find(...)`) — no HTTP round trip, fully typed.

---

## 2. Data model

### Collections

**`users`** — single admin. Payload's built-in auth.

**`media`** — every image. Licensing is enforced here, not assumed.
```
alt*              text          (required — accessibility + SEO)
credit*           text          (required — photographer / agency)
licence*          select        (required: agency | instagram-embed | cc | own | promotional)
sourceAgency      text
licenceExpiresAt  date          (surfaced on the admin dashboard as it approaches)
caption           text
```
Auto-generated sizes: `og` 1200×630, `wide` 2:1, `landscape` 4:3, `portrait` 3:4, `square` 1:1, `thumb`.

**`celebrities`**
```
name*, slug*, category (film|music|sport|creator), standfirst, bio (rich text),
heroImage → media, portraitImage → media,
featured (bool), rank (number),          ← manual ordering
seo (plugin group), _status (draft/published)
```
Counts (`looks`, `items`, `brands`) are computed at query time, not stored.

**`looks`** — one outfit, one page, its own SEO.
```
celebrity* → celebrities
title*, slug*, date*, location, occasion
description (rich text)
photos → media (array)
featured (bool), rank (number)           ← pin to top of the celebrity page
seo (plugin group), _status
```

**`items`** — one garment. Its own collection so the review queue can query across all looks.
```
look* → looks
category* (outerwear|knitwear|shirting|denim|footwear|eyewear|watch|bag|other)
confidence* (confirmed | closest_match | get_the_look | open)
evidenceNote (text — why we made this call; admin-only, never shown publicly)
product → products
alternativeProduct → products          ← the "get the look for less" pick
position (number)
```

**`products`** — mostly written by the affiliate feed importer, editable by hand.
```
brand → brands, name*, description, priceCents, currency,
merchant, affiliateUrl*, image → media, imageUrl (feed fallback),
sku, inStock (bool), priceCheckedAt (date)
```

**`brands`**
```
name*, slug*, description (rich text), logo → media,
affiliateNetwork, commissionRate, seo, _status
```

**`articles`** — the journal.
```
title*, slug*, template* (see §4)
heroImage → media
excerpt*            ← doubles as the default meta description
body                ← Lexical, with the blocks in §5
keywords            ← array, see §6
relatedCelebrity → celebrities
relatedBrand     → brands
author (text), publishedAt, featured (bool), rank (number)
views (number, read-only in admin)
seo (plugin group), _status
```

**`redirects`** — via plugin. Needed the first time a slug changes.

**`outboundClicks`** — append-only. `item`, `product`, `sessionId`, `referrer`, `createdAt`.

### Globals

- **`siteSettings`** — site name, logo, default OG image, canonical domain, affiliate disclosure text, non-affiliation text
- **`navigation`** — header links: label, href, order
- **`footer`** — column groups, links, legal text
- **`homepage`** — ordered blocks, each toggleable (§3)

---

## 3. Homepage — section blocks

Fixed block types, freely **reorderable** and **toggleable**. Not a free-form page builder.

| Block | Editable |
|---|---|
| `hero` | eyebrow, headline, body, CTA label + href, image |
| `latestLooks` | heading, "view all" link, count, manual override list |
| `celebrityGrid` | heading, count, manual override list |
| `standards` | heading + repeatable numbered items (the "How we identify an item" section) |
| `journalPreview` | heading, count, manual override list |
| `richText` | free content block for anything unplanned |

Every list block defaults to automatic (featured first, then newest) with an optional manual override.

---

## 4. Article templates

Selecting a template pre-fills the body with a heading skeleton and inline guidance. It does not lock anything down.

`how-to` · `listicle` · `comparison` · `review` · `news` · `generic`

Implemented as a custom Payload field component: a template picker that seeds the Lexical editor on first selection.

---

## 5. Lexical blocks (usable inside article body)

- **`shoppableProduct`** — product relation → renders the inline buy module from the prototype. **This is where article revenue comes from.**
- **`pullQuote`**
- **`imageBlock`** — media + caption + credit
- **`gallery`**
- **`embed`** — Instagram / YouTube / X, official embeds only
- **`callout`**

---

## 6. Keyword backlinks

Per-article array:
```
keyword*     text
url*         text
rel          select: auto (default) | dofollow | nofollow | sponsored
```

**Rendering rules** — applied server-side at render, never stored in the body:

1. Match is **case-insensitive** and **word-boundary aware**.
2. **First occurrence only.**
3. Only inside body text nodes. Never inside an existing anchor, a heading, a code block, or a block's own fields.
4. `rel: auto` resolves to:
   - link is on our own domain → `dofollow`, same tab
   - external → `rel="nofollow noopener"`, `target="_blank"`
5. Explicit `dofollow` / `nofollow` / `sponsored` always override, and always keep `noopener`.

**On the default:** external links default to `nofollow` deliberately. If an external link is paid or exchanged, a `dofollow` risks a manual action against *this* site — the one whose whole model is organic search. You can override per link whenever you want it; the default just stops it happening by accident.

---

## 7. SEO implementation

**Per document** (`plugin-seo`): meta title, meta description, OG image, canonical, `noindex` toggle — with live preview.

**Automatic:**
- `<title>`, meta description, canonical on every page
- Open Graph + Twitter card
- JSON-LD: `Person` (celebrity), `BlogPosting` (article), `Product` + `Offer` (item), `BreadcrumbList` (all)
- `sitemap.xml` generated from published content, regenerated on publish
- `robots.txt` — `Disallow: /admin`
- `/admin` returns `noindex, nofollow`

**SEO check panel** — custom Payload component on the article and look edit screens. Pass/warn only, no external API:
- meta title length (50–60)
- meta description length (150–160)
- word count (warn under 300)
- each keyword actually appears in the body
- internal vs external link counts
- images missing alt text
- hero image set

---

## 8. Public routes

```
/                                   home (from homepage global)
/celebrities                        index + category filter
/celebrities/[slug]                 celebrity page — looks, items, articles
/celebrities/[slug]/[lookSlug]      individual outfit — own SEO, own schema
/brands                             index
/brands/[slug]                      brand page
/journal                            article index, paginated
/journal/[slug]                     article
/go/[itemId]                        log click → 302 to affiliate URL
/api/views/[articleId]              client beacon, increments views
/sitemap.xml  /robots.txt
/admin                              Payload
```

**`/go/[itemId]` matters:** the raw affiliate URL never appears in an `href`. You get first-party click data and can swap merchants without touching content.

**View counting** runs as a client-side beacon to a route handler. Incrementing during render would break ISR caching.

---

## 9. Tickets

### Phase 1 — Foundation
1. `create-next-app` — TS, App Router, Tailwind
2. Supabase project, connection string, `.env.example`
3. Install Payload 3 + Postgres adapter + Lexical; mount `/admin`; first migration
4. Vercel Blob storage adapter on `media`
5. Self-host Bodoni Moda + Hanken Grotesk (`next/font/local`)
6. Port design tokens from the prototype — palette, type scale, light/dark, image frames
7. Deploy to Vercel, connect domain, seed the admin user

### Phase 2 — Content model
8. `media` with required alt/credit/licence + image sizes
9. `celebrities`, `looks`, `items`, `products`, `brands`
10. `articles` + Lexical blocks (§5)
11. Globals: siteSettings, navigation, footer, homepage
12. `plugin-seo` + `plugin-redirects`
13. `afterChange` hooks → `revalidatePath` (instant publish)

### Phase 3 — Admin UX
14. Template picker field component (§4)
15. Keyword manager field component (§6)
16. SEO check panel component (§7)
17. Look builder — upload, add items, attach products, set confidence
18. Custom dashboard — recent activity, licence expiry warnings, items needing review
19. Draft preview (view unpublished before publishing)

### Phase 4 — Public site
20. Design system components ported from the prototype
21. Home from the homepage global
22. Celebrities index + celebrity page
23. Individual look page
24. Journal index + article page, with keyword backlink renderer
25. Brands index + brand page
26. `/go/[itemId]` + `outboundClicks`
27. Disclosure component — top-of-page and footer
28. sitemap, robots, JSON-LD
29. Accessibility + Lighthouse pass

### Phase 5 — Affiliate

**Sequencing matters — do not apply early.** Most networks reject sites with no content or traffic, and a rejection means reapplying later from a worse position. Amazon is stricter: 3 qualifying sales within 180 days of signup or the account is closed.

- Now → create accounts, prepare details. Don't submit brand applications.
- After Phase 4 (site live, 10–15 pieces published) → Impact, CJ, Rakuten, ShareASale
- Only once real traffic exists → Amazon Associates
- Immediately on first approval → Sovrn Commerce or Skimlinks, so no link earns zero

30. Apply to networks per the sequencing above
31. Feed importer → `products`
32. Nightly price/stock refresh (Inngest)
33. Out-of-stock auto-substitution

### Phase 6 — AI pipeline
34. Per [TODO.md §5](TODO.md). Pre-fills the review queue; does not replace it.

---

## 10. Environment variables

```
DATABASE_URI=                 # Supabase Postgres connection string
PAYLOAD_SECRET=               # random 32+ chars
BLOB_READ_WRITE_TOKEN=        # Vercel Blob
NEXT_PUBLIC_SITE_URL=         # canonical domain, used for canonicals + schema
```

Every new variable goes into `.env.example` with a comment.
