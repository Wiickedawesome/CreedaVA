// ─── Business Mailboxes ──────────────────────────────
//
// The addresses CreedaVA is actually reachable on, and can send as. Every entry
// is a Google Workspace group, so any of them can both send and receive.
//
// `CreedaVA Marketing` and `Join` are the same mailbox (`join@`); they are
// modelled as one entry with an alternate label so the address is not listed
// twice while both spellings still match a received message.

export interface BusinessAddress {
  /** Primary name shown in the admin UI. */
  label: string;
  /** Canonical address, e.g. `join@creedava.com`. */
  address: string;
  /** Other names Gmail may have used in the `To` header for the same mailbox. */
  aka?: readonly string[];
}

export const BUSINESS_ADDRESSES: readonly BusinessAddress[] = [
  { label: "Admins", address: "admins@creedava.com" },
  { label: "Billing", address: "billing@creedava.com" },
  { label: "Contact", address: "contact@creedava.com" },
  { label: "Legal", address: "legal@creedava.com" },
  { label: "CreedaVA Marketing", address: "join@creedava.com", aka: ["Join"] },
  { label: "Privacy", address: "privacy@creedava.com" },
  { label: "Sales", address: "sales@creedava.com" },
  { label: "Feedback", address: "feedback@creedava.com" },
];

/** Where mail is sent from unless another mailbox is chosen. */
export const DEFAULT_SENDER_ADDRESS = "contact@creedava.com";

/** Options for the compose / send-from pickers. */
export const SENDABLE_ADDRESS_OPTIONS = BUSINESS_ADDRESSES.map((entry) => ({
  label: entry.address,
  value: entry.address,
}));

/** Every address the app may send from — the server allow-list mirrors this. */
export const SENDABLE_ADDRESSES: readonly string[] = BUSINESS_ADDRESSES.map(
  (entry) => entry.address,
);

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Does this synced message belong to `entry`?
 *
 * Matches the mailbox address, and also the display name in `receivedByLabel` —
 * that is the only signal available when Google rewrote the `To` header.
 */
export function isReceivedBy(
  message: { receivedBy?: string; receivedByLabel?: string },
  entry: BusinessAddress,
): boolean {
  const seen = [normalize(message.receivedBy), normalize(message.receivedByLabel)].filter(Boolean);
  const targets = [entry.address, entry.label, ...(entry.aka ?? [])].map(normalize);
  return targets.some((target) => seen.includes(target));
}

/**
 * Short name for the `To` column: the business label when the mailbox is one we
 * know, otherwise the local part before the `@`.
 */
export function mailboxDisplayName(message: {
  receivedBy?: string;
  receivedByLabel?: string;
}): string {
  const entry = BUSINESS_ADDRESSES.find((candidate) => isReceivedBy(message, candidate));
  if (entry) return entry.label;
  const raw = message.receivedBy || message.receivedByLabel || "";
  return raw.split("@")[0] || "—";
}

/**
 * Address to reply from: the mailbox that received the message, falling back to
 * the default sender. Every business address is a group, so replying from the
 * one that received it keeps the thread on the same alias.
 */
export function senderForReply(message: {
  receivedBy?: string;
  receivedByLabel?: string;
}): string {
  const entry = BUSINESS_ADDRESSES.find((candidate) => isReceivedBy(message, candidate));
  return entry?.address || DEFAULT_SENDER_ADDRESS;
}
