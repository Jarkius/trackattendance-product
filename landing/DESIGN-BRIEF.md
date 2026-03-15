# TrackAttendance Landing Page — Competitive Design Brief

> Research date: 2026-03-14
> Competitors analyzed: Deputy, Jibble, Clockify, TimeClock365, BambooHR, Homebase, WhenIWork

---

## Competitor Analysis Summary

### 1. Deputy.com
- **Hero**: "The complete people platform for hourly work" — centered, dual CTA (Try free + Book a demo)
- **Social proof**: Review platform badges (Capterra 4.6, G2 4.6, Trustpilot 4.1) immediately below hero; stats: 100 countries, 385K workplaces, 681K users
- **Pricing**: 3 tiers (Lite $5, Core $6.50 "Most Popular", Pro $9/user/mo) with monthly/annual toggle, minimum spend disclosed
- **Trust**: GDPR compliance, Trust Center, Privacy Center linked in footer
- **Animations**: Tab carousel, accordion sections, scroll-triggered opacity/transform
- **Notable**: ROI calculator linked from resources section; no FAQ on homepage

### 2. Jibble.io
- **Hero**: Two-column (text left, image right), emphasis on "FREE" in title tag
- **Social proof**: Grayscale client logos with opacity effect; dedicated testimonial cards with star ratings and author attribution
- **Pricing**: 4 tiers (Free "90% use this", Premium $4.49, Ultimate $7.99, Enterprise custom) with monthly/yearly toggle; 60+ feature comparison rows
- **Trust**: Multi-language (WPML)
- **Animations**: Fade-in entrance, dropdown toggles, hover opacity
- **Notable**: FAQ section present (accordion-style "section-qa"); no video

### 3. Clockify.me
- **Hero**: "The most popular free time tracker for teams" — centered, single CTA "Start tracking time - it's free!", 4.8 star badge
- **Social proof**: 12 enterprise logos (HP, Verizon, AmEx, Siemens, Cisco); 20+ named testimonials with roles; "5M+ users", "95% satisfaction"
- **Pricing**: 5 tiers (Free, Basic $3.99, Standard $5.49, Pro $7.99, Enterprise $11.99) with 20% annual discount; bundle "BEST VALUE" option
- **Trust**: ISO, SOC2, GDPR badges in footer; "99.99% uptime"; 24/7 support; review site badges (6 platforms)
- **Animations**: Mega menu dropdowns, slick slider carousel, video modal popup, hover feature tabs
- **Notable**: Multiple embedded feature tutorial videos (2-10 min); labor pricing calculator linked

### 4. TimeClock365.com
- **Hero**: "The #1 Choice for HR Managers and CEOs" — centered, dual CTA (Start Free Trial + Request a Demo), promo banner with discount code
- **Social proof**: Counter animations with large typography for key metrics
- **Pricing**: 4 tiers with color-coded borders, yearly subscription emphasized
- **Trust**: CSP implementation, Schema.org structured data
- **Notable**: "See how it works" implies video/demo; digital wallet pass feature highlighted

### 5. BambooHR.com
- **Hero**: "The Powerfully Easy HR Platform" — centered, single CTA "Get My Free Demo", 7 capability icons below
- **Social proof**: "34,000 businesses"; 13 named testimonials (CHRO, COO, VP HR); specific ROI stats ($70K saved via reporting, $40K via performance mgmt, $20K via payroll)
- **Pricing**: Gated (call or visit pricing page); no public pricing
- **Trust**: Zero Trust model, SOC II audit, SAML, WAF, encryption in transit, annual pen test; 150+ integrations
- **Animations**: Minimal — multiple "Get a Demo" modal CTAs throughout
- **Notable**: 7-question FAQ section present; security deeply detailed; data hosting locations (US, Canada, Ireland) disclosed

### 6. Homebase (joinhomebase.com)
- **Hero**: "Ready to pay roll." — two-column (text left, product screenshot right), dual CTA (Explore payroll + Get started for free)
- **Social proof**: 18+ brand logos in scrolling marquee; 4 named customer quotes; stats: 150K businesses, 3.5M employees, "85% rated extremely easy", "20 hours saved monthly", "1.2B hours logged"
- **Pricing**: 4 tiers (Basic Free, Essentials $24, Plus $56 "best value", All-in-One $96/mo annual) with monthly/annual toggle showing 20% savings
- **Trust**: App Store 4.8 (84K reviews), G2/Capterra 4.8 (1.1K reviews); awards from USA Today, Inc., G2, Webby
- **Animations**: Logo carousel marquee, Lottie tab animations, Swiper testimonial carousel, parallax scroll, navbar opacity on scroll
- **Notable**: FAQ dropdown referenced; calculator tools (time card, hourly salary); press mentions (WSJ, Forbes, NYT)

