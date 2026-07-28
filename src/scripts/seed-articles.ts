import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Article } from '@/payload-types'

/**
 * Seeds the opening journal.
 *
 * These are style-analysis pieces: editorial opinion about broad, observable
 * patterns. They deliberately name no brand a given person "wears" and cite no
 * specific event outfit, because that would be inventing facts about real
 * people. Swap in researched detail as you log actual looks.
 */

// ── Lexical helpers ────────────────────────────────────────────────────────
type LexicalNode = { [key: string]: unknown; type?: string; version?: number }

const text = (value: string, format = 0) => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const block = (children: LexicalNode[], type = 'paragraph', tag?: string) => ({
  type,
  ...(tag ? { tag } : {}),
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  children,
})

const p = (value: string) => block([text(value)])
const h2 = (value: string) => block([text(value)], 'heading', 'h2')
const quote = (value: string) => ({
  type: 'block',
  format: '',
  version: 2,
  fields: { blockType: 'pullQuote', blockName: '', quote: value, attribution: '' },
})

/**
 * We construct the serialized Lexical shape by hand here rather than running
 * the editor, so assert it once against the generated type instead of
 * chasing each literal union field individually.
 */
const doc = (children: LexicalNode[]): Article['body'] =>
  ({
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  }) as unknown as Article['body']

// ── Articles ───────────────────────────────────────────────────────────────
type Draft = {
  title: string
  template: 'how-to' | 'listicle' | 'comparison' | 'review' | 'news' | 'generic'
  excerpt: string
  celebrity?: string
  featured?: boolean
  keywords?: { keyword: string; url: string; rel?: 'auto' }[]
  body: LexicalNode[]
}

