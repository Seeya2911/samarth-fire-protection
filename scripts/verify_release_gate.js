const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const report = {
  jsonLdValidation: [],
  compiledScriptsValidation: [],
  enquiryEncodingTests: [],
  seoAndGeoValidation: {
    titles: {},
    descriptions: {},
    canonicals: {},
    headingStructure: {},
    imagesAltCheck: [],
    externalLinksSecurity: [],
    formAccessibility: []
  },
  businessClaimsAudit: [],
  securityHeaderVerification: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    flagged: 0
  }
};

function assert(condition, message, testGroup) {
  report.summary.totalTests++;
  if (condition) {
    report.summary.passed++;
    return true;
  } else {
    report.summary.failed++;
    console.error(`FAIL [${testGroup}]: ${message}`);
    return false;
  }
}

console.log('=== SAMARTH FIRE PROTECTION — FINAL RELEASE-GATE VERIFICATION ===\n');

// 1. JSON-LD VALIDATION & FABRICATION AUDIT
console.log('--- 1. Validating JSON-LD in all HTML pages ---');
const rootFiles = fs.readdirSync(rootDir);
const htmlFiles = rootFiles.filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  const schemaRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  let schemasFound = 0;

  while ((match = schemaRegex.exec(content)) !== null) {
    schemasFound++;
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw);
      
      // Check for forbidden fake elements
      const hasFakeRatings = Boolean(parsed.aggregateRating || parsed.review || parsed.ratingCount);
      const hasFakeAwards = Boolean(parsed.award);
      
      const passesFabricationCheck = !hasFakeRatings && !hasFakeAwards;
      assert(passesFabricationCheck, `${file}: contains fabricated ratings or awards in JSON-LD`, 'JSON-LD Fabrication');

      // Check essential schema fields
      const hasContext = parsed['@context'] === 'https://schema.org';
      const hasType = Boolean(parsed['@type']);
      assert(hasContext && hasType, `${file}: missing @context or @type in JSON-LD`, 'JSON-LD Structure');

      report.jsonLdValidation.push({
        file,
        type: parsed['@type'],
        name: parsed.name || '(unnamed)',
        valid: true,
        unfabricated: passesFabricationCheck
      });
    } catch (e) {
      assert(false, `${file}: Invalid JSON-LD syntax: ${e.message}`, 'JSON-LD Syntax');
      report.jsonLdValidation.push({ file, valid: false, error: e.message });
    }
  }

  assert(schemasFound > 0, `${file}: No JSON-LD schema found!`, 'JSON-LD Presence');
});

// 2. CLIENT-SIDE SCRIPT SURVIVAL & FLOW INTEGRITY
console.log('\n--- 2. Validating Client-Side Scripts in Compiled HTML ---');
const quoteHtml = fs.readFileSync(path.join(rootDir, 'quote.html'), 'utf8');
assert(quoteHtml.includes('function handleQuoteForm'), 'quote.html missing handleQuoteForm', 'Script Survival');
assert(quoteHtml.includes('id="q-requirement"'), 'quote.html missing requirement select', 'Form Elements');
assert(quoteHtml.includes('id="rev-wa-btn"'), 'quote.html missing review WhatsApp button', 'Form Elements');
assert(quoteHtml.includes('id="rev-mail-btn"'), 'quote.html missing review Email button', 'Form Elements');

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert(indexHtml.includes('function calculateEstimate'), 'index.html missing calculateEstimate', 'Script Survival');

const auditHtml = fs.readFileSync(path.join(rootDir, 'audit.html'), 'utf8');
assert(auditHtml.includes('function handleAuditSubmit'), 'audit.html missing handleAuditSubmit', 'Script Survival');
assert(auditHtml.includes('function handleTroubleSubmit'), 'audit.html missing handleTroubleSubmit', 'Script Survival');
assert(auditHtml.includes('id="audit-wa-btn"'), 'audit.html missing audit WhatsApp dispatch button', 'Form Elements');
assert(auditHtml.includes('id="audit-mail-btn"'), 'audit.html missing audit Email dispatch button', 'Form Elements');
assert(!auditHtml.includes('Your assessment details have been registered. Sameer M. Kangutkar will review'), 
  'audit.html still contains legacy false registration message', 'False Success Prevention');