### 7. WhenIWork.com
- **Hero**: Two-column (text+email signup left, product image right), email/password capture directly in hero
- **Social proof**: Customer logo carousel (sprite-based); review cards with blockquotes, sources, company names; stats section with value/descriptor pairs
- **Pricing**: Monthly/annual toggle; feature comparison table with checkmarks; sticky bottom CTA on desktop
- **Trust**: Google Sign-in option; integrations menu item
- **Animations**: Chevron rotation, color hover transitions, swipeable carousel, accordion expand/collapse
- **Notable**: FAQ accordion present; video modal with play button and hover scale (1.2x); email capture in hero (not just CTA link)

---

## Current TrackAttendance Page Audit

**What exists:**
- Hero with typewriter animation, mesh gradient, pill badge ("Offline-First Technology")
- Dual CTA: "Try Check-in System (Free)" + "Get a Quote"
- Scarcity badge ("Early-bird pricing... 3 slots left")
- Stats bar: 0.3s, 100%, 10+ gates
- Social proof stats section (50+, 25K+, 99.9%, 0)
- Problem/Solution section (3 pain points + 4 solutions)
- How-it-works 3-step flow
- Scanning methods grid (4 methods)
- Smart features section
- Interactive kiosk demo simulator
- Screenshots section (kiosk, mobile dashboard, desktop dashboard)
- Pricing: 3 tiers (Starter 3,500 THB, Professional 6,500 THB "Recommended", Enterprise Custom)
- Second social proof bar with trust badges (PDPA, Google Cloud, SHA256, 338 Tests)
- Use cases grid (4 types)
- Contact section (LINE CTA, email, phone)
- Minimal footer
- Bilingual TH/EN, dark/light mode, prefers-reduced-motion support

**What is strong:**
- Interactive demo is unique — none of the 7 competitors have this
- Offline-first positioning is a genuine differentiator
- Bilingual support (TH/EN) is well-implemented
- Dark/light mode with proper CSS custom properties
- Accessibility: reduced-motion media query
- Glassmorphism and glow effects are modern and well-executed

---

## Gap Analysis: What is MISSING vs. Competitors

### Critical Gaps (High Impact)

| Gap | Competitors Who Do This | Impact |
|-----|------------------------|--------|
| Customer testimonials with names/photos/roles | Clockify (20+), BambooHR (13), Homebase (4), Jibble, WhenIWork | Very High — builds trust; current page has zero named testimonials |
| FAQ section | BambooHR (7 Qs), Jibble, WhenIWork, Homebase | High — reduces friction, captures long-tail SEO |
| Video demo or animated product walkthrough | Clockify (multiple), WhenIWork (modal), TimeClock365 | High — video increases conversion 80%+ per industry data |
| Integration logos (LINE, Google Workspace, Excel, Slack) | Deputy, Clockify, BambooHR (150+), Homebase | High — signals ecosystem fit |
| Annual/monthly pricing toggle or multi-event discount | All 7 competitors | Medium-High — per-event pricing is unusual; a volume discount toggle would reduce price objection |
| Comparison table vs. alternatives | Clockify, Homebase (/compare), WhenIWork | Medium-High — "why us" content is missing entirely |

### Important Gaps (Medium Impact)

| Gap | Competitors Who Do This | Impact |
|-----|------------------------|--------|
| Review platform badges (G2, Capterra, Trustpilot) | Deputy, Clockify (6 platforms), Homebase | Medium — third-party validation |
| ROI calculator or savings estimator | Deputy, Homebase (tools), Clockify (labor calc) | Medium — quantifies value |
| Trust badges with visual weight (PDPA shield, SOC 2 badge) | Clockify (ISO, SOC2, GDPR logos), BambooHR (SOC II, Zero Trust), Deputy (GDPR) | Medium — current PDPA mention is text-only, needs visual badge |
| Press/awards mentions | Homebase (USA Today, WSJ, Forbes, NYT), Deputy | Medium — authority signal |
| Detailed security/compliance section | BambooHR (7 security items), Clockify | Medium — especially relevant for Thai B2B market |
| Structured data / Schema.org markup | TimeClock365, general SEO best practice | Medium — missing from current page |

### Nice-to-Have Gaps (Lower Impact)

