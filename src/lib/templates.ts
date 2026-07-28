/**
 * Article templates.
 *
 * These are heading skeletons, not straitjackets — they save the writer from a
 * blank page and keep post structure consistent enough that Google can tell
 * what each one is.
 */
export type ArticleTemplate = {
  value: string
  label: string
  outline: string[]
}

export const articleTemplates: ArticleTemplate[] = [
  {
    value: 'how-to',
    label: 'How-to / tutorial',
    outline: [
      'What you need',
      'Step one',
      'Step two',
      'Step three',
      'Common mistakes',
      'What it costs',
    ],
  },
  {
    value: 'listicle',
    label: 'Listicle (Top N…)',
    outline: ['How we picked these', '1.', '2.', '3.', 'The one to buy'],
  },
  {
    value: 'comparison',
    label: 'Comparison (X vs Y)',
    outline: ['The short answer', 'Where X wins', 'Where Y wins', 'Price', 'Which to buy'],
  },
  {
    value: 'review',
    label: 'Product / service review',
    outline: ['The verdict', 'What it is', 'How it wears', 'What it costs', 'Alternatives'],
  },
  {
    value: 'news',
    label: 'News / update',
    outline: ['What happened', 'What was worn', 'Where to buy it'],
  },
  {
    value: 'generic',
    label: 'Generic article',
    outline: [],
  },
]

export const templateByValue = (value?: string | null): ArticleTemplate | undefined =>
  articleTemplates.find((t) => t.value === value)
