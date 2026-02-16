/**
 * Google Sheets Cloud Function
 *
 * Exports CRM data (leads, customers, contacts, bookings) to Google Sheets.
 * Auto-creates or updates a shared spreadsheet.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";

// ─── Auth helper ─────────────────────────────────────

async function getSheetsClient() {
  const integration = await getIntegrationConfig("google-sheets");
  const config = integration?.config ?? {};

  let authClient;
  if (config.serviceAccountKey) {
    // Use stored service account JSON key
    const key = JSON.parse(config.serviceAccountKey);
    authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });
  } else {
    // Fall back to Application Default Credentials (Cloud Functions environment)
    authClient = new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });
  }

  const sheets = google.sheets({ version: "v4", auth: authClient });

  return { sheets, spreadsheetId: config.spreadsheetId || "", auth: authClient };
}

// ─── Export CRM Data to Sheets ───────────────────────

export const exportToSheets = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 120 },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const collection = (request.data as { collection?: string })?.collection || "leads";
    const allowedCollections = ["leads", "customers", "contacts", "bookings", "tasks", "campaigns", "blog"];

    if (!allowedCollections.includes(collection)) {
      throw new HttpsError("invalid-argument", `Collection must be one of: ${allowedCollections.join(", ")}`);
    }

    const { sheets, spreadsheetId: existingId } = await getSheetsClient();
    let spreadsheetId = existingId;

    try {
      // Auto-create spreadsheet if none configured
      if (!spreadsheetId) {
        const created = await sheets.spreadsheets.create({
          requestBody: {
            properties: { title: `CreedaVA — ${collection} Export` },
            sheets: [{ properties: { title: collection } }],
          },
        });
        spreadsheetId = created.data.spreadsheetId!;

        // Save the new ID back to config
        const configDoc = await db.collection("integrations").where("provider", "==", "google-sheets").get();
        if (!configDoc.empty) {
          await configDoc.docs[0].ref.update({ "config.spreadsheetId": spreadsheetId });
        }
      }

      // Fetch Firestore data
      const snapshot = await db.collection(collection).orderBy("createdAt", "desc").limit(1000).get();
      if (snapshot.empty) {
        return { success: true, rowCount: 0, spreadsheetId, message: "No data to export" };
      }

      // Build rows — dynamic columns from the first document
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const allKeys = new Set<string>();
      for (const doc of docs) {
        Object.keys(doc).forEach((k) => allKeys.add(k));
      }
      const headers = Array.from(allKeys);
      const rows: (string | number | boolean)[][] = [headers];

      for (const doc of docs) {
        const row = headers.map((h) => {
          const val = (doc as Record<string, unknown>)[h];
          if (val === null || val === undefined) return "";
          if (typeof val === "object") return JSON.stringify(val);
          return val as string | number | boolean;
        });
        rows.push(row);
      }

      // Ensure sheet exists
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];

      if (!existingSheets.includes(collection)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: collection } } }],
          },
        });
      }

      // Clear existing data and write new
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${collection}!A:ZZ`,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${collection}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });

      // Format header row (bold + freeze)
      const sheetId = spreadsheet.data.sheets?.find((s) => s.properties?.title === collection)?.properties?.sheetId;
      if (sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                  cell: {
                    userEnteredFormat: {
                      textFormat: { bold: true },
                      backgroundColor: { red: 0, green: 0.318, blue: 0.282 }, // #005148
                      horizontalAlignment: "CENTER",
                    },
                  },
                  fields: "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)",
                },
              },
              {
                updateSheetProperties: {
                  properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
                  fields: "gridProperties.frozenRowCount",
                },
              },
            ],
          },
        });
      }

      return {
        success: true,
        rowCount: rows.length - 1,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        syncedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Sheets export failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to export to Sheets");
    }
  },
);

// ─── Generate Weekly Report Sheet ────────────────────

export const generateReportSheet = onCall(
  { region: "us-east4", memory: "512MiB", timeoutSeconds: 120 },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { sheets, spreadsheetId: existingReportId } = await getSheetsClient();
    let spreadsheetId = existingReportId;

    try {
      if (!spreadsheetId) {
        const created = await sheets.spreadsheets.create({
          requestBody: {
            properties: { title: "CreedaVA — Weekly Reports" },
          },
        });
        spreadsheetId = created.data.spreadsheetId!;

        const configDoc = await db.collection("integrations").where("provider", "==", "google-sheets").get();
        if (!configDoc.empty) {
          await configDoc.docs[0].ref.update({ "config.spreadsheetId": spreadsheetId });
        }
      }

      // Gather last 7 days of key metrics
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      const [leadsSnap, bookingsSnap, contactsSnap] = await Promise.all([
        db.collection("leads").where("createdAt", ">=", weekAgoISO).get(),
        db.collection("bookings").where("createdAt", ">=", weekAgoISO).get(),
        db.collection("contacts").where("createdAt", ">=", weekAgoISO).get(),
      ]);

      const sheetTitle = `Week of ${weekAgo.toISOString().split("T")[0]}`;
      const rows: (string | number)[][] = [
        ["Metric", "Count", "Period"],
        ["New Leads", leadsSnap.size, `Last 7 days`],
        ["New Bookings", bookingsSnap.size, `Last 7 days`],
        ["New Contacts", contactsSnap.size, `Last 7 days`],
        ["Report Generated", "", new Date().toISOString()],
      ];

      // Add sheet and write data
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: sheetTitle } } }],
          },
        });
      } catch { /* sheet may already exist */ }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetTitle}'!A1`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });

      return {
        success: true,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        sheetTitle,
      };
    } catch (err) {
      console.error("Report sheet failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to generate report sheet");
    }
  },
);