| Gap | Competitors Who Do This | Impact |
|-----|------------------------|--------|
| Email capture in hero (not just CTA link) | WhenIWork, Homebase | Lower — current LINE-based approach may be more appropriate for Thai market |
| Logo carousel/marquee animation | Homebase, Deputy | Lower — needs real client logos first |
| Mega menu navigation | Clockify, Homebase, Deputy | Lower — single-product page doesn't need this yet |
| Sticky bottom CTA bar | WhenIWork | Lower — could help mobile conversion |

---

## Top 10 Actionable Improvements

### 1. Add Customer Testimonial Carousel
**Priority: P0 — Highest Impact**

Every competitor uses named testimonials. Add 3-5 real customer quotes with:
- Photo (or company logo if photo unavailable)
- Name, role, company
- Star rating (if available)
- Specific result ("Reduced check-in time from 45 minutes to 3 minutes for 800 attendees")

Place between the pricing section and the contact CTA. Use a Swiper/carousel for mobile. BambooHR pattern of quoting specific dollar/time savings is highly effective.

### 2. Add FAQ Accordion Section
**Priority: P0 — High Impact, Low Effort**

Add 6-8 questions before the contact section:
- "How does offline mode work?"
- "What scanning hardware do I need?"
- "How is attendee data protected? (PDPA)"
- "Can I use it for recurring events?"
- "How many gates/stations can run simultaneously?"
- "What file formats are supported for roster import?"
- "Do you offer on-site setup support?"
- "Is there a free trial?"

Benefits: Reduces support burden, captures SEO long-tail queries, addresses objections before contact. Use `<details>`/`<summary>` or accordion pattern (already used by Jibble, WhenIWork, BambooHR).

### 3. Add Video Demo or Animated Product Walkthrough
**Priority: P0 — High Impact**

Options (in order of effort):
- **Quick win**: 60-second screen recording of the kiosk app scanning badges, with text overlays (Thai + EN subtitles). Embed via YouTube/Vimeo for SEO benefit.
- **Medium effort**: Lottie animation showing the scan-to-dashboard flow (similar to Homebase's tab-based Lottie feature demos).
- **Full effort**: Professional product walkthrough video with voiceover.

Place above or alongside the interactive demo section. The interactive demo is great but a passive video catches visitors who won't click.

### 4. Upgrade Trust Badges to Visual Shield/Badge Format
**Priority: P1 — Medium Effort, High Credibility**

Current trust signals are small text with Lucide icons. Replace with:
- **PDPA Compliant** — Design a proper shield badge (green/purple shield icon with checkmark)
- **Google Cloud Hosted** — Use official Google Cloud partner badge/logo
- **SHA-256 Encryption** — Lock icon with badge styling
- **99.9% Uptime** — Circular badge with percentage
- Add: **"Data stays in Thailand (asia-southeast1)"** — geographic compliance signal

Reference BambooHR's security section: Zero Trust, SOC II, encryption, pen testing. Even listing 4-5 security practices in a dedicated mini-section adds weight.

### 5. Add Integration/Compatibility Logos Section
**Priority: P1 — Medium Impact**

Show what TrackAttendance works with:
- **Input**: Barcode scanners (generic icon), QR code readers, webcam
- **Output/Export**: Excel/CSV, Google Sheets
- **Communication**: LINE (already used for support), Email notifications
- **Cloud**: Google Cloud Platform
- **OS**: Windows, macOS (if applicable)

Display as a horizontal row of grayscale logos that colorize on hover (Jibble/Deputy pattern). Even 6-8 logos make the product feel like part of a larger ecosystem.

### 6. Add Volume/Multi-Event Pricing Toggle
**Priority: P1 — Conversion Impact**

Every competitor has monthly/annual toggles. TrackAttendance's per-event model is unique but needs a volume incentive:
- Add a toggle: "Single Event" vs. "Event Package (5+ events, save 20%)"
- Or show annual contract pricing alongside per-event pricing
- Show the per-event price crossed out with the package price below

This addresses the "#1 objection" for recurring customers (training companies, universities with monthly events).

### 7. Add Comparison Table ("Why TrackAttendance")
**Priority: P1 — Differentiation**

Create a simple comparison grid:

| Feature | TrackAttendance | Google Forms | Paper Sign-in | Other SaaS |
|---------|----------------|-------------|---------------|------------|
| Works offline | Yes | No | Yes | Rarely |
| Scan speed | 0.3s | N/A | 30s+ | 2-5s |
| Multi-gate sync | Yes | Manual | No | Sometimes |
| Setup time | 5 min | 15 min | 30 min | 30 min+ |
| Data privacy (PDPA) | Local-first | Cloud-only | Physical risk | Cloud-only |

This positions TrackAttendance against the real alternatives Thai event organizers currently use (paper + Google Forms), not just SaaS competitors.

### 8. Add ROI/Savings Estimator
**Priority: P2 — Engagement**

A simple interactive calculator:
- Input: Number of attendees, number of events per year, current check-in time per person
- Output: "You save X hours and Y THB per year with TrackAttendance"

Use BambooHR's pattern of showing specific monetary savings. For example: "An event with 500 attendees checking in at 30 seconds each = 4.2 hours. With TrackAttendance at 0.3 seconds = 2.5 minutes. You save 4 hours per event."

Place near the pricing section to justify the cost.

### 9. Add Structured Data (Schema.org) and Improve SEO Meta
**Priority: P2 — SEO**

Current meta is good but missing:
- `<script type="application/ld+json">` for SoftwareApplication, Product, FAQPage, Organization schemas
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`)
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:image`)
- `hreflang` tags for TH/EN (currently uses JS toggle, not separate URLs — consider `rel="alternate"`)
- Canonical URL tag
- More descriptive `<title>` for EN visitors

