import SocialCard, { alt, contentType, size } from "./opengraph-image";

/**
 * X/Twitter card. Re-exports the OG card instead of duplicating it — the two
 * were separate files with identical gradient markup, which is exactly how
 * they drifted off-brand independently.
 */
export { alt, contentType, size };
export default SocialCard;
