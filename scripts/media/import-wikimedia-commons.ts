import fs from "node:fs/promises";
import path from "node:path";
import { getPlaces } from "@/lib/data/index";

const userAgent = "MeaningfulRoutesPhotoSprint/0.1 local media candidate search";

async function main() {
  const outPath = path.join(process.cwd(), "output", "media", "commons-candidates.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const results = [];

  for (const place of getPlaces()) {
    const candidates = await searchCommons(`${place.name} Montreal`);
    results.push({ id: place.id, slug: place.slug, name: place.name, candidates });
    console.log(`${place.slug}: ${candidates[0]?.title ?? "no candidates"}`);
    await sleep(1200);
  }

  await fs.writeFile(outPath, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`Wrote ${outPath}.`);
}

async function searchCommons(query: string) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    origin: "*"
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": userAgent }
  });

  if (response.status === 429) {
    const retrySeconds = Number(response.headers.get("retry-after") ?? "10");
    await sleep(Math.max(10, retrySeconds) * 1000);
    return searchCommons(query);
  }

  if (!response.ok) {
    throw new Error(`Commons search failed for ${query}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { query?: { pages?: Record<string, { title: string; imageinfo?: Array<{ thumburl?: string; url?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> }> } };

  return Object.values(data.query?.pages ?? {}).map((page) => ({
    title: page.title,
    thumbUrl: page.imageinfo?.[0]?.thumburl,
    originalUrl: page.imageinfo?.[0]?.url,
    mime: page.imageinfo?.[0]?.mime,
    licenseName: page.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
