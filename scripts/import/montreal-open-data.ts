const dryRun = !process.argv.includes("--write");

console.log("Montreal open data import stub");
console.log(`Mode: ${dryRun ? "dry-run" : "write requested"}`);
console.log("No curated content will be overwritten by this stub.");

if (!dryRun) {
  console.error("Write mode is not implemented. Review normalized output before enabling writes.");
  process.exit(1);
}

export {};
