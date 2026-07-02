const dryRun = !process.argv.includes("--write");

console.log("Wikimedia Commons media candidate import stub");
console.log(`Mode: ${dryRun ? "dry-run" : "write requested"}`);
console.log("No media will be published by this stub. Save reviewed candidates before using local media.");

if (!dryRun) {
  console.error("Write mode is not implemented. Media candidates must be reviewed before publication.");
  process.exit(1);
}

export {};
