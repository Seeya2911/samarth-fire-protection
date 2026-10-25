# PRD: Samarth Fire Protection System Website Redesign & Engineering Overhaul

## 1. Overview & Business Goals
Samarth Fire Protection System is a Directorate of Maharashtra Fire Services Licensed Class D Agency (Licence No. MFS/LA/RF-34/RD-35) located in Malad East, Mumbai. Founded over 8 years ago by Principal Fire Consultant Sameer M. Kangutkar (post-graduate in Disaster Management), the company delivers audit-led fire safety engineering, turn-key system installations (hydrants, sprinklers, alarms, extinguishers, passive barriers), compliance certification (Form A & B NOCs), and community/corporate fire and first-aid/CPR training.

### Core Strategic Mandates:
1. **Brand Identity & Horizontal Header Lockup**: Prominent, crisp horizontal presentation: `[Company Logo Shield] SAMARTH FIRE PROTECTION SYSTEM` with high visual prominence, readable typography at normal desktop distance, and balanced mobile responsiveness without horizontal overflow.
2. **5-Page Primary Information Architecture**:
   - 1. **About Us** (`about.html`): Editorial, human introduction, company philosophy, founder profile, technical expertise, and documentary photo gallery.
   - 2. **Home** (`index.html`): Default landing page, signature hero, verified trust strip, core services, real-world demonstrations, industries served, project highlights, 7-step process, training, coverage, and interactive cost estimator.
   - 3. **Services** (`services.html`): Well-organized 6-hub engineering directory detailing scope, customer profile, process, quotation prerequisites, and direct technical specifications.
   - 4. **Projects / Case Studies** (`projects.html`): Documentary gallery of verified project logs (F Residency, High-Rise Pump Overhaul, Housing Society Evacuation) with standardized scope and outcomes.
   - 5. **Get a Quote** (`quote.html`): Dedicated conversion-focused quotation page visually emphasized in the navigation as the primary CTA, featuring requirement selection, facility profiling, and client-side staged transmission via WhatsApp and Email.
3. **Showcase Authentic Proof**: Leverage 18 high-resolution client documentary photographs audited in `docs/PHOTO_ASSET_AUDIT.md` (live fire pan drills, housing society seminars, wet-riser installations, booster pump manifolds, CPR emergency workshops).
4. **Professional Typography & Stitch MCP Design System**: Restrained modern typography pairing `Manrope` (headings), `Inter` (body, nav, forms), and `IBM Plex Mono` (technical badges), grounded in the curated palette: Deep Oxblood Maroon (`#5C1520`), Safety Gold (`#D9A441`), Warm Ivory (`#FDFBF7`), Paper Cream (`#F1E6CE`), and Steel Charcoal (`#1D2023`).
5. **Technical SEO, GEO & Machine Readability**:
   - Complete technical SEO audit and remediation in `docs/SEO_AUDIT.md`.
   - Production `sitemap.xml` and `robots.txt` supporting search engines and AI crawlers (GPTBot, PerplexityBot, ClaudeBot).
   - Dynamic canonical tags on all pages.
   - Generative Engine Optimization strategy in `docs/GEO_STRATEGY.md` and content mapping in `docs/SEO_CONTENT_MAP.md`.
   - Authoritative machine-readable knowledge endpoint `llms.txt`.
6. **Frontend Security & MessSaver Readiness**:
   - Full security and release readiness audit documented in `docs/SECURITY_RELEASE_READINESS.md`.
   - Cross-referencing of MessSaver engineering practices to static Jamstack architecture.
   - Zero secrets exposed; client-side input sanitization; response security headers in `vercel.json` and `scripts/server.js`.
7. **Motion Design & Accessibility**: Lightweight `IntersectionObserver` reveals, `prefers-reduced-motion` compliance, touch targets $\ge 44\text{px}$, and zero horizontal scroll across all breakpoints (1440px to 320px).

---

## 2. Target Customers
- **Cooperative Housing Societies (CHS) & Residential Committees**: Managing committees requiring bi-annual Form B compliance, fire hydrant maintenance, extinguisher recharging, and resident awareness drills.
- **Commercial Complex & Facility Managers**: High-rise office blocks, IT parks, retail malls seeking preventative maintenance (AMC), automatic detection alarm loops, and regulatory inspection reports.
- **Industrial Plants & Warehouses**: Manufacturing units and logistics hubs requiring heavy-duty fire protection, hydrant lines, foam suppression systems, and safety audits.
- **Institutions (Schools, Hospitals, Event Spaces)**: Campuses requiring life-safety evacuation plans, first-aid/CPR training, and compliant emergency hardware.

---

## 3. Authoritative Information Architecture & Routes

### Primary Navigation (Header Order)
1. `about.html` (About Us)
2. `index.html` (Home — Default Landing Page)
3. `services.html` (Services Hub + Category Dropdown)
4. `projects.html` (Projects / Case Studies)
5. `quote.html` (Get a Quote — Emphasized Navigation CTA)

### Preserved Supporting Pages & Secondary Routes
- `founder.html` (Principal Consultant Sameer M. Kangutkar Profile)
- `certifications.html` (Class D Licence Form N & Form A/B Compliance)
- `process.html` (7-Step Safety Lifecycle: Walkthrough to Maintenance)
- `resources.html` (Regulatory Guidelines & Maintenance Schedules)
- `contact.html` (Direct Inquiries, Office Location, Emergency Helplines)
- `audit.html` (Comprehensive Safety Assessment Booking Desk)
- Sub-service deep dives:
  - `fire-fighting.html`
  - `detection-alarm.html`
  - `extinguishing.html`
  - `passive-protection.html`
  - `compliance-certification.html`
  - `training-preparedness.html`
