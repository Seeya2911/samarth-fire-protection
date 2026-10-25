const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const results = {
  htmlFiles: [],
  brokenLinks: [],
  brokenImages: [],
  canonicalIssues: [],
  metadataIssues: [],
  sitemapIssues: [],
  secretScans: [],
  structuredDataIssues: []
};

// 1. Enumerate root HTML files
const rootFiles = fs.readdirSync(rootDir);
const htmlFiles = rootFiles.filter(f => f.endsWith('.html'));
results.htmlFiles = htmlFiles;

console.log(`Found ${htmlFiles.length} HTML files in root.`);

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check Title
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    results.metadataIssues.push({ file, issue: 'Missing or empty <title>' });
  }

  // Check Meta Description
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    results.metadataIssues.push({ file, issue: 'Missing or empty meta description' });
  }

  // Check Canonical URL
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  if (!canonicalMatch) {
    results.canonicalIssues.push({ file, issue: 'Missing canonical link' });
  } else {
    const url = canonicalMatch[1];
    if (!url.startsWith('https://samarthfire.in/')) {
      results.canonicalIssues.push({ file, issue: `Canonical URL does not use https://samarthfire.in/: ${url}` });
    }
  }

  // Check Images
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const imgSrc = match[1];
    // Ignore external or data URLs
    if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://') || imgSrc.startsWith('data:')) {
      continue;
    }
    // Clean query/hash
    const cleanSrc = imgSrc.split('?')[0].split('#')[0];
    const targetPath = path.resolve(rootDir, cleanSrc);
    if (!fs.existsSync(targetPath)) {
      results.brokenImages.push({ file, src: imgSrc, resolvedPath: targetPath });
    }
  }

  // Check Internal Links
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    // Ignore tel, mailto, javascript, external, or pure hash links
    if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      continue;
    }
    const cleanHref = href.split('?')[0].split('#')[0];
    if (!cleanHref) continue;
    const targetPath = path.resolve(rootDir, cleanHref);
    if (!fs.existsSync(targetPath)) {
      results.brokenLinks.push({ file, href, resolvedPath: targetPath });
    }
  }

  // Check JSON-LD
  const schemaRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  while ((match = schemaRegex.exec(content)) !== null) {
    const rawJson = match[1].trim();
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed['@context'] && !parsed['@type']) {
        results.structuredDataIssues.push({ file, issue: 'JSON-LD missing @context or @type' });
      }
    } catch (e) {
      results.structuredDataIssues.push({ file, issue: `Invalid JSON-LD syntax: ${e.message}` });
    }
  }

  // Secret Scanning
  const secretPatterns = [
    /(?:api_key|apikey|secret_key|password|bearer|private_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
    /ghp_[a-zA-Z0-9]{36}/,
    /sk_live_[a-zA-Z0-9]{24}/,
    /AIza[0-9A-Za-z-_]{35}/
  ];
  secretPatterns.forEach(pat => {
    if (pat.test(content)) {
      results.secretScans.push({ file, pattern: pat.toString() });
    }
  });
});

// Check Sitemap.xml
const sitemapPath = path.join(rootDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const locRegex = /<loc>(https:\/\/samarthfire\.in\/[^<]*)<\/loc>/g;
  let locMatch;
  while ((locMatch = locRegex.exec(sitemapContent)) !== null) {
    const fullUrl = locMatch[1];
    let relPath = fullUrl.replace('https://samarthfire.in/', '');
    if (!relPath || relPath === '/') relPath = 'index.html';
    const diskPath = path.join(rootDir, relPath);
    if (!fs.existsSync(diskPath)) {
      results.sitemapIssues.push({ url: fullUrl, missingDiskPath: diskPath });
    }
  }
} else {
  results.sitemapIssues.push({ issue: 'sitemap.xml missing in root' });
}

console.log(JSON.stringify(results, null, 2));
