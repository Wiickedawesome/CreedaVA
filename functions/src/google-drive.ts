/**
 * Google Drive Cloud Function
 *
 * Manages client files, proposals, and generated reports in shared Drive folders.
 * Organizes files by client with auto-created subfolders.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";

// ─── Auth helper ─────────────────────────────────────

async function getDriveClient() {
  const integration = await getIntegrationConfig("google-drive");
  if (!integration?.enabled) {
    throw new HttpsError("failed-precondition", "Google Drive integration not enabled. Configure in Admin → Integrations.");
  }
  const config = integration.config;

  let authClient;
  if (config.serviceAccountKey) {
    // Use stored service account JSON key
    const key = JSON.parse(config.serviceAccountKey);
    authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive",
      ],
    });
  } else {
    // Fall back to Application Default Credentials (Cloud Functions environment)
    authClient = new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive",
      ],
    });
  }

  const drive = google.drive({ version: "v3", auth: authClient });

  return { drive, rootFolderId: config.folderId || "" };
}

// ─── List Files in Root Folder ───────────────────────

export const listDriveFiles = onCall(
  { region: "us-east4", memory: "256MiB", ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { drive, rootFolderId } = await getDriveClient();
    const folderId = (request.data as { folderId?: string })?.folderId || rootFolderId;

    try {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,iconLink,thumbnailLink)",
        orderBy: "modifiedTime desc",
        pageSize: 50,
      });

      const files = (res.data.files || []).map((f) => ({
        id: f.id,
        name: f.name,
        type: f.mimeType?.includes("folder") ? "folder" : "file",
        mimeType: f.mimeType,
        size: f.size ? parseInt(f.size) : 0,
        createdAt: f.createdTime,
        modifiedAt: f.modifiedTime,
        webLink: f.webViewLink,
        icon: f.iconLink,
        thumbnail: f.thumbnailLink,
      }));

      return { success: true, files, folderId };
    } catch (err) {
      console.error("Drive list failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to list files");
    }
  },
);

// ─── Create Client Folder ────────────────────────────

export const createClientFolder = onCall(
  { region: "us-east4", ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { clientName, clientId } = request.data as { clientName: string; clientId?: string };
    if (!clientName) throw new HttpsError("invalid-argument", "clientName required");

    const { drive, rootFolderId } = await getDriveClient();

    try {
      // Create client root folder
      const folderRes = await drive.files.create({
        requestBody: {
          name: clientName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [rootFolderId],
        },
        fields: "id,webViewLink",
      });

      const clientFolderId = folderRes.data.id!;

      // Create standard subfolders
      const subfolders = ["Proposals", "Contracts", "Reports", "Assets", "Correspondence"];
      const created: { name: string; id: string }[] = [];

      for (const name of subfolders) {
        const sub = await drive.files.create({
          requestBody: {
            name,
            mimeType: "application/vnd.google-apps.folder",
            parents: [clientFolderId],
          },
          fields: "id",
        });
        created.push({ name, id: sub.data.id! });
      }

      // Save folder reference to Firestore customer doc
      if (clientId) {
        await db.collection("customers").doc(clientId).update({
          driveFolderId: clientFolderId,
          driveFolderUrl: folderRes.data.webViewLink,
        });
      }

      return {
        success: true,
        folderId: clientFolderId,
        folderUrl: folderRes.data.webViewLink,
        subfolders: created,
      };
    } catch (err) {
      console.error("Drive folder creation failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to create folder");
    }
  },
);

// ─── Upload Report to Drive ──────────────────────────

export const uploadReportToDrive = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 60, ingressSettings: "ALLOW_INTERNAL_AND_GCLB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { fileName, content, mimeType, folderId: targetFolderId } =
      request.data as {
        fileName: string;
        content: string; // base64 encoded
        mimeType?: string;
        folderId?: string;
      };

    if (!fileName || !content) {
      throw new HttpsError("invalid-argument", "fileName and content are required");
    }

    const { drive, rootFolderId } = await getDriveClient();
    const parentFolder = targetFolderId || rootFolderId;

    try {
      const buffer = Buffer.from(content, "base64");
      const { Readable } = await import("stream");
      const stream = Readable.from(buffer);

      const res = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [parentFolder],
        },
        media: {
          mimeType: mimeType || "application/pdf",
          body: stream,
        },
        fields: "id,webViewLink,webContentLink",
      });

      return {
        success: true,
        fileId: res.data.id,
        webLink: res.data.webViewLink,
        downloadLink: res.data.webContentLink,
      };
    } catch (err) {
      console.error("Drive upload failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to upload file");
    }
  },
);
