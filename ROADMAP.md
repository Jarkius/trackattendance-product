# TrackAttendance — Product Roadmap & Marketing Plan

> From internal tool to profitable SaaS. Built on Gemini Deep Research + market analysis (March 2026).
>
> **See also**: [docs/STRATEGY.md](docs/STRATEGY.md) — Feasibility, risks, selling points, decision matrix
> **See also**: [docs/PLAN-commercialize.md](docs/PLAN-commercialize.md) — Detailed implementation plan (licensing, Stripe, anti-piracy, SEO)

---

## 1. Market Opportunity

### Market Size
- **Global time & attendance software**: USD ~4.5B (2025), projected USD ~6.2B by 2030
- **CAGR**: 8-12% depending on segment (online/cloud tracking grows faster at ~12.5%)
- **Asia Pacific HR SaaS**: USD 3.76B (2024), growing at 12.6% CAGR
- **SME segment**: Growing at **23.5% CAGR** — the fastest-growing buyer segment

### Why Now
- SEA transitioning from manual/biometric hardware to mobile-first cloud solutions
- 40%+ of SEA SMEs prioritize HR tech adoption (Asian Development Bank)
- Deskless workforce (F&B, manufacturing, construction) is massively underserved
- Post-COVID: companies demand offline-capable, multi-site attendance solutions

### Our Edge
| Advantage | Why It Matters |
|-----------|---------------|
| **Offline-first** | Stations work without internet — critical for factories, construction sites |
| **QR/barcode kiosk scanning** | No biometric hardware cost, no fingerprint hygiene concerns |
| **Multi-station sync** | Real-time cloud sync across unlimited locations |
| **Privacy-first** | Employee names stay local; only badge IDs sync to cloud |
| **Sub-second scanning** | Built for shift-start bottleneck speed |

---

## 2. Target Market

### Primary Segments (Phase 1)

| Segment | Size | Pain Point | Our Pitch |
|---------|------|-----------|-----------|
| **F&B & Retail Chains** | 5-20 outlets | Need real-time visibility across locations | "See who's clocked in at every outlet, right now" |
| **Light Manufacturing** | 20-200 workers | Shift-start punch-in bottlenecks | "Scan 100 workers in under 5 minutes" |
| **Construction & Field** | Project-based sites | Hardware gets damaged; remote locations | "Print a QR poster, stick it on site — done" |

### Geographic Focus

| Phase | Markets | Why |
|-------|---------|-----|
| **Phase 1** | Singapore, Malaysia | High digital literacy, high labor costs, English-speaking |
| **Phase 2** | Indonesia, Vietnam | Massive workforce scale, rising compliance needs |
| **Phase 3** | Thailand, Philippines | Growing SME digitization, mobile-first markets |

---

## 3. Competitive Landscape

### Three Tiers We Compete Against

| Tier | Examples | Their Weakness | Our Advantage |
|------|----------|---------------|---------------|
| **Global Giants** | Jibble, Clockify, Deputy | Overbuilt for local SEA workflows, expensive | Simple, fast, offline-first |
| **Regional HRMS** | Swingvy, BrioHR, SalaryBox | Attendance is a feature, not the product | We ARE the attendance product — purpose-built |
| **Manual/Legacy** | Paper logs, punch cards | Zero visibility, fraud-prone | "Cheaper than 1 hour of lost productivity" |

### Competitive Pricing Reference
- Clockify: Free base, $2.50/user/mo for attendance
- Jibble: Free for <50, $2/user/mo premium
- Deputy: $4.50/user/mo
- OneTap: $19/mo flat for events
- **Our sweet spot**: $1.50-2.50/user/mo (undercut globals, beat regionals on focus)

---

## 4. Pricing Model — "Growth-Aligned"

Revenue scales with customer headcount. Free tier as acquisition funnel.

| Tier | Target | Price (USD/mo) | Features |
|------|--------|---------------|----------|
| **Free** | < 10 employees | $0 | 1 station, basic Excel export, 30-day history |
| **Pro** | 10-50 employees | $1.50/user | Multi-station, real-time cloud sync, dashboard, 1-year history |
| **Business** | 50-200 employees | $2.50/user | API access, business unit tracking, priority support, unlimited history |
| **Enterprise** | 200+ employees | Custom | SSO, dedicated support, custom integrations, SLA |

