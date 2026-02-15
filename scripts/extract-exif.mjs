/**
 * Photo Processing Script
 *
 * Reads all images from photos-source/ and:
 *   1. Generates WebP thumbnails (800px wide) in public/assets/img/photography/thumbs/
 *   2. Generates WebP display versions (1920px wide) in public/assets/img/photography/display/
 *   3. Extracts EXIF metadata
 *   4. Merges captions/tags from photos-source/metadata.json (if it exists)
 *   5. Outputs src/data/photos.json
 *   6. Generates photos-source/_preview.html so you can see which file is which
 *
 * Usage: node scripts/extract-exif.mjs
 * Workflow:
 *   1. Drop originals into photos-source/
 *   2. Run: npm run photos:exif
 *   3. Open photos-source/_preview.html in your browser to see thumbnails + filenames
 *   4. Edit photos-source/metadata.json to add captions and tags
 *   5. Run: npm run photos:exif (again, to pick up your metadata changes)
 *   6. Commit and push
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = path.resolve("photos-source");
const METADATA_FILE = path.join(SOURCE_DIR, "metadata.json");
const OUTPUT_DIR = path.resolve("public/assets/img/photography");
const THUMB_DIR = path.join(OUTPUT_DIR, "thumbs");
const DISPLAY_DIR = path.join(OUTPUT_DIR, "display");
const OUTPUT_FILE = path.resolve("src/data/photos.json");
const PREVIEW_FILE = path.join(SOURCE_DIR, "_preview.html");
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
    console.log(
      "Wrote empty photos.json. Drop your photos into photos-source/ and run again."
    );
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

  // Load existing metadata (captions, tags) if available
  let metadata = {};
  if (fs.existsSync(METADATA_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
      // metadata.json is an object keyed by filename
      metadata = raw;
      console.log(
        `Loaded metadata for ${Object.keys(metadata).length} photo(s) from metadata.json`
      );
    } catch (err) {
      console.warn("Warning: Could not parse metadata.json:", err.message);
    }
  }

  // Create output directories
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  fs.mkdirSync(DISPLAY_DIR, { recursive: true });

  const photos = [];

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const baseName = path.basename(file, path.extname(file));
    const webpName = `${baseName}.webp`;
    const userMeta = metadata[file] || {};

    try {
      const image = sharp(filePath);
      const imgMetadata = await image.metadata();
      const exifData = imgMetadata.exif
        ? parseExifBuffer(imgMetadata.exif)
        : {};

      // Generate thumbnail (800px wide)
      const thumbPath = path.join(THUMB_DIR, webpName);
      await sharp(filePath)
        .rotate() // auto-rotate based on EXIF orientation
        .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbPath);
      const thumbSize = fs.statSync(thumbPath).size;

      // Generate display version (1920px wide)
      const displayPath = path.join(DISPLAY_DIR, webpName);
      await sharp(filePath)
        .rotate() // auto-rotate based on EXIF orientation
        .resize(DISPLAY_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: DISPLAY_QUALITY })
        .toFile(displayPath);
      const displaySize = fs.statSync(displayPath).size;

      const originalSize = fs.statSync(filePath).size;

      const photo = {
        thumb: `/assets/img/photography/thumbs/${webpName}`,
        display: `/assets/img/photography/display/${webpName}`,
        alt: userMeta.caption || baseName.replace(/[-_]/g, " "),
        caption: userMeta.caption || "",
        date: exifData.date || "",
        camera: exifData.camera || "",
        tags: userMeta.tags || [],
        exif: {
          focalLength: exifData.focalLength || "",
          aperture: exifData.aperture || "",
          iso: exifData.iso || null,
          shutter: exifData.shutter || "",
          width: imgMetadata.width,
          height: imgMetadata.height,
        },
      };

      photos.push(photo);

      // Store back into metadata for the output file
      if (!metadata[file]) {
        metadata[file] = { caption: "", tags: [] };
      }

      const savings = (
        ((originalSize - thumbSize - displaySize) / originalSize) *
        100
      ).toFixed(0);
      console.log(
        `  ${file}: ${imgMetadata.width}x${imgMetadata.height} | ` +
          `original ${formatBytes(originalSize)} -> ` +
          `thumb ${formatBytes(thumbSize)} + display ${formatBytes(displaySize)} ` +
          `(${savings}% smaller)` +
          (userMeta.caption ? ` [${userMeta.caption}]` : "")
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
    return a.thumb.localeCompare(b.thumb);
  });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(photos, null, 2), "utf-8");
  console.log(`\nWrote ${photos.length} photo(s) to ${OUTPUT_FILE}`);

  // Write metadata.json (preserving existing entries, adding new ones)
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`Wrote ${Object.keys(metadata).length} entries to metadata.json`);

  // Generate preview HTML
  generatePreview(files, metadata, photos);

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
  console.log(
    `\nOpen photos-source/_preview.html in your browser to see thumbnails + filenames.`
  );
  console.log(
    `Edit photos-source/metadata.json to add captions and tags, then run again.`
  );
}

/**
 * Generate a visual HTML preview showing thumbnails with filenames,
 * so the user can identify which DSC file is which photo.
 */
function generatePreview(files, metadata, photos) {
  const cards = files
    .map((file) => {
      const baseName = path.basename(file, path.extname(file));
      const webpName = `${baseName}.webp`;
      const thumbPath = path.resolve(THUMB_DIR, webpName);
      const meta = metadata[file] || {};
      const photo = photos.find((p) => p.thumb.endsWith(webpName));
      const date = photo?.date || "";

      // Use a relative path from photos-source/ to the thumbs directory
      const relThumbPath = path.relative(SOURCE_DIR, thumbPath);

      return `
      <div style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:#fff">
        <img src="${relThumbPath}" style="width:100%;height:200px;object-fit:cover" alt="${file}">
        <div style="padding:8px">
          <strong style="font-size:13px;word-break:break-all">${file}</strong>
          ${date ? `<div style="font-size:11px;color:#666;margin-top:2px">${date}</div>` : ""}
          <div style="font-size:11px;color:#0d7377;margin-top:4px">
            caption: ${meta.caption ? `"${meta.caption}"` : '<em style="color:#999">empty</em>'}
          </div>
          <div style="font-size:11px;color:#0d7377">
            tags: ${meta.tags?.length ? meta.tags.map((t) => `<span style="background:#e0f2f1;padding:1px 6px;border-radius:10px;font-size:10px">${t}</span>`).join(" ") : '<em style="color:#999">none</em>'}
          </div>
        </div>
      </div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Photo Preview — edit metadata.json to add captions and tags</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { font-size: 20px; color: #333; }
    p { color: #666; font-size: 14px; }
    code { background: #e8e8e8; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Photo Preview</h1>
  <p>Use this page to identify your photos by filename, then edit <code>metadata.json</code> (in this same folder) to add captions and tags.</p>
  <p>After editing, run <code>npm run photos:exif</code> again to update the site.</p>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

  fs.writeFileSync(PREVIEW_FILE, html, "utf-8");
}

/**
 * Parse EXIF data from the raw buffer.
 */
function parseExifBuffer(exifBuffer) {
  const result = {};

  try {
    const text = exifBuffer.toString("latin1");

    // Try to extract date - look for EXIF date pattern YYYY:MM:DD HH:MM:SS
    const dateMatch = text.match(
      /(\d{4}):(\d{2}):(\d{2}) \d{2}:\d{2}:\d{2}/
    );
    if (dateMatch) {
      result.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }

    // Camera make and model
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
