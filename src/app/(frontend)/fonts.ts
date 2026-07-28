import { Bodoni_Moda, Hanken_Grotesk } from 'next/font/google'

/**
 * next/font/google downloads these at build time and serves them from our own
 * origin — no runtime request to Google, no layout shift, no CDN dependency.
 *
 * Bodoni Moda is a true didone: the typeface fashion print is actually set in.
 * Hanken Grotesk carries running text without competing with it.
 */
export const bodoni = Bodoni_Moda({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
})

export const hanken = Hanken_Grotesk({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
})
