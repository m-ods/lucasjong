import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "/Users/mart/Downloads/Lucas Jong Portfolio 2";
const OUT = path.resolve("public/photos");
const DATA = path.resolve("src/data/photos.ts");
const MAX = 1600;
const QUALITY = 78;

const CAMPAIGNS = [
  { match: /vogue/i, name: "Vogue Singapore", order: 1 },
  { match: /prada/i, name: "Prada", order: 2 },
  { match: /chanel/i, name: "Chanel", order: 3 },
  { match: /fenty/i, name: "Fenty", order: 4 },
  { match: /adidas/i, name: "adidas", order: 5 },
  { match: /g[\s-]?shock/i, name: "G-SHOCK", order: 6 },
  { match: /levi/i, name: "Levi's", order: 7 },
  { match: /atome/i, name: "Atome", order: 8 },
  { match: /august/i, name: "August Man", order: 9 },
  { match: /mens?\s*(folio|'s folio)|men’s folio|mf logo/i, name: "Men's Folio", order: 10 },
  { match: /elle/i, name: "ELLE Men", order: 11 },
  { match: /pin[\s-]?prestig/i, name: "PIN Prestige", order: 12 },
  { match: /mu_se|muse/i, name: "MU/SE", order: 13 },
  { match: /buzzcut|streething|lv shoot/i, name: "Buzzcut", order: 14 },
  { match: /by toon/i, name: "By Toon", order: 15 },
  { match: /wanjie/i, name: "By Wanjie", order: 16 },
  { match: /arcade/i, name: "Arcade Men", order: 17 },
  { match: /eejin/i, name: "EEJIN", order: 18 },
  { match: /ka yong/i, name: "Ka Yong", order: 19 },
];

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (EXT.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

function campaignOf(rel) {
  for (const campaign of CAMPAIGNS) {
    if (campaign.match.test(rel)) return campaign;
  }
  return { name: "Editorial", order: 50 };
}

function shouldSkip(file, rel, names) {
  const base = path.basename(file);
  if (/copy/i.test(base)) return true;
  if (rel.includes("Fenty 2021/2023")) return true;
  if (rel.startsWith("Ka Yong student proj/2022")) return true;
  if (/MU_SE.+\/(DP|SP|Page)\//.test(rel)) return true;
  if (base.startsWith("Print_")) {
    const web = base.replace(/^Print_/, "1920px Web_");
    if (names.has(web)) return true;
  }
  if (/instagram_body_printcover/i.test(base)) return true;
  return false;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function layout(width, height, featured) {
  const ratio = width / height;
  if (featured) return { span: "8", tall: ratio < 1, wide: ratio >= 1 };
  if (ratio > 1.3) return { span: "8", wide: true, tall: false };
  if (ratio > 0.95) return { span: "6", wide: false, tall: false };
  return { span: "4", tall: true, wide: false };
}

const files = await walk(SRC);
const names = new Set(files.map((file) => path.basename(file)));
const seen = new Set();
const selected = files
  .map((file) => {
    const rel = path.relative(SRC, file);
    return { file, rel, campaign: campaignOf(rel) };
  })
  .filter((item) => !shouldSkip(item.file, item.rel, names))
  .sort((a, b) => a.campaign.order - b.campaign.order || a.rel.localeCompare(b.rel))
  .filter((item) => {
    const key = path.basename(item.file).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const photos = [];
const used = new Set();
let featuredLeft = 1;

for (const item of selected) {
  const campaignSlug = slugify(item.campaign.name);
  let n = photos.filter((photo) => photo.campaign === item.campaign.name).length + 1;
  let id = `${campaignSlug}-${String(n).padStart(3, "0")}`;
  while (used.has(id)) {
    n += 1;
    id = `${campaignSlug}-${String(n).padStart(3, "0")}`;
  }
  used.add(id);

  try {
    const image = sharp(item.file, {
      failOn: "none",
      sequentialRead: true,
      limitInputPixels: false,
    }).rotate();
    const meta = await image.metadata();
    const width = meta.width ?? MAX;
    const height = meta.height ?? MAX;
    const scale = Math.min(1, MAX / Math.max(width, height));
    const outW = Math.round(width * scale);
    const outH = Math.round(height * scale);

    await image
      .clone()
      .resize({ width: outW, height: outH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(path.join(OUT, `${id}.webp`));

    const smW = Math.round(outW / 2);
    const smH = Math.round(outH / 2);
    await image
      .clone()
      .resize({ width: smW, height: smH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(path.join(OUT, `${id}-800.webp`));

    const featured = featuredLeft > 0;
    if (featured) featuredLeft -= 1;
    const { span, tall, wide } = layout(outW, outH, featured);

    photos.push({
      id,
      alt: `${item.campaign.name} — Lucas Jong`,
      width: outW,
      height: outH,
      span,
      tall,
      wide,
      campaign: item.campaign.name,
      src: `/photos/${id}.webp`,
      src800: `/photos/${id}-800.webp`,
    });

    console.log(`ok ${id} (${outW}x${outH}) ← ${item.rel}`);
  } catch (error) {
    console.error(`skip ${item.rel}: ${error.message}`);
  }
}

const serialized = photos.map((photo) => {
  const extra = [
    photo.tall ? "tall: true" : null,
    photo.wide ? "wide: true" : null,
  ]
    .filter(Boolean)
    .join(", ");
  return `  {
    id: ${JSON.stringify(photo.id)},
    alt: ${JSON.stringify(photo.alt)},
    width: ${photo.width},
    height: ${photo.height},
    span: ${JSON.stringify(photo.span)},${extra ? `\n    ${extra},` : ""}
    campaign: ${JSON.stringify(photo.campaign)},
    src: ${JSON.stringify(photo.src)},
    src800: ${JSON.stringify(photo.src800)},
  }`;
});

const file = `export type Photo = {
  id: string;
  alt: string;
  width: number;
  height: number;
  span: "4" | "6" | "8";
  tall?: boolean;
  wide?: boolean;
  campaign?: string;
  src?: string;
  src800?: string;
};

export const photos: Photo[] = [
${serialized.join(",\n")}
];
`;

await fs.writeFile(DATA, file);
console.log(`\nWrote ${photos.length} photos to ${OUT}`);
