# TrackAttendance Landing Page: Design Principles & Conversion Architecture

> Research synthesis from 20+ sources covering SaaS design psychology, conversion optimization,
> premium animation patterns, and Thai B2B cultural adaptation. March 2026.

---

## Table of Contents

1. [Top 10 Design Psychology Principles](#1-top-10-design-psychology-principles)
2. [Conversion Architecture Blueprint](#2-conversion-architecture-blueprint)
3. [Animation Cookbook](#3-animation-cookbook)
4. [Thai B2B Cultural Adaptations](#4-thai-b2b-cultural-adaptations)
5. ["Steal This" — Patterns from Stripe, Linear & Vercel](#5-steal-this--patterns-from-stripe-linear--vercel)

---

## 1. Top 10 Design Psychology Principles

### Principle 1: Z-Pattern Scanning for Landing Pages

Landing pages with minimal text follow the Z-pattern: eyes move top-left to top-right, then diagonally down to bottom-left, then across to bottom-right. This differs from F-pattern (used for text-heavy content like articles).

**Application**: Place logo top-left, navigation top-right, hero headline center-left, and primary CTA at the Z's terminal point (center-right or bottom-right of hero). Social proof logos sit along the second horizontal sweep.

**Sizing hierarchy**:
- Hero headline: 48-72px (desktop), 32-48px (mobile)
- Subheadline: 20-24px, lighter weight
- Body text: 16-18px for readability
- CTA button text: 16-18px, bold

### Principle 2: Cognitive Load Reduction

Visitors make decisions based on psychology, not logic. Landing page success is about reducing the cognitive load visitors experience when deciding whether to trust you. Every additional element, color, or animation that doesn't serve conversion adds friction.

**Application**: Maximum 2 typefaces. Maximum 3 colors (primary, secondary, accent). One primary CTA action per viewport. Remove any element you can't justify with a conversion purpose.

### Principle 3: Outcome-Driven Messaging Over Features

Pages that demonstrate transformation rather than listing capabilities consistently outperform traditional approaches. The shift from feature-focused to outcome-driven storytelling is the defining trend of 2025-2026 SaaS pages.

**Application**: Instead of "QR code scanning" say "Know who's here in seconds." Instead of "Cloud sync" say "Your data, everywhere, always safe." Lead with the business outcome, not the technical mechanism.

### Principle 4: Social Proof Layering

Social proof lifts conversions by 37% on average (10-270% range) for B2B SaaS. But placement is critical. Layer it throughout the page, not concentrated in one section.

**Application — the 3-layer system**:
1. **Logo bar** immediately below hero (trust signal: "who uses this")
2. **Metric callouts** after features section ("10,000+ scans processed daily")
3. **Testimonial quotes** before final CTA (result-driven, with names and photos)

### Principle 5: Visual Hierarchy Through Size, Weight & Contrast

The larger the element, the more attention it attracts. Typography hierarchy — different text sizes, weights, and styles — shows importance and guides the reader's eye naturally.

**Application — contrast ratios**:
- Headlines: high contrast (dark on light, or light on dark)
- Body text: minimum 4.5:1 contrast ratio (WCAG AA)
- CTA buttons: highest contrast element on page
- Secondary elements: reduced opacity (60-80%) to de-emphasize

### Principle 6: The Problem-Solution Arc

Most landing pages skip the problem section, yet it's crucial for clarifying value. Introducing the pain before the solution primes visitors to appreciate what you offer.

**Application**: Section 3 of the page should explicitly state the problem. Use a polarizing or emotionally resonant headline. Support with a statistic showing the severity of the problem. Then transition to "How It Works" as the resolution.

### Principle 7: Friction-Reducing CTA Design

CTAs should reduce perceived commitment. "Start Free Trial (No Credit Card)" outperforms "Sign Up" because it addresses the objection before it forms. Explaining what happens after clicking reduces anxiety.

**Application**:
- Primary CTA: action-first, benefit-implicit ("Start Tracking Free")
- Sub-text under CTA: "No credit card required. Set up in 2 minutes."
- Use high-contrast color distinct from all other page elements
- Minimum touch target: 48x48px on mobile

### Principle 8: Speed as Conversion

Each second of page load time drops conversions by 7%. Performance is not a technical concern — it's a conversion concern. A 3-second page loses 21% of potential conversions compared to a 0-second page.

**Application**: Lazy-load all images below the fold. Inline critical CSS. Defer non-essential JavaScript. Target Largest Contentful Paint (LCP) under 2.5 seconds. Compress all images to WebP.

### Principle 9: Mobile-First Design

83% of landing page visits are on mobile, while desktop converts about 8% better. Mobile-first design bridges this gap through touch-optimized CTAs, simplified forms, and fast-loading experiences.

**Application**: Design mobile layout first, then expand to desktop. Sticky/floating CTA on mobile (always visible). Simplify forms to absolute minimum fields. Stack all content vertically. Test thumb-reach zones for CTA placement.

### Principle 10: Pricing Transparency as Trust

Hiding pricing creates friction and suspicion. In B2B SaaS, transparency builds trust — especially for SME buyers who need to justify purchases quickly.

**Application**: Show pricing prominently. If pricing is complex, show a "Starting at" figure. Include a comparison table if multiple tiers exist. Place pricing after the value has been established (after features and social proof) but before the final CTA.

---

## 2. Conversion Architecture Blueprint

### The 8-Section Framework

This section order addresses customer objections sequentially:
*What is it? -> Who else uses it? -> Why do I need it? -> How does it work? -> How would I use it? -> Is it reliable? -> What does it cost? -> I'm ready.*

```
SECTION 1: HERO
├── Logo (top-left, Z-pattern start)
├── Minimal navigation (top-right)
├── Headline: outcome-driven, 6-10 words
├── Subheadline: 1-2 sentences clarifying the "how"
├── Primary CTA button (high contrast)
├── Secondary CTA (text link or ghost button)
├── Hero visual: product screenshot or short demo
└── Trust indicator: "Trusted by X+ companies"

SECTION 2: INITIAL SOCIAL PROOF (Logo Bar)
├── 4-8 recognizable company/client logos
├── Quantifiable metric: "3,000+ companies trust..."
└── NOTE: No testimonials here — save for later

SECTION 3: THE PROBLEM
├── Polarizing or emotionally resonant headline
├── Supporting statistic showing pain severity
├── Visual representation of the pain point
└── Brief copy (3-4 sentences max)

SECTION 4: HOW IT WORKS
├── Contrasting headline to problem section
├── 3-step process (scan -> sync -> report)
├── Specific benefits per step (not vague claims)
├── Integration logos if applicable
└── Secondary CTA

SECTION 5: USE CASES / FEATURES
├── 3-4 use case cards with icons
├── Each shows a specific scenario + benefit
├── Let prospects self-identify ("this is me")
└── Optional: tabbed or toggled content

SECTION 6: DEEPER SOCIAL PROOF
├── 2-3 result-driven testimonials with photos
├── Quantified outcomes ("Saved 4 hours per week")
├── Customer name, role, company
└── Optional: case study link

SECTION 7: PRICING
├── Clear pricing tiers or "Starting at" figure
├── Feature comparison if multiple plans
├── FAQ accordion addressing common objections
└── Primary CTA repeated

SECTION 8: FINAL CTA + ALTERNATIVE
├── Strong closing headline
├── Primary CTA (same as hero)
├── Alternative lower-commitment option
│   (e.g., "Talk to us on LINE" or "Watch a demo")
└── Footer with trust badges, contact info
```

### CTA Placement Map

Place CTAs at these strategic positions:

| Position | Type | Purpose |
|----------|------|---------|
| Hero (above fold) | Primary button | Capture high-intent visitors |
| After social proof logos | Text link or subtle button | Reinforce after trust signal |
| After "How It Works" | Primary button | Convert after understanding |
| After testimonials | Primary button | Convert after social proof |
| Sticky mobile bar | Floating button | Always-available conversion |
| Final section | Primary + Alternative | Last chance with options |

**Rule of thumb**: Repeat the primary CTA every 2-3 scroll-lengths. Use the same button text and color consistently. Never show more than one CTA at a time in the viewport (avoid decision fatigue).

### Information Architecture Principles

- **One page, one goal**: Every element serves conversion or trust-building
- **Modular sections**: Each section is self-contained and testable
- **Progressive disclosure**: Start broad (headline), get specific (features), end with proof (testimonials)
- **Objection sequence**: Address skepticism in order — credibility first, then mechanism, then proof, then price

---

## 3. Animation Cookbook

### 3.1 Design Tokens — Consistent Motion System

Define these CSS custom properties project-wide:

```css
:root {
  /* Timing */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-dramatic: 800ms;

  /* Easing — use consistently across all animations */
  --ease-out: cubic-bezier(0, 0, 0.58, 1);        /* Elements entering */
  --ease-in: cubic-bezier(0.42, 0, 1, 1);          /* Elements exiting */
  --ease-in-out: cubic-bezier(0.42, 0, 0.58, 1);   /* Elements moving */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful emphasis */
  --ease-premium: cubic-bezier(0.16, 1, 0.3, 1);   /* Smooth, premium feel */

  /* Distances */
  --slide-distance: 30px;
  --slide-distance-sm: 15px;
}
```

**80/20 Rule**: At least 80% of animations should use these tokens. If custom values exceed 20%, the token system needs expansion.

### 3.2 Scroll-Triggered Reveal (Intersection Observer)

The foundation animation for all section entries:

```css
/* Initial hidden state */
.reveal {
  opacity: 0;
  transform: translateY(var(--slide-distance));
  transition: opacity var(--duration-slow) var(--ease-out),
              transform var(--duration-slow) var(--ease-out);
}

/* Revealed state */
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger children for cascading effect */
.reveal-stagger > *:nth-child(1) { transition-delay: 0ms; }
.reveal-stagger > *:nth-child(2) { transition-delay: 100ms; }
.reveal-stagger > *:nth-child(3) { transition-delay: 200ms; }
.reveal-stagger > *:nth-child(4) { transition-delay: 300ms; }
```

```javascript
// Vanilla JS — no library needed
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // Animate once only
    }
  });
}, {
  threshold: 0.15,        // Trigger when 15% visible
  rootMargin: '0px 0px -50px 0px'  // Trigger slightly before fully in view
});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

### 3.3 Directional Reveals (Fade from Left/Right/Below)

```css
.reveal-up {
  opacity: 0;
  transform: translateY(var(--slide-distance));
}

.reveal-left {
  opacity: 0;
  transform: translateX(calc(-1 * var(--slide-distance)));
}

.reveal-right {
  opacity: 0;
  transform: translateX(var(--slide-distance));
}

.reveal-scale {
  opacity: 0;
  transform: scale(0.95);
}

/* All share the same visible state */
.reveal-up.visible,
.reveal-left.visible,
.reveal-right.visible,
.reveal-scale.visible {
  opacity: 1;
  transform: translateY(0) translateX(0) scale(1);
}
```

### 3.4 CTA Button Effects

```css
/* Subtle glow pulse on primary CTA */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(var(--color-primary-rgb), 0.3); }
  50% { box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.6); }
}

.cta-primary {
  transition: transform var(--duration-fast) var(--ease-bounce),
              box-shadow var(--duration-normal) var(--ease-out);
}

.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.4);
}