### Revenue Projections (Conservative)

| Milestone | Clients | Avg Users | MRR | ARR |
|-----------|---------|-----------|-----|-----|
| Month 6 | 20 free, 5 pro | ~150 paid | $225 | $2,700 |
| Month 12 | 50 free, 20 pro, 3 biz | ~600 paid | $1,350 | $16,200 |
| Month 18 | 100 free, 50 pro, 10 biz | ~2,000 paid | $4,250 | $51,000 |
| Month 24 | 200 free, 100 pro, 25 biz | ~5,000 paid | $10,750 | $129,000 |

### Passive Income Path
- Free tier drives organic growth (word of mouth, SEO)
- Pro/Business tiers are self-serve (no sales team needed)
- Once product-market fit is proven at Month 12, growth compounds
- **Break-even target**: ~30 paying customers (~$500/mo covers Neon + Cloud Run)

---

## 5. Product Roadmap

### Phase 1: Foundation (Now → Month 3)
*Goal: Make it sellable*

- [ ] **Multi-tenant architecture** — Add `tenant_id` + Row-Level Security to PostgreSQL
- [ ] **Self-service signup** — Registration flow, tenant provisioning
- [ ] **Billing integration** — Stripe for subscriptions (Free/Pro/Business tiers)
- [ ] **Web-based dashboard** — Replace desktop-only PyQt6 with responsive web app
- [ ] **Admin panel** — Manage stations, users, export settings per tenant
- [ ] **Landing page** — Product website with pricing, demo, signup

### Phase 2: Growth (Month 3 → 6)
*Goal: Acquire first 20 paying customers*

- [ ] **Mobile dashboard** — Managers check attendance from phone
- [ ] **Station management** — Register/deactivate scanning stations remotely
- [ ] **Notification system** — Late arrivals, no-shows, sync failures
- [ ] **Public holiday calendars** — SG, MY, ID, PH, TH
- [ ] **Localization** — Bahasa, Thai, Vietnamese UI
- [ ] **API documentation** — Enable payroll integrations

### Phase 3: Scale (Month 6 → 12)
*Goal: 50+ paying customers, channel partnerships*

- [ ] **Payroll integrations** — Talenox, HReasily, Xero
- [ ] **Geofencing** — Optional location verification for mobile check-in
- [ ] **Shift scheduling** — Basic shift templates with attendance matching
- [ ] **Reports & analytics** — Overtime, patterns, compliance reports
- [ ] **White-label option** — For HR resellers
- [ ] **SOC 2 / PDPA compliance** — Trust badge for enterprise sales

### Phase 4: Passive Income (Month 12+)
*Goal: Self-sustaining growth engine*

- [ ] **Marketplace listing** — List on Xero/Talenox/HReasily app stores
- [ ] **Referral program** — Existing customers bring new ones
- [ ] **Content marketing flywheel** — SEO-optimized guides, templates
- [ ] **Partner channel** — POS resellers, HR consultants, BPOs

---

## 6. Go-To-Market Strategy

### Phase 1: Product-Led Growth (The Hook)

**The "Aha" Moment**: First QR scan within 3 minutes of signup.

| Channel | Action | Cost |
|---------|--------|------|
| **Product Hunt launch** | Launch with "Offline-first attendance for SEA" angle | Free |
| **SEO content** | "QR attendance tracking", "offline attendance app" guides | Free |
| **LinkedIn** | Target SME owners, HR managers in SG/MY | Free |
| **Free tier** | 10-user free plan as permanent acquisition funnel | Hosting only |

### Phase 2: Channel Partnerships (The Scale)

| Partner Type | Examples | Value Exchange |
|-------------|----------|----------------|
| **Payroll providers** | Talenox, HReasily | We feed attendance data → they get stickier customers |
| **POS resellers** | F&B tech shops | Bundle attendance with POS → upsell opportunity |
| **HR consultants** | SME advisory firms | Recommend us → referral commission |
| **Co-working spaces** | WeWork, JustCo | Offer to members → built-in audience |

### Phase 3: Trust & Compliance

- PDPA/GDPR compliance certification
- Data hosted in Singapore region (Neon/Cloud Run asia-southeast1)
- Transparent employee-facing dashboard (employees see their own logs)
- Security audit + SOC 2 roadmap