const drafts: Draft[] = [
  {
    title: 'Method dressing, and why it actually works',
    template: 'generic',
    celebrity: 'zendaya',
    featured: true,
    excerpt:
      'Dressing to argue with the film you are promoting is not a gimmick — it is the most reliable way to make a red-carpet look mean something. A note on why the approach travels.',
    keywords: [{ keyword: 'style archive', url: '/celebrities/zendaya', rel: 'auto' }],
    body: [
      p(
        'Most red-carpet dressing is decorative. A gown is chosen because it flatters, photographs cleanly and offends nobody, and the result is a picture that could have been taken at any event in any year. It is competent and it is forgettable.',
      ),
      p(
        'Method dressing does something else. It treats the outfit as commentary on the work being promoted — a silhouette that echoes the film, a colour pulled from its palette, a reference only people who have seen it will catch. The look stops being decoration and starts being an argument.',
      ),
      h2('Why it survives the news cycle'),
      p(
        'An outfit that means something gets written about, and an outfit that gets written about outlives the evening. That is the whole mechanic. The dress is not competing with every other dress on the carpet; it is competing with nothing, because nobody else is making that particular point.',
      ),
      quote(
        'A look that argues with the film survives the news cycle. A look that merely flatters does not.',
      ),
      p(
        'The risk is obvious. Push the reference too hard and it reads as costume; the line between commentary and fancy dress is thinner than it looks, and the people who cross it rarely notice at the time.',
      ),
      h2('What is worth copying'),
      p(
        'You do not need a film to promote. The transferable idea is narrower and more useful: decide what a look is meant to say before choosing anything, and let that decision settle the questions that follow. Most wardrobes fail because they never make the first decision at all — every piece is chosen on its own terms, and the result has no argument to make.',
      ),
    ],
  },
  {
    title: 'The case for a suit that actually fits',
    template: 'how-to',
    celebrity: 'tom-holland',
    excerpt:
      'A close-cut suit is the hardest thing in menswear to get right and the easiest to get slightly wrong. Five checks that separate a suit that fits from a suit that is merely tight.',
    keywords: [{ keyword: 'style archive', url: '/celebrities/tom-holland', rel: 'auto' }],
    body: [
      p(
        'The current generation of leading men has settled on a close, short, high-buttoning suit. Worn well it looks modern and deliberate. Worn badly it looks borrowed, and the difference comes down to about five measurements.',
      ),
      h2('The shoulder decides everything'),
      p(
        'A jacket shoulder cannot be meaningfully altered, which makes it the only measurement you must get right off the rack. The seam should sit where your shoulder actually ends. Past it and the jacket looks handed down; short of it and the sleeve pulls every time you move.',
      ),
      h2('Sleeve length is a quarter-inch argument'),
      p(
        'Roughly a centimetre of shirt cuff should show. Less and the jacket looks too big; more and it looks like you are wearing someone else. This is the cheapest alteration available and the one most often skipped.',
      ),
      h2('Trousers break once, or not at all'),
      p(
        'A single soft break at the shoe, or none. Anything more reads as fabric you did not ask for. If you are unsure, err shorter — a clean hem photographs better than a pooled one.',
      ),
      h2('Buttoning point sets the proportion'),
      p(
        'A higher button shortens the leg line; a lower one lengthens it. Neither is correct in the abstract, which is exactly why it is worth trying both before deciding what suits you.',
      ),
      quote('A suit that fits is not a suit that is tight. Those are different problems.',),
      h2('What it costs'),
      p(
        'Less than people assume. A mid-price suit that has been properly altered will consistently outperform an expensive one straight off the rack — tailoring is the cheapest quality upgrade available in menswear, and almost nobody bothers.',
      ),
    ],
  },
  {
    title: 'Two approaches to the same navy suit',
    template: 'comparison',
    excerpt:
      'Put a conservative dresser and a physically imposing one in the same navy two-piece and you get two entirely different garments. A study in how proportion changes meaning.',
    keywords: [
      { keyword: 'Chris Evans', url: '/celebrities/chris-evans', rel: 'auto' },
      { keyword: 'Chris Hemsworth', url: '/celebrities/chris-hemsworth', rel: 'auto' },
    ],
    body: [
      p(
        'Navy suiting is the most common thing on any red carpet and the least discussed, which is a shame, because the same cloth in the same colour behaves completely differently depending on who is inside it.',
      ),
      h2('The conservative reading'),
      p(
        'Chris Evans dresses like someone who decided what worked a decade ago and saw no reason to revisit it. Clean lapel, quiet tie, no surprises. The effect is that nothing about the suit dates — but also that nothing about it is memorable on its own.',
      ),
      h2('The built reading'),
      p(
        'Chris Hemsworth wears the same category of garment as a frame for physical scale rather than a disguise for it. The shoulder is worked with rather than against, and the proportions run larger throughout so the jacket does not read as strained.',
      ),
      quote('The suit is not the variable. The proportions are.'),
      h2('Which is right'),
      p(
        'Neither, and that is the point. A navy suit is a neutral container; what makes it work is whether the proportions match the person, not whether the cloth is expensive. Copying a look off someone built differently to you is the most common and least examined mistake in menswear.',
      ),
      p(
        'The useful exercise is not choosing between these two approaches. It is working out which one your own proportions are asking for, and then being disciplined about it.',
      ),
    ],
  },
  {
    title: 'The discipline of a narrow palette',
    template: 'generic',
    celebrity: 'ryan-gosling',
    excerpt:
      'Wearing five colours well beats wearing twenty badly. On restriction as a wardrobe strategy, and why the people who look most consistent own the least.',
    keywords: [{ keyword: 'style archive', url: '/celebrities/ryan-gosling', rel: 'auto' }],
    body: [
      p(
        'There is a particular kind of dresser who appears to own about nine garments and never looks wrong. It is not accidental, and it is not minimalism for its own sake. It is a palette decision, made once and then held.',
      ),
      h2('Why restriction works'),
      p(
        'A narrow palette means everything you own goes with everything else you own. The decision cost of getting dressed collapses, and the failure rate goes with it — you cannot make a colour mistake if the wardrobe contains no colours that fight.',
      ),
      p(
        'It also compounds. Buy within a fixed palette for two years and you end up with a wardrobe where any two pieces work; buy on impulse for two years and you end up with a wardrobe of individually good garments that refuse to combine.',
      ),
      quote('You cannot make a colour mistake in a wardrobe that contains no colours that fight.'),
      h2('The cost'),
      p(
        'Restriction is genuinely boring in the shop and genuinely liberating on the day. If you enjoy clothes as a hobby, this approach will frustrate you — it is optimised for looking consistent rather than for the pleasure of variety, and those are different goals.',
      ),
      h2('How to start'),
      p(
        'Pick two neutrals and one accent. Everything bought for the next year has to be one of those three, or it does not come home. It is a crude rule and it works better than any amount of taste.',
      ),
    ],
  },
  {
    title: 'Five things that make red-carpet tailoring work',
    template: 'listicle',
    excerpt:
      'Across hundreds of looks the same handful of decisions separate tailoring that photographs well from tailoring that merely fits. None of them are about money.',
    body: [
      p(
        'Red-carpet tailoring is shot under hard light from below by a hundred people at once. That is an unusually punishing set of conditions, and it rewards a specific set of choices.',
      ),
      h2('1. Cloth with weight'),
      p(
        'Light cloth collapses under flash. Weight holds a line, and a held line is most of what reads as expensive in a photograph.',
      ),
      h2('2. A shoulder that matches the wearer'),
      p(
        'The most common failure is a shoulder built for a different body. It cannot be fixed afterwards and it is visible in every frame.',
      ),
      h2('3. One decision, not five'),
      p(
        'Colour, texture, silhouette, accessory, hair — pick one to be the story. Looks that try to do several things at once photograph as noise.',
      ),
      h2('4. Shoes that finish the line'),
      p(
        'The bottom of the frame is in shot far more often than people plan for. A clean, low-profile shoe extends the leg; a bulky one truncates it.',
      ),
      h2('5. Something that is not perfect'),
      p(
        'An open collar, an unbuttoned jacket, a slightly relaxed hand. Total polish reads as costume; one deliberate concession reads as a person.',
      ),
      quote('Total polish reads as costume. One deliberate concession reads as a person.'),
      p(
        'None of these are expensive. Four of the five are free, and the fifth is a tailoring bill measured in tens rather than hundreds.',
      ),
    ],
  },
]

