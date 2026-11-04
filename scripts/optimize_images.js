/**
 * Image optimisation pipeline.
 *
 * Usage:  npm run images
 *
 * For every raster image listed in SOURCES (jpg/png in the project root) this creates
 * responsive AVIF + WebP variants in /img and writes img/manifest.json with the REAL
 * intrinsic dimensions. build.js reads the manifest to:
 *   - wrap <img> in <picture> with AVIF/WebP + srcset
 *   - set accurate width/height (prevents layout shift)
 * Original files are untouched and stay as the <img> fallback.
 *
 * Re-run only when you add or change a photo. Requires: npm i -D sharp
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'img');
const WIDTHS = [480, 800, 1200];
const SKIP = new Set(['logo.png', 'logo_name.png']); // tiny brand marks: keep as-is
// Photos that are withheld from public pages (see docs/BUSINESS_PUBLICATION_APPROVALS.md)
const WITHHELD = new Set(['client_society_assembly.jpg', 'client_cpr_training.jpg']);

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = {};
  // Only process photos that are actually referenced by a page / layout (unused files are ignored).
  const referenced = new Set();
  const scan = dir => fs.readdirSync(dir).forEach(n => {
    const full = path.join(dir, n);
    if (fs.statSync(full).isDirectory()) return scan(full);
    if (!/\.(html|md)$/i.test(n)) return;
    const text = fs.readFileSync(full, 'utf8');
    (text.match(/[A-Za-z0-9_\-]+\.(?:jpe?g|png)/gi) || []).forEach(f => referenced.add(f));
  });
  scan(path.join(root, 'src'));
  const sourceDir = path.join(root, 'src', 'pages');
  const pagePhotos = fs.readdirSync(sourceDir).filter(f => /\.(jpe?g|png)$/i.test(f));
  const rootPhotos = fs.readdirSync(root).filter(f => /\.(jpe?g|png)$/i.test(f));
  const files = [...new Set([...pagePhotos, ...rootPhotos])].filter(f => referenced.has(f) && !SKIP.has(f) && !WITHHELD.has(f));
  for (const file of files) {
    const base = file.replace(/\.[^.]+$/, '');
    const pageSource = path.join(root, 'src', 'pages', file);
    const src = fs.existsSync(pageSource) ? pageSource : path.join(root, file);
    const meta = await sharp(src).metadata();
    const variants = [];
    const isLicense = /^license_page/.test(file); // documents: keep readable, WebP only, no AVIF blur
    for (const w of WIDTHS) {
      if (w > meta.width && !(variants.length === 0)) continue; // never upscale (but always emit one)
      const width = Math.min(w, meta.width);
      const webp = `${base}-${width}.webp`;
      await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: isLicense ? 82 : 76, effort: 5 }).toFile(path.join(outDir, webp));
      let avif = null;
      if (!isLicense) {
        avif = `${base}-${width}.avif`;
        await sharp(src).rotate().resize({ width, withoutEnlargement: true }).avif({ quality: 50, effort: 4 }).toFile(path.join(outDir, avif));
      }
      variants.push({ width, webp, avif });
      if (width === meta.width) break;
    }
    manifest[file] = { width: meta.width, height: meta.height, variants };
    const total = variants.reduce((n, v) => n + fs.statSync(path.join(outDir, v.webp)).size, 0);
    console.log(`${file.padEnd(40)} ${meta.width}x${meta.height}  -> ${variants.length} sizes, WebP total ${(total / 1024).toFixed(0)} KB`);
  }

  // Social share image: 1200x630 crop from an approved field photo
  const ogName = 'client_hydrant_valve_test.jpg';
  const ogPageSource = path.join(root, 'src', 'pages', ogName);
  const ogSrc = fs.existsSync(ogPageSource) ? ogPageSource : path.join(root, ogName);
  await sharp(ogSrc).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(outDir, 'og-default.jpg'));
  manifest['__og'] = { file: 'img/og-default.jpg', width: 1200, height: 630 };

  // Favicon / app icons from the brand mark
  const logoPageSource = path.join(root, 'src', 'pages', 'logo.png');
  const logo = fs.existsSync(logoPageSource) ? logoPageSource : path.join(root, 'logo.png');
  for (const s of [32, 180, 192, 512]) {
    await sharp(logo).resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(path.join(outDir, `icon-${s}.png`));
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Wrote img/manifest.json');
})().catch(e => { console.error(e); process.exit(1); });
