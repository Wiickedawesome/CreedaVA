/**
 * Forum Firestore-rules check.
 *
 * Runs against the emulators via `npm run smoke:emulator:forum-rules`
 * (wrapped by run-emulator-smoke.mjs, which supplies the host env vars).
 *
 * Why this exists: the forum rules were changed to bind authorship to the
 * caller. The security smoke does not exercise them, and "the emulator started,
 * so the rules compile" says nothing about whether the rule *decides* correctly.
 * Every assertion below is a REST call made as a real authenticated user, so the
 * rules engine actually evaluates.
 *
 * No dependencies — plain fetch against the emulator REST APIs.
 */

const PROJECT = process.env.GCLOUD_PROJECT || "demo-creeda-va";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9098";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085";
const API_KEY = "fake-api-key";

const FS_BASE = `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;

const results = [];

function record(name, expected, actual) {
  const ok = expected === actual;
  results.push({ name, expected, actual, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (expected ${expected}, got ${actual})`);
}

async function signUp(email) {
  const res = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "test-password-123", returnSecureToken: true }),
    },
  );
  if (!res.ok) throw new Error(`signUp ${email} failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return { uid: body.localId, token: body.idToken };
}

const toFields = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      Array.isArray(v)
        ? { arrayValue: { values: v.map((x) => ({ stringValue: String(x) })) } }
        : typeof v === "number"
          ? { integerValue: String(v) }
          : { stringValue: String(v) },
    ]),
  );

async function create(collection, data, token) {
  const res = await fetch(`${FS_BASE}/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  const body = await res.json().catch(() => ({}));
  const name = body?.name ?? "";
  return { status: res.status, id: name.split("/").pop(), body };
}

async function patch(collection, id, data, token) {
  const mask = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  const res = await fetch(`${FS_BASE}/${collection}/${id}?${mask}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  return res.status;
}

const ok2xx = (s) => s >= 200 && s < 300;

async function main() {
  const author = await signUp("forum-author@example.com");
  const reader = await signUp("forum-reader@example.com");

  const thread = {
    authorId: author.uid,
    author: "Author",
    authorEmail: "forum-author@example.com",
    title: "Original title",
    content: "Original body",
    status: "open",
    replies: 0,
    likes: 0,
    likedBy: [],
    tags: [],
    lang: "en",
  };

  // ── Create ──────────────────────────────────────
  const created = await create("forum", thread, author.token);
  record("author creates own thread", true, ok2xx(created.status));
  const threadId = created.id;
  if (!threadId) throw new Error("thread was not created — later assertions cannot run");

  const spoof = await create("forum", { ...thread }, reader.token);
  record("reader CANNOT create a thread owned by the author", false, ok2xx(spoof.status));

  // ── Update: reaction path ───────────────────────
  const like = await patch("forum", threadId, { likes: 1, likedBy: [reader.uid] }, reader.token);
  record("reader CAN like (writes only likes/likedBy)", true, ok2xx(like));

  // ── Update: translation path ────────────────────
  const translate = await patch(
    "forum",
    threadId,
    { lang: "en", translations: {} },
    reader.token,
  );
  record("reader CAN add translations (writes only lang/translations)", true, ok2xx(translate));

  // ── Update: tampering ───────────────────────────
  const tamper = await patch("forum", threadId, { title: "Tampered" }, reader.token);
  record("reader CANNOT edit the title", false, ok2xx(tamper));

  const steal = await patch("forum", threadId, { authorId: reader.uid }, author.token);
  record("author CANNOT hand the thread to someone else", false, ok2xx(steal));

  const edit = await patch("forum", threadId, { title: "Edited by author" }, author.token);
  record("author CAN edit own thread", true, ok2xx(edit));

  // ── Profiles ────────────────────────────────────
  const profile = await create(
    "forumProfiles",
    { uid: author.uid, displayName: "Author", email: "forum-author@example.com" },
    author.token,
  );
  record("user creates own profile", true, ok2xx(profile.status));

  const stolenProfile = await create(
    "forumProfiles",
    { uid: author.uid, displayName: "Impostor", email: "forum-reader@example.com" },
    reader.token,
  );
  record("user CANNOT create a profile owned by someone else", false, ok2xx(stolenProfile.status));

  if (profile.id) {
    const reassign = await patch(
      "forumProfiles",
      profile.id,
      { uid: reader.uid },
      author.token,
    );
    record("owner CANNOT reassign their profile's uid", false, ok2xx(reassign));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} assertions passed`,
  );
  if (failed.length > 0) {
    console.error("Failed assertions:", failed.map((f) => f.name).join("; "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Forum rules check failed:", err.message);
  process.exit(1);
});