Adding FAQPage schema (after implementing the FAQ section) will enable rich snippets in Google search.

### 10. Add Sticky Mobile CTA Bar
**Priority: P2 — Mobile Conversion**

On mobile, add a fixed bottom bar with:
- "Try Free" or "LINE Chat" button (always visible)
- Appears after scrolling past the hero section
- Semi-transparent background matching the nav style

WhenIWork uses a sticky bottom CTA on desktop. For TrackAttendance's Thai B2B audience, a persistent LINE chat button on mobile would reduce friction significantly. Current mobile menu hides the CTA behind a hamburger menu.

---

## Design Patterns to Adopt from Competitors

### Hero Section
- **Keep**: Typewriter effect (unique), mesh gradient, dual CTA, scarcity badge
- **Add**: A product screenshot or mockup on the right side (two-column layout like Homebase/WhenIWork) — currently hero is text-only
- **Consider**: Moving the 3-stat bar (0.3s, 100%, 10+) into pill badges below the CTA for better visual hierarchy

### Social Proof
- **Keep**: Stats counters
- **Add**: Client logos (once available), review badges, named testimonials
- **Consolidate**: Currently there are 3 separate social proof sections (after hero, after pricing, before contact) — merge into 2 maximum

### Pricing
- **Keep**: 3-tier structure with highlighted middle tier, THB currency, per-event model
- **Add**: Volume toggle, annual contract option, feature comparison matrix below cards
- **Consider**: "Most Popular" badge (Deputy) instead of "Recommended" — social proof language converts better

### Footer
- **Current**: Minimal single-line footer
- **Upgrade**: Multi-column footer with links to future pages (About, Blog, Docs, Privacy Policy, Terms), social links, contact info. Every competitor has a substantial footer. Even a 2-column layout would improve credibility.

---

## Quick Wins (Can Implement Today)

1. **FAQ section** — pure HTML/CSS accordion, no external dependencies
2. **Structured data** — JSON-LD script tags in `<head>`
3. **Open Graph / Twitter Card meta tags** — 5 minutes of work
4. **Upgrade trust badges** — larger icons, shield styling, add "Data hosted in Thailand" text
5. **Sticky mobile CTA** — CSS `position: fixed; bottom: 0` with a LINE button
6. **Consolidate duplicate social proof sections** — currently 3 sections showing similar data

---

## Sources

- [Unbounce: 26 SaaS Landing Page Best Practices](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/)
- [Landingi: 14 SaaS Landing Page Best Practices](https://landingi.com/landing-page/saas-best-practices/)
- [Heyflow: SaaS Landing Page Best Practices](https://heyflow.com/blog/saas-landing-page-best-practices/)
- [Webstacks: SaaS Website Conversions 2026](https://www.webstacks.com/blog/website-conversions-for-saas-businesses)
- [Genesys Growth: Landing Page Conversion Stats 2026](https://genesysgrowth.com/blog/landing-page-conversion-stats-for-marketing-leaders)
- [Google Cloud: Thailand PDPA Compliance](https://cloud.google.com/security/compliance/thailand-pdpa)
- [OneTrust: Thai PDPA Compliance Guide](https://www.onetrust.com/blog/the-ultimate-guide-to-thai-pdpa-compliance/)
