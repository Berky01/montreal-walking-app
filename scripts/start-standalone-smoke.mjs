import { cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const serverPath = join(standaloneDir, "server.js");

if (!existsSync(serverPath)) {
  console.error("Standalone server bundle is missing. Run `npm run build` first.");
  process.exit(1);
}

const staticSource = join(root, ".next", "static");
if (existsSync(staticSource)) {
  await cp(staticSource, join(standaloneDir, ".next", "static"), { recursive: true, force: true });
}

const publicSource = join(root, "public");
if (existsSync(publicSource)) {
  await cp(publicSource, join(standaloneDir, "public"), { recursive: true, force: true });
}

const child = spawn(process.execPath, ["server.js"], {
  cwd: standaloneDir,
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME ?? "127.0.0.1",
    PORT: process.env.PORT ?? "3105"
  },
  stdio: "inherit"
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
