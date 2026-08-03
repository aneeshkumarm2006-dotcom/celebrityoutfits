import { existsSync, readFileSync } from 'fs'
import { basename } from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

import { slugify } from '@/fields/slug'
import type { Article } from '@/payload-types'

/**
 * One journal piece per person on the roster, each with its own hero image.
 *
 *   pnpm seed:celebrity-articles
 *
 * These describe broad, observable patterns and are explicit about being
 * opinion. None of them claims a named person wore a named brand on a named
 * date — that is a factual assertion about a real individual, and we only make
 * those from a logged look with a photograph behind it. Rewrite freely as real
 * looks accumulate; the shape is what matters here.
 *
 * Idempotent: matches on slug, so re-running updates rather than duplicating.
 */

// ── Lexical helpers ────────────────────────────────────────────────────────
type LexicalNode = { [key: string]: unknown; type?: string; version?: number }

const text = (value: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const node = (children: LexicalNode[], type = 'paragraph', tag?: string) => ({
  type,
  ...(tag ? { tag } : {}),
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  children,
})

const p = (value: string) => node([text(value)])
const h2 = (value: string) => node([text(value)], 'heading', 'h2')
const quote = (value: string) => ({
  type: 'block',
  format: '',
  version: 2,
  fields: { blockType: 'pullQuote', blockName: '', quote: value, attribution: '' },
})

const doc = (children: LexicalNode[]): Article['body'] =>
  ({
    root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
  }) as unknown as Article['body']

// ── The pieces ─────────────────────────────────────────────────────────────
type Template = 'how-to' | 'listicle' | 'comparison' | 'review' | 'news' | 'generic'
type Piece = {
  celebrity: string
  title: string
  template: Template
  excerpt: string
  links?: string[] // slugs of brands or celebrities to link as keywords
  body: LexicalNode[]
}

const pieces: Piece[] = [
  {
    celebrity: 'tom-cruise',
    title: 'Tom Cruise has worn the same four things for forty years',
    template: 'generic',
    excerpt:
      'Dark tailoring worn open, a knit collar instead of a shirt, a steel sports watch, and no tie. It has not moved in four decades, and that is the whole trick.',
    links: ['rolex', 'omega'],
    body: [
      p(
        'There is a version of dressing well that consists of finding the answer once and then declining, politely and permanently, to revisit it. Tom Cruise has been running that experiment in public for forty years.',
      ),
      h2('The uniform, such as it is'),
      p(
        'Dark two-piece tailoring, cut close but never tight. The jacket stays open. Underneath, more often than not, a fine knit or a shirt worn without a tie. Footwear is plain and dark. A steel sports watch, worn on a bracelet rather than leather.',
      ),
      p(
        'None of those decisions is remarkable on its own. What is remarkable is that the combination has survived every shift in menswear since the early eighties (the wide-shouldered period, the minimal period, the deliberately ugly period) without acknowledging any of them.',
      ),
      quote('Consistency reads as confidence long before anyone works out why.'),
      h2('Why the open jacket matters'),
      p(
        'A buttoned jacket is formal and finished. An open one keeps a vertical line running the full height of the body while reading as relaxed. It is the single most transferable thing here, and it costs nothing: the same suit, worn open, is a different garment.',
      ),
      h2('The cost of never changing'),
      p(
        'Being unmoved by fashion means being occasionally out of step with it. There are photographs from every decade where the proportions are of their moment rather than above it, and the tailoring reads slightly of its year.',
      ),
      p(
        'That is the trade. A consistent wardrobe will never be the most interesting thing in the room, and it will also never be the thing anyone regrets. For most people that is the better deal, and almost nobody takes it.',
      ),
    ],
  },
  {
    celebrity: 'tom-holland',
    title: 'The press-tour suit, and what it is actually for',
    template: 'how-to',
    excerpt:
      'A close-cut, high-buttoning suit is the default uniform of the modern press tour. Worn well it looks deliberate; worn badly it looks borrowed. The difference is about five measurements.',
    links: ['zegna', 'tom-ford'],
    body: [
      p(
        'The press tour is a specific dressing problem: forty appearances, hundreds of photographs, hard light, and a requirement to look like the same person each time without looking like you own one suit.',
      ),
      h2('Close is not the same as tight'),
      p(
        'The current silhouette runs slim, short and high-buttoning. It works when the cloth still moves. It fails the moment the jacket pulls across the back or the button strains, and hard flash finds both instantly.',
      ),
      quote('Hard light is unforgiving of a jacket that is working too hard.'),
      h2('Shoulder first, everything else second'),
      p(
        'A shoulder cannot be altered afterwards, which makes it the one measurement that has to be right off the rack. The seam sits where the shoulder ends. Past it the jacket looks handed down; short of it the sleeve drags every time an arm moves.',
      ),
      h2('The young-tailoring problem'),
      p(
        'Cut a suit for someone in their twenties and there is a temptation to make it read young: shorter jacket, narrower lapel, higher trouser. Push any of those far enough and the suit stops being tailoring and starts being a costume of tailoring.',
      ),
      p(
        'The correction is boring and works: lengthen the jacket by a centimetre, widen the lapel slightly, and let the trouser break once. The look reads adult without reading old, which is the actual target.',
      ),
    ],
  },
  {
    celebrity: 'colman-domingo',
    title: 'Maximalism is a discipline, not an absence of one',
    template: 'generic',
    excerpt:
      'Colour, texture and volume worn without hedging. The loudest dresser on a carpet is usually the one following the strictest rules. Here is what they are.',
    links: ['valentino', 'versace'],
    body: [
      p(
        'The assumption about maximalist dressing is that it is what happens when nobody edits. The opposite is nearer the truth: a look with four strong ideas in it needs more discipline than one with none, because there is no neutral ground to fall back on.',
      ),
      h2('One structural idea, then decorate'),
      p(
        'The looks that work have a single silhouette decision underneath (a defined waist, an exaggerated shoulder, a cape), and everything else is applied to that frame. The ones that fail have two structural ideas fighting, and no amount of colour rescues them.',
      ),
      quote('Four strong ideas need more editing than none, not less.'),
      h2('Texture is the cheap version'),
      p(
        'Colour is the obvious lever and the riskiest. Texture does much of the same work quietly: a black outfit in three different surfaces reads as considered from across a room, and photographs far better than flat black, without asking anyone to be brave.',
      ),
      h2('Why it needs age'),
      p(
        'This register depends on the wearer looking like they are enjoying it rather than submitting to it. That confidence is hard to fake and tends to arrive later, which is why the best maximalist dressing is rarely done by the youngest people on the carpet.',
      ),
    ],
  },
  {
    celebrity: 'jenna-ortega',
    title: 'A dark palette, and the value of rationing red',
    template: 'generic',
    excerpt:
      'Holding one register long enough that a single departure becomes an event. On gothic dressing as a system rather than a mood.',
    links: ['dior', 'saint-laurent'],
    body: [
      p(
        'A consistently dark wardrobe is usually read as a mood. It is more useful to read it as a system, because the interesting part is not the black: it is what the black makes possible.',
      ),
      h2('The mechanics'),
      p(
        'Hold a near-monochrome palette across enough appearances and the baseline stops being noticed. A single saturated colour then lands with a force it could never have in a varied wardrobe, where it would be one bright thing among many.',
      ),
      quote('The black is not the statement. It is what makes one possible.'),
      h2('Sharp, not heavy'),
      p(
        'The failure mode of dark dressing is bulk: black absorbs detail, so a heavy silhouette in it reads as a mass rather than a shape. The correction is structural: defined waists, clean shoulders, and surfaces with enough sheen or texture to give the camera something to catch.',
      ),
      h2('What to take'),
      p(
        'Not the gothic register specifically. The transferable idea is rationing: pick the thing you want to be noticed for and then use it sparingly enough that it still is. Most wardrobes spend their whole budget of attention every day and wonder why nothing registers.',
      ),
    ],
  },
  {
    celebrity: 'zendaya',
    title: 'Method dressing is a discipline, not a gimmick',
    template: 'generic',
    excerpt:
      'Dressing to argue with the film you are promoting is the most reliable way to make a red-carpet look mean something. On why the approach travels, and where it fails.',
    links: ['valentino', 'loewe'],
    body: [
      p(
        'Most red-carpet dressing is decorative: a gown chosen because it flatters, photographs cleanly and offends nobody. The result is a picture that could have been taken at any event in any year.',
      ),
      h2('The alternative'),
      p(
        'Method dressing treats the outfit as commentary on the work being promoted: a silhouette that echoes the film, a colour pulled from its palette, a reference only people who have seen it will catch. The look stops being decoration and starts being an argument.',
      ),
      quote('A look that argues with the film survives the news cycle. A look that merely flatters does not.'),
      h2('Why it outlives the evening'),
      p(
        'An outfit that means something gets written about, and an outfit that gets written about outlives the night. The dress is no longer competing with every other dress on the carpet, because nobody else is making that particular point.',
      ),
      h2('Where it goes wrong'),
      p(
        'Push the reference too hard and it reads as fancy dress. The line between commentary and costume is thinner than it looks, and the people who cross it rarely notice at the time. The successful version is usually one degree more restrained than the idea in your head.',
      ),
      h2('The transferable part'),
      p(
        'You do not need a film to promote. The useful idea is narrower: decide what a look is meant to say before choosing anything, and let that decision settle the questions that follow. Most wardrobes fail because they never make the first decision at all.',
      ),
    ],
  },
  {
    celebrity: 'robert-downey-jr',
    title: 'Tailoring with something in the way',
    template: 'generic',
    excerpt:
      'Strong colour, heavy eyewear, and an accessory doing more work than the suit underneath. A study in deliberate friction, and why it needs a conservative base to work at all.',
    links: ['ray-ban', 'cartier'],
    body: [
      p(
        'There is a category of dresser who wears an entirely conventional suit and then puts something in front of it (tinted glasses, a scarf, a brooch, a watch too large for the occasion) so the eye never quite settles.',
      ),
      h2('The base has to be quiet'),
      p(
        'Friction only reads as friction against something regular. A conservative three-piece plus one loud decision is legible. Three loud decisions plus a loud suit is noise, and photographs as clutter.',
      ),
      quote('You get one argument per outfit. Spend it deliberately.'),
      h2('Eyewear as punctuation'),
      p(
        'Tinted lenses on a red carpet are a genuine risk: they remove the eyes from every photograph taken that evening. The compensation has to be that the frame itself is worth looking at, which is a high bar and frequently missed.',
      ),
      h2('Age and permission'),
      p(
        'This approach is easier later. A younger dresser doing the same thing tends to read as trying; the same outfit on someone with three decades of public record behind it reads as a person who has earned the right to be uninterested in your opinion.',
      ),
      p(
        'That is not a reason to avoid it. It is a reason to expect the same clothes to say different things depending on who is in them, which is true of everything on this site.',
      ),
    ],
  },
  {
    celebrity: 'chris-hemsworth',
    title: 'Dressing for a frame that is larger than the pattern',
    template: 'how-to',
    excerpt:
      'Most tailoring is drafted for a narrow range of proportions. What to change when the shoulders are wider and the waist is not, and why buying up a size fixes nothing.',
    links: ['zegna', 'loro-piana'],
    body: [
      p(
        'Off-the-rack tailoring assumes a relationship between chest, shoulder and waist. Sit outside that relationship in either direction and the garment fights you, and no amount of money spent on the suit fixes it.',
      ),
      h2('The size-up trap'),
      p(
        'The instinct when a jacket pulls across the back is to go up a size. That solves the tightness and introduces two new problems: the shoulder now overhangs, and the waist balloons. The jacket fits nowhere instead of one place.',
      ),
      quote('Buy for the shoulder. Everything below it is a tailoring bill, not a decision.'),
      h2('What actually helps'),
      p(
        'A slightly softer shoulder construction, so the seam sits rather than perches. A lower button stance, which lengthens the torso line. And a trouser cut with room through the thigh, since a slim leg under a broad top half exaggerates both.',
      ),
      h2('The off-duty half'),
      p(
        'The same person who needs careful tailoring often defaults to plain tees, shorts and a cap when not working. That is not laziness; it is the correct answer. Casual clothing is far more forgiving of scale than tailoring is, so the wardrobe splits cleanly into effortful and effortless with very little in between.',
      ),
    ],
  },
  {
    celebrity: 'chris-evans',
    title: 'The case for being the most boring dresser in the room',
    template: 'generic',
    excerpt:
      'Navy, grey, a knit, a boot. A wardrobe that has not dated in a decade because it never contained anything capable of dating.',
    links: ['common-projects', 'levis'],
    body: [
      p(
        'There is a way of dressing that generates no commentary whatsoever, and it is systematically underrated. Nothing about it is interesting. Nothing about it is ever wrong.',
      ),
      h2('What the wardrobe contains'),
      p(
        'Navy and grey tailoring. Mid-weight knitwear in the same two colours plus oatmeal. Dark denim. A leather boot and a plain sneaker. That is close to the whole inventory, and it recombines endlessly.',
      ),
      quote('Nothing here can date, because nothing here was ever current.'),
      h2('Why restriction compounds'),
      p(
        'A narrow palette means everything owned goes with everything else owned. Buy inside a fixed palette for two years and any two pieces work; buy on impulse for two years and you end up with individually good garments that refuse to combine.',
      ),
      h2('The honest cost'),
      p(
        'This is genuinely boring to shop for and genuinely freeing to wear. If clothes are a hobby, it will frustrate you. It optimises for looking consistent rather than for the pleasure of variety, and those are different goals that people routinely confuse.',
      ),
    ],
  },
  {
    celebrity: 'david-corenswet',
    title: 'Old-Hollywood proportion, revived without irony',
    template: 'generic',
    excerpt:
      'High-rise trousers, generous lapels, and a shoulder line most contemporaries avoid. Why the mid-century silhouette is returning, and what it demands in exchange.',
    links: ['giorgio-armani', 'brunello-cucinelli'],
    body: [
      p(
        'For twenty years menswear has been getting narrower and shorter. The counter-move now underway is not a new idea. It is the proportion that dominated from roughly 1935 to 1955, brought back at full size.',
      ),
      h2('Where the waist sits'),
      p(
        'The single defining change is the trouser rise. A higher waist shortens the torso and lengthens the leg, which is why mid-century photographs read as tall even when the subject was not. Drop the rise and the whole effect collapses.',
      ),
      quote('Move the waistband two inches and you have changed someone’s height on camera.'),
      h2('The lapel follows'),
      p(
        'A wider lapel needs a wider shoulder to sit on and a longer jacket to stay in proportion. This is why half-adopting the silhouette fails: a broad lapel on a short modern jacket reads as a mistake rather than a reference.',
      ),
      h2('What it asks of you'),
      p(
        'Commitment, essentially. The mid-century line does not blend with contemporary tailoring. You cannot wear the trousers with a modern jacket and expect either to work. It is an all-or-nothing wardrobe, which is why it stays rare.',
      ),
    ],
  },
  {
    celebrity: 'timothee-chalamet',
    title: 'When the red carpet is the point, not the obligation',
    template: 'generic',
    excerpt:
      'Harnesses, backless tailoring, colour worn head to toe. A generation treating the carpet as a venue for the work rather than an interruption of it.',
    links: ['loewe', 'saint-laurent'],
    body: [
      p(
        'For most of the last century the male red-carpet answer was a dinner suit, and the only question was how well it fitted. That consensus has broken, and the people breaking it are not treating it as a lapse.',
      ),
      h2('The shift'),
      p(
        'Backless tailoring, harnesses, sequins, single-colour looks head to toe. What these have in common is not shock value but intent: each is a decision that could not have been made accidentally.',
      ),
      quote('A dinner suit says you turned up. Anything else says you had an opinion about turning up.'),
      h2('Why it is not costume'),
      p(
        'The line holds as long as the garment is still tailoring: cut properly, fitted properly, in cloth that behaves. The failures in this mode are almost never too bold; they are badly made, and boldness makes bad making visible.',
      ),
      h2('The risk nobody mentions'),
      p(
        'This approach ages faster than a dinner suit. That is not an argument against it. It is an argument for understanding that some looks are meant to be of their moment, and pretending otherwise is how people end up with a wardrobe of hedged decisions.',
      ),
    ],
  },
  {
    celebrity: 'ryan-gosling',
    title: 'The discipline of a narrow palette',
    template: 'generic',
    excerpt:
      'Wearing five colours well beats wearing twenty badly. On restriction as a wardrobe strategy, and on the value of detonating it exactly once.',
    links: ['gucci', 'levis'],
    body: [
      p(
        'There is a particular kind of dresser who appears to own about nine garments and never looks wrong. It is not accidental and it is not minimalism for its own sake. It is a palette decision, made once and then held.',
      ),
      h2('Why restriction works'),
      p(
        'A narrow palette collapses the decision cost of getting dressed, and the failure rate goes with it. You cannot make a colour mistake in a wardrobe that contains no colours that fight.',
      ),
      quote('You cannot make a colour mistake in a wardrobe that contains no colours that fight.'),
      h2('And then the exception'),
      p(
        'The interesting move is what happens when someone who has held a narrow palette for years abandons it entirely for a single project: full colour, full theatre, no restraint. It lands precisely because the baseline was so controlled.',
      ),
      p(
        'That only works one way round. Restraint after excess is invisible; excess after restraint is an event. Which suggests the discipline is not the opposite of the fun. It is what pays for it.',
      ),
      h2('How to start'),
      p(
        'Two neutrals and one accent. Everything bought for the next year has to be one of those three or it does not come home. Crude, and it outperforms taste.',
      ),
    ],
  },
  {
    celebrity: 'margot-robbie',
    title: 'Archive dressing, done precisely',
    template: 'generic',
    excerpt:
      'Referencing a decade is easy. Referencing it accurately (the right shoulder, the right hem, the right shoe) is the entire difference between homage and fancy dress.',
    links: ['chanel', 'dior'],
    body: [
      p(
        'Every red carpet contains several looks gesturing vaguely at a past decade. Very few contain one that has got the decade right, and the gap between those two things is almost entirely in the details nobody photographs deliberately.',
      ),
      h2('Periods live in the shoulder and the hem'),
      p(
        'Silhouette dates a garment faster than pattern or colour. A fifties reference needs the waist and the hem length of the fifties; put a modern hem on it and it becomes a contemporary dress with a vintage print, which is a different and much weaker statement.',
      ),
      quote('A decade is a silhouette. Everything else is decoration on top of it.'),
      h2('The shoe betrays you'),
      p(
        'The most common failure in archive dressing is a contemporary shoe under a period dress. The toe shape and heel profile of any given decade are extremely specific, and the eye registers the mismatch without being able to name it.',
      ),
      h2('Why bother'),
      p(
        'Because precision is legible even to people who cannot identify what they are looking at. A look that is internally consistent reads as considered; one that is approximately right reads as a costume hire, regardless of what it cost.',
      ),
    ],
  },
  {
    celebrity: 'florence-pugh',
    title: 'Volume, sheerness, and refusing to be flattering',
    template: 'generic',
    excerpt:
      'Flattering is a low bar and a limiting one. On dressing for shape and argument rather than for the narrowest possible outline.',
    links: ['valentino', 'balenciaga'],
    body: [
      p(
        'Most red-carpet advice reduces to one instruction: look slimmer. It is an impoverished goal, it produces near-identical results, and a growing number of people are ignoring it entirely.',
      ),
      h2('What volume does'),
      p(
        'A garment with real volume creates its own shape rather than tracing the body underneath. That is architecturally more interesting and photographically more distinctive: a silhouette the eye has not seen forty times that evening.',
      ),
      quote('Flattering is the lowest thing an outfit can achieve. It is also the easiest.'),
      h2('Sheerness as a decision'),
      p(
        'Transparent fabric is read as provocation, which undersells it. Structurally it is a way of showing construction (seams, boning, the actual engineering of a garment) that opaque cloth conceals. The provocation is a side effect of the honesty.',
      ),
      h2('The cost of the approach'),
      p(
        'It generates commentary, most of it tedious. Anyone dressing this way is accepting a running argument as the price of not producing the same photograph as everybody else. Whether that is worth it is a personal calculation, but it is at least a real one.',
      ),
    ],
  },
  {
    celebrity: 'austin-butler',
    title: 'Taking tailoring seriously in a generation that mostly does not',
    template: 'generic',
    excerpt:
      'Jackets buttoned, boots pointed, a leaner and dressier line than most contemporaries. On formality as a deliberate position.',
    links: ['saint-laurent', 'celine'],
    body: [
      p(
        'The default register for a young actor now is relaxed: jacket open, sneaker on, tie absent. Choosing the opposite is a position, and it is read as one.',
      ),
      h2('The buttoned jacket'),
      p(
        'Fastening the jacket changes the whole geometry. It creates a defined waist and a clean triangle, and it demands a jacket that actually fits, because a buttoned jacket cannot hide anything. It is the least forgiving choice available.',
      ),
      quote('An open jacket forgives. A buttoned one reports.'),
      h2('Footwear does the dating'),
      p(
        'A pointed leather boot under tailoring reads late-sixties; a round toe reads contemporary; a sneaker reads now-and-slightly-lazy. Very little else in a men’s outfit signals period so cheaply, and almost nobody uses it on purpose.',
      ),
      h2('Formality is not stiffness'),
      p(
        'The failure mode is looking upholstered. The correction is textural rather than structural: a knit instead of a shirt, a softer cloth, no tie. The formality stays in the cut, and the ease comes from the materials.',
      ),
    ],
  },
  {
    celebrity: 'jacob-elordi',
    title: 'Oversize, and the height required to mean it',
    template: 'generic',
    excerpt:
      'Generously cut suiting worn without apology. Where the oversize silhouette actually works, and the specific ways it fails on everyone else.',
    links: ['bottega-veneta', 'balenciaga'],
    body: [
      p(
        'Oversize tailoring is the defining silhouette of the moment and the one most frequently attempted badly, because it looks like it requires nothing and in fact requires more than a slim cut does.',
      ),
      h2('Oversize is a cut, not a size'),
      p(
        'A jacket designed oversize has the shoulder, armhole and length redrawn together. A normal jacket bought two sizes up has none of that: the shoulder falls in the wrong place and the sleeve head collapses. They look nothing alike in a photograph.',
      ),
      quote('Buying big is not the same as buying oversize. One is a cut; the other is a mistake.'),
      h2('Height buys you volume'),
      p(
        'The silhouette adds visual width and subtracts apparent height. Above roughly six feet that is a surplus you can spend. Below it, the same garment shortens the wearer, and the usual fix (cropping the jacket) reintroduces the proportions oversize was meant to escape.',
      ),
      h2('The workable middle'),
      p(
        'Oversize on top, controlled below. A generous jacket over a trouser that still has a defined line keeps the volume as a deliberate contrast rather than a general looseness, which is the difference between a silhouette and pyjamas.',
      ),
    ],
  },
  {
    celebrity: 'sydney-sweeney',
    title: 'Structure on the carpet, workwear off it',
    template: 'comparison',
    excerpt:
      'A wardrobe that splits cleanly in two, with almost nothing in between. On why the hard divide works better than a blended middle.',
    links: ['miu-miu', 'levis'],
    body: [
      p(
        'Some wardrobes run on a gradient from casual to formal. Others have two settings and no dial. The second arrangement is less versatile and, in practice, considerably more effective.',
      ),
      h2('The structured half'),
      p(
        'Corsetry, boning, defined waists: garments that impose a shape rather than follow one. These are engineering-led and unforgiving of fit; a structured bodice that does not fit is visible from across a room.',
      ),
      h2('The workwear half'),
      p(
        'Denim, utility outerwear, heavy cotton. Cut for movement, indifferent to occasion, and improved rather than degraded by wear. The two halves share essentially nothing.',
      ),
      quote('Two settings and no dial. It sounds limiting and it removes the hardest decisions.'),
      h2('Why the gap is the point'),
      p(
        'A blended middle (smart-casual, in the worst sense) is where most wardrobes go to die, because every garment is a compromise and none is excellent at anything. Keeping the halves separate means each can be optimised without negotiating with the other.',
      ),
      h2('What to copy'),
      p(
        'Decide which mode you are in before you get dressed, and dress fully into it. The most common wardrobe failure is not owning the wrong clothes; it is combining two modes badly and calling the result an outfit.',
      ),
    ],
  },
  {
    celebrity: 'anya-taylor-joy',
    title: 'Sculptural dressing and the cost of never repeating',
    template: 'generic',
    excerpt:
      'Editorial silhouettes, rarely the same shape twice. What that demands, and why almost nobody can sustain it.',
    links: ['dior', 'prada'],
    body: [
      p(
        'There is a mode of red-carpet dressing that behaves like a magazine editorial rather than an evening out: sculptural, occasionally uncomfortable, and never repeating a silhouette.',
      ),
      h2('What sculptural means in practice'),
      p(
        'Garments that hold a shape independent of the body: structured shoulders, moulded bodices, skirts with their own architecture. The wearer is inside the shape rather than defining it.',
      ),
      quote('The garment holds the shape. The person is inside it, not underneath it.'),
      h2('Why it cannot be sustained alone'),
      p(
        'This mode depends on access: to houses, to archives, to pieces made for a body rather than a size. It is the least replicable approach on this site, and pretending otherwise would be dishonest.',
      ),
      h2('The part that is replicable'),
      p(
        'Not the gowns. The principle: choose one structural idea per outfit and let it be the whole statement. A single strong shape with quiet everything-else is achievable at any budget and is what actually reads in a photograph.',
      ),
    ],
  },
  {
    celebrity: 'michael-b-jordan',
    title: 'Tailoring with a sportswear posture',
    template: 'generic',
    excerpt:
      'Sharp jackets, relaxed trousers, and footwear doing the talking. On the hybrid that most people attempt and few resolve.',
    links: ['new-balance', 'gucci'],
    body: [
      p(
        'The most attempted look of the last decade is tailoring worn with sneakers. It is also the most frequently botched, because the two halves have to be renegotiated rather than simply combined.',
      ),
      h2('The trouser has to move first'),
      p(
        'A slim tailored trouser over a bulky sneaker produces a silhouette that narrows and then abruptly widens at the floor. Letting the trouser out through the leg, and shortening it slightly, resolves it: the line runs continuously into the shoe instead of colliding with it.',
      ),
      quote('The sneaker is not the problem. The trouser that was drafted for a dress shoe is.'),
      h2('Keep the jacket sharp'),
      p(
        'The instinct is to relax the whole outfit to match the footwear. That produces something shapeless. The tension is the point: a properly structured jacket above a relaxed lower half reads as a decision, while soft-everything reads as giving up.',
      ),
      h2('Letting the shoe be the statement'),
      p(
        'If the footwear is doing the talking, everything above it should be quiet enough to let it. A loud shoe under a loud suit is two arguments in one photograph, and neither wins.',
      ),
    ],
  },
  {
    celebrity: 'pedro-pascal',
    title: 'Dressing like you are enjoying it',
    template: 'generic',
    excerpt:
      'Colour, print and comfort in equal measure. The rare register that reads as pleasure rather than performance, and why it is harder than it looks.',
    links: ['prada', 'valentino'],
    body: [
      p(
        'Most public dressing is defensive: the goal is to avoid being wrong. A smaller group dresses as though the clothes are a source of enjoyment, and it is immediately legible in a photograph.',
      ),
      h2('Comfort is not the opposite of considered'),
      p(
        'Softer construction, generous cut, cloth that moves. None of that requires sacrificing precision. It relocates the precision from the structure to the fit and the colour, which is a harder place to hide.',
      ),
      quote('Ease is a construction choice. It is not the absence of one.'),
      h2('Colour without a system'),
      p(
        'Wearing colour well at this level is less about matching and more about committing: a single saturated colour across a whole look, or one deliberate clash. Timid colour (a bright accessory against neutrals) reads as a hedge, and hedges photograph badly.',
      ),
      h2('The bit that does not travel'),
      p(
        'This register depends heavily on the wearer seeming relaxed. The same clothes on someone visibly uncomfortable read as a stylist’s decision rather than a personal one, and the whole effect inverts.',
      ),
    ],
  },
  {
    celebrity: 'paul-mescal',
    title: 'The anti-stylist look that became a style',
    template: 'generic',
    excerpt:
      'Short shorts, plain knitwear, unfussy tailoring. What happens when a deliberate refusal of fashion becomes a recognisable position within it.',
    links: ['loewe', 'carhartt-wip'],
    body: [
      p(
        'Every so often someone dresses in a way that reads as an explicit refusal to participate, and within about eighteen months the refusal has become one of the available positions.',
      ),
      h2('The components'),
      p(
        'Athletic shorts worn as ordinary clothing. Plain crew-neck knitwear in unremarkable colours. Tailoring only when unavoidable, and then without ornament. Individually banal; collectively very specific.',
      ),
      quote('Refusing to signal is itself a signal, and a legible one.'),
      h2('Why it worked'),
      p(
        'Because it was consistent. Any single element would read as not having thought about it. Repeated across two years of public appearances, the same elements read as a position. The consistency is what converts indifference into intent.',
      ),
      h2('The paradox'),
      p(
        'Once the look is recognised, it can no longer be accidental. Anyone adopting it now is making a fashion decision to look like someone who does not make fashion decisions, which is a more self-conscious act than whatever it is imitating.',
      ),
    ],
  },
  {
    celebrity: 'andrew-garfield',
    title: 'Soft construction, muted colour, worn slightly loose',
    template: 'generic',
    excerpt:
      'Quiet tailoring, consistently. On the unstructured jacket: what it does, what it demands, and why it is the hardest thing to buy well.',
    links: ['giorgio-armani', 'brunello-cucinelli'],
    body: [
      p(
        'An unstructured jacket has no padding, little or no canvas, and almost nothing holding its shape but the cloth and the cut. It is the most comfortable tailoring available and the least forgiving to make.',
      ),
      h2('What the structure was doing'),
      p(
        'Canvas and padding impose a shape regardless of the wearer. Remove them and the jacket reports the body underneath exactly. Nothing is corrected, which is why an unstructured jacket in cheap cloth looks like a shirt and an expensive one looks like nothing at all, in the good sense.',
      ),
      quote('Take out the structure and the cloth has to do all the work. Cheap cloth cannot.'),
      h2('The colour question'),
      p(
        'Soft construction pairs naturally with muted, slightly complex colours: olive, stone, faded navy, brown. Flat black tends to flatten it further, removing the texture that is most of the appeal.',
      ),
      h2('Loose, within limits'),
      p(
        'Slightly loose reads relaxed; properly loose reads borrowed. The workable margin is about a centimetre through the chest, which is a smaller allowance than the casual look suggests. Ease here is engineered, not approximate.',
      ),
    ],
  },
  {
    celebrity: 'anne-hathaway',
    title: 'A late reinvention, and the confidence it required',
    template: 'generic',
    excerpt:
      'Some of the most decisive red-carpet dressing of the moment, arriving two decades into a career. On what changes when you stop dressing to be liked.',
    links: ['versace', 'chanel'],
    body: [
      p(
        'The usual arc is that public dressing gets safer over time: early experimentation, then a settled register, then a long plateau. The reverse happens rarely and is worth paying attention to when it does.',
      ),
      h2('What decisive looks like'),
      p(
        'Not louder. More committed. A single colour taken all the way, a silhouette held rather than softened, an absence of the small hedges (the cardigan over the dress, the neutral shoe) that most outfits use to soften a decision.',
      ),
      quote('Most outfits are ruined by their hedges, not their choices.'),
      h2('Why it comes later'),
      p(
        'Dressing to be liked and dressing to be interesting are different objectives, and the first tends to dominate when there is more to lose. The shift usually follows a change in what the person is optimising for, and it shows up in the clothes before it shows up anywhere else.',
      ),
      h2('The transferable bit'),
      p(
        'Look at your own last five outfits and find the hedge in each. There is almost always one: a piece added to make the rest less definite. Removing it is free and does more than anything you could buy.',
      ),
    ],
  },
  {
    celebrity: 'ryan-reynolds',
    title: 'Uncomplicated on purpose',
    template: 'generic',
    excerpt:
      'A well-cut suit, a plain knit, and no interest in being the story. On dressing to get out of the way, and when that is the right call.',
    links: ['zegna', 'common-projects'],
    body: [
      p(
        'Not every public figure is trying to make their clothing part of the conversation. For someone whose work is verbal, clothes that draw attention actively compete with the thing they are there to do.',
      ),
      h2('What getting out of the way looks like'),
      p(
        'Mid-tone tailoring, no pattern, no visible hardware, a knit or plain shirt, dark plain shoes. Every element chosen so that nothing in the photograph asks a question.',
      ),
      quote('If the outfit raises a question, the answer had better be worth the interruption.'),
      h2('It still has to fit'),
      p(
        'This only works if the execution is exact. Quiet clothes that fit badly are not quiet. A poorly fitting plain navy suit draws more attention than a well-cut bold one, because the eye catches on the error instead of the design.',
      ),
      h2('When it is the wrong call'),
      p(
        'When the occasion is the point. Deliberate neutrality at an event built around spectacle reads as disengagement rather than restraint. The approach is a tool for staying out of the way, which is only correct when being out of the way is what you want.',
      ),
    ],
  },
]

// ── Seed ───────────────────────────────────────────────────────────────────
type HeroEntry = { slug: string; name: string; file: string; credit: string; licence: string }

const HEROES = 'seed-assets/heroes/manifest.json'

const toLicence = (raw: string): 'cc' | 'own' => (/^(cc|public domain)/i.test(raw) ? 'cc' : 'own')

const run = async () => {
  const payload = await getPayload({ config })

  const heroes: Record<string, HeroEntry> = existsSync(HEROES)
    ? Object.fromEntries(
        (JSON.parse(readFileSync(HEROES, 'utf8')) as HeroEntry[]).map((h) => [h.slug, h]),
      )
    : {}

  // Brand and celebrity slugs that actually exist, so we never link a 404.
  const known = new Set<string>()
  const linkTarget: Record<string, string> = {}
  for (const collection of ['brands', 'celebrities'] as const) {
    const { docs } = await payload.find({ collection, limit: 500, depth: 0, draft: true })
    for (const d of docs) {
      const slug = (d as { slug?: string }).slug
      const name = (d as { name?: string }).name
      if (!slug || !name) continue
      known.add(slug)
      linkTarget[slug] = `/${collection === 'brands' ? 'brands' : 'celebrities'}/${slug}`
      linkTarget[`${slug}::name`] = name
    }
  }

  let created = 0
  let updated = 0
  let withHero = 0
  let skipped = 0

  for (const piece of pieces) {
    const { docs: celebs } = await payload.find({
      collection: 'celebrities',
      limit: 1,
      where: { slug: { equals: piece.celebrity } },
      draft: true,
    })
    const celebrity = celebs[0]
    if (!celebrity) {
      console.warn(`  no celebrity for "${piece.celebrity}" — skipped`)
      skipped++
      continue
    }

    // Hero image, uploaded once and matched on filename thereafter.
    let heroId: number | undefined
    const hero = heroes[piece.celebrity]
    if (hero && existsSync(hero.file)) {
      const filename = basename(hero.file)
      const { docs: existingMedia } = await payload.find({
        collection: 'media',
        limit: 1,
        where: { filename: { equals: filename } },
      })
      const media =
        existingMedia[0] ??
        (await payload.create({
          collection: 'media',
          filePath: hero.file,
          data: {
            alt: `${hero.name}, photographed at a public appearance`,
            credit: hero.credit,
            licence: toLicence(hero.licence),
            caption: `${hero.name} · ${hero.licence}`,
          },
        }))
      heroId = media.id as number
      withHero++
    }

    const keywords = [
      { keyword: celebrity.name as string, url: `/celebrities/${piece.celebrity}`, rel: 'auto' as const },
      ...(piece.links ?? [])
        .filter((slug) => known.has(slug))
        .map((slug) => ({
          keyword: linkTarget[`${slug}::name`],
          url: linkTarget[slug],
          rel: 'auto' as const,
        })),
    ]

    const slug = slugify(piece.title)
    const data = {
      title: piece.title,
      slug,
      template: piece.template,
      excerpt: piece.excerpt,
      author: 'The Celebrity Spotted Outfits desk',
      publishedAt: new Date().toISOString(),
      featured: false,
      relatedCelebrity: celebrity.id as number,
      ...(heroId ? { heroImage: heroId } : {}),
      keywords,
      body: doc(piece.body),
      _status: 'published' as const,
    }

    /**
     * Match on title as well as slug. Earlier seeds set slugs by hand, so
     * deriving one from the title finds nothing and creates a second copy of
     * the same piece at a second URL — two pages competing for one query,
     * which is the exact failure this site exists to avoid.
     */
    const { docs: existing } = await payload.find({
      collection: 'articles',
      limit: 1,
      where: { or: [{ slug: { equals: slug } }, { title: { equals: piece.title } }] },
      draft: true,
    })

    if (existing[0]) {
      // Keep whatever slug is already published — the URL may be linked to,
      // and a shorter hand-written one is usually better than a derived one.
      const { slug: _derived, ...rest } = data
      await payload.update({ collection: 'articles', id: existing[0].id, data: rest })
      updated++
    } else {
      await payload.create({ collection: 'articles', data })
      created++
    }
    console.log(`  ${existing[0] ? 'updated' : 'created'}  ${heroId ? 'img' : '—  '}  ${piece.title}`)
  }

  payload.logger.info(
    `Celebrity journal seeded — ${created} created, ${updated} updated, ${withHero} with hero images, ${skipped} skipped.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
