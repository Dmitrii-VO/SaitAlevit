# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**АЛЕВИТ СТРОЙ** - Landing page for a construction company (ООО «АЛЕВИТ СТРОЙ») that builds turnkey private houses in Belgorod Oblast, Russia.

**Tech Stack:**
- HTML5 with semantic markup
- CSS3 with PostCSS (autoprefixer, BEM methodology)
- Vanilla JavaScript (ES6+, modular architecture)
- Webpack for JS bundling
- Live Server for local development

**Key Business Context:**
- Premium, modern, strict design aesthetic
- Target audience: families concerned about trust, fixed pricing, quality
- Core values: reliability, 5-year warranty, fixed contract price
- **CRITICAL**: Only use real photos from `images/` folder - NO AI renders or stock images

## Essential Commands

```bash
# Development
npm start          # Start local server (serves root directory on port 3000)
npm run dev        # Development with auto-reload (watches root directory)
npm run watch      # Watch for changes (CSS + JS separately)

# Build
npm run build      # Full production build (CSS + JS)
npm run build:css  # Compile PostCSS: src/css/main.css → styles.css (root)
npm run build:js   # Webpack bundle: src/js → js/ (root)

# Code Quality
npm run lint       # ESLint on src/js/**/*.js
npm run format     # Prettier format src/**/*.{html,css,js}
npm test          # Run Jest tests
```

## Project Structure

```
├── src/              # Source files for development
│   ├── css/         # CSS source (main.css entry point)
│   ├── js/          # JavaScript modules (main.js entry)
│   ├── components/  # (Empty - reserved for future modularization)
│   └── images/      # Source images
├── images/          # Real photos of houses and projects (PRODUCTION)
│   ├── houses/     # Built houses (1а-6а) → "Наши работы" section
│   ├── projects/   # Typical projects → "Проекты" section
│   └── logo.jpg    # Company logo
├── js/              # Bundled JavaScript (PRODUCTION)
│   └── main.js     # Compiled JS bundle
├── index.html       # Main landing page (PRODUCTION)
├── styles.css       # Compiled styles (PRODUCTION)
├── docs/           # Documentation
├── tests/          # Tests
└── public/         # (gitignored - legacy build folder, not used)
```

**Build Flow:**
- CSS: `src/css/main.css` → PostCSS → `styles.css` (root)
- JS: `src/js/main.js` → Webpack → `js/main.js` (root)
- All production files are in the root directory for GitHub Pages

## Landing Page Architecture

The site has **13 required sections** (strictly follow this order):

1. **Hero Block** - Main headline, 2 CTAs ("Calculate Cost", "Get Free Project")
2. **Trust Block** - 6+ years, 60+ houses, 5-year warranty, fixed price
3. **Why Choose Us** - Reliability, deadlines, quality control, financial transparency
4. **House Formats & Pricing** - Price per m² by material/finish (no full prices)
5. **Projects** - Typical house projects with plans (from `images/projects/`)
6. **Our Works** - Real built houses (from `images/houses/`)
7. **Construction Stages** - Step-by-step process timeline
8. **Object Map** - Interactive visual map (🟢 built, 🟠 building, 🔴 sold)
9. **Services** - Mortgage, land selection, design
10. **Reviews** - Video (3) + text testimonials
11. **About & Team** - Company leadership, experience, philosophy
12. **CTA + Forms** - Calculate cost, get project, consultation
13. **Contacts** - Phone, email, messengers, address

## Critical Design Constraints

**Color Palette (STRICT):**
- Primary: Black (#000000, #1a1a1a) + Gold (#D4AF37, #B8860B)
- Allowed: White (#FFFFFF), Gray (#F5F5F5, #808080, #333333)
- **FORBIDDEN**: Bright colors, loud shades

**CSS Methodology:**
- BEM naming: `.block`, `.block__element`, `.block__element--modifier`
- CSS variables for colors, spacing, fonts, transitions
- Use `rem` units for sizing
- Mobile-first approach

**JavaScript Patterns:**
- ES6+ syntax (const/let, arrow functions, destructuring, modules)
- Try/catch for async operations
- No jQuery or legacy ES5
- Keep functions under ~30 lines, files under ~800 lines

## Key Implementation Details

**Forms:**
- Minimum fields: name + phone
- Extended: area, house type, finish type
- Real-time validation (phone: +7 (XXX) XXX-XX-XX format)
- Show progress bar for multi-field forms
- Require GDPR consent checkbox

**Calculator:**
- Parameters: area (m²), house type (gas concrete/brick/frame), finish (shell/clean/turnkey)
- Show price range dynamically
- Save inputs to localStorage
- After calculation, prompt for lead form

**Image Handling:**
- WebP with JPG/PNG fallback
- Lazy loading (`loading="lazy"`) below fold
- Always specify width/height (prevent layout shift)
- Descriptive alt text (not "image", use "Gas concrete house, 120 m²")

**Performance:**
- Minimize CSS/JS in production
- Use `defer` for scripts in `<head>`
- Target: FCP < 1.8s, LCP < 2.5s, CLS < 0.1

## Important Rules Reference

See `.cursorrules` for comprehensive details on:
- Code size limits (functions ~30 lines, classes ~400 lines, files ~800 lines)
- Naming conventions (camelCase vars, PascalCase classes, kebab-case files, UPPER_SNAKE_CASE constants)
- JSDoc comments for all functions/classes
- Accessibility requirements (ARIA, keyboard nav, 4.5:1 contrast ratio)
- Russian localization (ДД.ММ.ГГГГ dates, space-separated thousands, ₽ currency)
- Conventional Commits format (feat:, fix:, docs:, style:, refactor:, perf:, test:, chore:)

**Reference `.cursorrules` for:**
- SEO structured data requirements (JSON-LD schemas)
- Form validation rules and error handling patterns
- Security practices (XSS/CSRF protection)
- Browser support matrix
- Animation guidelines (200-300ms, prefers-reduced-motion)

## Git Workflow

**Commit Format (Conventional Commits):**
```
feat: добавить калькулятор стоимости домов
fix: исправить валидацию телефона
docs: обновить README
style: форматирование кода
refactor: рефакторинг формы заявки
```

**Branching:**
- `main` - stable production
- `develop` - development branch
- `feature/название` - new features
- `fix/название` - bug fixes

## Build Configuration Notes

- **No webpack.config.js in root**: Webpack likely uses default config or inline config in package.json scripts
- **No postcss.config.js**: PostCSS configuration may be in package.json or using CLI flags
- **Build outputs to root**: All production files (styles.css, js/main.js) are built directly to the root directory
- If adding build configs, create them in root as `webpack.config.js` and `postcss.config.js`

## Special Files

- **PROMPT.md** - Original project brief (has priority over .cursorrules if conflicts)
- **TZ.md** - Technical specification
- **PERFORMANCE_REPORT.md** - Performance metrics
- **SEO_AUDIT_REPORT.md** - SEO audit results
- **GITHUB_SETUP.md** - GitHub setup instructions

## Context for Future Development

This is a sales-focused landing page where **every element must drive conversions and trust**. The target audience fears being deceived, price increases, and poor quality. Combat this with:
- Fixed price messaging
- 5-year warranty prominence
- Real photos (never AI renders)
- Transparent construction stages
- Social proof (reviews, portfolio)

**UTP (Unique Value Proposition):**
"Turnkey house in 3 months with fixed price and 5-year warranty. Free project design."
