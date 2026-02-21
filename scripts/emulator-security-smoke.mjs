const projectId = process.env.GCLOUD_PROJECT || "creeda-va";
const region = "us-east4";
const functionsPort = process.env.FUNCTIONS_EMULATOR_PORT || "5005";
const webhookUrl = `http://127.0.0.1:${functionsPort}/${projectId}/${region}/handleFormWebhook`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(method, body) {
  const response = await fetch(webhookUrl, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function run() {
  console.log(`Running security smoke against ${webhookUrl}`);

  const methodCheck = await request("GET");
  assert(methodCheck.status === 405, `Expected 405 for GET, got ${methodCheck.status}`);

  const unsupportedForm = await request("POST", {
    formType: "bad-type",
    name: "Smoke",
    email: "smoke@example.com",
  });
  assert(unsupportedForm.status === 400, `Expected 400 for unsupported formType, got ${unsupportedForm.status}`);

  const invalidEmail = await request("POST", {
    formType: "contact",
    name: "Smoke",
    email: "not-an-email",
    message: "Hello",
  });
  assert(invalidEmail.status === 400, `Expected 400 for invalid email, got ${invalidEmail.status}`);

  const missingMessage = await request("POST", {
    formType: "contact",
    name: "Smoke",
    email: "smoke@example.com",
  });
  assert(missingMessage.status === 400, `Expected 400 for missing contact message, got ${missingMessage.status}`);

  const invalidPhone = await request("POST", {
    formType: "lead",
    name: "Smoke",
    email: "smoke@example.com",
    phone: "invalid***",
  });
  assert(invalidPhone.status === 400, `Expected 400 for invalid phone, got ${invalidPhone.status}`);

  console.log("Security smoke passed");
  console.log("Note: App Check 401 behavior is bypassed in Functions emulator and should be verified in non-emulator env.");
}

run().catch((error) => {
  console.error("Security smoke failed:", error.message);
  process.exit(1);
});
