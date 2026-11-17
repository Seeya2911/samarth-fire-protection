/**
 * Samarth Fire Protection System — static site builder
 *
 * Input : src/layouts/main.html, src/pages/*.{html,md,txt,xml}, img/manifest.json
 * Output: compiled pages + generated SEO files in the project root (Vercel serves "." as the output dir)
 *
 * Generated automatically on every build (never edit these by hand):
 *   sitemap.xml · feed.xml · llms.txt · llms-full.txt · every page's JSON-LD graph · <picture> markup
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
let marked = null;
try { ({ marked } = require('marked')); } catch (e) { /* only needed for .md pages */ }

const SITE = 'https://samarthfire.in';
const ORG_ID = SITE + '/#organization';
const SITE_ID = SITE + '/#website';
const FOUNDER_ID = SITE + '/founder#person';
const BUSINESS = 'Samarth Fire Protection System';
const LICENCE_NO = 'MFS/LA/RF-34/RD-35';

const distDir = __dirname;
const srcDir = path.join(__dirname, 'src');
const layoutsDir = path.join(srcDir, 'layouts');
const pagesDir = path.join(srcDir, 'pages');
const imgManifestPath = path.join(__dirname, 'img', 'manifest.json');

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
const imgManifest = fs.existsSync(imgManifestPath) ? JSON.parse(fs.readFileSync(imgManifestPath, 'utf8')) : {};

// Photos withheld from public pages (docs/BUSINESS_PUBLICATION_APPROVALS.md). Never emit these.
const WITHHELD_IMAGES = ['client_society_assembly.jpg', 'client_cpr_training.jpg'];

