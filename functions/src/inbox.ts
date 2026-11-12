/**
 * Inbox Cloud Function — fetches emails via Gmail API.
 *
 * Uses a Google Service Account with domain-wide delegation to access
 * the configured Gmail mailbox. Replaces the legacy IMAP approach.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google, gmail_v1 } from "googleapis";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";

// ─── Types ───────────────────────────────────────────

interface FetchInboxRequest {
  folder?: string;
  limit?: number;
  page?: number;
  filter?: string;
  markRead?: boolean;
}

interface InboxMessage {
  uid: string;
  messageId: string;
  from: string;
  fromName: string;
  to: string;
  cc?: string;
  subject: string;
  date: string;
  preview: string;
  bodyHtml?: string;
  bodyText?: string;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  attachments?: { filename: string; contentType: string; size: number }[];
  labels?: string[];
}

// ─── Gmail API Auth ──────────────────────────────────

async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const integration = await getIntegrationConfig("email");
  if (!integration || !integration.enabled) {
    throw new HttpsError(
      "failed-precondition",
      "Email integration not enabled. Configure in Admin → Integrations.",
    );
  }

  const { config } = integration;
  const userEmail = config.user || "admin@creedava.com";

  if (config.serviceAccountKey) {
    const key = JSON.parse(config.serviceAccountKey);
    const authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.labels",
      ],
      subject: userEmail,
    });
    return google.gmail({ version: "v1", auth: authClient });
  }

  const authClient = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  return google.gmail({ version: "v1", auth: authClient });
}

// ─── Decode Gmail base64 (URL-safe variant) ──────────

function decodeBase64(data: string | null | undefined): string {
  if (!data) return "";
  const standard = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(standard, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

// ─── Recursive MIME part extraction ──────────────────

function extractTextFromParts(payload: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    return payload.parts.map((p) => extractTextFromParts(p)).filter(Boolean).join("\n").trim();
  }
  return "";
}

function extractHtmlFromParts(payload: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    return payload.parts.map((p) => extractHtmlFromParts(p)).filter(Boolean).join("\n");
  }
  return "";
}

// ─── Header helpers ──────────────────────────────────

function getHeader(payload: gmail_v1.Schema$MessagePart, name: string): string {
  return payload.headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase(),
  )?.value || "";
}

function parseFromHeader(header: string): { name: string; address: string } {
  const match = header.match(/^"?([^"<]*)"?\s*<([^>]+)>/);
  if (match) {
    return { name: match[1].trim() || match[2], address: match[2] };
  }
  return { name: header, address: header };
}

/**
 * Split a raw `To`/`Cc` header into recipients.
 *
 * The address is taken from the angle brackets so a display name such as
 * `CreedaVA Marketing <x@y>` is not stored as if it were the mailbox — that is
 * what made `inbox.receivedBy` unmatchable by the admin filter.
 */
function parseRecipients(header: string): { name: string; address: string }[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const angled = part.match(/^(.*?)<([^>]+)>/);
      if (!angled) return { name: part, address: part };
      const name = angled[1].trim().replace(/^"|"$/g, "");
      const address = angled[2].trim();
      return { name: name || address, address };
    })
    .filter((recipient) => recipient.address.length > 0);
}

// ─── Parse Gmail message → InboxMessage ──────────────

function parseGmailMessage(msg: gmail_v1.Schema$Message): InboxMessage {
  const payload = msg.payload!;
  const { name: fromName, address: fromAddr } = parseFromHeader(getHeader(payload, "From"));
  const toAddr = getHeader(payload, "To");
  const ccAddr = getHeader(payload, "Cc");
  const messageId = getHeader(payload, "Message-ID");
  const subject = getHeader(payload, "Subject") || "(no subject)";
  const dateStr = getHeader(payload, "Date");
  const labels = msg.labelIds || [];

  const textBody = extractTextFromParts(payload);
  const htmlBody = extractHtmlFromParts(payload);
  const preview = textBody.replace(/\s+/g, " ").trim().slice(0, 200);

  const attachmentParts = msg.payload?.parts?.filter((p) => p.filename && p.filename.length > 0) || [];
  const attachments = attachmentParts.map((p) => ({
    filename: p.filename || "unknown",
    contentType: p.mimeType || "application/octet-stream",
    size: Number(p.body?.size) || 0,
  }));

  return {
    uid: msg.id || "",
    messageId,
    from: fromAddr,
    fromName,
    to: toAddr,
    cc: ccAddr || undefined,
    subject,
    date: dateStr || new Date().toISOString(),
    preview,
    bodyHtml: htmlBody || undefined,
    bodyText: textBody || undefined,
    seen: !labels.includes("UNREAD"),
    flagged: labels.includes("STARRED"),
    hasAttachments: attachments.length > 0,
    attachments: attachments.length > 0 ? attachments : undefined,
    labels,
  };
}

// ─── Fetch Inbox Messages ────────────────────────────