---

## 7. Technical Architecture for Scale

### Current → Target

```
CURRENT (Single-tenant)              TARGET (Multi-tenant SaaS)
┌─────────────────────┐              ┌──────────────────────────┐
│ PyQt6 Desktop App   │              │ Web App (React/Next.js)  │
│ SQLite local DB     │              │ + Mobile PWA             │
│ Fastify API         │              │                          │
│ Neon PostgreSQL     │              │ Fastify API + Auth       │
└─────────────────────┘              │ Neon PostgreSQL + RLS    │
                                     │ Stripe Billing           │
                                     │ Station Agent (Electron) │
                                     └──────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Multi-tenancy** | Row-Level Security (RLS) | Single schema, easier maintenance than DB-per-tenant |
| **Station app** | Electron (replaces PyQt6) | Cross-platform, web tech, easier updates |
| **Auth** | Clerk or Auth.js | Fast to implement, handles OAuth/magic links |
| **Billing** | Stripe | Industry standard, handles SEA payment methods |
| **Hosting** | Cloud Run (asia-southeast1) | Already deployed, auto-scales, pay-per-use |
| **Sync** | Keep SQLite buffer | Offline-first stays — it's our moat |

### Infrastructure Costs (Estimated Monthly)

| Service | Free Tier | At 50 Clients | At 200 Clients |
|---------|-----------|---------------|----------------|
| Neon PostgreSQL | Free (0.5GB) | $19 (10GB) | $69 (50GB) |
| Cloud Run | Free (2M req) | ~$15 | ~$50 |
| Stripe | 2.9% + $0.30 | ~$40 | ~$150 |
| Domain + Email | $12/yr | $12/yr | $12/yr |
| **Total** | ~$1/mo | ~$75/mo | ~$270/mo |

**Margin at 200 clients**: ~$10,750 MRR - $270 costs = **97.5% gross margin**

---

## 8. Marketing Plan — First 90 Days

### Week 1-2: Foundation
- [ ] Register domain: `trackattendance.io` or `.app`
- [ ] Create landing page with waitlist (Framer or Next.js)
- [ ] Set up social accounts (LinkedIn, Twitter/X)
- [ ] Write launch blog post: "Why We Built an Offline-First Attendance System"

### Week 3-4: Content
- [ ] Create 5 SEO articles targeting:
  - "QR code attendance tracking for small business"
  - "Offline attendance app for factories"
  - "Best attendance tracking software Southeast Asia"
  - "How to track employee attendance without biometrics"
  - "Free attendance tracking app for SME"
- [ ] Record 2-minute demo video
- [ ] Create comparison pages (vs Jibble, vs Clockify, vs paper)

### Week 5-8: Launch
- [ ] Product Hunt launch
- [ ] LinkedIn posts (3x/week) — tips, behind-the-scenes, use cases
- [ ] Direct outreach to 50 F&B/retail chains in SG/MY
- [ ] Post in SME owner communities (Facebook groups, Reddit r/smallbusiness)

### Week 9-12: Iterate
- [ ] Collect feedback from first 10 users
- [ ] A/B test pricing page
- [ ] Start payroll integration conversations
- [ ] Publish customer case study (if available)

---

## 9. Key Metrics to Track

| Metric | Target (Month 3) | Target (Month 12) |
|--------|-------------------|---------------------|
| Signups (free) | 50 | 200 |
| Paid conversions | 5 | 50 |
| MRR | $225 | $4,250 |
| Churn rate | < 10%/mo | < 5%/mo |
| NPS | > 30 | > 50 |
| Time to first scan | < 3 min | < 2 min |

---

## 10. Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Low initial traction | Medium | Free tier removes friction; direct outreach |
| Price pressure from globals | Medium | Compete on simplicity + offline, not features |
| Technical scaling issues | Low | Neon auto-scales; Cloud Run handles bursts |
| Copycat competitors | Medium | Speed + offline moat + channel partnerships |
| Compliance requirements | Medium | Build PDPA compliance early; it's a selling point |

---

*Generated: 2026-03-14 | Sources: Gemini Deep Research, Mordor Intelligence, Grand View Research, IMARC Group, Cognitive Market Research*
*Next review: 2026-04-14*
