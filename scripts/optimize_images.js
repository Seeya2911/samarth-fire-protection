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

  // Favicon / app icons and branded social share card (1200x630) from the brand mark
  const logoPageSource = path.join(root, 'src', 'pages', 'logo.png');
  const logo = fs.existsSync(logoPageSource) ? logoPageSource : path.join(root, 'logo.png');

  const logoCard = await sharp(logo)
    .resize(210, 210, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const ogSvg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FAF7F2"/>
          <stop offset="100%" stop-color="#F1E6D8"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect x="0" y="0" width="1200" height="14" fill="#9E2127"/>
      <rect x="0" y="616" width="1200" height="14" fill="#9E2127"/>
      <rect x="76" y="155" width="270" height="270" rx="36" fill="#FFFFFF" stroke="#E2D2C3" stroke-width="4"/>
      <rect x="390" y="155" width="330" height="42" rx="21" fill="#ECFDF5" stroke="#6EE7B7" stroke-width="2"/>
      <circle cx="416" cy="176" r="6" fill="#059669"/>
      <text x="434" y="182" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#065F46" letter-spacing="1.2">CLASS D LICENSED AGENCY</text>
      <text x="390" y="256" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="900" fill="#9E2127">SAMARTH FIRE</text>
      <text x="390" y="314" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="800" fill="#2E2422" letter-spacing="1.5">PROTECTION SYSTEM</text>
      <text x="390" y="372" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600" fill="#554B49">Fire Fighting  •  Detection &amp; Alarms  •  Extinguishers</text>
      <text x="390" y="410" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600" fill="#554B49">Form A &amp; Form B Audits  •  AMC  •  Safety Training</text>
      <line x1="390" y1="448" x2="1110" y2="448" stroke="#DFD5C6" stroke-width="2"/>
      <text x="390" y="492" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#8C4B00">Malad East, Mumbai  •  Licence: MFS/LA/RF-34/RD-35  •  +91 9967101472</text>
    </svg>
  `);

  await sharp(ogSvg)
    .composite([{ input: logoCard, left: 106, top: 185 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(outDir, 'og-default.jpg'));
  manifest['__og'] = { file: 'img/og-default.jpg', width: 1200, height: 630 };

  for (const s of [32, 180, 192, 512]) {
    await sharp(logo).resize(s, s, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(path.join(outDir, `icon-${s}.png`));
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Wrote img/manifest.json');
})().catch(e => { console.error(e); process.exit(1); });
