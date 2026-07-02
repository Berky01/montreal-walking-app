import fs from "node:fs/promises";
import path from "node:path";
import { getAllPlaces } from "@/lib/data/index";
import type { MediaAsset } from "@/lib/types";

type CommonsImageInfo = {
  url?: string;
  thumburl?: string;
  width?: number;
  height?: number;
  mime?: string;
  extmetadata?: Record<string, { value?: string }>;
};

const importedAt = "2026-07-01";
const userAgent = "MeaningfulRoutesPhotoSprint/0.1 local media ingestion";

const curatedCommonsFiles: Record<string, string | null> = {
  "place-darmes": "File:Place d'Armes August 2017 02.jpg",
  "notre-dame-basilica": "File:Basílica de Notre-Dame, Montreal, Canadá, 2017-08-12, DD 07-09 HDR.jpg",
  "pointe-a-calliere": "File:Vue de Pointe-a-Calliere 07.JPG",
  "bonsecours-market": "File:Montreal - QC - Bonsecours Market.jpg",
  "place-jacques-cartier": "File:Place Jacques-Cartier Montreal 2012-05-01.jpg",
  "montreal-city-hall": "File:Montreal City Hall Jan 2006.jpg",
  "crew-collective-cafe": "File:Crew Collective Cafe Montreal.jpg",
  "st-patricks-basilica": "File:Saint Patrick Basilica Montreal.jpg",
  "mary-queen-cathedral": "File:Cathédrale Marie-Reine-du-Monde 2017 02.jpg",
  "mount-royal-chalet": "File:Mount Royal Chalet, Montreal 2.jpg",
  "kondiaronk-belvedere": "File:Kondiaronk Belvedere, Montreal city, Canada.jpg",
  "lachine-canal": "File:Montreal Canal de Lachine 1.jpg",
  "atwater-market": "File:AtwaterMarket.jpg",
  "habitat-67-viewpoint": "File:Habitat 67 Montreal summer sunset view from the river.jpg",
  "saint-louis-square": "File:Saint Louis Square Fountain - Montreal.JPG",
  "rialto-theatre": "File:Rialto Theatre Montreal 01.jpg",
  "fairmount-bagel-area": "File:Fairmount Bagels (84188394).jpg",
  "la-fontaine-park": "File:EntranceParcLaFontaine.jpg",
  "mcgill-arts-building": "File:Arts Building, McGill University.jpg",
  "redpath-museum": "File:Redpath Museum 2012.JPG",
  "old-port-clock-tower": "File:The Montréal Clock Tower at sunrise.jpg",
  "quays-of-old-port": "File:Silo No 5 B1 - Quai de la Pointe-du-Moulin 02.jpg",
  "champ-de-mars": "File:Champ de mars Montreal.JPG",
  "victoria-square": "File:Square Victoria.jpg",
  "dorchester-square": "File:Square Dorchester Montreal.JPG",
  "smith-house-mount-royal": "File:Maison Smith.jpg",
  "beaver-lake": "File:Beaver Lake @ Mount Royal @ Montreal (30119857560).jpg",
  "saint-gabriel-locks": "File:Lachine Canal Enlargement, 1877.jpg",
  "maison-saint-gabriel": "File:Maison Saint-Gabriel.jpg",
  "jean-talon-market": "File:Jean-Talon Market.jpg",
  "place-ville-marie-ring": "File:2022 - L'Anneau à l'Esplanade Place Ville Marie.jpg",
  "place-des-arts": "File:Place des Arts Entree 01.jpg",
  "illuminated-crowd": null,
  "mccord-stewart-museum": "File:McCord Museum.jpg",
  "montreal-museum-fine-arts": "File:Musée des beaux-arts de Montréal (bâtiment de 1991) 2005-11-10.jpg",
  "roddick-gates": "File:Roddick Gates (McGill University) 2005-09-02.jpg",
  "phillips-square": "File:Phillips Square Montreal Conrad Poirier.JPG",
  "square-saint-henri": "File:Parc Saint-Henri 05.JPG",
  "dante-park": "File:Dante Park (WTM by official-ly cool 126).jpg",
  "madonna-della-difesa": "File:Little Italy Church Montreal.JPG",
  "little-italy-saint-laurent": "File:Boulevard Saint-Laurent - petite Italie - Montreal - Quebec - panoramio.jpg",
  "plaza-st-hubert": "File:Plaza St Hubert.JPG",
  "marche-maisonneuve": "File:Maisonneuve Market 03.jpg",
  "botanical-garden-entrance": "File:Botanical Gardens viii..JPG",
  "jean-drapeau-river-view": "File:Saint-Lawrence river with Montreal skyline.jpg",
  "quartier-des-spectacles": "File:Quartier des Spectacles @ Montreal (30319039321).jpg",
  "place-de-la-dauversiere": "File:Place De La Dauversiere.jpg",
  "cours-le-royer": "File:Le cours Le Royer, Montreal, 2005-10-21.JPG",
  "grand-seminaire-montreal": "File:Grand séminaire de Montréal1.JPG",
  "concordia-ev-building": "File:Concordia EV Building.jpg",
  "canadian-centre-architecture": "File:Centre Canadien Architecture Montreal.JPG",
  "laurier-park": "File:Allee Parc Laurier.JPG",
  "st-viateur-bagel-area": "File:St-Viateur Bagel - 263 Saint-Viateur Ouest.jpg",
  "sun-yat-sen-park": "File:Quartier chinois de Montreal 003.JPG",
  "chinatown-paifang": "File:Montréal - païfang Est 20170814.jpg",
  "cabot-square": "File:Square Cabot Montreal.JPG",
  "saint-joseph-oratory": "File:Oratoire Saint-Joseph du Mont-Royal 3.jpg",
  "georges-etienne-cartier-monument": "File:Monument George-Etienne Cartier.JPG",
  "belgo-building": "File:Belgo Montreal 01.JPG",
  "place-jean-riopelle": "File:Jp-riopelle-joute.jpg"
};

