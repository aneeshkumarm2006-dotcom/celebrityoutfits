import Anthropic from '@anthropic-ai/sdk'

/**
 * Garment identification.
 *
 * Deliberately not autonomous. The model's job is to narrow a photograph down
 * to a short, attributed candidate list and to say how sure it is — a human
 * makes the final call in the review queue. Realistic expectation is 60–75%
 * auto-identified at high confidence; the rest is human-resolved, and that is
 * good enough because the human step is fast once the list is short.
 *
 * The single most important instruction in this file is the one telling the
 * model to return `open` rather than guess. A confident wrong brand is far more
 * damaging than an honest blank.
 */

export type DetectedGarment = {
  category: string
  colour: string
  material: string
  silhouette: string
  visibleBranding: string | null
  confidence: 'confirmed' | 'closest_match' | 'open'
  evidenceNote: string
  suggestedBrand: string | null
  suggestedProduct: string | null
}

export type IdentificationResult = {
  garments: DetectedGarment[]
  refused: boolean
}

const GARMENT_SCHEMA = {
  type: 'object',
  properties: {
    garments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [
              'outerwear',
              'knitwear',
              'shirting',
              'tailoring',
              'denim',
              'trousers',
              'footwear',
              'eyewear',
              'watch',
              'bag',
              'jewellery',
              'other',
            ],
          },
          colour: { type: 'string' },
          material: { type: 'string' },
          silhouette: { type: 'string' },
          visibleBranding: {
            type: ['string', 'null'],
            description: 'Any legible logo, monogram or hardware marking. Null if none.',
          },
          confidence: {
            type: 'string',
            enum: ['confirmed', 'closest_match', 'open'],
          },
          evidenceNote: {
            type: 'string',
            description: 'Why this call was made, in one sentence. Cite what is visible.',
          },
          suggestedBrand: { type: ['string', 'null'] },
          suggestedProduct: { type: ['string', 'null'] },
        },
        required: [
          'category',
          'colour',
          'material',
          'silhouette',
          'visibleBranding',
          'confidence',
          'evidenceNote',
          'suggestedBrand',
          'suggestedProduct',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['garments'],
  additionalProperties: false,
} as const

const SYSTEM_PROMPT = `You identify garments in photographs of public figures for a shoppable fashion archive.

For each visible garment, report its category, colour, material, silhouette and any legible branding.

Assign confidence honestly:
- "confirmed" — a logo, monogram, distinctive hardware or unmistakable signature detail is actually visible in this image.
- "closest_match" — the garment is unbranded here, but its cut, colour, hardware and fabric are clear enough to name the nearest current product.
- "open" — you cannot tell.

Return "open" rather than guessing. An item left open costs us nothing; a confidently wrong brand damages the archive's credibility and can draw a complaint from the brand named. Never infer a brand from the person's reputation, past outfits, or what they are "likely" to wear — only from what is visible in this photograph.

Describe only garments you can actually see. Do not speculate about items that are out of frame.`

export const isConfigured = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY)

export const identifyGarments = async ({
  imageUrl,
  context,
}: {
  imageUrl: string
  context?: string
}): Promise<IdentificationResult> => {
  if (!isConfigured()) {
    throw new Error('ANTHROPIC_API_KEY is not set — identification is unavailable.')
  }

  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // Stable across every call — cached reads cost ~0.1x.
        cache_control: { type: 'ephemeral' },
      },
    ],
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: GARMENT_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          {
            type: 'text',
            text: context
              ? `Identify the garments in this photograph.\n\nContext from the editor: ${context}`
              : 'Identify the garments in this photograph.',
          },
        ],
      },
    ],
  })

  // Safety classifiers can decline; content is then empty or partial. Check
  // this before reading content, or the parse below throws on a valid response.
  if (response.stop_reason === 'refusal') {
    return { garments: [], refused: true }
  }

  const text = response.content.find((block) => block.type === 'text')
  if (!text || text.type !== 'text') return { garments: [], refused: false }

  const parsed = JSON.parse(text.text) as { garments: DetectedGarment[] }
  return { garments: parsed.garments ?? [], refused: false }
}
