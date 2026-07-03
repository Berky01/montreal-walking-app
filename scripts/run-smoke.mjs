import { spawn } from "node:child_process";

function resolveCommand(command, args) {
  if (command === "npm" && process.env.npm_execpath) {
    return { file: process.execPath, args: [process.env.npm_execpath, ...args] };
  }

  if (command === "npx" && process.env.npm_execpath) {
    return { file: process.execPath, args: [process.env.npm_execpath, "exec", "--", ...args] };
  }

  return { file: command, args };
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const resolved = resolveCommand(command, args);
    const child = spawn(resolved.file, resolved.args, {
      env: process.env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} ${args.join(" ")} exited via ${signal}`));
        return;
      }

      if (code) {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
        return;
      }

      resolve();
    });
  });
}

try {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    await run("npm", ["run", "build"]);
  }

  await run("npx", ["playwright", "test", "--config=playwright.config.ts", "tests/playwright-smoke.pw.ts"]);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