.cta-primary:active {
  transform: translateY(0);
  transition-duration: var(--duration-instant);
}

/* Optional: idle glow pulse (use sparingly) */
.cta-primary--glow {
  animation: glow-pulse 3s var(--ease-in-out) infinite;
}
```

### 3.5 Gradient Text Animation (Vercel-style)

```css
:root {
  --gradient-1: #007CF0;
  --gradient-2: #00DFD8;
  --gradient-3: #7928CA;
  --gradient-4: #FF0080;
}

/* Static gradient text */
.gradient-text {
  background-image: linear-gradient(90deg, var(--gradient-1), var(--gradient-2));
  -webkit-text-fill-color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
}

/* Animated cycling gradient (overlay technique) */
@keyframes gradient-cycle-1 {
  0%, 16.667%, 100% { opacity: 1; }
  33.333%, 83.333% { opacity: 0; }
}

@keyframes gradient-cycle-2 {
  0%, 16.667%, 66.667%, 100% { opacity: 0; }
  33.333%, 50% { opacity: 1; }
}

@keyframes gradient-cycle-3 {
  0%, 50%, 100% { opacity: 0; }
  66.667%, 83.333% { opacity: 1; }
}

.hero-headline {
  position: relative;
}

.hero-headline .gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-headline .gradient-overlay:nth-child(1) {
  background-image: linear-gradient(90deg, var(--gradient-1), var(--gradient-2));
  animation: gradient-cycle-1 8s infinite;
}

