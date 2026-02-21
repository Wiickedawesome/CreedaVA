import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG_PROJECT || "creeda-va";
const region = "us-east4";
const functionsPort = process.env.FUNCTIONS_EMULATOR_PORT || "5001";
const baseUrl = `http://127.0.0.1:${functionsPort}/${projectId}/${region}`;
const webhookUrl = `${baseUrl}/handleFormWebhook`;

initializeApp({ projectId });
const db = getFirestore();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function postWebhook(payload) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Webhook ${payload.formType} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function waitForDoc(queryFactory, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snapshot = await queryFactory().get();
    if (!snapshot.empty) {
      return snapshot.docs[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

async function run() {
  const token = `smoke-${Date.now()}`;
  const contactEmail = `${token}-contact@example.com`;
  const leadEmail = `${token}-lead@example.com`;
  const bookingEmail = `${token}-booking@example.com`;

  console.log(`Running emulator E2E smoke with token: ${token}`);
  console.log(`Webhook URL: ${webhookUrl}`);

  await postWebhook({
    formType: "contact",
    name: "Smoke Contact",
    email: contactEmail,
    phone: "+1 555 111 0001",
    company: "Smoke QA",
    message: "Contact smoke test",
    source: token,
  });

  await postWebhook({
    formType: "lead",
    name: "Smoke Lead",
    email: leadEmail,
    phone: "+1 555 111 0002",
    company: "Smoke QA",
    notes: "Lead smoke test",
    source: token,
    value: 500,
    pageTitle: "Smoke LP",
  });

  await postWebhook({
    formType: "booking",
    name: "Smoke Booking",
    email: bookingEmail,
    phone: "+1 555 111 0003",
    service: "Discovery Call",
    date: "2026-12-01",
    time: "10:30",
    notes: "Booking smoke test",
    source: token,
  });

  const contactDoc = await waitForDoc(() => db.collection("contacts").where("email", "==", contactEmail).limit(1));
  assert(contactDoc, "Contact doc was not created");

  const leadDoc = await waitForDoc(() => db.collection("leads").where("email", "==", leadEmail).limit(1));
  assert(leadDoc, "Lead doc was not created");

  const bookingDoc = await waitForDoc(() => db.collection("bookings").where("email", "==", bookingEmail).limit(1));
  assert(bookingDoc, "Booking doc was not created");

  const bookingData = bookingDoc.data();
  assert(bookingData.status === "pending", `Expected booking status pending, got ${bookingData.status}`);

  const bookingWithSyncMetadata = await waitForDoc(
    () =>
      db
        .collection("bookings")
        .where("email", "==", bookingEmail)
        .where("syncedToCalendar", "in", [true, false])
        .limit(1),
    15000,
  );

  assert(bookingWithSyncMetadata, "Booking calendar-sync side effect fields were not written");

  const bookingSyncData = bookingWithSyncMetadata.data();
  const summary = {
    token,
    contactId: contactDoc.id,
    leadId: leadDoc.id,
    bookingId: bookingWithSyncMetadata.id,
    bookingStatus: bookingSyncData.status,
    syncedToCalendar: bookingSyncData.syncedToCalendar,
    hasCalendarError: Boolean(bookingSyncData.calendarSyncError),
  };

  console.log("E2E smoke passed:");
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error("E2E smoke failed:", error.message);
  process.exit(1);
});