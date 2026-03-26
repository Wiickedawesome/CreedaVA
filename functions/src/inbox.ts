/**
 * Inbox Cloud Function — fetches emails via IMAP (Gmail).
 *
 * Uses the same SMTP credentials from integrations/email config.
 * Supports fetching from multiple aliases by connecting to the same mailbox
 * and filtering by the delivered-to header.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { ImapFlow } from "imapflow";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";
import { simpleParser } from "mailparser";

// ─── Types ───────────────────────────────────────────

interface FetchInboxRequest {
  folder?: string;       // INBOX (default), Sent, Drafts, etc.
  limit?: number;        // max messages to fetch (default 50)
  page?: number;         // for pagination
  filter?: string;       // optional alias filter (e.g. "sales@creedava.com")
  markRead?: boolean;    // whether to mark fetched messages as seen
}

interface InboxMessage {
  uid: number;
  messageId: string;
  from: string;
  fromName: string;
  to: string;
  cc?: string;
  subject: string;
  date: string;
  preview: string;        // first ~200 chars of text body
  bodyHtml?: string;
  bodyText?: string;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  attachments?: { filename: string; contentType: string; size: number }[];
  labels?: string[];
}

// ─── IMAP Connection ─────────────────────────────────

async function getImapClient() {
  const integration = await getIntegrationConfig("email");
  if (!integration || !integration.enabled) {
    throw new HttpsError(
      "failed-precondition",
      "Email integration not enabled. Configure in Admin → Integrations.",
    );
  }

  const { config } = integration;

  // Map SMTP host to IMAP host
  let imapHost = config.imapHost || "";
  if (!imapHost) {
    if (config.host?.includes("gmail")) {
      imapHost = "imap.gmail.com";
    } else if (config.host?.includes("outlook") || config.host?.includes("office365")) {
      imapHost = "outlook.office365.com";
    } else {
      imapHost = config.host?.replace("smtp.", "imap.") || "imap.gmail.com";
    }
  }

  const client = new ImapFlow({
    host: imapHost,
    port: parseInt(config.imapPort || "993"),
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  return { client, config };
}

// ─── Fetch Inbox Messages ────────────────────────────

export const fetchInbox = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 60, ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const data = request.data as FetchInboxRequest;
    const folder = data.folder || "INBOX";
    const limit = Math.min(data.limit || 50, 100);
    const page = data.page || 1;

    const { client, config } = await getImapClient();
    const messages: InboxMessage[] = [];

    try {
      await client.connect();
      const lock = await client.getMailboxLock(folder);

      try {
        const mailbox = client.mailbox;
        if (!mailbox || !mailbox.exists) {
          return { success: true, messages: [], total: 0, folder, page };
        }

        const total = mailbox.exists;
        const startSeq = Math.max(1, total - (page * limit) + 1);
        const endSeq = Math.max(1, total - ((page - 1) * limit));

        // Fetch messages in reverse order (newest first)
        const range = `${startSeq}:${endSeq}`;

        for await (const msg of client.fetch(range, {
          uid: true,
          envelope: true,
          flags: true,
          bodyStructure: true,
          source: true,
        })) {
          try {
            if (!msg.source) continue;
            const parsed = await simpleParser(msg.source as Buffer);

            const fromAddr = parsed.from?.value?.[0]?.address || "";
            const fromName = parsed.from?.value?.[0]?.name || fromAddr;
            const toAddrs = parsed.to
              ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
                  .flatMap((t: { value?: { address?: string }[] }) => t.value || [])
                  .map((v: { address?: string }) => v.address || "")
                  .join(", ")
              : "";
            if (data.filter && !toAddrs.toLowerCase().includes(data.filter.toLowerCase())) {
              continue;
            }

            const textBody = parsed.text || "";
            const preview = textBody.replace(/\s+/g, " ").trim().slice(0, 200);

            const attachments = parsed.attachments?.map((a: { filename?: string; contentType?: string; size?: number }) => ({
              filename: a.filename || "unknown",
              contentType: a.contentType || "application/octet-stream",
              size: a.size || 0,
            })) || [];

            messages.push({
              uid: msg.uid,
              messageId: parsed.messageId || "",
              from: fromAddr,
              fromName,
              to: toAddrs,
              cc: parsed.cc
                ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
                    .flatMap((c: { value?: { address?: string }[] }) => c.value || [])
                    .map((v: { address?: string }) => v.address || "")
                    .join(", ")
                : undefined,
              subject: parsed.subject || "(no subject)",
              date: parsed.date?.toISOString() || new Date().toISOString(),
              preview,
              bodyHtml: parsed.html || undefined,
              bodyText: textBody || undefined,
              seen: msg.flags?.has("\\Seen") || false,
              flagged: msg.flags?.has("\\Flagged") || false,
              hasAttachments: attachments.length > 0,
              attachments: attachments.length > 0 ? attachments : undefined,
            });
          } catch (parseErr) {
            console.error("Failed to parse message:", parseErr);
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();

      // Reverse so newest is first
      messages.reverse();

      return {
        success: true,
        messages,
        total: messages.length,
        folder,
        page,
        aliases: getAliasesFromConfig(config),
      };
    } catch (err) {
      console.error("IMAP fetch failed:", err);
      try { await client.logout(); } catch { /* ignore */ }
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch inbox");
    }
  },
);

// ─── Fetch Single Email ──────────────────────────────

