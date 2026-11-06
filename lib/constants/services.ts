/**
 * Section anchors on the /services page, in dictionary order.
 *
 * The services page renders these as section ids and the footer links to them,
 * so both must read from this list — keeping separate copies let the two drift
 * apart (a footer link pointed at a section id that no longer existed).
 */
export const SERVICE_ANCHORS = [
  "administrative",
  "executive",
  "hr-recruiting",
  "legal",
  "customer",
  "social",
  "data",
  "bookkeeping",
  "web",
  "real-estate",
  "insurance",
  "workflow-optimization",
] as const;

/**
 * Route for the pricing page.
 *
 * The service packages used to be a `#packages` section on /services. They moved
 * to their own page, so links that used to deep-link into /services now point at
 * this path instead.
 */
export const PRICING_PATH = "/pricing";

/**
 * How the twelve services map onto the sectors we sell them to.
 *
 * The services grid answers "what do you do"; this answers "what do you do for
 * a business like mine". Same twelve services, read through a second lens, so a
 * law firm does not have to scan eight unrelated entries to find its own.
 *
 * The lists are curated rather than exhaustive: a sector lists the services that
 * actually get bought for it, and a service may appear in more than one sector if
 * it genuinely sells to both. Between them the sectors cover **all twelve**
 * services — asserted by the test suite, so a service added to `SERVICE_ANCHORS`
 * without a sector fails the build rather than silently vanishing from the band.
 *
 * Order matters: it pairs with `t.services.industries` **by index**, and the grid
 * fills row-first, so this order decides which cards share a row and therefore
 * which cards stretch to match each other. Agencies and small business lead
 * because they carry the most services; the four single-service sectors sit
 * together in the last row so they match each other exactly.
 *
 * `anchors` must reference real `SERVICE_ANCHORS` entries — the industry cards
 * deep-link into the grid by id, so a typo here is a dead link. The test suite
 * asserts every anchor resolves.
 */
export const INDUSTRIES = [
  { id: "agencies", anchors: ["social", "data", "web"] },
  {
    id: "small-business",
    anchors: [
      "administrative",
      "customer",
      "executive",
      "bookkeeping",
      "workflow-optimization",
    ],
  },
  { id: "hr", anchors: ["hr-recruiting"] },
  { id: "insurance", anchors: ["insurance"] },
  { id: "real-estate", anchors: ["real-estate"] },
  { id: "legal", anchors: ["legal"] },
] as const satisfies readonly {
  id: string;
  anchors: readonly ServiceAnchor[];
}[];

export type IndustryId = (typeof INDUSTRIES)[number]["id"];

/** Anchor union, derived from the canonical list rather than duplicated. */
export type ServiceAnchor = (typeof SERVICE_ANCHORS)[number];
