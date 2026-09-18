import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "/Users/mart/Downloads/Lucas Jong Portfolio 2";
const OUT = path.resolve("public/photos");
const DATA = path.resolve("src/data/shoots.ts");
const MAX = 1600;
const QUALITY = 78;

const SHOOTS = [
  {
    id: "vogue-2022",
    title: "Vogue Singapore",
    order: 1,
    match: (rel) => /Vogue Cover March 2022/.test(rel) && !rel.includes("Ka Yong"),
    cover: /SGBODY_VOGUESG_SOCIAL/,
  },
  {
    id: "folio-2021",
    title: "Men's Folio",
    order: 2,
    match: (rel) => /mens folio - grooming/i.test(rel),
    cover: /photo_2021-06-03/,
  },
  {
    id: "fenty-2021",
    title: "Fenty",
    order: 3,
    match: (rel) => rel.startsWith("Fenty 2021/") && !rel.includes("Fenty 2021/2023"),
    cover: /1920px Web_/,
  },
  {
    id: "prada-2025",
    title: "Prada",
    order: 4,
    match: (rel) => /PRADA/.test(rel),
    cover: /_47A5035/,
  },
  {
    id: "chanel-2021",
    title: "Chanel",
    order: 5,
    match: (rel) => /FEMALE chanel/i.test(rel),
    cover: /Chanel_0366/,
    skip: /Spread/i,
  },
  {
    id: "adidas-2022",
    title: "adidas",
    order: 6,
    match: (rel) => /ADIDAS SPRING 2022/.test(rel),
    cover: /Full Body_379-Edit/,
  },
  {
    id: "levis-2025",
    title: "Levi's",
    order: 7,
    match: (rel) => /Levis CNY 2025/.test(rel),
    cover: /LNY_M_03A_014/,
  },
  {
    id: "augustman-2025",
    title: "August Man",
    order: 8,
    match: (rel) => /Augustman Jul_25/.test(rel),
    cover: /01_page-0002/,
    skip: /IMG_0878/,
  },
  {
    id: "pin-2021",
    title: "PIN Prestige",
    order: 9,
    match: (rel) => /Pin Prestigue 2021/i.test(rel),
    cover: /PIN-Nov-21_Film_S05_03/,
  },
  {
    id: "muse-2026",
    title: "MU/SE",
    order: 10,
    match: (rel) => /MU_SE/.test(rel) && /\/(4X5|Digital Cover)\//.test(rel),
    cover: /DIGITAL COVER Lucas Jong1/,
  },
  {
    id: "elle-2021",
    title: "ELLE Men",
    order: 11,
    match: (rel) => /ELLE MEN/.test(rel),
    cover: /20210801-2645RGB/,
  },
  {
    id: "atome-2021",
    title: "Atome",
    order: 12,
    match: (rel) => rel.startsWith("ATOME/"),
    cover: /Atome_Feb-2828/,
  },
  {
    id: "folio-2025",
    title: "Men's Folio",
    order: 13,
    match: (rel) => /JEWELLERY SPREAD/.test(rel),
    cover: /JEWELLERY SPREAD3/,
  },
  {
    id: "pin-2022",
    title: "PIN Prestige",
    order: 14,
    match: (rel) => /Pin prestige 2022/i.test(rel) && !rel.includes("Ka Yong"),
    cover: /PIN-JUN-22_Fashion_0249/,
  },
  {
    id: "buzzcut",
    title: "Buzzcut",
    order: 15,
    match: (rel) => /buzzcut season/.test(rel),
    cover: /1920px Web__EN_4301-2/,
  },
  {
    id: "wanjie",
    title: "By Wanjie",
    order: 16,
    match: (rel) => /by wanjie/.test(rel),
    cover: /LUCAS-2/,
  },
  {
    id: "toon-2023",
    title: "By Toon",
    order: 17,
    match: (rel) => /By Toon/.test(rel),
    cover: /NOW0097/,
  },
  {
    id: "arcade-2021",
    title: "Arcade Men",
    order: 18,
    match: (rel) => /arcademen FEB 2021/.test(rel),
    cover: /C2\.JPG/i,
  },
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

function shootOf(rel) {
  return SHOOTS.find((shoot) => shoot.match(rel)) ?? null;
}

function shouldSkip(file, rel, names, shoot) {
  const base = path.basename(file);
  if (/copy/i.test(base)) return true;
  if (shoot?.skip?.test(base) || shoot?.skip?.test(rel)) return true;
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

function serializePhoto(photo) {
  return `{
    id: ${JSON.stringify(photo.id)},
    alt: ${JSON.stringify(photo.alt)},
    width: ${photo.width},
    height: ${photo.height},
    src: ${JSON.stringify(photo.src)},
    src800: ${JSON.stringify(photo.src800)},
  }`;
}

const files = await walk(SRC);
const names = new Set(files.map((file) => path.basename(file)));
const seen = new Set();
const grouped = new Map(SHOOTS.map((shoot) => [shoot.id, []]));

for (const file of files) {
  const rel = path.relative(SRC, file);
  const shoot = shootOf(rel);
  if (!shoot) continue;
  if (shouldSkip(file, rel, names, shoot)) continue;
  const key = path.basename(file).toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  grouped.get(shoot.id).push({ file, rel, shoot });
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const shoots = [];

for (const shoot of [...SHOOTS].sort((a, b) => a.order - b.order)) {
  const items = grouped.get(shoot.id) ?? [];
  if (!items.length) {
    console.warn(`no files for ${shoot.id}`);
    continue;
  }

  items.sort((a, b) => {
    const aCover = shoot.cover.test(a.rel) || shoot.cover.test(path.basename(a.file)) ? 0 : 1;
    const bCover = shoot.cover.test(b.rel) || shoot.cover.test(path.basename(b.file)) ? 0 : 1;
    return aCover - bCover || a.rel.localeCompare(b.rel);
  });

  const photos = [];
  let n = 0;
  for (const item of items) {
    n += 1;
    const id = `${shoot.id}-${String(n).padStart(3, "0")}`;
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

      await image
        .clone()
        .resize({
          width: Math.round(outW / 2),
          height: Math.round(outH / 2),
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY, effort: 4 })
        .toFile(path.join(OUT, `${id}-800.webp`));

      photos.push({
        id,
        alt: `${shoot.title} — Lucas Jong`,
        width: outW,
        height: outH,
        src: `/photos/${id}.webp`,
        src800: `/photos/${id}-800.webp`,
      });
      console.log(`ok ${id} ← ${item.rel}`);
    } catch (error) {
      console.error(`skip ${item.rel}: ${error.message}`);
    }
  }

  if (!photos.length) continue;
  shoots.push({
    id: shoot.id,
    title: shoot.title,
    cover: photos[0],
    photos,
  });
}

const file = `export type Photo = {
  id: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  src800: string;
};

export type Shoot = {
  id: string;
  title: string;
  cover: Photo;
  photos: Photo[];
};

export const shoots: Shoot[] = [
${shoots
  .map(
    (shoot) => `  {
    id: ${JSON.stringify(shoot.id)},
    title: ${JSON.stringify(shoot.title)},
    cover: ${serializePhoto(shoot.cover)},
    photos: [
      ${shoot.photos.map(serializePhoto).join(",\n      ")}
    ],
  }`,
  )
  .join(",\n")}
];
`;

await fs.writeFile(DATA, file);
console.log(`\nWrote ${shoots.length} shoots / ${shoots.reduce((n, s) => n + s.photos.length, 0)} photos`);
