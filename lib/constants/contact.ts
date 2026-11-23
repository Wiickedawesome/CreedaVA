/**
 * The one place the public business phone number is written.
 *
 * The previous number lived in five files — both i18n dictionaries, the
 * Organization JSON-LD, the AI system prompt twice, and the contact page's
 * `tel:` link — so changing it meant finding all five and they could disagree.
 * Everything imports from here now.
 *
 * Two forms, deliberately:
 *   - `DISPLAY` for humans: page copy and prompt text.
 *   - `E164` for machines: `tel:` hrefs and schema.org `telephone` reject the
 *     spaces and hyphens a person would read.
 */

/** Human-readable form. */
export const BUSINESS_PHONE_DISPLAY = "+1 908-248-2875";

/** E.164 form, without separators. */
export const BUSINESS_PHONE_E164 = "+19082482875";