const CATEGORIES = {
  compliance: { label: 'Compliance & Forms', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  firefighting: { label: 'Hydrants & Pumps', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
  alarm: { label: 'Fire Alarms', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  extinguishers: { label: 'Extinguishers', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  training: { label: 'Training & First Aid', chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  passive: { label: 'Passive Protection', chip: 'bg-purple-50 text-purple-700 border-purple-200' },
  buying: { label: 'Equipment & AMC', chip: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const LLMS_GROUPS = {
  core: ['index', 'about', 'founder', 'certifications', 'contact', 'quote', 'audit'],
  services: ['services', 'fire-fighting', 'detection-alarm', 'extinguishing', 'passive-protection', 'compliance-certification', 'training-preparedness'],
  reference: ['resources', 'glossary', 'service-areas', 'industries', 'projects', 'process', 'blog']
};

/* ------------------------------------------------------------------ helpers */
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

const esc = s => String(s == null ? '' : s).replace(/&(?!#?\w+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decode = s => String(s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&bull;/g, '\u2022').replace(/&middot;/g, '\u00b7').replace(/&ndash;/g, '\u2013').replace(/&mdash;/g, '\u2014').replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018').replace(/&#8377;|&rupee;/g, '\u20b9');
const stripTags = s => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const slugify = s => stripTags(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const fmtDate = d => { try { return new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } };
const urlFor = slug => (slug === 'index' ? SITE + '/' : SITE + '/' + slug);
const withAbs = p => (/^https?:/i.test(p) ? p : SITE + '/' + String(p).replace(/^\//, ''));

function gitDate(file) {
  try {
    const out = execSync('git log -1 --format=%cs -- "' + file + '"', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return out || null;
  } catch (e) { return null; }
}

function splitScripts(html, fn) {
  // apply fn only to markup outside <script>…</script> and <style>…</style>
  return html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/gi).map((part, i) => (i % 2 ? part : fn(part))).join('');
}

function toRootRelativeLinks(html) {
  return splitScripts(html, part => part
    // internal page links: about.html#x -> /about#x, index.html -> /
    .replace(/href=(["'])(?![a-z][a-z0-9+.-]*:|\/\/|#|\?|\/)([^"']+?)\.html([?#][^"']*)?\1/gi, (m, q, href, suffix = '') => 'href=' + q + '/' + (href === 'index' ? '' : href) + suffix + q)
    .replace(/href=(["'])\/index\.html([?#][^"']*)?\1/gi, (m, q, s = '') => 'href=' + q + '/' + s + q)
    .replace(/href=(["'])\/([a-z0-9-]+)\.html([?#][^"']*)?\1/gi, (m, q, p, s = '') => 'href=' + q + '/' + p + s + q)
    // other relative assets: css/styles.css, logo.png, license.pdf
    .replace(/\b(href|src)=(["'])(?![a-z][a-z0-9+.-]*:|\/|#|\?|\{\{)([^"']+)\2/gi, (m, attr, q, val) => attr + '=' + q + '/' + val + q));
}

function getAttr(tag, name) {
  const m = tag.match(new RegExp('\\b' + name + '=(["\'])(.*?)\\1', 'i'));
  return m ? m[2] : null;
}
function setAttr(tag, name, value) {
  const re = new RegExp('\\b' + name + '=(["\'])(.*?)\\1', 'i');
  if (re.test(tag)) return tag.replace(re, name + '="' + value + '"');
  return tag.replace(/\s*(\/?)>$/, ' ' + name + '="' + value + '"$1>');
}
function addAttribute(tag, name, value) {
  if (new RegExp('\\b' + name + '=', 'i').test(tag)) return tag;
  return setAttr(tag, name, value);
}
function removeAttr(tag, name) { return tag.replace(new RegExp('\\s+' + name + '=(["\']).*?\\1', 'i'), ''); }

/** Wrap known photos in <picture> (AVIF → WebP → original), set REAL width/height, add loading hints. */
function enhanceImages(html) {
  let firstContentImageSeen = false;
  return splitScripts(html, part => part.replace(/<img\b[^>]*>/gi, tag => {
    const src = getAttr(tag, 'src');
    if (!src) return tag;
    const clean = src.replace(/^\//, '');
    const entry = imgManifest[clean];
    const isLogo = /^logo(_name)?\.png$/i.test(clean);
    const sizes = getAttr(tag, 'data-sizes') || '(min-width: 1024px) 40vw, 100vw';
    let next = removeAttr(tag, 'data-sizes');
    if (entry) { next = setAttr(next, 'width', entry.width); next = setAttr(next, 'height', entry.height); }
    next = addAttribute(next, 'decoding', 'async');
    if (isLogo) next = addAttribute(next, 'loading', 'eager');
    else if (!firstContentImageSeen) {
      firstContentImageSeen = true;
      next = addAttribute(next, 'loading', 'eager');
      next = addAttribute(next, 'fetchpriority', 'high');
    } else next = addAttribute(next, 'loading', 'lazy');
    if (!entry || !entry.variants) return next;
    const set = key => entry.variants.filter(v => v[key]).map(v => '/img/' + v[key] + ' ' + v.width + 'w').join(', ');
    const avif = set('avif'), webp = set('webp');
    return '<picture>' + (avif ? '<source type="image/avif" srcset="' + avif + '" sizes="' + sizes + '">' : '') +
      (webp ? '<source type="image/webp" srcset="' + webp + '" sizes="' + sizes + '">' : '') + next + '</picture>';
  }));
}

function htmlToText(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<figure[\s\S]*?<\/figure>|<form[\s\S]*?<\/form>|<button[\s\S]*?<\/button>|<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<h1[^>]*>/gi, '\n\n# ').replace(/<h2[^>]*>/gi, '\n\n## ').replace(/<h3[^>]*>/gi, '\n\n### ').replace(/<h4[^>]*>/gi, '\n\n#### ')
    .replace(/<summary[^>]*>/gi, '\n\n### ').replace(/<\/(h1|h2|h3|h4|summary)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ').replace(/<\/(p|div|section|tr|ul|ol|details|table)>/gi, '\n').replace(/<\/t[dh]>/gi, ' | ').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decode(text).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ------------------------------------------------------------------ content extraction */
function extractFaqs(html) {
  const faqs = [];
  const re = /<details[^>]*data-faq[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const q = stripTags(m[1]), a = stripTags(m[2]);
    if (q && a) faqs.push({ q, a });
  }
  return faqs;
}

/** Markdown → guide body: heading ids, TOC, FAQ accordions, table wrappers. */
function renderMarkdown(md) {
  if (!marked) throw new Error('The "marked" package is required to build .md pages (npm install).');
  let html = marked.parse(md, { gfm: true, breaks: false });
  const toc = [];
  html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
    const id = slugify(inner);
    toc.push({ id, text: stripTags(inner) });
    return '<h2 id="' + id + '">' + inner + '</h2>';
  });
  html = html.replace(/<h3>([\s\S]*?)<\/h3>/g, (m, inner) => '<h3 id="' + slugify(inner) + '">' + inner + '</h3>');
  // FAQ section: every <h3> + following content inside <h2 id="faq"> becomes an accordion item
  html = html.replace(/(<h2 id="(?:faq|frequently-asked-questions)">[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2 id=|$)/, (m, h2, rest) => {
    const items = rest.split(/<h3 id="[^"]*">/).slice(1).map(chunk => {
      const end = chunk.indexOf('</h3>');
      const q = chunk.slice(0, end), a = chunk.slice(end + 5);
      return '<details class="faq-item" data-faq><summary>' + q + '</summary><div class="faq-answer">' + a.trim() + '</div></details>';
    });
    return h2 + '<div class="my-6 space-y-3">' + items.join('') + '</div>';
  });
  html = html.replace(/<table>/g, '<div class="my-6 overflow-x-auto rounded-xl border border-slate-200"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, (m, href) => href.startsWith(SITE) ? m : '<a href="' + href + '" target="_blank" rel="noopener noreferrer"');
  return { html, toc };
}

/* ------------------------------------------------------------------ JSON-LD */
const GLOBAL_NODES = () => ([
  {
    '@type': ['HomeAndConstructionBusiness'],
    '@id': ORG_ID,
    name: BUSINESS,
    alternateName: ['Samarth Fire', 'Samarth Fire Protection'],
    url: SITE + '/',
    logo: { '@type': 'ImageObject', '@id': SITE + '/#logo', url: SITE + '/logo.png', width: 112, height: 110 },
    image: [SITE + '/img/og-default.jpg'],
    description: 'Government-licensed (Class D) fire protection agency in Malad East, Mumbai, providing fire-fighting systems, fire detection and alarm systems, fire extinguishers, passive fire protection, Form A / Form B compliance, fire safety audits, AMC and fire-drill training across the Mumbai Metropolitan Region.',
    telephone: '+919967101472',
    email: 'samarthfireprotectionsystem@gmail.com',
    priceRange: '\u20b9\u20b9',
    taxID: '27APXPK0844G1ZJ',
    foundingLocation: 'Mumbai, Maharashtra, India',
    address: { '@type': 'PostalAddress', streetAddress: 'C/611, Parekh Nagar, CTS 710, Pathan Wadi', addressLocality: 'Malad (East)', addressRegion: 'Maharashtra', postalCode: '400097', addressCountry: 'IN' },
    geo: { '@type': 'GeoCoordinates', latitude: 19.1824479, longitude: 72.859666 },
    openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '09:00', closes: '20:00' },
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: '+919967101472', email: 'samarthfireprotectionsystem@gmail.com', areaServed: 'IN', availableLanguage: ['English', 'Hindi', 'Marathi'] }],
    areaServed: [
      { '@type': 'City', name: 'Mumbai' },
      { '@type': 'AdministrativeArea', name: 'Mumbai Metropolitan Region' },
      { '@type': 'City', name: 'Thane' },
      { '@type': 'City', name: 'Navi Mumbai' }
    ],
    knowsAbout: ['Fire hydrant systems', 'Sprinkler systems', 'Fire detection and alarm systems', 'Portable fire extinguishers', 'Passive fire protection', 'Maharashtra Fire Prevention and Life Safety Measures Act, 2006', 'Form A and Form B fire compliance', 'Fire safety audits', 'Fire drills and evacuation planning'],
    numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 25 },
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'Maharashtra Fire Services Licence (Form N)', value: LICENCE_NO },
      { '@type': 'PropertyValue', propertyID: 'GSTIN', value: '27APXPK0844G1ZJ' }
    ],
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      name: 'Class D Licensed Agency for Fire Prevention and Life Safety Measures (' + LICENCE_NO + ')',
      credentialCategory: 'license',
      validFrom: '2026-01-14',
      validUntil: '2028-01-13',
      recognizedBy: { '@type': 'GovernmentOrganization', name: 'Directorate of Maharashtra Fire & Emergency Services', url: 'https://mahafireservice.gov.in/' }
    },
    founder: { '@id': FOUNDER_ID },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Fire protection services',
      itemListElement: [
        ['Fire fighting & sprinkler systems', 'fire-fighting'],
        ['Fire detection & alarm systems', 'detection-alarm'],
        ['Fire extinguisher supply, refilling & hydro-testing', 'extinguishing'],
        ['Passive fire protection', 'passive-protection'],
        ['Form A / Form B compliance certification', 'compliance-certification'],
        ['Fire safety training & mock drills', 'training-preparedness'],
        ['Fire safety audit & assessment', 'audit']
      ].map(([name, slug]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, url: SITE + '/' + slug, provider: { '@id': ORG_ID } } }))
    }
  },
  {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE + '/',
    name: BUSINESS,
    inLanguage: 'en-IN',
    publisher: { '@id': ORG_ID }
  },
  {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: 'Sameer M. Kangutkar',
    jobTitle: 'Founder & Principal Fire Safety Consultant',
    url: SITE + '/founder',
    worksFor: { '@id': ORG_ID }
  }
]);

/** Replace nested copies of the business entity with a reference to the single canonical node. */
function dedupeEntities(node) {
  if (Array.isArray(node)) return node.map(dedupeEntities);
  if (!node || typeof node !== 'object') return node;
  const type = [].concat(node['@type'] || []);
  const isBusiness = (type.includes('Organization') || type.includes('HomeAndConstructionBusiness') || type.includes('LocalBusiness')) && node.name === BUSINESS;
  if (isBusiness && !node['@id']) return { '@id': ORG_ID };
  const out = {};
  for (const k of Object.keys(node)) out[k] = dedupeEntities(node[k]);
  return out;
}

function buildSchema(page) {
  const fm = page.fm;
  let pageNodes = [];
  if (fm.schema) {
    try {
      const raw = fm.schema.replace(/https:\/\/samarthfire\.in\/([^"\s]+?)\.html(?=["\s])/g, 'https://samarthfire.in/$1');
      const parsed = JSON.parse(raw);
      const list = parsed['@graph'] ? parsed['@graph'] : [parsed];
      pageNodes = list.map(n => { const c = Object.assign({}, n); delete c['@context']; return dedupeEntities(c); });
    } catch (e) { throw new Error('Invalid JSON-LD in frontmatter of ' + page.file + ': ' + e.message); }
  }
  const types = pageNodes.map(n => [].concat(n['@type'] || [])).flat();
  const hasType = t => types.includes(t);

  // Service pages: stable ids + canonical provider
  pageNodes.forEach(n => {
    const t = [].concat(n['@type'] || []);
    if (t.includes('Service')) { n['@id'] = n['@id'] || page.url + '#service'; n.url = n.url || page.url; n.provider = { '@id': ORG_ID }; }
    if (t.includes('AboutPage') || t.includes('ContactPage') || t.includes('CollectionPage') || t.includes('WebPage')) {
      n['@id'] = n['@id'] || page.url + '#webpage';
      n.url = page.url; n.isPartOf = { '@id': SITE_ID }; n.inLanguage = 'en-IN'; n.about = n.about || { '@id': ORG_ID };
      if (page.fm.modified) n.dateModified = page.fm.modified;
    }
    if (t.includes('ProfilePage')) { n['@id'] = page.url + '#webpage'; n.url = page.url; n.isPartOf = { '@id': SITE_ID }; if (n.mainEntity) n.mainEntity = { '@id': FOUNDER_ID }; }
  });

  // Plain pages without any page-level node
  const pageLevel = ['WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ProfilePage', 'Blog', 'Article', 'HowTo', 'FAQPage', 'HomePage'];
  const pageId = page.url + '#webpage';
  if (!types.some(t => pageLevel.includes(t))) {
    const node = { '@type': 'WebPage', '@id': pageId, url: page.url, name: fm.title, description: fm.description, isPartOf: { '@id': SITE_ID }, about: { '@id': ORG_ID }, inLanguage: 'en-IN' };
    if (fm.modified) node.dateModified = fm.modified;
    if (page.ogImage) node.primaryImageOfPage = { '@type': 'ImageObject', url: page.ogImage };
    pageNodes.unshift(node);
  }

  // Breadcrumbs
  if (page.slug !== 'index' && !hasType('BreadcrumbList') && fm.type !== '404') {
    const trail = [['Home', SITE + '/']];
    const parent = fm.parent;
    const parents = { services: ['Services', SITE + '/services'], blog: ['Blogs', SITE + '/blog'], about: ['About', SITE + '/about'], resources: ['Resources', SITE + '/resources'] };
    if (parent && parents[parent]) trail.push(parents[parent]);
    trail.push([fm.crumb || fm.title.split('|')[0].trim(), page.url]);
    pageNodes.push({ '@type': 'BreadcrumbList', '@id': page.url + '#breadcrumb', itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t[0], item: t[1] })) });
  }
  // FAQ — generated from the visible accordion so schema always equals on-page text
  if (!hasType('FAQPage') && page.faqs && page.faqs.length) {
    pageNodes.push({ '@type': 'FAQPage', '@id': page.url + '#faq', url: page.url, mainEntity: page.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  }
  return { '@context': 'https://schema.org', '@graph': [...GLOBAL_NODES(), ...pageNodes] };
}

/* ------------------------------------------------------------------ guide / page templates */
const CTA_BLOCK = (heading, text) => `
<div class="mt-12 bg-brand-base text-white p-7 sm:p-9 border-t-4 border-brand-red hard-shadow-spec relative">
  <div class="inline-block px-2 py-0.5 border border-white/20 bg-white/10 font-mono text-[10px] uppercase font-bold text-amber-400 mb-2">Direct Field Engineering Support</div>
  <h2 class="font-headline font-bold text-2xl uppercase tracking-wide text-white">${heading}</h2>
  <p class="text-xs sm:text-sm text-slate-300 font-body mt-2 leading-relaxed max-w-2xl">${text}</p>
  <div class="flex flex-wrap gap-3 mt-6">
    <a href="quote.html" class="inline-flex items-center justify-center bg-brand-red hover:bg-brand-redDark text-white px-5 py-3 text-xs font-mono uppercase font-bold tracking-wider focus-ring">Request a quotation</a>
    <a href="https://wa.me/919967101472" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center bg-[#25D366] text-white px-5 py-3 text-xs font-mono uppercase font-bold tracking-wider">WhatsApp 99671 01472</a>
    <a href="tel:+919967101472" class="inline-flex items-center justify-center border border-white/30 hover:border-white text-white px-5 py-3 text-xs font-mono uppercase font-bold tracking-wider">Call Dispatch</a>
  </div>
</div>`;

const AUTHOR_BLOCK = `
<aside class="mt-8 flex gap-4 items-start border border-brand-line bg-brand-canvas p-5 hard-shadow-spec" aria-label="About the publisher">
  <img src="logo.png" alt="Samarth Fire Protection System emblem" width="48" height="48" class="h-12 w-12 object-contain flex-shrink-0">
  <div class="text-xs sm:text-sm text-slate-700 font-body leading-relaxed"><strong class="text-brand-base uppercase font-mono font-bold">Published by Samarth Fire Protection System</strong> — Directorate of Maharashtra Fire &amp; Emergency Services Class D Licensed Agency (Licence No. <span class="font-mono font-bold">${LICENCE_NO}</span>) based in Malad East, Mumbai. Principal consultant: <a href="founder.html" class="text-brand-red font-semibold underline">Sameer M. Kangutkar</a>.</div>
</aside>
<p class="mt-6 text-[11px] font-mono text-slate-500 leading-relaxed uppercase">Statutory Notice: This technical bulletin provides general engineering context. It is not legal counsel, emergency instruction, or substitute for approved building drawings or statutory fire-safety certification under Maharashtra Fire Prevention and Life Safety Measures Act, 2006.</p>`;

function renderGuide(page, body, toc, readMin, related) {
  const fm = page.fm;
  const cat = CATEGORIES[fm.category] || CATEGORIES.compliance;
  const tocHtml = toc.map((t, i) => `<a class="block text-xs font-mono uppercase text-slate-600 hover:text-brand-red py-1.5 leading-snug" href="#${t.id}">[${i + 1}] ${esc(t.text)}</a>`).join('');
  const hero = fm.image ? `<figure class="border border-brand-line hard-shadow-spec mb-10 bg-brand-canvas"><img src="${fm.image}" alt="${esc(fm.imageAlt || fm.title)}" class="w-full max-h-[460px] object-cover" data-sizes="(min-width: 1152px) 1100px, 100vw"></figure>` : '';
  return `
<section class="bg-brand-canvas py-12 sm:py-16 border-b border-brand-line">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-slate-500 mb-4 flex items-center gap-2"><a href="index.html" class="hover:text-brand-red">HOME</a> <span>/</span> <a href="blog.html" class="hover:text-brand-red">BULLETINS</a> <span>/</span> <span class="text-brand-base font-bold uppercase">${esc(fm.crumb || fm.title.split('|')[0].trim())}</span></nav>
    <span class="inline-flex items-center px-2.5 py-0.5 border border-brand-line text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-brand-base">${cat.label}</span>
    <h1 class="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wide text-brand-base max-w-4xl mt-3">${esc(fm.h1 || fm.title.split('|')[0].trim())}</h1>
    <p class="text-base sm:text-lg text-slate-700 font-body leading-relaxed mt-4 max-w-3xl">${esc(fm.lead || fm.description)}</p>
    <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-slate-500">
      <span class="inline-flex items-center gap-1.5"><time datetime="${fm.published}">Published ${fmtDate(fm.published)}</time></span>
      ${fm.modified && fm.modified !== fm.published ? `<span>Updated <time datetime="${fm.modified}">${fmtDate(fm.modified)}</time></span>` : ''}
      <span>${readMin} MIN READ</span>
      <span>LICENCE ${LICENCE_NO}</span>
    </div>
  </div>
</section>
<div class="py-10 sm:py-14 bg-white"><div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
  ${hero}
  <div class="grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
    <aside class="lg:sticky lg:top-28 space-y-4">
      <details class="bg-brand-canvas border border-brand-line hard-shadow-spec p-5 group" open>
        <summary class="font-headline font-bold text-sm text-brand-base uppercase tracking-wider cursor-pointer list-none flex items-center justify-between">Section Index <span class="text-slate-400 font-mono group-open:rotate-180 transition-transform" aria-hidden="true">▾</span></summary>
        <div class="mt-3 divide-y divide-slate-100">${tocHtml}</div>
      </details>
    </aside>
    <article class="min-w-0">
      <div class="prose-guide">${body}</div>
      ${CTA_BLOCK(esc(fm.ctaHeading || 'Need a building-specific assessment?'), esc(fm.ctaText || 'Samarth Fire Protection System provides fire-safety assessment, system maintenance and compliance support across Mumbai and the wider MMR. Scope and statutory requirements are confirmed for each property.'))}
      ${AUTHOR_BLOCK}
    </article>
  </div>
</div></div>
${related}`;
}

function renderRelated(current, articles) {
  const others = articles.filter(a => a.slug !== current.slug);
  const same = others.filter(a => a.fm.category === current.fm.category);
  const pick = [...same, ...others.filter(a => !same.includes(a))].slice(0, 3);
  if (!pick.length) return '';
  return `<section class="bg-brand-canvas border-t border-brand-line py-12"><div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><div class="mb-6"><div class="inline-block px-2.5 py-0.5 border border-brand-line bg-white font-mono text-[10px] uppercase font-bold text-brand-base mb-1">Index Reference</div><h2 class="font-headline font-bold text-2xl uppercase tracking-wide text-brand-base">Related Engineering Bulletins</h2></div><div class="grid grid-cols-1 md:grid-cols-3 gap-6">${pick.map(a => articleCard(a, false)).join('')}</div></div></section>`;
}

function articleCard(a, withData) {
  const fm = a.fm;
  const cat = CATEGORIES[fm.category] || CATEGORIES.compliance;
  return `<article class="group bg-white border border-brand-line overflow-hidden hard-shadow-spec hover:border-brand-base transition-colors duration-200 flex flex-col"${withData ? ' data-cat="' + (fm.category || '') + '"' : ''}>
  <a href="${a.slug}.html" class="block aspect-[16/10] overflow-hidden bg-brand-canvas border-b border-brand-line relative" tabindex="-1" aria-hidden="true">
    <img src="${fm.image || 'hero_panel.jpg'}" alt="${esc(fm.imageAlt || fm.title)}" class="w-full h-full object-cover filter contrast-[1.02] group-hover:scale-102 transition-transform duration-300" data-sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw">
    <div class="absolute top-2 left-2 px-2 py-0.5 bg-brand-base text-white font-mono text-[10px] uppercase font-bold tracking-wider">SEC ${fm.category ? fm.category.substring(0, 4).toUpperCase() : 'DOC'}</div>
  </a>
  <div class="p-5 flex flex-col flex-1">
    <span class="self-start inline-flex px-2 py-0.5 border border-brand-line text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-canvas text-brand-base">${cat.label}</span>
    <h3 class="font-headline font-bold text-lg text-brand-base uppercase tracking-tight mt-3 leading-snug"><a href="${a.slug}.html" class="hover:text-brand-red transition-colors">${esc(fm.cardTitle || fm.crumb || fm.title.split('|')[0].trim())}</a></h3>
    <p class="text-xs text-slate-600 font-body mt-2 leading-relaxed flex-1">${esc(fm.cardText || fm.description)}</p>
    <div class="mt-4 pt-3 border-t border-brand-line/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
      <span>${fm.published ? fmtDate(fm.published) : 'BULLETIN'}</span>
      <span class="font-bold text-brand-red uppercase group-hover:underline">Read Spec [${a.readMin || 6} MIN]</span>
    </div>
  </div></article>`;
}

function renderPlainPage(page, body, toc) {
  const fm = page.fm;
  const tocHtml = toc.length > 3 ? `<nav aria-label="Contents" class="mt-8 flex flex-wrap gap-2">${toc.map(t => `<a href="#${t.id}" class="text-xs font-mono font-semibold px-3 py-1 bg-white border border-brand-line text-slate-700 hover:border-brand-base hover:text-brand-base">${esc(t.text)}</a>`).join('')}</nav>` : '';
  return `
<section class="bg-brand-canvas py-12 sm:py-16 border-b border-brand-line relative">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-slate-500 mb-4 flex items-center gap-2"><a href="index.html" class="hover:text-brand-red">HOME</a> <span>/</span> <span class="text-brand-base font-bold uppercase">${esc(fm.crumb || fm.title.split('|')[0].trim())}</span></nav>
    <div class="inline-block px-2.5 py-0.5 border border-brand-line bg-white font-mono text-[10px] uppercase font-bold text-brand-base mb-3">Statutory Engineering Specification</div>
    <h1 class="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wide text-brand-base max-w-4xl">${esc(fm.h1 || fm.title.split('|')[0].trim())}</h1>
    <p class="text-base sm:text-lg text-slate-700 font-body leading-relaxed mt-4 max-w-3xl">${esc(fm.lead || fm.description)}</p>
    ${tocHtml}
  </div>
</section>
<div class="py-12 sm:py-16 bg-white"><div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
  <div class="prose-guide">${body}</div>
  ${CTA_BLOCK(esc(fm.ctaHeading || 'Talk to a licensed fire agency in Malad East'), esc(fm.ctaText || 'Tell us about your building and we will confirm scope, statutory requirements and a quotation after a site assessment.'))}
</div></div>`;
}

// Extract section anchors for HTML-based guide templates, as well as Markdown guides.
function extractHtmlToc(html) {
  const entries = [];
  const re = /<section\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = re.exec(html))) {
    const heading = match[2].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    if (!heading) continue;
    const label = stripTags(heading[1]).replace(/\s+/g, ' ').trim();
    if (label) entries.push({ id: match[1], text: label });
  }
  return entries;
}

/* ------------------------------------------------------------------ load pages */
const pages = [];
const passthrough = [];
for (const file of fs.readdirSync(pagesDir)) {
  const filePath = path.join(pagesDir, file);
  if (fs.statSync(filePath).isDirectory()) continue;
  if (file === 'sitemap.xml') continue; // generated
  if (!/\.(html|md)$/i.test(file)) { passthrough.push(file); continue; }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(raw);
  const slug = file.replace(/\.(html|md)$/i, '');
  const fm = parsed.data;
  if (!fm.modified) fm.modified = gitDate('src/pages/' + file) || fm.published || null;
  const url = fm.canonical ? fm.canonical.replace(/\.html(?=[?#]|$)/, '') : urlFor(slug);
  pages.push({ file: slug + '.html', srcFile: file, slug, url, fm, raw: parsed.content, isMd: /\.md$/i.test(file) });
}

// Pass 1: render bodies so we can reuse FAQs / read time / card data
for (const p of pages) {
  let body = p.raw.trim();
  p.toc = [];
  if (p.isMd) {
    const r = renderMarkdown(body);
    body = r.html; p.toc = r.toc;
  } else if (p.fm.template === 'guide') {
    p.toc = extractHtmlToc(body);
  }
  p.body = body.replace(/<main\b/gi, '<div').replace(/<\/main>/gi, '</div>'); // layout already provides <main>
  p.faqs = extractFaqs(p.body);
  p.words = stripTags(p.body).split(/\s+/).length;
  p.readMin = Math.max(3, Math.round(p.words / 210));
}
const articles = pages.filter(p => p.fm.type === 'article').sort((a, b) => String(b.fm.published).localeCompare(String(a.fm.published)) || a.slug.localeCompare(b.slug));

/* ------------------------------------------------------------------ compile pages */
const activeTabs = ['home', 'about', 'process', 'services', 'compliance', 'projects', 'resources', 'blog', 'contact', 'quote', 'industries'];
const compiled = {};
for (const p of pages) {
  const fm = p.fm;
  let content = p.body;
  if (fm.template === 'guide') content = renderGuide(p, p.body, p.toc, p.readMin, renderRelated(p, articles));
  else if (fm.template === 'page') content = renderPlainPage(p, p.body, p.toc);
  else if (fm.type === 'article') content += renderRelated(p, articles);

  if (fm.type === 'blog-index') {
    const cats = Object.keys(CATEGORIES).filter(c => articles.some(a => a.fm.category === c));
    content = content
      .replace(/{{blog_filters}}/g, '<button type="button" data-filter="all" class="blog-filter is-active">All blogs</button>' + cats.map(c => `<button type="button" data-filter="${c}" class="blog-filter">${CATEGORIES[c].label}</button>`).join(''))
      .replace(/{{blog_featured}}/g, () => articles[0] ? articleCard(articles[0], false) : '')
      .replace(/{{blog_cards}}/g, () => articles.map(a => articleCard(a, true)).join(''))
      .replace(/{{blog_count}}/g, String(articles.length));
    p.faqs = extractFaqs(content);
  }

  p.ogImage = withAbs(fm.ogImage || (imgManifest.__og ? imgManifest.__og.file : 'client_hydrant_valve_test.jpg'));
  if (fm.image && !fm.ogImage) p.ogImage = withAbs(fm.image);
  p.isArticle = fm.type === 'article';

  // Blog index schema is generated from the articles so new posts appear automatically
  if (fm.type === 'blog-index') {
    fm.schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Blog', '@id': p.url + '#blog', name: BUSINESS + ' — Samarth Fire Safety Blog', url: p.url, inLanguage: 'en-IN', publisher: { '@id': ORG_ID },
      blogPost: articles.map(a => ({ '@type': 'BlogPosting', headline: (a.fm.h1 || a.fm.title.split('|')[0]).trim(), url: a.url, description: a.fm.description, datePublished: a.fm.published, dateModified: a.fm.modified || a.fm.published, image: a.fm.image ? withAbs(a.fm.image) : undefined, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID } })) });
  }
  // Guide pages: generate Article schema from frontmatter
  if (fm.template === 'guide' && !fm.schema) {
    const head = (fm.h1 || fm.title.split('|')[0]).trim();
    const img = fm.image ? withAbs(fm.image) : p.ogImage;
    const im = imgManifest[fm.image] || {};
    fm.schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': p.url + '#webpage', url: p.url, name: fm.title, description: fm.description, isPartOf: { '@id': SITE_ID }, breadcrumb: { '@id': p.url + '#breadcrumb' }, primaryImageOfPage: { '@type': 'ImageObject', url: img }, inLanguage: 'en-IN', dateModified: fm.modified || fm.published },
      { '@type': 'Article', '@id': p.url + '#article', headline: head, description: fm.description, image: { '@type': 'ImageObject', url: img, width: im.width, height: im.height }, datePublished: fm.published, dateModified: fm.modified || fm.published, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, mainEntityOfPage: { '@id': p.url + '#webpage' }, inLanguage: 'en-IN', articleSection: (CATEGORIES[fm.category] || {}).label, wordCount: p.words, isAccessibleForFree: true }
    ] });
  }
  if (fm.type === 'article' && fm.template !== 'guide' && fm.schema) {
    // existing hand-written guides: upgrade Article nodes with fresh dates / ids / entity refs
    try {
      const obj = JSON.parse(fm.schema);
      (obj['@graph'] || []).forEach(n => {
        if (n['@type'] === 'Article') { n['@id'] = p.url + '#article'; if (fm.published) n.datePublished = fm.published; n.dateModified = fm.modified || fm.published; n.author = { '@id': ORG_ID }; n.publisher = { '@id': ORG_ID }; n.inLanguage = 'en-IN'; n.wordCount = p.words; if (fm.category) n.articleSection = (CATEGORIES[fm.category] || {}).label; if (fm.image) n.image = withAbs(fm.image); }
        if (n['@type'] === 'BreadcrumbList') n['@id'] = p.url + '#breadcrumb';
      });
      fm.schema = JSON.stringify(obj);
    } catch (e) { /* leave untouched; buildSchema will report */ }
  }

  const schema = buildSchema(Object.assign(p, { faqs: p.faqs }));

  let html = layout;
  activeTabs.forEach(tab => {
    const active = tab === (fm.active || '');
    const activeClass = 'text-brand-maroon font-semibold border-b-2 border-brand-maroon pb-1';
    const inactiveClass = 'text-[#3A3030] hover:text-brand-maroon transition-colors';
    html = html.replace(new RegExp('\\{\\{active_' + tab + '\\}\\}', 'g'), active ? activeClass : inactiveClass);
  });
  const title = fm.title || BUSINESS;
  const description = fm.description || 'Government Licensed Fire Safety Agency in Malad East, Mumbai';
  const articleMeta = p.isArticle ? `<meta property="article:published_time" content="${fm.published}">\n  <meta property="article:modified_time" content="${fm.modified || fm.published}">\n  <meta property="article:section" content="${esc((CATEGORIES[fm.category] || {}).label || 'Fire safety')}">\n  <meta property="article:author" content="${BUSINESS}">` : '';
  const ogKey = p.ogImage.replace(SITE + '/', '').replace(/^img\/og-default\.jpg$/, '__og');
  const ogEntry = ogKey === '__og' ? imgManifest.__og : imgManifest[ogKey];
  const ogDims = ogEntry ? '<meta property="og:image:width" content="' + ogEntry.width + '">\n  <meta property="og:image:height" content="' + ogEntry.height + '">' : '';
  const map = {
    canonical: p.url, title: esc(title), description: esc(description),
    og_type: p.isArticle ? 'article' : 'website',
    og_image: p.ogImage, og_image_alt: esc(fm.imageAlt || 'Samarth Fire Protection System technician inspecting a building fire hydrant landing valve in Mumbai'),
    robots: fm.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    og_image_dims: ogDims,
    article_meta: articleMeta
  };
  html = html.replace(/\{\{(canonical|title|description|og_type|og_image|og_image_alt|og_image_dims|robots|article_meta)\}\}/g, (m, k) => map[k]);
  html = html.replace(/\{\{schema\}\}/g, () => JSON.stringify(schema).replace(/</g, '\\u003c'));
  html = html.replace(/\{\{(content|scripts)\}\}/g, (m, k) => (k === 'content' ? content.trim() : (fm.scripts || '')));
  html = toRootRelativeLinks(html);
  html = enhanceImages(html);
  compiled[p.file] = html;
  fs.writeFileSync(path.join(distDir, p.file), html, 'utf8');
  console.log('Compiled HTML: ' + p.file);
}

/* ------------------------------------------------------------------ generated SEO files */
const sitemapPages = pages.filter(p => !p.fm.noindex).sort((a, b) => (a.slug === 'index' ? -1 : b.slug === 'index' ? 1 : (parseFloat(b.fm.priority || 0.6) - parseFloat(a.fm.priority || 0.6)) || a.slug.localeCompare(b.slug)));
function sitemapImages(p) {
  const found = new Set();
  const html = p.body + ' ' + (p.fm.image ? '<img src="' + p.fm.image + '">' : '');
  html.replace(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi, (m, q, src) => { found.add(src.replace(/^\//, '')); return m; });
  return [...found].filter(s => /\.(jpe?g|png|webp)$/i.test(s) && !/^(logo|license_page)/.test(s) && !WITHHELD_IMAGES.includes(s) && fs.existsSync(path.join(__dirname, s))).slice(0, 6);
}
const defaultPriority = p => p.slug === 'index' ? '1.0' : p.fm.type === 'article' ? '0.7' : '0.8';
const defaultFreq = p => p.slug === 'index' ? 'weekly' : p.fm.type === 'article' ? 'monthly' : 'monthly';
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
for (const p of sitemapPages) {
  sm += '  <url>\n    <loc>' + p.url + '</loc>\n';
  if (p.fm.modified) sm += '    <lastmod>' + p.fm.modified + '</lastmod>\n';
  sm += '    <changefreq>' + (p.fm.changefreq || defaultFreq(p)) + '</changefreq>\n    <priority>' + (p.fm.priority || defaultPriority(p)) + '</priority>\n';
  for (const img of sitemapImages(p)) sm += '    <image:image><image:loc>' + SITE + '/' + img + '</image:loc></image:image>\n';
  sm += '  </url>\n';
}
sm += '</urlset>\n';
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sm, 'utf8');
console.log('Generated sitemap.xml (' + sitemapPages.length + ' URLs)');

// RSS feed of safety blog articles
const rssDate = d => new Date(d + 'T06:00:00Z').toUTCString();
const feed = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>' + esc(BUSINESS) + ' — Fire Safety Blog</title>\n  <link>' + SITE + '/blog</link>\n  <atom:link href="' + SITE + '/feed.xml" rel="self" type="application/rss+xml"/>\n  <description>Practical fire-safety blog articles for housing societies, building owners, facility managers and businesses in Mumbai and Maharashtra.</description>\n  <language>en-IN</language>\n' +
  articles.map(a => '  <item>\n    <title>' + esc((a.fm.h1 || a.fm.title.split('|')[0]).trim()) + '</title>\n    <link>' + a.url + '</link>\n    <guid isPermaLink="true">' + a.url + '</guid>\n    <pubDate>' + rssDate(a.fm.published) + '</pubDate>\n    <description>' + esc(a.fm.description) + '</description>\n  </item>').join('\n') + '\n</channel>\n</rss>\n';
fs.writeFileSync(path.join(distDir, 'feed.xml'), feed, 'utf8');
console.log('Generated feed.xml');

// llms.txt (index of links) + llms-full.txt (readable text of every public page)
const linkLine = p => '- [' + (p.fm.h1 || p.fm.crumb || p.fm.title.split('|')[0]).trim() + '](' + p.url + '): ' + p.fm.description;
const bySlug = s => pages.find(p => p.slug === s);
const group = names => names.map(bySlug).filter(Boolean).map(linkLine).join('\n');
const llmsTemplatePath = path.join(pagesDir, 'llms.txt');
if (fs.existsSync(llmsTemplatePath)) {
  const llms = fs.readFileSync(llmsTemplatePath, 'utf8')
    .replace(/{{llms_core}}/g, () => group(LLMS_GROUPS.core))
    .replace(/{{llms_services}}/g, () => group(LLMS_GROUPS.services))
    .replace(/{{llms_reference}}/g, () => group(LLMS_GROUPS.reference))
    .replace(/{{llms_guides}}/g, () => articles.map(linkLine).join('\n'))
    .replace(/{{build_date}}/g, () => articles.concat(pages).map(p => p.fm.modified || '').sort().pop());
  fs.writeFileSync(path.join(distDir, 'llms.txt'), llms, 'utf8');
  console.log('Generated llms.txt');
}
const fullOrder = [...LLMS_GROUPS.core, ...LLMS_GROUPS.services, ...LLMS_GROUPS.reference.filter(s => s !== 'blog'), ...articles.map(a => a.slug)];
const fullPages = [...new Set(fullOrder)].map(bySlug).filter(p => p && !['quote', 'contact'].includes(p.slug));
let full = '# ' + BUSINESS + ' — full site text\n\n> Plain-text copy of the public pages of ' + SITE + ' for AI systems and answer engines. Source of truth is the website; confirm licence status with the Directorate of Maharashtra Fire & Emergency Services.\n\n';
for (const p of fullPages) {
  full += '\n\n---\n\nSource: ' + p.url + '\nTitle: ' + p.fm.title + '\n' + (p.fm.modified ? 'Last updated: ' + p.fm.modified + '\n' : '') + '\n' + htmlToText(p.body) + '\n';
}
full += '\n\n---\n\n## Contact\nSamarth Fire Protection System, C/611, Parekh Nagar, CTS 710, Pathan Wadi, Malad (East), Mumbai 400097. Phone/WhatsApp +91 9967101472. Email samarthfireprotectionsystem@gmail.com. Licence ' + LICENCE_NO + '.\n';
fs.writeFileSync(path.join(distDir, 'llms-full.txt'), full, 'utf8');
console.log('Generated llms-full.txt (' + Math.round(full.length / 1024) + ' KB)');

/* ------------------------------------------------------------------ passthrough assets */
for (const file of passthrough) {
  if (file === 'llms.txt') continue;
  fs.copyFileSync(path.join(pagesDir, file), path.join(distDir, file));
  console.log('Copied asset: ' + file);
}
console.log('Build complete.');
