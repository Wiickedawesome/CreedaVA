/**
 * Section anchors on the /services page, in dictionary order.
 *
 * The services page renders these as section ids and the footer links to them,
 * so both must read from this list — keeping separate copies let the two drift
 * apart (a footer link pointed at a section id that no longer existed).
 */
export const SERVICE_ANCHORS = [
  "administrative",
  "customer",
  "social",
  "data",
  "bookkeeping",
  "web",
  "real-estate",
  "insurance",
  "workflow-optimization",
] as const;

/** Anchor for the service packages section on /services. */
export const PACKAGES_ANCHOR = "packages";
