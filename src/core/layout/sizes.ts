import type { AppStyle, CardDensity } from '../settings'
import type { LayoutOptions } from './layout'

/** Card sizes and gaps of the tree canvas for each style and density (also used by exports). */
export const CARD_SIZES: Record<AppStyle, Record<CardDensity, Partial<LayoutOptions>>> = {
  modern: {
    comfortable: {
      nodeWidth: 220,
      nodeHeight: 64,
      partnerGap: 28,
      siblingGap: 32,
      generationGap: 76
    },
    compact: { nodeWidth: 172, nodeHeight: 48, partnerGap: 20, siblingGap: 22, generationGap: 56 }
  },
  // Upright medallions (portrait above the name); a wider partner gap holds the partner knot.
  tapestry: {
    comfortable: {
      nodeWidth: 184,
      nodeHeight: 104,
      partnerGap: 40,
      siblingGap: 32,
      generationGap: 88
    },
    compact: { nodeWidth: 164, nodeHeight: 56, partnerGap: 30, siblingGap: 22, generationGap: 60 }
  }
}

/** Card sizes and gaps for a style and density. */
export const cardSizes = (style: AppStyle, density: CardDensity): Partial<LayoutOptions> =>
  CARD_SIZES[style][density]