export const fetchEmailMessage = onCall(
  { region: "us-east4", memory: "256MiB", timeoutSeconds: 30, ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const { uid, folder = "INBOX" } = request.data as { uid: number; folder?: string };
    if (!uid) throw new HttpsError("invalid-argument", "Missing uid");

    const { client } = await getImapClient();

    try {
      await client.connect();
      const lock = await client.getMailboxLock(folder);

      try {
        const msg = await client.fetchOne(String(uid), {
          uid: true,
          source: true,
        }, { uid: true });

        if (!msg || !msg.source) {
          throw new HttpsError("not-found", "Message not found");
        }

        const parsed = await simpleParser(msg.source);
        const fromAddr = parsed.from?.value?.[0]?.address || "";
        const fromName = parsed.from?.value?.[0]?.name || fromAddr;

        // Mark as read
        await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });

        return {
          success: true,
          message: {
            uid,
            messageId: parsed.messageId || "",
            from: fromAddr,
            fromName,
            to: parsed.to
              ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
                  .flatMap((t: { value?: { address?: string }[] }) => t.value || [])
                  .map((v: { address?: string }) => v.address || "")
                  .join(", ")
              : "",
            cc: parsed.cc
              ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
                  .flatMap((c: { value?: { address?: string }[] }) => c.value || [])
                  .map((v: { address?: string }) => v.address || "")
                  .join(", ")
              : undefined,
            subject: parsed.subject || "(no subject)",
            date: parsed.date?.toISOString() || new Date().toISOString(),
            bodyHtml: parsed.html || undefined,
            bodyText: parsed.text || undefined,
            hasAttachments: (parsed.attachments?.length || 0) > 0,
            attachments: parsed.attachments?.map((a: { filename?: string; contentType?: string; size?: number }) => ({
              filename: a.filename || "unknown",
              contentType: a.contentType || "application/octet-stream",
              size: a.size || 0,
            })),
          },
        };
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error("Fetch message failed:", err);
      try { await client.logout(); } catch { /* ignore */ }
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch message");
    }
  },
);

// ─── List Mailbox Folders ────────────────────────────

export const listMailboxFolders = onCall(
  { region: "us-east4", memory: "256MiB", timeoutSeconds: 15, ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const { client } = await getImapClient();

    try {
      await client.connect();
      const folders = await client.list();
      await client.logout();

      return {
        success: true,
        folders: folders.map((f) => ({
          name: f.name,
          path: f.path,
          specialUse: f.specialUse || null,
          listed: f.listed,
        })),
      };
    } catch (err) {
      console.error("List folders failed:", err);
      try { await client.logout(); } catch { /* ignore */ }
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to list folders");
    }
  },
);

// ─── Sync Inbox to Firestore (for dashboard widgets) ─

export const syncInboxToFirestore = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 120, ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }
    verifyAdminEmail(request.auth.token.email);

    const { client, config } = await getImapClient();
    const aliases = getAliasesFromConfig(config);
    let synced = 0;

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        const mailbox = client.mailbox;
        if (!mailbox || !mailbox.exists) {
          return { success: true, synced: 0 };
        }

        // Fetch last 100 messages
        const total = mailbox.exists;
        const startSeq = Math.max(1, total - 99);
        const range = `${startSeq}:${total}`;

        for await (const msg of client.fetch(range, {
          uid: true,
          envelope: true,
          flags: true,
          source: true,
        })) {
          try {
            if (!msg.source) continue;
            const parsed = await simpleParser(msg.source as Buffer);
            const messageId = parsed.messageId || `uid-${msg.uid}`;

            // Check if already synced
            const existing = await db.collection("inbox")
              .where("messageId", "==", messageId)
              .limit(1)
              .get();

            if (!existing.empty) continue;

            const fromAddr = parsed.from?.value?.[0]?.address || "";
            const toAddrs = parsed.to
              ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
                  .flatMap((t: { value?: { address?: string }[] }) => t.value || [])
                  .map((v: { address?: string }) => v.address || "")
              : [];

            // Determine which alias received this email
            const receivedBy = toAddrs.find((a: string) =>
              aliases.map((al: string) => al.toLowerCase()).includes(a.toLowerCase()),
            ) || toAddrs[0] || "";

            const textBody = parsed.text || "";

            await db.collection("inbox").add({
              uid: msg.uid,
              messageId,
              from: fromAddr,
              fromName: parsed.from?.value?.[0]?.name || fromAddr,
              to: toAddrs.join(", "),
              receivedBy,
              subject: parsed.subject || "(no subject)",
              date: parsed.date?.toISOString() || new Date().toISOString(),
              preview: textBody.replace(/\s+/g, " ").trim().slice(0, 200),
              bodyHtml: parsed.html || "",
              bodyText: textBody,
              seen: msg.flags?.has("\\Seen") || false,
              flagged: msg.flags?.has("\\Flagged") || false,
              hasAttachments: (parsed.attachments?.length || 0) > 0,
              replied: false,
              archived: false,
              starred: false,
              createdAt: parsed.date?.toISOString() || new Date().toISOString(),
            });
            synced++;
          } catch (parseErr) {
            console.error("Failed to sync message:", parseErr);
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
      return { success: true, synced };
    } catch (err) {
      console.error("Inbox sync failed:", err);
      try { await client.logout(); } catch { /* ignore */ }
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to sync inbox");
    }
  },
);

// ─── Helper ──────────────────────────────────────────

function getAliasesFromConfig(config: Record<string, string>): string[] {
  const list: string[] = [];
  if (config.user) list.push(config.user);
  if (config.aliases) {
    config.aliases.split(",").forEach((s) => {
      const email = s.trim();
      if (email && !list.includes(email)) list.push(email);
    });
  }
  return list;
}
