const siteUrl = process.env.SITE_URL || "https://creedava.com";

function normalizeBaseUrl(input) {
  try {
    return new URL(input).origin;
  } catch {
    throw new Error(`Invalid SITE_URL: ${input}`);
  }
}

const baseUrl = normalizeBaseUrl(siteUrl);

async function checkEndpoint(path, validate) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, { redirect: "manual" });
  await validate(response, url);
  console.log(`OK ${response.status} ${path}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log(`Running smoke checks against ${baseUrl}`);

  await checkEndpoint("/", async (response, url) => {
    assert(response.ok, `Expected 2xx for ${url}, got ${response.status}`);
  });

  await checkEndpoint("/robots.txt", async (response, url) => {
    assert(response.ok, `Expected 2xx for ${url}, got ${response.status}`);
    const text = await response.text();
    assert(text.includes("Sitemap:"), `Expected robots.txt to include Sitemap entry`);
  });

  await checkEndpoint("/sitemap.xml", async (response, url) => {
    assert(response.ok, `Expected 2xx for ${url}, got ${response.status}`);
    const text = await response.text();
    assert(text.includes("<urlset") || text.includes("<sitemapindex"), "Expected valid sitemap XML");
  });

  await checkEndpoint("/manifest.webmanifest", async (response, url) => {
    assert(response.ok, `Expected 2xx for ${url}, got ${response.status}`);
  });

  await checkEndpoint("/api/session", async (response, url) => {
    const allowed = [405, 400, 401];
    assert(allowed.includes(response.status), `Expected one of ${allowed.join(", ")} for ${url}, got ${response.status}`);
  });

  console.log("Smoke checks passed");
}

run().catch((error) => {
  console.error("Smoke checks failed:", error.message);
  process.exit(1);
});
