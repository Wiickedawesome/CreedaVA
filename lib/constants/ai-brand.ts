/**
 * Creeda AI — the single assistant's identity.
 *
 * Deliberately one name: there are no personas to switch between. What changes
 * per page is which data and skill modules the prompt carries, not who is
 * answering.
 */

export const CREEDA_AI_NAME = "Creeda AI";

const AREA_LABELS: Record<string, string> = {
  "": "Dashboard",
  bookings: "Bookings",
  analytics: "Analytics",
  blog: "Blog",
  forum: "Forum",
  emails: "Email",
  leads: "Leads",
  contacts: "Contacts",
  customers: "Customers",
  settings: "Settings",
  "seo/keywords": "SEO",
  "seo/content": "SEO",
  "marketing/campaigns": "Campaigns",
  "marketing/landing-pages": "Landing pages",
};

/**
 * Human name for the admin area a path belongs to, e.g. "Bookings".
 *
 * Returns an empty string for an unrecognised path so callers can omit the
 * label rather than printing a guess.
 */
export function describeAdminArea(pagePath: string): string {
  const key = pagePath
    .replace(/^\/admin\/?/, "")
    .replace(/\/$/, "")
    .toLowerCase();
  return AREA_LABELS[key] ?? "";
}
