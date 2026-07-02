const dryRun = !process.argv.includes("--write");

console.log("Import review queue stub");
console.log(`Mode: ${dryRun ? "dry-run" : "write requested"}`);
console.log("Future implementation should promote reviewed candidates, not raw import records.");

if (!dryRun) {
  console.error("Write mode is not implemented. Review queue writes must be explicit and audited.");
  process.exit(1);
}

export {};
