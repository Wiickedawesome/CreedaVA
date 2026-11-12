// ─── Business Mailboxes (server) ─────────────────────
//
// Mirrors `lib/constants/business-emails.ts`. The two cannot share a module:
// functions are deployed from `functions/` alone, so importing app code would
// break the deploy. `__tests__/lib/constants/business-emails.test.ts` asserts
// the address sets stay identical, so drift fails a test instead of silently
// rejecting a sender at runtime.
//
// Every entry is a Google Workspace group, so any of them can send and receive.

export interface BusinessAddress {
  label: string;
  address: string;
}

export const BUSINESS_ADDRESSES: readonly BusinessAddress[] = [
  { label: "Admins", address: "admins@creedava.com" },
  { label: "Billing", address: "billing@creedava.com" },
  { label: "Contact", address: "contact@creedava.com" },
  { label: "Legal", address: "legal@creedava.com" },
  { label: "CreedaVA Marketing", address: "join@creedava.com" },
  { label: "Privacy", address: "privacy@creedava.com" },
  { label: "Sales", address: "sales@creedava.com" },
  { label: "Feedback", address: "feedback@creedava.com" },
];

/** Display name for a mailbox; `CreedaVA` when the address is not a business one. */
export function senderDisplayName(address: string): string {
  const entry = BUSINESS_ADDRESSES.find((candidate) => candidate.address === address.toLowerCase());
  return entry?.label ?? "CreedaVA";
}

/**
 * Pick the address a message is actually sent from.
 *
 * Only addresses this app owns may be used: the business group list, plus
 * whatever is configured in Integrations → Email (`aliases` and the sign-in
 * `user`). Anything else falls back instead of being sent, because asserting an
 * address the account cannot send as produces a spoofed `From` or a hard bounce.
 */
export function resolveSenderAddress(
  requested: string | undefined,
  integrationConfig: { user?: string; aliases?: string; fromEmail?: string } | undefined,
): string {
  const configured = (integrationConfig?.aliases ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (integrationConfig?.user) configured.push(integrationConfig.user.toLowerCase());

  const allowed = new Set([...BUSINESS_ADDRESSES.map((entry) => entry.address), ...configured]);
  const wanted = requested?.trim().toLowerCase();

  if (wanted && allowed.has(wanted)) return wanted;
  return (
    integrationConfig?.fromEmail ||
    integrationConfig?.user ||
    BUSINESS_ADDRESSES.find((entry) => entry.address === "contact@creedava.com")!.address
  );
}
