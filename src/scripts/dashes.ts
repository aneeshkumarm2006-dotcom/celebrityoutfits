import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Removes every em dash from reader-facing copy.
 *
 *   pnpm dashes          # report what would change
 *   pnpm dashes --write  # apply
 *
 * The database is the source of truth for site copy, not the seed scripts, so
 * this walks the stored documents, including Lexical rich text where the prose
 * sits several layers down inside `root.children[].children[].text`.
 *
 * Replacements are written out by hand rather than derived by rule. An em dash
 * does at least four different jobs in English and the right substitute depends
 * on which one it is doing:
 *
 *   parenthetical aside      "the usual fix — cropping it — reintroduces"  → brackets
 *   an independent clause    "not a new idea — it is the proportion"       → full stop
 *   a gloss or a list        "complex colours — olive, stone, brown"       → colon
 *   a trailing qualifier     "the corduroy — which is most of it"          → comma
 *
 * A blanket swap to a comma produces comma splices ("the strictest rules, here
 * is what they are"); a blanket swap to a hyphen keeps the dash-heavy cadence
 * that made the copy read as machine-written, which is the reason for removing
 * them in the first place. Neither is worth shipping across a hundred strings.
 *
 * Anything not covered here is reported as unhandled and left alone. Mangling
 * published prose silently is worse than missing one.
 */
const WRITE = process.argv.includes('--write')

/**
 * Alt text is uniformly "Name — A garment…", which reads better as plain prose
 * and makes better alt text besides. Uniform enough to be worth a rule.
 */
const CREDIT_PATTERN = /^(\p{Lu}[\p{L}.'’\- ]{1,38}) — A(n?) /u

/**
 * Everything else, keyed on the fragment around the dash. Literal string
 * matching, not regex, so nothing here can misfire on text it was not written
 * for. Longest first at apply time, so an entry can safely be a prefix of
 * another.
 */
const REPLACEMENTS: [string, string][] = [
  // Product names
  ['Canvas blazer — sand', 'Canvas blazer in sand'],
  ['The Cuadrada blazer — black', 'The Cuadrada blazer in black'],
  ['La Veste Cabri blazer — navy', 'La Veste Cabri blazer in navy'],
  ['Ghost Rider red denim jacket — recreation', 'Ghost Rider red denim jacket (recreation)'],
  ['Marvel SDCC red trucker — recreation', 'Marvel SDCC red trucker (recreation)'],
  ['Red denim trucker — Comic-Con recreation', 'Red denim trucker (Comic-Con recreation)'],
  ['Vintage trucker jacket, red — 1980s', 'Vintage 1980s trucker jacket in red'],
  ['Resale — eBay, Grailed, Poshmark', 'Resale: eBay, Grailed, Poshmark'],

  // Credits and captions
  ['Press image — rights holder', 'Press image, rights holder'],
  ['Italian mill and tailor — the cloth', 'Italian mill and tailor, the cloth'],

  // Paired dashes: a genuine parenthetical, so brackets
  [
    'A blended middle — smart-casual, in the worst sense — is where',
    'A blended middle (smart-casual, in the worst sense) is where',
  ],
  [
    'since the early eighties — the wide-shouldered period, the minimal period, the deliberately ugly period — without',
    'since the early eighties (the wide-shouldered period, the minimal period, the deliberately ugly period) without',
  ],
  [
    'the small hedges — the cardigan over the dress, the neutral shoe — that most outfits',
    'the small hedges (the cardigan over the dress, the neutral shoe) that most outfits',
  ],
  [
    'and details — the corduroy collar among them — that the rest',
    'and details (the corduroy collar among them) that the rest',
  ],
  [
    'different temperatures — the suit deep and slightly brown, the shirt bright and clean — so they read',
    'different temperatures (the suit deep and slightly brown, the shirt bright and clean), so they read',
  ],
  [
    'Referencing it accurately — the right shoulder, the right hem, the right shoe — is the entire',
    'Referencing it accurately (the right shoulder, the right hem, the right shoe) is the entire',
  ],
  [
    'decision underneath — a defined waist, an exaggerated shoulder, a cape — and everything else',
    'decision underneath (a defined waist, an exaggerated shoulder, a cape), and everything else',
  ],
  [
    'the usual fix — cropping the jacket — reintroduces',
    'the usual fix (cropping the jacket) reintroduces',
  ],
  [
    'in front of it — tinted glasses, a scarf, a brooch, a watch too large for the occasion — so the eye',
    'in front of it (tinted glasses, a scarf, a brooch, a watch too large for the occasion) so the eye',
  ],
  [
    'showing construction — seams, boning, the actual engineering of a garment — that opaque cloth',
    'showing construction (seams, boning, the actual engineering of a garment) that opaque cloth',
  ],
  [
    'Timid colour — a bright accessory against neutrals — reads as a hedge',
    'Timid colour (a bright accessory against neutrals) reads as a hedge',
  ],

  // An independent clause follows, so a full stop
  [
    'at a press panel — no contrast anywhere',
    'at a press panel. No contrast anywhere',
  ],
  ['is not the black — it is what', 'is not the black: it is what'],
  ['should be judged as one — but if what you actually want', 'should be judged as one. But if what you actually want'],
  ['for over a decade — the whole Project Hail Mary run', 'for over a decade. The whole Project Hail Mary run'],
  ['read as a position — the consistency is what', 'read as a position. The consistency is what'],
  ['the suit dates — but also that nothing', 'the suit dates, but also that nothing'],
  ['the strictest rules — here is what they are', 'the strictest rules. Here is what they are'],
  [
    'with contemporary tailoring — you cannot wear the trousers',
    'with contemporary tailoring. You cannot wear the trousers',
  ],
  ['is not a new idea — it is the proportion', 'is not a new idea. It is the proportion'],
  ['camel corduroy — and that detail is', 'camel corduroy, and that detail is'],
  ['straight off the rack — tailoring is the cheapest', 'straight off the rack. Tailoring is the cheapest'],
  ['one alarming neon green — no crimson', 'one alarming neon green. No crimson'],
  ['press tour, relabelled — one is a dark brown', 'press tour, relabelled. One is a dark brown'],
  [
    'requires sacrificing precision — it relocates the precision',
    'requires sacrificing precision. It relocates the precision',
  ],
  ['not the opposite of the fun — it is what pays for it', 'not the opposite of the fun. It is what pays for it'],
  [
    'no visible fastening — the front simply wraps',
    'no visible fastening. The front simply wraps',
  ],
  [
    'is the resale market — search the brand',
    'is the resale market. Search the brand',
  ],
  ['It is indigo, not red — but the cut', 'It is indigo, not red, but the cut'],
  ['it will frustrate you — it optimises for', 'it will frustrate you. It optimises for'],
  [
    'that fit badly are not quiet — a poorly fitting plain navy suit',
    'that fit badly are not quiet. A poorly fitting plain navy suit',
  ],
  [
    'resolves it — the line runs continuously',
    'resolves it: the line runs continuously',
  ],

  // A gloss or a list follows, so a colon
  ['and a patterned tie — three colours doing the work', 'and a patterned tie: three colours doing the work'],
  [
    'photographically more distinctive — a silhouette the eye',
    'photographically more distinctive: a silhouette the eye',
  ],
  ['err shorter — a clean hem photographs', 'err shorter: a clean hem photographs'],
  ['accessory, hair — pick one to be the story', 'accessory, hair: pick one to be the story'],
  [
    'defined waists — garments that impose a shape',
    'defined waists: garments that impose a shape',
  ],
  ['make it read young — shorter jacket', 'make it read young: shorter jacket'],
  ['There is almost always one — a piece added', 'There is almost always one: a piece added'],
  ['the work being promoted — a silhouette that echoes', 'the work being promoted: a silhouette that echoes'],
  ['refuses to compete — white, navy, black', 'refuses to compete: white, navy, black'],
  ['Project Hail Mary panel — the Andy Weir adaptation', 'Project Hail Mary panel: the Andy Weir adaptation'],
  ['rather than structural — a knit instead of a shirt', 'rather than structural: a knit instead of a shirt'],
  [
    'The correction is structural — defined waists, clean shoulders',
    'The correction is structural: defined waists, clean shoulders',
  ],
  ['for a single project — full colour, full theatre', 'for a single project: full colour, full theatre'],
  ['still tailoring — cut properly, fitted properly', 'still tailoring: cut properly, fitted properly'],
  ['gets safer over time — early experimentation', 'gets safer over time: early experimentation'],
  ['than an evening out — sculptural, occasionally', 'than an evening out: sculptural, occasionally'],
  ['depends on access — to houses, to archives', 'depends on access: to houses, to archives'],
  ['slightly complex colours — olive, stone', 'slightly complex colours: olive, stone'],
  ['Blue carpet rather than red — the film', 'Blue carpet rather than red: the film'],
  ['On the unstructured jacket — what it does', 'On the unstructured jacket: what it does'],

  // A trailing qualifier, so a comma
  ['and placket — the only detail', 'and placket, the only detail'],
  ['no visible fastening — just an asymmetric curve', 'no visible fastening, just an asymmetric curve'],
  ['room through the thigh — a slim leg under a broad top half', 'room through the thigh, since a slim leg under a broad top half'],
  ['get out of the way — and when that is', 'get out of the way, and when that is'],
  ['looks like nothing at all — in the good sense', 'looks like nothing at all, in the good sense'],
  ['rather than performance — and why it is harder', 'rather than performance, and why it is harder'],
  ['the cut and the corduroy — which is most of what', 'the cut and the corduroy, which is most of what'],
  ['who is in them — which is true of everything', 'who is in them, which is true of everything'],
  ['somewhere between the two — which is exactly the gap', 'somewhere between the two, which is exactly the gap'],
  ['camel corduroy — the detail that identifies', 'camel corduroy, the detail that identifies'],
  ['tends to arrive later — which is why the best', 'tends to arrive later, which is why the best'],
  ['wardrobe strategy — and on the value of detonating', 'wardrobe strategy, and on the value of detonating'],
  [
    'built off the Le Palmier collection — reported, not read off a label, so it stays',
    'built off the Le Palmier collection, though that is reported rather than read off a label, so it stays',
  ],

  // Celebrity bios: a label followed by its gloss, so a colon
  [
    'used without hedging — the most consistently maximalist dresser',
    'used without hedging: the most consistently maximalist dresser',
  ],
  ['in equal measure — the rare A-lister who dresses', 'in equal measure: the rare A-lister who dresses'],
  ['on a modern carpet — sculptural, editorial', 'on a modern carpet: sculptural, editorial'],
  ['than most of his generation — jackets buttoned', 'than most of his generation: jackets buttoned'],
  [
    'with unusual discipline — then occasionally detonated',
    'with unusual discipline, then occasionally detonated',
  ],
  ['revived without irony — high-rise trousers', 'revived without irony: high-rise trousers'],
  ['on any red carpet — outfits chosen to argue', 'on any red carpet: outfits chosen to argue'],
  [
    'the same disciplined uniform — dark tailoring worn open',
    'the same disciplined uniform: dark tailoring worn open',
  ],

  // Homepage
  [
    'We track what celebrities actually wear — on the carpet, at press calls, in transit — then identify each garment',
    'We track what celebrities actually wear on the carpet, at press calls and in transit, then identify each garment',
  ],

  // Present only in the seed scripts, not currently in the database, but they
  // would be written back the next time anyone runs a seed.
  ['No tie — there has not been one in years.', 'No tie. There has not been one in years.'],
  ['runs on novelty — a new designer every red carpet', 'runs on novelty: a new designer every red carpet'],
  [
    'It is not a fashion sunglass — it is a piece of military optical equipment',
    'It is not a fashion sunglass. It is a piece of military optical equipment',
  ],
  [
    'by cut, colour, hardware and fabric — and say so plainly',
    'by cut, colour, hardware and fabric, and say so plainly',
  ],
]

/** Longest first, so a shorter entry can never pre-empt a longer one. */
const ORDERED = [...REPLACEMENTS].sort((a, b) => b[0].length - a[0].length)

const unhandled: string[] = []

export const stripDashes = (value: string): string => {
  if (!value.includes('—')) return value

  let out = value.replace(CREDIT_PATTERN, (_m, name: string, n: string) => `${name} in a${n} `)

  for (const [from, to] of ORDERED) {
    if (out.includes(from)) out = out.split(from).join(to)
    if (!out.includes('—')) break
  }

  if (out.includes('—')) unhandled.push(out)
  return out
}

/**
 * Fields are discovered rather than listed.
 *
 * A hand-written field map is only as good as the guess behind it: the first
 * version of this script named `homepage.introText` and `celebrities.bio`,
 * neither of which exists, so nine pages kept their dashes and the script still
 * reported success. Walking every string in the document cannot miss a field,
 * including ones nested inside arrays, blocks and rich text.
 *
 * Non-prose strings (slugs, URLs, filenames) are reached too, but an em dash
 * never appears in one, so the `includes` gate keeps them untouched.
 */
const SKIP_KEYS = new Set(['id', 'createdAt', 'updatedAt', '_status'])

const walkStrings = (node: unknown, onChange: () => void): void => {
  if (Array.isArray(node)) {
    for (const child of node) walkStrings(child, onChange)
    return
  }
  if (!node || typeof node !== 'object') return

  const record = node as Record<string, unknown>
  for (const [key, value] of Object.entries(record)) {
    if (SKIP_KEYS.has(key)) continue
    if (typeof value === 'string') {
      if (!value.includes('—')) continue
      const next = stripDashes(value)
      if (next !== value) {
        record[key] = next
        onChange()
      }
    } else if (value && typeof value === 'object') {
      walkStrings(value, onChange)
    }
  }
}

const run = async () => {
  const payload = await getPayload({ config })
  let changed = 0

  // Every collection and global the config declares, so a new one added later
  // is covered without anyone remembering to update this script.
  const collections = Object.keys(payload.collections)
  const globals = payload.config.globals.map((global) => global.slug)

  for (const collection of collections) {
    let docs: unknown[]
    try {
      const result = await payload.find({
        collection: collection as never,
        limit: 1000,
        depth: 0,
        draft: true,
        overrideAccess: true,
      })
      docs = result.docs
    } catch {
      continue
    }

    for (const doc of docs) {
      const record = doc as Record<string, unknown>
      const serialised = JSON.stringify(record)
      if (!serialised.includes('—')) continue

      const copy = JSON.parse(serialised) as Record<string, unknown>
      let touched = false
      walkStrings(copy, () => {
        touched = true
      })
      if (!touched) continue

      // Only the fields that actually moved, so an unrelated validation rule on
      // some untouched field cannot reject the write.
      const update: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(copy)) {
        if (SKIP_KEYS.has(key)) continue
        if (JSON.stringify(value) !== JSON.stringify(record[key])) update[key] = value
      }
      if (Object.keys(update).length === 0) continue

      console.log(`  ${collection} #${record.id}: ${Object.keys(update).join(', ')}`)
      changed += 1
      if (WRITE) {
        await payload.update({
          collection: collection as never,
          id: record.id as number,
          data: update as never,
          overrideAccess: true,
        })
      }
    }
  }

  for (const slug of globals) {
    let doc: Record<string, unknown>
    try {
      doc = (await payload.findGlobal({ slug: slug as never, depth: 0 })) as Record<string, unknown>
    } catch {
      continue
    }

    const serialised = JSON.stringify(doc)
    if (!serialised.includes('—')) continue

    const copy = JSON.parse(serialised) as Record<string, unknown>
    let touched = false
    walkStrings(copy, () => {
      touched = true
    })
    if (!touched) continue

    const update: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(copy)) {
      if (SKIP_KEYS.has(key)) continue
      if (JSON.stringify(value) !== JSON.stringify(doc[key])) update[key] = value
    }
    if (Object.keys(update).length === 0) continue

    console.log(`  ${slug}: ${Object.keys(update).join(', ')}`)
    changed += 1
    if (WRITE) await payload.updateGlobal({ slug: slug as never, data: update as never })
  }

  if (unhandled.length) {
    console.log(`\n!! ${unhandled.length} string(s) still contain an em dash and were left alone:`)
    for (const line of [...new Set(unhandled)]) console.log(`   ${line}`)
  }

  console.log(
    `\n${changed} document(s) rewritten.${WRITE ? '' : ' Dry run. Pass --write to apply.'}`,
  )
  process.exit(unhandled.length ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
