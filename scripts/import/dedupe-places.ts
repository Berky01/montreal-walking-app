const dryRun = !process.argv.includes("--write");

console.log("Place dedupe stub");
console.log(`Mode: ${dryRun ? "dry-run" : "write requested"}`);
console.log("Future implementation should compare slug, normalized name, source IDs, and coordinate proximity.");

if (!dryRun) {
  console.error("Write mode is not implemented. Dedupe results must be reviewed before curated merges.");
  process.exit(1);
}

export {};
