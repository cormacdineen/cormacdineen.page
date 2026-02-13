/**
 * Photo Processing Script
 *
 * Reads all images from photos-source/ and:
 *   1. Generates WebP thumbnails (800px wide) in public/assets/img/photography/thumbs/
 *   2. Generates WebP display versions (1920px wide) in public/assets/img/photography/display/
 *   3. Extracts EXIF metadata
 *   4. Outputs src/data/photos.json
 *
 * Usage: node scripts/extract-exif.mjs
 * Workflow: Drop originals into photos-source/, run this script, commit the output.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = path.resolve("photos-source");
const OUTPUT_DIR = path.resolve("public/assets/img/photography");
const THUMB_DIR = path.join(OUTPUT_DIR, "thumbs");
const DISPLAY_DIR = path.join(OUTPUT_DIR, "display");
const OUTPUT_FILE = path.resolve("src/data/photos.json");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".tiff"];

const THUMB_WIDTH = 800;
const DISPLAY_WIDTH = 1920;
const THUMB_QUALITY = 80;
const DISPLAY_QUALITY = 85;

async function processPhotos() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`Source directory not found: ${SOURCE_DIR}`);
    console.log("Creating directory...");
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, "[]", "utf-8");
    console.log("Wrote empty photos.json. Drop your photos into photos-source/ and run again.");
    return;
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => {
      const fullPath = path.join(SOURCE_DIR, f);
      return (
        fs.statSync(fullPath).isFile() &&
        EXTENSIONS.includes(path.extname(f).toLowerCase())
      );
    })
    .sort();

  if (files.length === 0) {
    console.log("No image files found in", SOURCE_DIR);
    fs.writeFileSync(OUTPUT_FILE, "[]", "utf-8");
    console.log("Wrote empty photos.json");
    return;
  }

  console.log(`Found ${files.length} image(s) in ${SOURCE_DIR}`);

  // Create output directories
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  fs.mkdirSync(DISPLAY_DIR, { recursive: true });

  const photos = [];

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const baseName = path.basename(file, path.extname(file));
    const webpName = `${baseName}.webp`;

    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      const exifData = metadata.exif ? parseExifBuffer(metadata.exif) : {};

      // Generate thumbnail (800px wide)
      const thumbPath = path.join(THUMB_DIR, webpName);
      await sharp(filePath)
        .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbPath);
      const thumbSize = fs.statSync(thumbPath).size;

      // Generate display version (1920px wide)
      const displayPath = path.join(DISPLAY_DIR, webpName);
      await sharp(filePath)
        .resize(DISPLAY_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: DISPLAY_QUALITY })
        .toFile(displayPath);
      const displaySize = fs.statSync(displayPath).size;

      const originalSize = fs.statSync(filePath).size;

      const photo = {
        thumb: `/assets/img/photography/thumbs/${webpName}`,
        display: `/assets/img/photography/display/${webpName}`,
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

      const savings = (
        ((originalSize - thumbSize - displaySize) / originalSize) *
        100
      ).toFixed(0);
      console.log(
        `  ${file}: ${metadata.width}x${metadata.height} | ` +
          `original ${formatBytes(originalSize)} -> ` +
          `thumb ${formatBytes(thumbSize)} + display ${formatBytes(displaySize)} ` +
          `(${savings}% smaller)`
      );
    } catch (err) {
      console.error(`  Error processing ${file}:`, err.message);
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

  // Summary
  const totalOriginal = files.reduce(
    (sum, f) => sum + fs.statSync(path.join(SOURCE_DIR, f)).size,
    0
  );
  const totalThumb = photos.reduce(
    (sum, p) =>
      sum +
      fs.statSync(path.join(OUTPUT_DIR, "thumbs", path.basename(p.thumb)))
        .size,
    0
  );
  const totalDisplay = photos.reduce(
    (sum, p) =>
      sum +
      fs.statSync(path.join(OUTPUT_DIR, "display", path.basename(p.display)))
        .size,
    0
  );

  console.log(`\n--- Summary ---`);
  console.log(`  Originals:     ${formatBytes(totalOriginal)}`);
  console.log(`  Thumbnails:    ${formatBytes(totalThumb)} (grid view)`);
  console.log(`  Display:       ${formatBytes(totalDisplay)} (lightbox)`);
  console.log(
    `  Page load:     ${formatBytes(totalThumb)} (was ${formatBytes(totalOriginal)})`
  );
  console.log(
    `  Reduction:     ${(((totalOriginal - totalThumb) / totalOriginal) * 100).toFixed(0)}% smaller for initial page load`
  );
}

/**
 * Parse EXIF data from the raw buffer using IFD tag reading.
 */
function parseExifBuffer(exifBuffer) {
  const result = {};

  try {
    // The EXIF buffer from sharp starts with "Exif\0\0" header (6 bytes)
    // followed by TIFF data. We'll do a simple text scan for common fields
    // since full IFD parsing is complex and we already have sharp.

    const text = exifBuffer.toString("latin1");

    // Try to extract date - look for EXIF date pattern YYYY:MM:DD HH:MM:SS
    const dateMatch = text.match(/(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/);
    if (dateMatch) {
      result.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }

    // Camera make and model - these are usually null-terminated ASCII strings
    // We look for common camera manufacturer names followed by model info
    const makeModelPatterns = [
      /SONY\0([^\0]+)/,
      /Canon\0([^\0]+)/,
      /NIKON[^\0]*\0([^\0]+)/,
      /FUJIFILM\0([^\0]+)/,
      /Panasonic\0([^\0]+)/,
      /OLYMPUS[^\0]*\0([^\0]+)/,
      /RICOH[^\0]*\0([^\0]+)/,
      /LEICA[^\0]*\0([^\0]+)/,
      /Apple\0([^\0]+)/,
      /samsung\0([^\0]+)/i,
      /Google\0([^\0]+)/,
    ];

    for (const pattern of makeModelPatterns) {
      const match = text.match(pattern);
      if (match) {
        const make = text.match(
          /(SONY|Canon|NIKON|FUJIFILM|Panasonic|OLYMPUS|RICOH|LEICA|Apple|samsung|Google)/i
        );
        result.camera = make
          ? `${make[1]} ${match[1].trim()}`
          : match[1].trim();
        break;
      }
    }
  } catch {
    // Silently fail - EXIF parsing is best-effort
  }

  return result;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

processPhotos().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