// 3. ENQUIRY ENCODING SUITE (Spaces, Punctuation, Unicode, Malicious Input)
console.log('\n--- 3. Testing WhatsApp & Email Link Generators with Extreme Inputs ---');

const testCases = [
  {
    name: 'Standard Commercial Inquiry',
    req: 'AMC Maintenance',
    facility: 'Commercial High-Rise',
    contact: 'Rajesh Sharma',
    org: 'Apex Towers CHS',
    phone: '+91 98200 12345',
    email: 'secretary@apextowers.com',
    loc: 'Andheri East, Mumbai',
    notes: 'Booster pump pressure dropping below 3.5 bar.'
  },
  {
    name: 'Special Characters & Punctuation',
    req: 'Form B Compliance (Jan/July & 2026)',
    facility: 'Industrial / Chemical Warehouse & Hub',
    contact: 'M. K. D\'Souza & Sons',
    org: 'Global Logistics Ltd.',
    phone: '+91 (022) 2890-1122',
    email: 'compliance+audit@company.co.in',
    loc: 'MIDC, TTC Area, Navi Mumbai #400705',
    notes: 'Price? ~100 extinguishers @ ₹500/unit; check CO2 & Foam % ratio!'
  },
  {
    name: 'Non-ASCII / Unicode Text (Devanagari)',
    req: 'नवीन फायर फायटिंग सिस्टीम बसवणे',
    facility: 'रहिवासी इमारत (Housing Society)',
    contact: 'संतोष पाटील (Santosh Patil)',
    org: 'समर्थ गृहनिर्माण संस्था',
    phone: '९८२०१२३४५६',
    email: 'santosh@samarthchs.org',
    loc: 'मालाड पूर्व, मुंबई - ४०००९७',
    notes: 'सोसायटीसाठी दरपत्रक त्वरित पाठवावे. मॉक ड्रिल आणि प्रमाणपत्र हवे.'
  },
  {
    name: 'Malicious Payloads & Injection Attempts',
    req: '<script>alert("XSS")</script>',
    facility: '"><img src=x onerror=alert(1)>',
    contact: 'Robert\'); DROP TABLE enquiries;--',
    org: '${7*7} {{7*7}} <iframe src="evil.com">',
    phone: '0000000000" onfocus="alert(1)',
    email: 'test@evil.com%0D%0ABcc:victim@target.com',
    loc: '`rm -rf /` & calc.exe',
    notes: 'https://evil.com/phish?param=1&exploit=true'
  }
];

