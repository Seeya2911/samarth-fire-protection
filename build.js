const fs = require('fs');
const path = require('path');

// Ensure directories exist
const distDir = __dirname;
const srcDir = path.join(__dirname, 'src');
const layoutsDir = path.join(srcDir, 'layouts');
const pagesDir = path.join(srcDir, 'pages');

if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir);
if (!fs.existsSync(layoutsDir)) fs.mkdirSync(layoutsDir);
if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir);

// Read main layout
const layoutPath = path.join(layoutsDir, 'main.html');
if (!fs.existsSync(layoutPath)) {
  console.error("Layout main.html not found! Please create it first.");
  process.exit(1);
}
const layout = fs.readFileSync(layoutPath, 'utf8');

// Read pages
const files = fs.readdirSync(pagesDir);

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  const stat = fs.statSync(filePath);
  
  if (stat.isDirectory()) return;

  // For non-HTML files, copy them directly
  if (!file.endsWith('.html') && !file.endsWith('.txt')) {
    fs.copyFileSync(filePath, path.join(distDir, file));
    console.log(`Copied Asset: ${file}`);
    return;
  }

  // Read page content
  const contentRaw = fs.readFileSync(filePath, 'utf8');

  // Handle plain text and XML files (e.g. llms.txt, robots.txt, sitemap.xml) without layout wrapper
  if (file === 'llms.txt' || file === 'robots.txt' || file.endsWith('.txt') || file.endsWith('.xml')) {
    fs.writeFileSync(path.join(distDir, file), contentRaw, 'utf8');
    console.log(`Generated Direct File: ${file}`);
    return;
  }

  // Parse frontmatter
  let frontmatter = {};
  let content = contentRaw;

  if (contentRaw.trim().startsWith('---')) {
    const parts = contentRaw.split('---');
    const fmText = parts[1];
    content = parts.slice(2).join('---').trim();

    // Extract multi-line JSON schema if present
    let schemaString = '{}';
    let textToParse = fmText;
    const schemaStart = fmText.indexOf('schema:');
    if (schemaStart !== -1) {
      const firstBrace = fmText.indexOf('{', schemaStart);
      if (firstBrace !== -1) {
        let depth = 0;
        let endBrace = -1;
        for (let i = firstBrace; i < fmText.length; i++) {
          if (fmText[i] === '{') depth++;
          else if (fmText[i] === '}') {
            depth--;
            if (depth === 0) {
              endBrace = i;
              break;
            }
          }
        }
        if (endBrace !== -1) {
          schemaString = fmText.substring(firstBrace, endBrace + 1);
          // Remove the schema block from simple key-value parsing
          textToParse = fmText.substring(0, schemaStart) + fmText.substring(endBrace + 1);
        }
      }
    }
    frontmatter.schema = schemaString;

    // Extract multi-line scripts if present
    const scriptsStart = textToParse.indexOf('scripts:');
    if (scriptsStart !== -1) {
      let rawScripts = textToParse.substring(scriptsStart + 8).trim();
      if (rawScripts.startsWith('|')) {
        rawScripts = rawScripts.substring(1).trim();
      }
      frontmatter.scripts = rawScripts;
      textToParse = textToParse.substring(0, scriptsStart);
    }

    // Parse simple key-values
    textToParse.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.substring(0, idx).trim();
        let value = line.substring(idx + 1).trim();
        value = value.replace(/^['"]|['"]$/g, '');
        if (key && !frontmatter[key]) {
          frontmatter[key] = value;
        }
      }
    });
  }

  const schemaString = frontmatter.schema || '{}';

  // Build the page
  let pageHtml = layout;

  // Replace active tab highlighting classes
  const activeTab = frontmatter.active || '';
  const activeTabs = ['home', 'about', 'process', 'services', 'compliance', 'projects', 'resources', 'contact', 'quote'];
  
  activeTabs.forEach(tab => {
    const placeholder = `{{active_${tab}}}`;
    const isActive = (tab === activeTab);
    const desktopClass = isActive 
      ? 'text-brand-gold font-semibold border-b-2 border-brand-gold pb-1' 
      : 'text-brand-ivory hover:text-brand-gold transition-colors';
    const mobileClass = isActive 
      ? 'bg-brand-charcoalLight text-brand-gold font-semibold border-l-4 border-brand-gold pl-2' 
      : 'text-brand-ivory hover:text-brand-gold hover:bg-brand-charcoalLight transition-all';
    
    // Since layouts handle active styling, we just output the classes based on active state
    // Let's replace the placeholder directly
    pageHtml = pageHtml.replace(new RegExp(placeholder, 'g'), isActive ? 'text-brand-maroon font-semibold border-b-2 border-brand-maroon pb-1' : 'text-[#3A3030] hover:text-brand-maroon transition-colors');
  });

  // Inject page parameters
  const canonicalUrl = frontmatter.canonical || (file === 'index.html' ? 'https://samarthfire.in/' : `https://samarthfire.in/${file}`);
  pageHtml = pageHtml.replace(/{{canonical}}/g, canonicalUrl);
  pageHtml = pageHtml.replace(/{{title}}/g, frontmatter.title || 'Samarth Fire Protection System');
  pageHtml = pageHtml.replace(/{{description}}/g, frontmatter.description || 'Government Licensed Fire Safety Agency in Malad East, Mumbai');
  pageHtml = pageHtml.replace(/{{schema}}/g, schemaString);
  pageHtml = pageHtml.replace(/{{content}}/g, content);
  pageHtml = pageHtml.replace(/{{scripts}}/g, frontmatter.scripts || '');

  // Write output file
  const outputPath = path.join(distDir, file);
  fs.writeFileSync(outputPath, pageHtml, 'utf8');
  console.log(`Compiled HTML: ${file}`);
});

console.log("Build Complete!");
