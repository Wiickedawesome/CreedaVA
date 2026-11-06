import type { ServiceAnchor } from "./service-glyphs";

/**
 * Which illustration each service opens with.
 *
 * **One bespoke mockup per service**, twelve in total. An earlier version reused
 * six across the twelve on the theory that an inbox is an inbox, but that made
 * Legal and HR show the same drawing, which read as filler. A law practice
 * recognises e-filing; a recruiter recognises a shortlist. Recognition is the
 * whole job of these illustrations, so each service gets its own.
 *
 * Every mockup is CSS, not an image, and is `aria-hidden`. They are illustrations
 * of the work, not screenshots and not live data, and they carry no numbers that
 * could read as measured claims.
 */
export type ServiceMockup =
  | "inbox"
  | "calendar"
  | "hiring"
  | "checklist"
  | "conversation"
  | "gallery"
  | "chart"
  | "invoices"
  | "editor"
  | "listing"
  | "claim"
  | "flow";

export const SERVICE_MOCKUPS = {
  administrative: "inbox",
  executive: "calendar",
  "hr-recruiting": "hiring",
  legal: "checklist",
  customer: "conversation",
  social: "gallery",
  data: "chart",
  bookkeeping: "invoices",
  web: "editor",
  "real-estate": "listing",
  insurance: "claim",
  "workflow-optimization": "flow",
} as const satisfies Record<ServiceAnchor, ServiceMockup>;
