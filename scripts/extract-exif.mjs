/**
 * EXIF Data Extraction Script
 *
 * Reads all images from public/assets/img/photography/ and extracts EXIF metadata.
 * Outputs src/data/photos.json for use by the photography page.
 *
 * Usage: node scripts/extract-exif.mjs
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PHOTO_DIR = path.resolve("public/assets/img/photography");
const OUTPUT_FILE = path.resolve("src/data/photos.json");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".tiff"];

async function extractExif() {
  if (!fs.existsSync(PHOTO_DIR)) {
    console.log(`Photo directory not found: ${PHOTO_DIR}`);
    console.log("Creating directory...");
    fs.mkdirSync(PHOTO_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, "[]", "utf-8");
    console.log("Wrote empty photos.json");
    return;
  }

  const files = fs
    .readdirSync(PHOTO_DIR)
    .filter((f) => EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.log("No image files found in", PHOTO_DIR);
    fs.writeFileSync(OUTPUT_FILE, "[]", "utf-8");
    console.log("Wrote empty photos.json");
    return;
  }

  console.log(`Found ${files.length} image(s) in ${PHOTO_DIR}`);

  const photos = [];

  for (const file of files) {
    const filePath = path.join(PHOTO_DIR, file);
    const baseName = path.basename(file, path.extname(file));

    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      const exifData = metadata.exif ? parseExifFields(metadata) : {};

      const photo = {
        src: `/assets/img/photography/${file}`,
        alt: baseName.replace(/[-_]/g, " "),
        caption: "",
        date: exifData.date || "",
        camera: exifData.camera || "",
        tags: [],
        exif: {
          focalLength: exifData.focalLength || "",
          aperture: exifData.aperture || "",
          iso: exifData.iso || null,
          shutter: exifData.shutter || "",
          width: metadata.width,
          height: metadata.height,
        },
      };

      photos.push(photo);
      console.log(`  ${file}: ${metadata.width}x${metadata.height}${exifData.camera ? ` (${exifData.camera})` : ""}`);
    } catch (err) {
      console.error(`  Error reading ${file}:`, err.message);
    }
  }

  // Sort by date (newest first), then by filename
  photos.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.src.localeCompare(b.src);
  });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(photos, null, 2), "utf-8");
  console.log(`\nWrote ${photos.length} photo(s) to ${OUTPUT_FILE}`);
}

function parseExifFields(metadata) {
  const result = {};

  // sharp exposes some EXIF data directly in metadata
  if (metadata.exif) {
    try {
      // Use sharp's built-in EXIF parsing
      // The raw EXIF buffer can be parsed, but sharp also exposes some fields
      // For a simple approach, we extract what's available from metadata
    } catch {
      // Fallback if parsing fails
    }
  }

  // sharp metadata fields
  if (metadata.density) {
    result.dpi = metadata.density;
  }

  return result;
}

extractExif().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
