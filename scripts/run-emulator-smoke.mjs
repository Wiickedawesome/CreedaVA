import { readFile, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const projectId = process.env.FIREBASE_PROJECT_ID || "demo-creeda-va";
const functionsPort = Number(process.env.FUNCTIONS_EMULATOR_PORT || 5005);
const firestorePort = Number(process.env.FIRESTORE_EMULATOR_PORT || 8085);
const authPort = Number(process.env.AUTH_EMULATOR_PORT || 9098);
const tempConfigPath = join(process.cwd(), ".firebase.emu.temp.json");
const functionsPackagePath = join(process.cwd(), "functions", "package.json");

// Verified locally with `firebase --version` on 2026-11-26. Bump deliberately:
// `@latest` re-resolves from the registry on every run and can stall silently.
const FIREBASE_TOOLS_VERSION = process.env.FIREBASE_TOOLS_VERSION || "15.35.0";

const targetScript = process.argv[2];
if (!targetScript) {
  console.error("Usage: node scripts/run-emulator-smoke.mjs <target-script>");
  process.exit(1);
}


const DEFAULT_TIMEOUT_MS = 180_000;
const BUILD_TIMEOUT_MS = 120_000;
const EMULATOR_TIMEOUT_MS = 300_000;

let activeChild = null;

function killTree(child) {
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    child.kill("SIGKILL");
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (activeChild) killTree(activeChild);
    process.exit(1);
  });
}

function run(command, args, env = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
      shell: false,
      detached: true,
    });
    activeChild = child;

    const timer = setTimeout(() => {
      killTree(child);
      reject(new Error(`${command} ${args.join(" ")} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      activeChild = null;
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      activeChild = null;
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

function emulatorEnv() {
  return {
    CI: "1",
    GCLOUD_PROJECT: projectId,
    GOOGLE_CLOUD_PROJECT: projectId,
    FIREBASE_CONFIG: JSON.stringify({
      projectId,
      storageBucket: `${projectId}.appspot.com`,
    }),
    NODE_NO_WARNINGS: "1",
  };
}

async function createTempEmulatorConfig() {
  const raw = await readFile(join(process.cwd(), "firebase.json"), "utf8");
  const config = JSON.parse(raw);
  config.emulators = config.emulators || {};
  config.emulators.functions = {
    ...(config.emulators.functions || {}),
    port: functionsPort,
  };
  config.emulators.firestore = {
    ...(config.emulators.firestore || {}),
    port: firestorePort,
  };
  config.emulators.auth = {
    ...(config.emulators.auth || {}),
    port: authPort,
  };

  await writeFile(tempConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

async function normalizeFunctionsEngineForEmulator() {
  const raw = await readFile(functionsPackagePath, "utf8");
  const parsed = JSON.parse(raw);

  if (typeof parsed?.engines?.node === "string" && parsed.engines.node.endsWith(".x")) {
    parsed.engines.node = parsed.engines.node.slice(0, -2);
    await writeFile(functionsPackagePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  }

  return raw;
}

async function main() {
  await createTempEmulatorConfig();
  const originalFunctionsPackageJson = await normalizeFunctionsEngineForEmulator();

  try {
    await run("npm", ["--prefix", "functions", "run", "build"], {}, BUILD_TIMEOUT_MS);
    await run("npx", [
      "-y",
      `firebase-tools@${FIREBASE_TOOLS_VERSION}`,
      "emulators:exec",
      "--config",
      tempConfigPath,
      "--project",
      projectId,
      "--only",
      "functions,firestore,auth",
      `FUNCTIONS_EMULATOR_PORT=${functionsPort} FIRESTORE_EMULATOR_HOST=127.0.0.1:${firestorePort} FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:${authPort} node ${targetScript}`,
    ], emulatorEnv(), EMULATOR_TIMEOUT_MS);
  } finally {
    await writeFile(functionsPackagePath, originalFunctionsPackageJson, "utf8");
    await rm(tempConfigPath, { force: true });
  }
}

main().catch((error) => {
  console.error("Emulator smoke runner failed:", error.message);
  process.exit(1);
});