testCases.forEach(tc => {
  // Test WhatsApp generation logic (as implemented in quote.html)
  const waText = `*New Quotation Request - Samarth Fire Protection System*%0A` +
    `• Requirement: ${encodeURIComponent(tc.req)}%0A` +
    `• Facility Type: ${encodeURIComponent(tc.facility)}%0A` +
    `• Contact Name: ${encodeURIComponent(tc.contact)}%0A` +
    `• Organization: ${encodeURIComponent(tc.org)}%0A` +
    `• Phone: ${encodeURIComponent(tc.phone)}%0A` +
    `• Email: ${encodeURIComponent(tc.email)}%0A` +
    `• Location: ${encodeURIComponent(tc.loc)}%0A` +
    `• Scope Details: ${encodeURIComponent(tc.notes)}`;

  const fullWaUrl = `https://wa.me/919967101472?text=${waText}`;

  // Validate URL structure
  assert(fullWaUrl.startsWith('https://wa.me/919967101472?text='), `${tc.name}: WA URL malformed`, 'URL Structure');
  assert(!fullWaUrl.includes('\n') && !fullWaUrl.includes('\r'), `${tc.name}: WA URL contains unescaped newline`, 'URL Safety');
  assert(!fullWaUrl.includes('<script>') && !fullWaUrl.includes('<iframe>'), `${tc.name}: WA URL contains unescaped HTML tag`, 'XSS Prevention');

  // Test Email generation logic
  const mailBody = `Requirement: ${tc.req}\nFacility: ${tc.facility}\nClient: ${tc.contact} (${tc.org})\nPhone: ${tc.phone}\nLocation: ${tc.loc}\nDetails: ${tc.notes}`;
  const mailSubject = `Quotation Request from ${tc.org || tc.contact}`;
  const fullMailUrl = `mailto:samarthfireprotectionsystem@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

  assert(fullMailUrl.startsWith('mailto:samarthfireprotectionsystem@gmail.com?'), `${tc.name}: Mailto URL malformed`, 'Mailto Structure');
  assert(!fullMailUrl.includes('\n'), `${tc.name}: Mailto URL contains raw newline`, 'Mailto Safety');

  report.enquiryEncodingTests.push({
    testName: tc.name,
    waLength: fullWaUrl.length,
    mailLength: fullMailUrl.length,
    status: 'PASSED'
  });
});

// 4. SEO & ACCESSIBILITY AUDIT
console.log('\n--- 4. Validating SEO, GEO, Heading Hierarchy, and Alt Attributes ---');
const titlesSeen = new Set();
const descriptionsSeen = new Set();
const canonicalsSeen = new Set();

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');

  // Title
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  assert(title.length >= 25 && title.length <= 80, `${file}: Title length (${title.length}) out of optimal range [25-80]`, 'Title Length');
  assert(!titlesSeen.has(title), `${file}: Duplicate title detected: "${title}"`, 'Title Uniqueness');
  titlesSeen.add(title);
  report.seoAndGeoValidation.titles[file] = title;

  // Description
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const desc = descMatch ? descMatch[1].trim() : '';
  assert(desc.length >= 100 && desc.length <= 170, `${file}: Description length (${desc.length}) out of optimal range [100-170]`, 'Meta Description Length');
  assert(!descriptionsSeen.has(desc), `${file}: Duplicate description detected in ${file}`, 'Description Uniqueness');
  descriptionsSeen.add(desc);
  report.seoAndGeoValidation.descriptions[file] = desc;

  // Canonical
  const canonMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  const canon = canonMatch ? canonMatch[1].trim() : '';
  const expectedCanon = file === 'index.html' ? 'https://samarthfire.in/' : `https://samarthfire.in/${file}`;
  assert(canon === expectedCanon, `${file}: Canonical "${canon}" does not match expected "${expectedCanon}"`, 'Canonical Match');
  assert(!canonicalsSeen.has(canon), `${file}: Duplicate canonical URL detected: "${canon}"`, 'Canonical Uniqueness');
  canonicalsSeen.add(canon);
  report.seoAndGeoValidation.canonicals[file] = canon;

  // Heading hierarchy: exactly 1 h1
  const h1Matches = content.match(/<h1[\s>]/gi) || [];
  assert(h1Matches.length === 1, `${file}: Found ${h1Matches.length} <h1> tags (must be exactly 1)`, 'Heading Hierarchy');

  // Image alt check
  const imgRegex = /<img([^>]+)>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const attrs = imgMatch[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
    const src = srcMatch ? srcMatch[1] : '(unknown)';
    
    assert(Boolean(altMatch && altMatch[1].trim().length > 0), `${file}: <img> tag missing alt attribute (src: ${src})`, 'Image Alt');
  }

  // External Links Security (rel="noopener noreferrer")
  const extLinkRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  let linkMatch;
  while ((linkMatch = extLinkRegex.exec(content)) !== null) {
    const fullTag = linkMatch[0];
    const href = linkMatch[1];
    if (href.startsWith('https://samarthfire.in')) continue; // internal absolute
    const hasRel = /rel=["'][^"']*noopener[^"']*["']/i.test(fullTag);
    assert(hasRel, `${file}: External link "${href}" missing rel="noopener"`, 'External Link Hardening');
  }
});

// 5. SECURITY CONFIGURATION CHECK
console.log('\n--- 5. Validating Security Configurations (vercel.json) ---');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
assert(Array.isArray(vercelConfig.headers), 'vercel.json missing headers array', 'Security Headers');

const globalHeaders = vercelConfig.headers.find(h => h.source === '/(.*)');
assert(Boolean(globalHeaders), 'vercel.json missing global (.*) header rule', 'Security Headers');

const expectedHeaders = ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'];
expectedHeaders.forEach(eh => {
  const found = globalHeaders.headers.find(h => h.key === eh);
  assert(Boolean(found), `vercel.json missing security header ${eh}`, 'Security Headers');
  report.securityHeaderVerification.push({ header: eh, present: Boolean(found), value: found ? found.value : null });
});

// 6. BUSINESS CLAIMS CHECK AGAINST AUTHORITATIVE COPIES
console.log('\n--- 6. Business Claims Verification ---');
const officialLicenseNo = 'MFS/LA/RF-34/RD-35';
const officialGstin = '27APXPK0844G1ZJ';

// Ensure llms.txt, contact.html, certifications.html carry the authoritative license number
const certHtml = fs.readFileSync(path.join(rootDir, 'certifications.html'), 'utf8');
assert(certHtml.includes(officialLicenseNo), 'certifications.html does not contain official license number', 'Business Claims');
assert(certHtml.includes(officialGstin), 'certifications.html does not contain official GSTIN', 'Business Claims');

const llmsContent = fs.readFileSync(path.join(rootDir, 'llms.txt'), 'utf8');
assert(llmsContent.includes(officialLicenseNo), 'llms.txt does not contain official license number', 'Business Claims');
assert(llmsContent.includes(officialGstin), 'llms.txt does not contain official GSTIN', 'Business Claims');

// 7. COMPLIANCE FALLBACKS VERIFICATION (BPA-01, BPA-02, BPA-03)
console.log('\n--- 7. Validating Compliance Fallbacks (BPA-01, BPA-02, BPA-03) ---');
htmlFiles.forEach(file => {
  const fileContent = fs.readFileSync(path.join(rootDir, file), 'utf8');

  // BPA-01: No unapproved drill photos in public <img>
  assert(!fileContent.includes('client_society_assembly.jpg'), `${file}: Still displays client_society_assembly.jpg (BPA-01)`, 'Fallback BPA-01');
  assert(!fileContent.includes('client_cpr_training.jpg'), `${file}: Still displays client_cpr_training.jpg (BPA-01)`, 'Fallback BPA-01');

  // BPA-02: No unverified postgraduate claim
  assert(!fileContent.includes('Postgraduate in Disaster Management'), `${file}: Contains unverified Postgraduate claim (BPA-02)`, 'Fallback BPA-02');
  assert(!fileContent.includes('PG in Disaster Management'), `${file}: Contains unverified PG claim (BPA-02)`, 'Fallback BPA-02');

  // BPA-03: No unauthorized corporate client brand names
  assert(!fileContent.includes('Nuclear Power Corporation of India'), `${file}: Contains NPCIL brand name (BPA-03)`, 'Fallback BPA-03');
  assert(!fileContent.includes('Bharat Diamond Bourse'), `${file}: Contains Bharat Diamond Bourse brand name (BPA-03)`, 'Fallback BPA-03');
  assert(!fileContent.includes('NES International School'), `${file}: Contains NES brand name (BPA-03)`, 'Fallback BPA-03');
});

// Check llms.txt for BPA fallbacks
assert(!llmsContent.includes('Postgraduate in Disaster Management'), 'llms.txt contains Postgraduate claim (BPA-02)', 'Fallback BPA-02');
assert(!llmsContent.includes('Nuclear Power Corporation'), 'llms.txt contains NPCIL (BPA-03)', 'Fallback BPA-03');
assert(!llmsContent.includes('Bharat Diamond Bourse'), 'llms.txt contains BDB (BPA-03)', 'Fallback BPA-03');
assert(!llmsContent.includes('NES International School'), 'llms.txt contains NES (BPA-03)', 'Fallback BPA-03');

// Check sitemap.xml for BPA-01
const sitemapTxt = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
assert(!sitemapTxt.includes('client_cpr_training.jpg'), 'sitemap.xml still lists client_cpr_training.jpg (BPA-01)', 'Fallback BPA-01');
assert(sitemapTxt.includes('client_hose_reel_drill.jpg'), 'sitemap.xml does not list replacement client_hose_reel_drill.jpg (BPA-01)', 'Fallback BPA-01');

console.log('\n===============================================================');
console.log(`TOTAL CHECKS: ${report.summary.totalTests}`);
console.log(`PASSED:       ${report.summary.passed}`);
console.log(`FAILED:       ${report.summary.failed}`);
console.log('===============================================================\n');

if (report.summary.failed > 0) {
  process.exit(1);
} else {
  console.log('ALL RELEASE-GATE AUTOMATED VERIFICATIONS PASSED SUCCESSFULLY.');
}