export const fetchInbox = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const data = request.data as FetchInboxRequest;
    const folder = data.folder || "INBOX";
    const limit = Math.min(data.limit || 50, 100);

    const query = data.filter
      ? `in:${folder.toLowerCase()} to:${data.filter}`
      : `in:${folder.toLowerCase()}`;

    const gmail = await getGmailClient();

    try {
      const listRes = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: limit,
      });

      const messageIds = listRes.data.messages || [];
      const total = listRes.data.resultSizeEstimate || 0;

      if (messageIds.length === 0) {
        return { success: true, messages: [], total: 0, folder, page: data.page || 1 };
      }

      const messages: InboxMessage[] = [];
      for (const meta of messageIds) {
        if (!meta.id) continue;
        try {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: meta.id,
            format: "full",
          });
          if (!msg.data.payload) continue;

          const parsed = parseGmailMessage(msg.data);
          messages.push(parsed);

          if (data.markRead && !parsed.seen) {
            await gmail.users.messages.modify({
              userId: "me",
              id: meta.id,
              requestBody: { removeLabelIds: ["UNREAD"] },
            });
          }
        } catch (fetchErr) {
          console.error("Failed to fetch message:", meta.id, fetchErr);
        }
      }

      return {
        success: true,
        messages,
        total,
        folder,
        page: data.page || 1,
      };
    } catch (err) {
      console.error("Gmail API fetch failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch inbox");
    }
  },
);

// ─── Fetch Single Email ──────────────────────────────

export const fetchEmailMessage = onCall(
  { region: "us-east4", memory: "256MiB", timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const data = request.data as { uid?: string | number; folder?: string };
    if (!data.uid) throw new HttpsError("invalid-argument", "Missing uid");
    const messageId = String(data.uid);

    const gmail = await getGmailClient();

    try {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      if (!msg.data.payload) {
        throw new HttpsError("not-found", "Message not found");
      }

      const parsed = parseGmailMessage(msg.data);

      // Mark as read
      if (parsed.seen) {
        await gmail.users.messages.modify({
          userId: "me",
          id: messageId,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });
      }

      return { success: true, message: parsed };
    } catch (err) {
      console.error("Fetch message failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch message");
    }
  },
);

// ─── List Mailbox Labels (replaces IMAP folders) ─────

export const listMailboxFolders = onCall(
  { region: "us-east4", memory: "256MiB", timeoutSeconds: 15 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const gmail = await getGmailClient();

    try {
      const res = await gmail.users.labels.list({ userId: "me" });
      const labels = res.data.labels || [];

      return {
        success: true,
        folders: labels.map((l) => ({
          name: l.name,
          path: l.id,
          specialUse: l.type || null,
          listed: l.labelListVisibility !== "labelHide",
        })),
      };
    } catch (err) {
      console.error("List labels failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to list labels");
    }
  },
);

// ─── Sync Inbox to Firestore (for dashboard widgets) ─

/**
 * Pull the Gmail inbox into `inbox`, newest 100 messages.
 *
 * Shared by the manual callable and the daily scheduler — the inbox used to
 * update only when someone pressed Sync in the admin, which is why the stored
 * data could be months stale with no signal that anything had stopped.
 */
export async function runInboxSync(): Promise<{ synced: number; repaired: number }> {
  const gmail = await getGmailClient();
  let synced = 0;
  let repaired = 0;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: "in:inbox",
    maxResults: 100,
  });

  const messageIds = listRes.data.messages || [];

  for (const meta of messageIds) {
    if (!meta.id) continue;
    try {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: meta.id,
        format: "full",
      });
      if (!msg.data.payload) continue;

      const parsed = parseGmailMessage(msg.data);
      const primaryRecipient = parseRecipients(parsed.to)[0];
      const receivedBy = (primaryRecipient?.address || "").toLowerCase();
      const receivedByLabel = primaryRecipient?.name || "";

      // Check if already synced by messageId header
      const existing = await db.collection("inbox")
        .where("messageId", "==", parsed.messageId)
        .limit(1)
        .get();

      if (!existing.empty) {
        // Earlier syncs stored the whole header (`Name <addr>`) as
        // `receivedBy`, which no admin filter could match. Rewriting the two
        // address fields repairs history without touching the message body.
        const doc = existing.docs[0];
        const stored = (doc.data().receivedBy || "").toLowerCase();
        if (stored !== receivedBy) {
          await doc.ref.update({ receivedBy, receivedByLabel });
          repaired++;
        }
        continue;
      }

      await db.collection("inbox").add({
        uid: parsed.uid,
        messageId: parsed.messageId,
        from: parsed.from,
        fromName: parsed.fromName,
        to: parsed.to,
        receivedBy,
        receivedByLabel,
        subject: parsed.subject,
        date: parsed.date,
        preview: parsed.preview,
        bodyHtml: parsed.bodyHtml || "",
        bodyText: parsed.bodyText || "",
        seen: parsed.seen,
        flagged: parsed.flagged,
        hasAttachments: parsed.hasAttachments,
        replied: false,
        archived: false,
        starred: false,
        createdAt: parsed.date,
      });
      synced++;
    } catch (fetchErr) {
      console.error("Failed to sync message:", meta.id, fetchErr);
    }
  }

  return { synced, repaired };
}

export const syncInboxToFirestore = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    try {
      const { synced, repaired } = await runInboxSync();
      return { success: true, synced, repaired };
    } catch (err) {
      console.error("Inbox sync failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to sync inbox");
    }
  },
);