.hero-headline .gradient-overlay:nth-child(2) {
  background-image: linear-gradient(90deg, var(--gradient-2), var(--gradient-3));
  animation: gradient-cycle-2 8s infinite;
}

.hero-headline .gradient-overlay:nth-child(3) {
  background-image: linear-gradient(90deg, var(--gradient-3), var(--gradient-4));
  animation: gradient-cycle-3 8s infinite;
}
```

### 3.6 Number Counter Animation

```javascript
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out curve
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * eased);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

// Trigger on scroll into view
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.target, 10);
      animateCounter(entry.target, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));
```

```html
<!-- Usage -->
<span data-counter data-target="10000">0</span>
```

### 3.7 Smooth Logo Bar Scroll

```css
@keyframes scroll-logos {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.logo-bar-track {
  display: flex;
  animation: scroll-logos 30s linear infinite;
  width: max-content;
}

/* Pause on hover for accessibility */
.logo-bar-container:hover .logo-bar-track {
  animation-play-state: paused;
}
```

### 3.8 Card Hover Lift

```css
.feature-card {
  transition: transform var(--duration-normal) var(--ease-premium),
              box-shadow var(--duration-normal) var(--ease-out);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}
```

### 3.9 Performance Rules

1. **Only animate `transform` and `opacity`** — these are GPU-composited and won't trigger layout/paint
2. **Use `will-change` sparingly** — only on elements actively animating, remove after animation
3. **Prefer CSS transitions over JS** for simple state changes
4. **Use `prefers-reduced-motion`** to respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.10 What Makes "Premium" vs "Template"

| Template Feel | Premium Feel |
|---------------|--------------|
| Instant/jarring transitions | Smooth easing with deliberate timing |
| Everything animates at once | Staggered, cascading reveals |
| Generic bounce/elastic easing | Custom cubic-bezier curves |
| Animations for decoration | Animations that guide attention |
| Same animation everywhere | Varied, contextual motion |
| Fast, snappy (< 150ms) | Measured, confident (300-500ms) |
| No motion system | Consistent design tokens |
| No reduced-motion support | Full accessibility compliance |

---

## 4. Thai B2B Cultural Adaptations

### 4.1 Trust is Relationship-Based

Thai business culture prioritizes personal connections and trust built through sincerity, respect, and reliability. Recommendations from trusted sources carry significant weight in Thailand's collectivist culture.

**Adaptations**:
- Feature testimonials from Thai companies prominently (with Thai names and logos)
- Include a team/founder photo section — Thai buyers want to know who they're dealing with
- Add a LINE Official Account QR code as a primary contact channel
- Show local phone number (+66) prominently
- Display Thai business registration number and tax ID for legitimacy

### 4.2 LINE Over Email

LINE dominates Thai business communications — it's used for customer support, promotions, and relationship management. Thai people place high value on politeness and prompt responses.

**Adaptations**:
- Primary CTA alternative: "Add us on LINE" with QR code (not just email)
- Include LINE as the support channel, not Intercom/chat widgets
- Offer LINE notification option for scan reports
- Response time commitment: "Reply within 5 minutes on LINE"

### 4.3 Language & Tone

Locally tailored content with Thai language significantly improves engagement. Politeness markers matter.

**Adaptations**:
- Bilingual page: Thai primary, English secondary (toggle)
- Use polite Thai particles (krub/ka) in UI copy
- Formal but warm tone — avoid overly casual Western SaaS copy
- Thai font: use Sarabun, Noto Sans Thai, or IBM Plex Sans Thai for professional feel
- Numbers in Thai numerals as an option, but Arabic numerals are standard in business

### 4.4 Payment & Compliance Trust Signals

Thailand has embraced digital payments (70%+ use mobile payments). PDPA (Personal Data Protection Act) compliance is the Thai equivalent of GDPR.

**Adaptations**:
- Show PDPA compliance badge
- Mention data residency (where data is stored)
- Display accepted payment methods (PromptPay, Thai bank transfer, credit card)
- Monthly invoicing option (Thai B2B expects this)
- Include Thai tax invoice (VAT receipt) capability

### 4.5 Visual Design Preferences

Thai corporate websites tend toward clean, professional designs with blue/white color schemes. Government and enterprise trust is signaled through formality.

**Adaptations**:
- Clean, professional color palette (blues, whites work well)
- Avoid overly dark/edgy design for B2B — save that for consumer SaaS
- Use professional photography over illustrations for B2B
- Show certification badges and partnership logos prominently
- Include a "Trusted by" section with recognizable Thai company logos

### 4.6 SaaS Market Context

SaaS adoption in Thai SMEs is around 10% (approximately 50,000 of ~500,000 juristic SMEs), representing 90% untapped potential. This means many visitors may be new to SaaS concepts.

**Adaptations**:
- Explain SaaS benefits (no installation, automatic updates, cloud backup)
- Emphasize "works offline" capability — internet reliability varies
- Show a clear "How to Get Started" section with numbered steps
- Offer a demo or trial — Thai SMEs want to see before buying
- Include comparison with manual/paper-based attendance tracking

---

## 5. "Steal This" — Patterns from Stripe, Linear & Vercel

### From Stripe: The Art of Excessive Refinement

**What they do**: Stripe balances dense information with elegant layout using a 4-column grid system that's subtly visible. Grid lines become design elements. Diagonal motifs repeat throughout for visual interest. The hero features animated color splashes with slow, mesmerizing movement.

**Patterns to steal**:
1. **Container block system** (Apple-style) — present dense information without overwhelming. Each section is a self-contained block with clear boundaries.
2. **Monochromatic inactive states** — collapsed/unfocused elements are grayscale; active elements get full color. This guides attention through contrast.
3. **Negative space as emphasis** — Stripe's CTAs are intentionally small, using surrounding whitespace and gradient effects to draw attention rather than size.
4. **Grid as design element** — subtle lines and structure visible in the layout itself, conveying engineering precision and attention to detail.

**How to apply to TrackAttendance**: Use the container block approach for the "How It Works" section. Each step (Scan, Sync, Report) gets its own contained block with clear boundaries. Use grayscale for non-active steps if using a tabbed/carousel approach.

### From Linear: Dark Precision

**What they do**: Linear established a design aesthetic that has become an industry standard. Dark backgrounds with gradient accents. Inter typeface. 8px spacing scale (8, 16, 32, 64). Modular components. Subtle 85% opacity header bar that appears on scroll. Purple gradient sphere as identity.

**Patterns to steal**:
1. **8px spacing system** — all spacing in multiples of 8 (8, 16, 24, 32, 48, 64, 96, 128). Creates unconscious visual consistency.
2. **Modular component library** — wide variety of section layouts that all share the same design language. Enables visual interest within consistency.
3. **Gradient accents on dark backgrounds** — use gradients as focal points, not decoration. Linear's gradient sphere is functional identity.
4. **Sticky transparent header** — 85% opacity navbar that appears on scroll. Professional and non-intrusive.

**How to apply to TrackAttendance**: Adopt the 8px spacing system. If using a dark variant/theme, follow Linear's approach: dark gray backgrounds (#0A0A0A to #1A1A1A), not pure black. Use gradient accents sparingly on key elements (headline, CTA glow). Consider Inter or a similar geometric sans-serif for the English type.

### From Vercel: Motion with Restraint

**What they do**: Deep blacks, clean whites, accent gradients of blue/purple/magenta. Shimmering deploy button. Animated gradient backgrounds used sparingly. Code previews as interactive elements. Dark/light mode toggle.

**Patterns to steal**:
1. **Gradient text animation** — cycling gradient overlays on the hero headline using opacity keyframes and 8-second duration loops. (Full CSS in Animation Cookbook section 3.5 above.)
2. **Shimmer CTA** — subtle gradient animation on the primary button that catches the eye without being distracting.
3. **Code as visual** — showing actual code/terminal output as a design element. For TrackAttendance: show a scan log or API response as a visual.
4. **Minimal motion, maximum impact** — every animation serves a purpose. No decorative animation. Motion is "like salt."

**How to apply to TrackAttendance**: Use the gradient text technique on the hero headline (cycle through brand colors). Show a live scan preview or API response in a terminal-style block as the hero visual. Keep total animations to under 5 distinct types across the entire page.

### From Cal.com & Lemon Squeezy: Open Source Trust

**Patterns to steal**:
1. **Open-source as trust signal** — if any component is open, badge it. Shows transparency.
2. **Interactive pricing calculator** — let users see exactly what they'd pay. Remove pricing anxiety.
3. **Developer-friendly documentation** — link to API docs from the landing page. Technical buyers want to verify before buying.
4. **Community metrics** — GitHub stars, contributor count, active installations as social proof.

### Cross-Cutting Patterns (Shared by All Top Pages)

| Pattern | Implementation |
|---------|---------------|
| Single primary action | One CTA verb repeated throughout ("Start Free") |
| Above-fold value | Headline + CTA + visual within first viewport |
| Progressive trust | Logo bar -> Features -> Testimonials -> Pricing -> CTA |
| Modular sections | Each section works independently and is A/B testable |
| Performance obsession | Sub-2-second load, lazy images, minimal JS |
| Accessibility | Reduced-motion support, WCAG AA contrast, keyboard nav |
| Responsive by default | Mobile-first design, tested on real devices |

---

## Sources

- [SaaSFrame: 10 Landing Page Trends 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [Fibr: 20 Best SaaS Landing Pages 2026](https://fibr.ai/landing-page/saas-landing-pages)
- [Cortes Design: Perfect SaaS Landing Page Breakdown](https://www.cortes.design/post/saas-landing-page-breakdown-example)
- [LandingPageFlow: CTA Placement Strategies 2026](https://www.landingpageflow.com/post/best-cta-placement-strategies-for-landing-pages)
- [Anthony Hobday: Stripe Website Critique](https://anthonyhobday.com/blog/20220810.html)
- [Charlimarie: Stripe Landing Page Lessons](https://pages.charlimarie.com/posts/what-we-can-learn-from-this-new-stripe-landing-page)
- [Kevin Hufnagl: Vercel Text Gradient Animation](https://kevinhufnagl.com/verceltext-gradient/)
- [Dev.to: Vercel Gradient Text CSS](https://dev.to/mohsenkamrani/create-a-gradient-text-effect-like-vercel-with-css-38g5)
- [Drifting Creatives: SaaS Landing Page Motion](https://driftingcreatives.com/add-motion-not-mayhem-why-smart-saas-landing-pages-move-with-purpose/)
- [99designs: F and Z Patterns](https://99designs.com/blog/tips/visual-hierarchy-landing-page-designs/)
- [Design Studio UX: SaaS Landing Page Design 2026](https://www.designstudiouiux.com/blog/saas-landing-page-design/)
- [Genesys Growth: B2B SaaS Landing Pages 2026](https://genesysgrowth.com/blog/designing-b2b-saas-landing-pages)
- [SaaS Hero: Enterprise Landing Page Design 2026](https://www.saashero.net/design/enterprise-landing-page-design-2026/)
- [Lovable: Landing Page Best Practices 2026](https://lovable.dev/guides/landing-page-best-practices-convert)
- [KlientBoost: 51 High-Converting SaaS Landing Pages](https://www.klientboost.com/landing-pages/saas-landing-page/)
- [Unbounce: State of SaaS Landing Pages](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/)
- [GreenFish: Thai Business Culture & Digital Marketing 2025](https://blog.ourgreenfish.com/the-business-mind/navigating-thai-business-culture-and-digital-marketing-trends-in-2025)
- [AccelerAsia: Thailand B2B Tech Sales](https://www.accelerasia.com/blog/thailand-seizing-sales-opportunities-for-b2b-tech-and-saas-companies/)
- [1StopAsia: B2B SaaS Localization Asia](https://www.1stopasia.com/blog/b2b-saas-localization-asia/)
- [Easings.net: Easing Functions Cheat Sheet](https://easings.net/)
- [MDN: CSS Animation Timing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function)
