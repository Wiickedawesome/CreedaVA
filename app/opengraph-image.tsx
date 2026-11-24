import { SOCIAL_CARD_SIZE, SOCIAL_CARD_TYPE, socialCard } from "@/lib/brand/social-card";
import { SOCIAL_CARDS, DEFAULT_CARD_PATH } from "@/lib/brand/social-cards";

/**
 * Root social card, served at `/opengraph-image`.
 *
 * Copy comes from the same registry `/share` reads, so the default card and
 * every page card stay one set. Kept as a file convention because Next's
 * metadata for the root route points at it directly; page cards are served from
 * `app/share/[[...path]]/route.tsx` instead (see that file for why).
 */
const defaultCard = SOCIAL_CARDS[DEFAULT_CARD_PATH];

export const alt = defaultCard.alt;
export const size = SOCIAL_CARD_SIZE;
export const contentType = SOCIAL_CARD_TYPE;

export default function SocialCard() {
  return socialCard(defaultCard);
}
