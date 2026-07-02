import fs from "node:fs";
import path from "node:path";
import { getAllPlaces, getAllRoutes } from "@/lib/data/index";
import { buildMediaCoverageReport } from "@/lib/media/media-selection";

const report = buildMediaCoverageReport({ routes: getAllRoutes(), places: getAllPlaces() });
const outPath = path.join(process.cwd(), "output", "media", "media-coverage-report.json");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
