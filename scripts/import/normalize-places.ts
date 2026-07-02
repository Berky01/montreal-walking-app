const dryRun = !process.argv.includes("--write");

console.log("Place normalization stub");
console.log(`Mode: ${dryRun ? "dry-run" : "write requested"}`);
console.log("This command is reserved for reviewing candidate places before curated merge.");

if (!dryRun) {
  console.error("Write mode is not implemented. Curated content must not be overwritten by default.");
  process.exit(1);
}

export {};
