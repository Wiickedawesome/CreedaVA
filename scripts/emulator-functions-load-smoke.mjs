const projectId = process.env.GCLOUD_PROJECT || "creeda-va";
const region = "us-east4";
const functionsPort = process.env.FUNCTIONS_EMULATOR_PORT || "5005";
const baseUrl = `http://127.0.0.1:${functionsPort}/${projectId}/${region}`;
const webhookUrl = `${baseUrl}/handleFormWebhook`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log(`Running functions-load smoke against ${webhookUrl}`);

  const response = await fetch(webhookUrl, { method: "GET" });
  const body = await response.text();

  assert(response.status === 405, `Expected 405 from webhook GET, got ${response.status}. Body: ${body}`);

  console.log("Functions-load smoke passed");
}

run().catch((error) => {
  console.error("Functions-load smoke failed:", error.message);
  process.exit(1);
});