- SEO & Machine-Readable Endpoints:
  - `sitemap.xml`
  - `robots.txt`
  - `llms.txt`

---

## 4. User Stories & Implementation Backlog

### US-001: Client Photography Asset Audit & Mapping
- **Status:** COMPLETED (`docs/PHOTO_ASSET_AUDIT.md`)
- **Criteria:** 18 client photographs cataloged with dimensions, file sizes, quality ratings, crops, and accurate alt text; 14 optimized derivatives deployed into web pipeline.

### US-002: Navigation Reorganization (5-Page Primary Hierarchy)
- **Status:** COMPLETED (`src/layouts/main.html`, `build.js`)
- **Criteria:** Header navigation organized in strict order: About Us -> Home -> Services -> Projects -> Get a Quote. "Get a Quote" highlighted as primary CTA button.

### US-003: Design System, Stitch MCP Screen & Typography Overhaul
- **Status:** COMPLETED (`tailwind.config.js`, `src/layouts/main.html`)
- **Criteria:** Stitch design screen generated in project `projects/16375723910085679998`. Typography switched to Manrope, Inter, and IBM Plex Mono. Color tokens codified.

### US-004: Dedicated Quotation Page (`quote.html`) Implementation
- **Status:** COMPLETED (`src/pages/quote.html`)
- **Criteria:** Created dedicated quote desk with 7 requirement categories, facility profiling, and client-side staged review summary with 1-click WhatsApp and Email transmission.

### US-005: About Us Editorial Page (`about.html`) Overhaul
- **Status:** COMPLETED (`src/pages/about.html`)
- **Criteria:** Human, editorial layout featuring authentic client lecture photo (`client_extinguisher_lecture.jpg`), company history, assessment-first philosophy, verified Founder credentials, and documentary gallery.

### US-006: Home Page (`index.html`) Restructuring
- **Status:** COMPLETED (`src/pages/index.html`)
- **Criteria:** 10-section structure: Hero with live drill photo (`client_drill_live.jpg`), Trust Indicators, Core Services, Demonstrations, Industries, Projects, 7-Step Process, Training, Coverage, Final CTA / Estimator.

### US-007: Services Hub Reorganization (`services.html`)
- **Status:** COMPLETED (`src/pages/services.html`)
- **Criteria:** 6 engineering categories with authentic photos, scope, target profile, process, and quote requirements.

### US-008: Projects & Case Studies Gallery (`projects.html`)
- **Status:** COMPLETED (`src/pages/projects.html`)
- **Criteria:** Verified project logs (F Residency, High-Rise Pump Overhaul, CHS Evacuation) with complete technical scope and verified outcomes; standardized template included.

### US-009: Logo Brand Identity & Horizontal Header Lockup (Phase 14)
- **Status:** COMPLETED (`src/layouts/main.html`)
- **Criteria:**
  - Redesigned header with prominent horizontal brand lockup: `[Logo Shield] SAMARTH FIRE PROTECTION SYSTEM`.
  - Scalable, high-contrast typography readable at normal desktop viewing distance.
  - Mobile header features compact horizontal lockup, dedicated top Quote CTA, and accessible mobile drawer.
  - Zero layout shift and zero horizontal overflow across 1440px to 320px.

### US-010: Technical SEO Foundation & Sitemap Implementation (Phase 16)
- **Status:** COMPLETED (`docs/SEO_AUDIT.md`, `src/pages/sitemap.xml`, `src/pages/robots.txt`, `build.js`)
- **Criteria:**
  - Completed comprehensive Technical SEO Audit in `docs/SEO_AUDIT.md`.
  - Generated production `sitemap.xml` with 17 canonical URLs and documentary image tags.
  - Generated production `robots.txt` with search and AI crawler permissions.
  - Dynamic canonical URL tag injection across all templates.

### US-011: Generative Engine Optimization (GEO) & Content Mapping (Phase 18 & 19)
- **Status:** COMPLETED (`docs/GEO_STRATEGY.md`, `docs/SEO_CONTENT_MAP.md`, `llms.txt`)
- **Criteria:**
  - Codified canonical Entity Knowledge Graph in `docs/GEO_STRATEGY.md`.
  - Structured FAQ inventory covering services, alarms, extinguishers, drills, and Form B compliance.
  - Comprehensive keyword-to-page mapping matrix in `docs/SEO_CONTENT_MAP.md`.
  - Maintained `llms.txt` knowledge endpoint for AI web scrapers.

### US-012: Frontend Security Hardening & MessSaver Readiness (Phase 20 & 21)
- **Status:** COMPLETED (`docs/SECURITY_RELEASE_READINESS.md`, `vercel.json`, `scripts/server.js`)
- **Criteria:**
  - Completed security audit and documented architecture in `docs/SECURITY_RELEASE_READINESS.md`.
  - Cross-referenced MessSaver engineering practices against static Jamstack architecture.
  - Implemented response security headers in `vercel.json` and path traversal protection in `scripts/server.js`.
  - Verified safe client-side input handling with DOM XSS prevention.

### US-013: Production Quality Gates & Responsive Build Verification (Phase 22)
- **Status:** COMPLETED
- **Criteria:**
  - Quality Gates A through E passed.
  - `npm run build` completes with exit code 0.
  - Browser testing across 1440px, 1024px, 768px, 390px, and 320px confirms zero horizontal overflow.