const run = async () => {
  const payload = await getPayload({ config })
  let created = 0
  let updated = 0

  for (const draft of drafts) {
    const slug = slugify(draft.title)

    // Postgres IDs are numeric; the relationship field is typed accordingly.
    let celebrityId: number | undefined
    if (draft.celebrity) {
      const { docs } = await payload.find({
        collection: 'celebrities',
        limit: 1,
        where: { slug: { equals: draft.celebrity } },
        draft: true,
      })
      celebrityId = docs[0]?.id as number | undefined
    }

    const data = {
      title: draft.title,
      slug,
      template: draft.template,
      excerpt: draft.excerpt,
      author: 'The Celebrity Outfits desk',
      publishedAt: new Date().toISOString(),
      featured: draft.featured ?? false,
      ...(celebrityId ? { relatedCelebrity: celebrityId } : {}),
      keywords: draft.keywords ?? [],
      body: doc(draft.body),
      _status: 'published' as const,
    }

    const { docs: existing } = await payload.find({
      collection: 'articles',
      limit: 1,
      where: { slug: { equals: slug } },
      draft: true,
    })

    if (existing[0]) {
      await payload.update({ collection: 'articles', id: existing[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'articles', data })
      created++
    }
    console.log(`  ${existing[0] ? 'updated' : 'created'}  ${draft.title}`)
  }

  payload.logger.info(`Journal seeded — ${created} created, ${updated} updated.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