async function main() {
  const places = getAllPlaces();
  const outputDir = path.join(process.cwd(), "public", "media", "places");
  const manifestPath = path.join(process.cwd(), "data", "media", "media-assets.json");
  const assets: MediaAsset[] = [];

  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });

  for (const place of places) {
    const title = curatedCommonsFiles[place.id];

    if (!title) {
      continue;
    }

    const info = await getCommonsImageInfo(title);
    const licenseName = metadataText(info, "LicenseShortName") ?? metadataText(info, "UsageTerms");

    if (!info.thumburl || !info.mime?.startsWith("image/") || !isAllowedLicense(licenseName)) {
      console.warn(`Skipping ${place.slug}: unsupported media or license (${licenseName ?? "unknown"}).`);
      continue;
    }

    const extension = extensionFor(info.mime, title);
    const filename = `${place.slug}.${extension}`;
    const localPath = `/media/places/${filename}`;
    const absolutePath = path.join(outputDir, filename);
    await downloadFile(info.thumburl, absolutePath);

    assets.push({
      id: `${place.slug}-wikimedia-photo`,
      type: "image",
      role: "hero",
      localPath,
      url: localPath,
      originalUrl: info.url,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      sourceType: "wikimedia_commons",
      provider: "wikimedia_commons",
      creator: metadataText(info, "Artist") ?? metadataText(info, "Credit") ?? "Wikimedia Commons contributor",
      title: metadataText(info, "ObjectName") ?? title.replace(/^File:/, ""),
      alt: `${place.name} in Montreal.`,
      attributionText: attributionText(info, title),
      licenseName,
      licenseUrl: metadataText(info, "LicenseUrl") ?? fallbackLicenseUrl(licenseName),
      licenseAllowsCommercialUse: true,
      licenseRequiresAttribution: requiresAttribution(licenseName),
      licenseRequiresShareAlike: Boolean(licenseName?.toLowerCase().includes("sa")),
      width: info.width,
      height: info.height,
      placeId: place.id,
      importedAt,
      lastCheckedAt: importedAt,
      confidence: "verified",
      status: "approved"
    });

    console.log(`Imported ${place.slug}: ${title}`);
    await sleep(350);
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(assets, null, 2)}\n`);
  console.log(`Wrote ${assets.length} approved media assets to ${manifestPath}.`);
}

async function getCommonsImageInfo(title: string): Promise<CommonsImageInfo> {
  const params = new URLSearchParams({
    action: "query",
    prop: "imageinfo",
    titles: title,
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
    return getCommonsImageInfo(title);
  }

  if (!response.ok) {
    throw new Error(`Commons request failed for ${title}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { query?: { pages?: Record<string, { imageinfo?: CommonsImageInfo[] }> } };
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];

  if (!info) {
    throw new Error(`Commons file not found: ${title}`);
  }

  return info;
}

async function downloadFile(url: string, targetPath: string, attempt = 1) {
  try {
    const existing = await fs.stat(targetPath);
    if (existing.size > 0) {
      return;
    }
  } catch {
    // File does not exist yet.
  }

  const response = await fetch(url, { headers: { "User-Agent": userAgent } });

  if (response.status === 429 && attempt <= 5) {
    const retrySeconds = Number(response.headers.get("retry-after") ?? "15");
    await sleep(Math.max(15, retrySeconds) * 1000);
    return downloadFile(url, targetPath, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Download failed ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, buffer);
}

function attributionText(info: CommonsImageInfo, title: string): string {
  const creator = metadataText(info, "Artist") ?? metadataText(info, "Credit") ?? "Wikimedia Commons contributor";
  const licenseName = metadataText(info, "LicenseShortName") ?? metadataText(info, "UsageTerms") ?? "open license";
  return `Photo by ${creator}, ${licenseName}, via Wikimedia Commons (${title.replace(/^File:/, "")}).`;
}

function metadataText(info: CommonsImageInfo, key: string): string | undefined {
  const value = info.extmetadata?.[key]?.value;

  if (typeof value !== "string") {
    return undefined;
  }

  return decodeHtml(value);
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function isAllowedLicense(licenseName: string | undefined): boolean {
  const normalized = (licenseName ?? "").toLowerCase();

  if (!normalized || normalized.includes("unknown") || normalized.includes("all rights") || normalized.includes("noncommercial") || normalized.includes("by-nc")) {
    return false;
  }

  return normalized.includes("public domain") || normalized.includes("cc0") || normalized.includes("cc by") || normalized.includes("cc-by") || normalized.includes("attribution") || normalized === "pd";
}

function requiresAttribution(licenseName: string | undefined): boolean {
  const normalized = (licenseName ?? "").toLowerCase();
  return !(normalized.includes("public domain") || normalized.includes("cc0") || normalized === "pd");
}

function fallbackLicenseUrl(licenseName: string | undefined): string | undefined {
  const normalized = (licenseName ?? "").toLowerCase();

  if (normalized.includes("public domain") || normalized === "pd") {
    return "https://creativecommons.org/publicdomain/mark/1.0/";
  }

  if (normalized.includes("cc0")) {
    return "https://creativecommons.org/publicdomain/zero/1.0/";
  }

  return undefined;
}

function extensionFor(mime: string | undefined, title: string): "jpg" | "png" | "webp" {
  if (mime === "image/png" || title.toLowerCase().endsWith(".png")) {
    return "png";
  }

  if (mime === "image/webp" || title.toLowerCase().endsWith(".webp")) {
    return "webp";
  }

  return "jpg";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
