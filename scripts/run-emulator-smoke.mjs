import { readFile, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

const projectId = process.env.FIREBASE_PROJECT_ID || "creeda-va";
const functionsPort = Number(process.env.FUNCTIONS_EMULATOR_PORT || 5005);
const firestorePort = Number(process.env.FIRESTORE_EMULATOR_PORT || 8085);
const tempConfigPath = join(process.cwd(), ".firebase.emu.temp.json");
const functionsPackagePath = join(process.cwd(), "functions", "package.json");

const targetScript = process.argv[2];
if (!targetScript) {
  console.error("Usage: node scripts/run-emulator-smoke.mjs <target-script>");
  process.exit(1);
}

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
      shell: false,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
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

  await writeFile(tempConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

async function normalizeFunctionsEngineForEmulator() {
  const raw = await readFile(functionsPackagePath, "utf8");
  const parsed = JSON.parse(raw);

  if (parsed?.engines?.node === "22.x") {
    parsed.engines.node = "22";
    await writeFile(functionsPackagePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  }

  return raw;
}

async function main() {
  await createTempEmulatorConfig();
  const originalFunctionsPackageJson = await normalizeFunctionsEngineForEmulator();

  try {
    await run("npm", ["--prefix", "functions", "run", "build"]);
    await run("npx", [
      "-y",
      "firebase-tools@latest",
      "emulators:exec",
      "--config",
      tempConfigPath,
      "--project",
      projectId,
      "--only",
      "functions,firestore",
      `FUNCTIONS_EMULATOR_PORT=${functionsPort} FIRESTORE_EMULATOR_HOST=127.0.0.1:${firestorePort} node ${targetScript}`,
    ]);
  } finally {
    await writeFile(functionsPackagePath, originalFunctionsPackageJson, "utf8");
    await rm(tempConfigPath, { force: true });
  }
}

main().catch((error) => {
  console.error("Emulator smoke runner failed:", error.message);
  process.exit(1);
});
