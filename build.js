const fs = require('fs');
const path = require('path');

const distDir = __dirname;
const srcDir = path.join(__dirname, 'src');
const layoutsDir = path.join(srcDir, 'layouts');
const pagesDir = path.join(srcDir, 'pages');

if (!fs.existsSync(layoutsDir) || !fs.existsSync(pagesDir)) {
  console.error('Expected src/layouts and src/pages directories were not found.');
  process.exit(1);
}
const layoutPath = path.join(layoutsDir, 'main.html');
if (!fs.existsSync(layoutPath)) {
  console.error('Layout main.html not found! Please create it first.');
  process.exit(1);
}
const layout = fs.readFileSync(layoutPath, 'utf8');

function extractJsonObject(text, startIndex) {
  const firstBrace = text.indexOf('{', startIndex);
  if (firstBrace === -1) return null;
  let depth = 0, inString = false, escaped = false;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return { value: text.slice(firstBrace, i + 1), end: i + 1 };
  }
  return null;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { data: {}, content: raw };
  let fmText = match[1];
  const data = {};
  const schemaStart = fmText.indexOf('schema:');
  if (schemaStart !== -1) {
    const json = extractJsonObject(fmText, schemaStart);
    if (json) {
      data.schema = json.value;
      fmText = fmText.slice(0, schemaStart) + fmText.slice(json.end);
    }
  }
  const scriptsStart = fmText.indexOf('scripts:');
  if (scriptsStart !== -1) {
    data.scripts = fmText.slice(scriptsStart + 8).replace(/^\s*\|?/, '').trim();
    fmText = fmText.slice(0, scriptsStart);
  }
  fmText.split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && data[key] === undefined) data[key] = value;
  });
  return { data, content: raw.slice(match[0].length) };
}

function toCleanInternalLinks(html) {
  return html.replace(/href=(["'])([^"']+?)\.html([?#][^"']*)?\1/gi, (full, quote, href, suffix = '') => {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) return full;
    return 'href=' + quote + (href === 'index' ? '/' : href) + suffix + quote;
  });
}

function addAttribute(tag, name, value) {
  if (new RegExp('\\b' + name + '=', 'i').test(tag)) return tag;
  return tag.replace(/\s*(\/?)>$/, ' ' + name + '="' + value + '"$1>');
}

function addImageLoadingHints(html) {
  let firstContentImageSeen = false;
  return html.replace(/<img\b[^>]*>/gi, tag => {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    if (!srcMatch) return tag;
    const isLogo = /(?:^|\/)logo(?:\.[a-z0-9]+)?$/i.test(srcMatch[2]);
    let next = addAttribute(tag, 'decoding', 'async');
    if (isLogo) return addAttribute(next, 'loading', 'eager');
    if (!firstContentImageSeen) {
      firstContentImageSeen = true;
      next = addAttribute(next, 'loading', 'eager');
      next = addAttribute(next, 'fetchpriority', 'high');
      return next;
    }
    return addAttribute(next, 'loading', 'lazy');
  });
}

const activeTabs = ['home', 'about', 'process', 'services', 'compliance', 'projects', 'resources', 'blog', 'contact', 'quote'];
for (const file of fs.readdirSync(pagesDir)) {
  const filePath = path.join(pagesDir, file);
  if (fs.statSync(filePath).isDirectory()) continue;
  if (!file.endsWith('.html') && !file.endsWith('.txt') && !file.endsWith('.xml')) {
    fs.copyFileSync(filePath, path.join(distDir, file));
    console.log('Copied asset: ' + file);
    continue;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  if (file.endsWith('.txt') || file.endsWith('.xml')) {
    fs.writeFileSync(path.join(distDir, file), raw, 'utf8');
    console.log('Generated direct file: ' + file);
    continue;
  }
  const parsed = parseFrontmatter(raw);
  const frontmatter = parsed.data;
  let pageHtml = layout;
  activeTabs.forEach(tab => {
    const active = tab === (frontmatter.active || '');
    const placeholder = new RegExp('\\{\\{active_' + tab + '\\}\\}', 'g');
    const activeClass = 'text-brand-maroon font-semibold border-b-2 border-brand-maroon pb-1';
    const inactiveClass = 'text-[#3A3030] hover:text-brand-maroon transition-colors';
    pageHtml = pageHtml.replace(placeholder, active ? activeClass : inactiveClass);
  });
  const slug = file === 'index.html' ? '' : file.replace(/\.html$/i, '');
  let canonicalUrl = frontmatter.canonical || (slug ? 'https://samarthfire.in/' + slug : 'https://samarthfire.in/');
  canonicalUrl = canonicalUrl.replace(/^https:\/\/samarthfire\.in\/([^?#]+)\.html(?=[?#]|$)/i, 'https://samarthfire.in/$1');
  let schema = (frontmatter.schema || '{}').replace(/https:\/\/samarthfire\.in\/([^"\s]+?)\.html(?=["\s])/g, 'https://samarthfire.in/$1');
  pageHtml = pageHtml.replace(/{{canonical}}/g, canonicalUrl);
  pageHtml = pageHtml.replace(/{{title}}/g, frontmatter.title || 'Samarth Fire Protection System');
  pageHtml = pageHtml.replace(/{{description}}/g, frontmatter.description || 'Government Licensed Fire Safety Agency in Malad East, Mumbai');
  pageHtml = pageHtml.replace(/{{schema}}/g, schema);
  pageHtml = pageHtml.replace(/{{content}}/g, parsed.content.trim());
  pageHtml = pageHtml.replace(/{{scripts}}/g, frontmatter.scripts || '');
  pageHtml = toCleanInternalLinks(pageHtml);
  pageHtml = addImageLoadingHints(pageHtml);
  fs.writeFileSync(path.join(distDir, file), pageHtml, 'utf8');
  console.log('Compiled HTML: ' + file);
}
console.log('Build complete.');
