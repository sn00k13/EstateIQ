/**
 * Resize + WebP encode for src/components/images.
 * Writes optimized public/logo.png (PNG) for email / OG URLs.
 * Run from apps/web: node scripts/optimize-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "../src/components/images");
const publicDir = path.join(__dirname, "../public");

/** @type {{ name: string; out: string; maxW: number; quality: number }[]} */
const jobs = [
  { name: "hero-estate.jpg", out: "hero-estate.webp", maxW: 1920, quality: 82 },
  { name: "contactBackground.jpg", out: "contactBackground.webp", maxW: 1920, quality: 80 },
  { name: "frontgate.png", out: "frontgate.webp", maxW: 1920, quality: 85 },
  { name: "Ipad.png", out: "Ipad.webp", maxW: 1200, quality: 85 },
  { name: "kynjousers.png", out: "kynjousers.webp", maxW: 1200, quality: 85 },
  { name: "logo.png", out: "logo.webp", maxW: 450, quality: 90 },
  { name: "LogoIcon.png", out: "LogoIcon.webp", maxW: 128, quality: 90 },
  { name: "FeatureList.png", out: "FeatureList.webp", maxW: 1920, quality: 85 },
  { name: "MobileFeature.png", out: "MobileFeature.webp", maxW: 1200, quality: 85 },
  { name: "logo2.png", out: "logo2.webp", maxW: 450, quality: 90 },
];

async function main() {
  const logoSrc = path.join(imagesDir, "logo.png");
  if (fs.existsSync(logoSrc)) {
    await sharp(logoSrc)
      .resize({ width: 450, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(path.join(publicDir, "logo.png"));
    const pub = fs.statSync(path.join(publicDir, "logo.png"));
    console.log(`public/logo.png: ${(pub.size / 1024).toFixed(1)} KB (PNG for email)`);
  }

  const logo2Src = path.join(publicDir, "logo2.png");
  if (fs.existsSync(logo2Src)) {
    await sharp(logo2Src)
      .resize({ width: 450, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(logo2Src + ".tmp");
    fs.renameSync(logo2Src + ".tmp", logo2Src);
    const s = fs.statSync(logo2Src);
    console.log(`public/logo2.png: ${(s.size / 1024).toFixed(1)} KB`);
  }

  for (const job of jobs) {
    const inputPath = path.join(imagesDir, job.name);
    if (!fs.existsSync(inputPath)) {
      console.warn("Skip (missing):", job.name);
      continue;
    }
    const outPath = path.join(imagesDir, job.out);
    const oldSize = fs.statSync(inputPath).size;
    await sharp(inputPath)
      .resize({ width: job.maxW, withoutEnlargement: true })
      .webp({ quality: job.quality, effort: 6 })
      .toFile(outPath);
    fs.unlinkSync(inputPath);
    const newSize = fs.statSync(outPath).size;
    console.log(
      `${job.name} -> ${job.out}: ${(oldSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
