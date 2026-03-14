# TrackAttendance — Company Strategy

> "The value is in the cloud, not the binary." — From PLAN-commercialize.md
>
> This document is for brainstorming. It's honest about what's strong, what's risky, and what needs decisions.

**Last updated**: 2026-03-14
**Sources**: Gemini Deep Research, web market data, codebase audit, PLAN-commercialize.md

---

## Part 1: What We Actually Have (Honest Assessment)

### Product Maturity: 8/10

This is NOT a prototype. It's a **production-deployed system** with:

| What's Built | Maturity | Evidence |
|-------------|----------|----------|
| Badge/QR scanning | Production | USB keyboard listener, sub-second |
| Offline-first SQLite buffer | Production | WAL mode, 10 indexes, sync states |
| Cloud sync (Neon PostgreSQL) | Production | Idempotency keys, retry logic, batch upload |
| Cross-station duplicate detection | Production | Live Sync with 5-min window, SHA256 keys |
| Public mobile dashboard | Production | No-auth stats + 10-min timeline |
| Admin control panel | Production | PIN-protected, runtime sliders |
| Voice feedback (TTS) | Production | Piper + MP3 voice clips |
| Camera proximity greeting | Production | MediaPipe/Haar cascade |
| Excel export | Production | One-click with employee metadata |
| API (15+ endpoints) | Production | Deployed on Cloud Run asia-southeast1 |
| 338 tests | Comprehensive | Sync, dup detection, race conditions, stress tests |

### What's Missing for Sales: 2/10

| Missing | Effort | Blocker? |
|---------|--------|----------|
| License validation (server-side) | 2-3 days | **Yes** — can't charge without it |
| Stripe billing integration | 2-3 days | **Yes** — can't collect payment |
| Landing page | 1-2 days | **Yes** — can't acquire customers |
| Free tier graceful degradation | 1 day | Nice-to-have at launch |
| Nuitka binary compilation | 1 day | Can ship PyInstaller first |
| Multi-tenant RLS | 3-5 days | **No** — can start with API-key-per-org (simpler) |
| Web dashboard | 2-4 weeks | **No** — mobile public dashboard already exists |
| User accounts / auth | 1-2 weeks | **No** — API key model works for Phase 1 |

### The Honest Timeline

```
To FIRST SALE (minimum viable commercial):     ~7-10 days
├── License table + enforcement in API           2-3 days
├── Stripe webhooks + key provisioning           2-3 days
├── Landing page + pricing table                 1-2 days
├── Free tier degradation                        1 day
└── Test + polish                                1-2 days

To SCALABLE SaaS (multi-tenant, web app):       ~2-3 months
├── Row-Level Security in PostgreSQL             3-5 days
├── Web-based management dashboard               2-4 weeks
├── User accounts + auth (Clerk/Auth.js)         1-2 weeks
├── Onboarding flow                              1 week
└── Documentation + support system               1 week
```

**Key insight**: You don't need the full SaaS to start selling. The desktop app + API key + Stripe is a valid v1. The HARD ENGINEERING IS DONE — what remains is business wrapping.

---

## Part 2: Our Strongest Selling Points

### The Killer Combo

No competitor has ALL of these together:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   1. OFFLINE-FIRST        ←  Works in dead zones    │
│   2. MULTI-STATION SYNC   ←  Real-time visibility   │
│   3. NO HARDWARE COST     ←  $15 USB scanner only   │
│   4. PRIVACY BY DESIGN    ←  Names never leave site │
│   5. PER-STATION PRICING  ←  Fair for 200+ workers  │
│   6. SUB-SECOND SCANNING  ←  No bottleneck at 9 AM  │
│                                                     │
│   = The only attendance kiosk that works offline,   │
│     syncs across stations, and costs under $20/mo   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Why Each Point Pulls Market Attention

**1. Offline-First (THE #1 differentiator)**
- Every competitor is cloud-first or cloud-only
- Factories, construction sites, event venues often have no WiFi
- Customer reviews on G2/Capterra consistently complain about lost data during outages
- We don't just "handle" offline — we're BUILT for it. SQLite buffer → batch sync → idempotency
- **Pitch**: "Your attendance system shouldn't crash when the WiFi does"

**2. Multi-Station Sync with Cross-Station Dedup**
- Jibble has free kiosk but NO multi-station sync
- We detect if someone scanned at Station A and tries Station B (5-min window)
- Idempotency keys prevent duplicates even on retry
- **Pitch**: "One badge, five stations, zero duplicates"

**3. No Biometric Hardware = Zero CAPEX**
- Biometric scanners: $200-500 per unit + fingerprint hygiene issues (post-COVID)
- NFC readers: $100+ per unit
- Our approach: Print a QR badge, use a $15 USB barcode scanner
- **Pitch**: "Print your first badge in 30 seconds. No special hardware."

**4. Privacy by Design (Architecturally Enforced)**
- Employee names NEVER leave the local machine — only badge IDs sync to cloud
- This isn't a policy — it's code. The sync function literally strips PII.
- PDPA/GDPR compliance is built-in, not bolted-on
- **Pitch**: "Employee data stays on your premises. Always."

**5. Per-Station Pricing (Not Per-User)**
- Deputy: $4.50/user × 200 workers = $900/mo
- BambooHR: $8/user × 200 workers = $1,600/mo
- TrackAttendance: $19/station × 5 stations = $95/mo
- For factories/warehouses with 50-500+ workers, we're 10-20x cheaper
- **Pitch**: "5 stations, unlimited employees, $95/month"

**6. Sub-Second Scan Speed**
- USB barcode scanner → keyboard event → instant processing
- No app to open, no face to position, no fingerprint to press
- Critical for shift-start: 100 workers need to clock in within 5 minutes
- **Pitch**: "Beep. Done. Next."

### The Moat (What Competitors Can't Easily Copy)

| Moat | Why It's Hard to Replicate |
|------|---------------------------|
| **Sync architecture** | Idempotency keys, retry logic, race condition handling, offline buffer — months of engineering |
| **Privacy-by-design** | Architecturally baked in. You can't bolt "names stay local" onto a cloud-first product |
| **Offline resilience** | Most apps assume internet. Redesigning for offline-first is a ground-up rewrite |
| **Production deployment** | Live on Cloud Run with 15+ endpoints, 338 tests. Not vaporware |

---

## Part 3: Market Positioning

### The Gap We Fill

```
Price
  │
  │  Cvent ($19K+)
  │  Bizzabo ($15K+)         ← Enterprise: powerful but overkill
  │  Swoogo ($8K+)
  │  nunify ($500-8K/event)
  │
  │
  │  ┌─────────────────────┐
  │  │  THE GAP             │  ← No strong player here
  │  │  $20-100/mo          │
  │  │  Offline + Multi-site │
  │  │  = TrackAttendance    │
  │  └─────────────────────┘
  │
  │  Clockify ($0-12/user)   ← Free but no kiosk/offline
  │  Jibble (Free-$2/user)   ← Free kiosk but no multi-station
  │  Paper logs ($0)          ← Free but no visibility
  │
  └────────────────────────────── Features
```

### One-Line Positioning (Options to Brainstorm)

1. **"The attendance kiosk that works without WiFi"** — leads with #1 differentiator
2. **"Badge scanning for teams who can't afford downtime"** — leads with reliability
3. **"5 stations. Unlimited employees. $95/month."** — leads with pricing
4. **"Scan 100 workers in 5 minutes. No internet required."** — leads with speed + offline
5. **"Attendance tracking that works where your team works"** — emotional/aspirational

**Decision needed**: Which positioning resonates most with your target buyer?

---

## Part 4: Revenue Model Analysis

### Pricing Decision: Per-Station vs Per-User

| Model | Per-Station ($19/station/mo) | Per-User ($1.50-2.50/user/mo) |
|-------|---------------------------|-------------------------------|
| **Pros** | Predictable for buyer, scales with locations not headcount, simpler billing | Lower entry point, scales with growth, industry standard |
| **Cons** | Fewer units to price (5 stations vs 200 users), harder to upsell | Revenue unpredictable, requires user tracking, churn per-seat |
| **Factory (200 workers, 5 stations)** | $95/mo | $300-500/mo |
| **Small F&B (20 workers, 2 stations)** | $38/mo | $30-50/mo |
| **Event (100 attendees, 3 stations)** | $57/mo or $199/event | Not applicable |

**Recommendation**: **Per-station pricing**. Here's why:
- Our product is a KIOSK — customers think in stations, not users
- Per-station is dramatically cheaper for large workforces (our target)
- It's a unique positioning vs competitors who all charge per-user
- "Unlimited employees" is a powerful sales line
- Event packs ($99-299) capture one-time buyers

**Decision needed**: Confirm per-station vs per-user, or hybrid?

### Revenue Scenarios (Per-Station Model)

**Scenario A: Conservative (Organic Only)**
```
Month 3:   10 customers ×  2.5 stations = $475/mo   ($5,700 ARR)
Month 6:   25 customers ×  3.0 stations = $1,425/mo  ($17,100 ARR)
Month 12:  50 customers ×  3.5 stations = $3,325/mo  ($39,900 ARR)
Month 24: 100 customers ×  4.0 stations = $7,600/mo  ($91,200 ARR)
```

**Scenario B: Moderate (Organic + Paid Ads + 1 Channel Partner)**
```
Month 3:   15 customers ×  3.0 stations = $855/mo    ($10,260 ARR)
Month 6:   40 customers ×  3.5 stations = $2,660/mo  ($31,920 ARR)
Month 12: 100 customers ×  4.0 stations = $7,600/mo  ($91,200 ARR)
Month 24: 250 customers ×  4.5 stations = $21,375/mo ($256,500 ARR)
```

**Scenario C: Aggressive (+ AppSumo Launch + 3 Channel Partners)**
```
Month 3:   30 customers ×  3.0 stations = $1,710/mo  ($20,520 ARR)
Month 6:   80 customers ×  3.5 stations = $5,320/mo  ($63,840 ARR)
Month 12: 200 customers ×  4.0 stations = $15,200/mo ($182,400 ARR)
Month 24: 500 customers ×  4.5 stations = $42,750/mo ($513,000 ARR)
```

### Break-Even Analysis

```
Monthly fixed costs:
  Neon PostgreSQL    $0 (free tier) → $19 (10GB) → $69 (50GB)
  Cloud Run          $0 (free tier) → $15-50
  Domain + email     $1
  Stripe fees        2.9% + $0.30/tx
  Total:             $1-120/mo depending on scale

Break-even:          ~3 paying customers ($57/mo covers free-tier infra)
Comfortable margin:  ~15 customers ($285/mo, 60%+ margin after Stripe)
Full-time viable:    ~80-100 customers ($1,500-1,900/mo net)
```

**The SaaS economics are excellent**: Near-zero marginal cost per customer. Every new customer is almost pure profit.

---

## Part 5: Feasibility & Risk Matrix

### Feasibility Score: HIGH

| Factor | Score | Reasoning |
|--------|-------|-----------|
| **Product readiness** | 9/10 | Core product is production-deployed and battle-tested |
| **Market demand** | 8/10 | $4.5B market, 12.5% CAGR, SMEs underserved |
| **Technical risk** | Low | Remaining work is well-understood (Stripe, landing page) |
| **Capital required** | Very Low | ~$0-50/mo to start (free tiers everywhere) |
| **Time to first sale** | 7-10 days | If focused, the commercial wrapper is straightforward |
| **Solo-dev feasible** | Yes | Product-led growth doesn't need sales team |

### Risk Matrix

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Nobody buys** — product-market fit is wrong | Medium | Critical | Free tier validates demand before investing in growth. Start with 10 beta users from personal network. |
| 2 | **Support burden kills dev time** | High | High | Document everything. FAQ page. Auto-responses. Set expectation: "email support, 24-48h response." No live chat at launch. |
| 3 | **Jibble/Clockify adds offline** | Low | High | Our offline is architecturally deep (SQLite buffer + sync). They'd need a ground-up rewrite. Plus our per-station pricing is structurally different. |
| 4 | **Desktop app feels "old school"** | Medium | Medium | Phase 1: desktop works fine for kiosks (they're stationary). Phase 2: Electron or web app for modern feel. |
| 5 | **Solo dev = single point of failure** | High | Medium | Automate everything: CI/CD, Stripe webhooks, license provisioning. The less manual, the more passive. |
| 6 | **SEA market is price-sensitive** | High | Medium | PPP pricing ($6-7/station in ASEAN). Free tier absorbs price-sensitive buyers. Convert via value, not discounts. |
| 7 | **Churn from basic features** | Medium | Medium | The roadmap (notifications, shift scheduling, payroll integration) adds stickiness. Free → Pro conversion reduces churn. |
| 8 | **Piracy / key sharing** | Low | Low | Anti-piracy is server-side (station limits). Shared keys hit the limit fast. Free tier means piracy isn't worth the effort. |
| 9 | **PDPA/GDPR compliance gap** | Medium | High | Privacy-by-design is already built. Get formal compliance review before enterprise sales. |
| 10 | **Scaling issues at 100+ tenants** | Low | Medium | RLS migration is planned. Neon auto-scales. Cloud Run handles bursts. Cross that bridge when revenue justifies it. |

### What Could Kill This Project

| Threat | How Likely | Why It Probably Won't |
|--------|-----------|----------------------|
| **Zero traction after 6 months** | Possible | Mitigated by free tier + direct outreach. If 50 free users don't convert, pivot the positioning, not the product. |
| **A funded competitor targets the same niche** | Unlikely | The offline-first + per-station + privacy combo is too niche for VCs to fund. Big players go upmarket. |
| **Burnout / losing motivation** | Real risk | Automate relentlessly. First sale creates momentum. Set small milestones: 1st user, 1st sale, 10th sale, $1K MRR. |

---

## Part 6: The Passive Income Path

### What "Passive" Means Here

**Not passive from day 1.** Passive income requires upfront investment in automation:

```
Phase 1 (Active):     Build + sell + support manually         0-6 months
Phase 2 (Semi-active): Automate onboarding + billing + support  6-12 months
Phase 3 (Passive):     Product sells itself, you maintain       12+ months
```

### What Must Be Automated for Passive Income

| Function | Manual Today | Automated Target |
|----------|-------------|------------------|
| **Customer acquisition** | Direct outreach, LinkedIn posts | SEO content + Product Hunt + Capterra listing |
| **Onboarding** | Email API key manually | Stripe webhook → auto-generate key → auto-email |
| **Billing** | N/A | Stripe handles 100% (subscriptions, invoices, upgrades) |
| **Support** | Email | FAQ + docs + auto-responses. Only escalated issues need you. |
| **Updates** | Manual release | GitHub Releases + auto-updater in app |
| **Monitoring** | Check manually | Cloud Run health checks + Neon alerts + uptime monitoring |

### The Flywheel

```
Free tier users → Word of mouth → More free users
    ↓                                    ↓
Some convert to Pro → Revenue → Fund SEO/ads → More users
    ↓                                           ↓
Pro users need more stations → Upgrade to Business → Higher ARPU
    ↓
Happy customers → Capterra/G2 reviews → Organic discovery → More users
```

Once the flywheel spins, your job shifts from "building and selling" to "maintaining and improving." That's where passive income lives.

### Realistic Passive Income Timeline

| Milestone | When | Monthly Net Income |
|-----------|------|-------------------|
| First paying customer | Month 1-2 | $19-57 |
| Cover infrastructure costs | Month 2-3 | $0 (break-even) |
| Coffee money | Month 3-6 | $100-300 |
| Side income | Month 6-12 | $500-2,000 |
| Part-time income equivalent | Month 12-18 | $2,000-5,000 |
| Full-time income equivalent | Month 18-24 | $5,000-10,000 |
| True passive (minimal maintenance) | Month 24+ | $10,000+ |

---

## Part 7: Decision Points (For Brainstorming)

These are the decisions that shape everything. No right answer — they depend on your goals and constraints.

### Decision 1: Speed vs Polish

| Option A: Ship in 7 Days | Option B: Polish for 30 Days |
|--------------------------|------------------------------|
| License table + Stripe + landing page | + Web dashboard + better onboarding |
| Desktop app as-is (PyInstaller) | + Nuitka compilation + auto-updater |
| Manual email for API key | + Automated provisioning flow |
| **Pro**: Revenue starts NOW | **Pro**: Better first impression |
| **Con**: Rough edges | **Con**: Delayed revenue, risk of over-engineering |

**My take**: Ship in 7-10 days. Your first 10 customers won't care about polish — they care about whether it solves their problem. Perfect is the enemy of profitable.

### Decision 2: Per-Station vs Per-User Pricing

Already analyzed above. **Per-station ($19/mo) is recommended** because it's our unique angle and dramatically cheaper for large workforces.

### Decision 3: Target Market Priority

| Option A: SEA First | Option B: Global (English) First |
|---------------------|----------------------------------|
| SG, MY → TH, ID, VN | US, UK, AU → then SEA |
| Smaller market, less competition | Larger market, more competition |
| Need localization early | English-only at launch |
| Lower price points (PPP) | Higher price points |
| Local connections advantage | Pure online sales |

**Decision needed**: Where do you start? SEA leverage your location. Global has bigger upside but more competition.

### Decision 4: Desktop App vs Web App

| Desktop (Current) | Web App (Future) |
|-------------------|------------------|
| PyQt6 kiosk — works great for scanning stations | React/Next.js — modern, no install |
| Needs download + install | Works in any browser |
| Perfect for dedicated kiosks | Better for management dashboard |
| Offline-first is natural | Offline requires service workers |

**My take**: Keep desktop for scanning stations (that's the use case). Add web for management/dashboard later. Don't rewrite what works.

### Decision 5: When to Quit Your Day Job

| Stage | Signal | Action |
|-------|--------|--------|
| Validation | 10 free users actively scanning | Keep going, start charging |
| Traction | 20 paying customers, < 10% churn | This is real — invest more time |
| Sustainability | $2K+ MRR for 3 consecutive months | Consider part-time |
| Confidence | $5K+ MRR for 6 consecutive months | Consider full-time |

---

## Part 8: First 30 Days Action Plan

### Week 1: Commercial Foundation
- [ ] Add `licenses` table to Neon PostgreSQL
- [ ] Modify auth middleware to validate against license table
- [ ] Enforce station limits on heartbeat endpoint
- [ ] Frontend reads license status from heartbeat response

### Week 2: Payment + Distribution
- [ ] Create Stripe products (Pro $19/station, Business $15/station)
- [ ] Build webhook handler (checkout → license → email)
- [ ] Free tier graceful degradation (no API key = local-only)
- [ ] Test end-to-end: Stripe checkout → API key → scanning works

### Week 3: Go Live
- [ ] Build landing page (hero + features + Stripe pricing table + FAQ)
- [ ] Register domain
- [ ] Record 2-minute demo video
- [ ] Deploy landing page
- [ ] Announce on LinkedIn + relevant communities

### Week 4: First Customers
- [ ] Direct outreach to 20 potential customers (F&B, factories in SG/MY)
- [ ] Offer 5 beta customers free 3-month Pro access for feedback
- [ ] Create Capterra/G2 listing
- [ ] Write first SEO blog post
- [ ] Collect feedback, iterate

---

## Part 9: What We DON'T Do (Focus)

Saying "no" is as important as saying "yes."

| We DON'T... | Why Not |
|-------------|---------|
| Build a full HRMS | We're attendance, not payroll/leave/recruitment |
| Sell hardware | No inventory risk. Recommend $15 USB scanners |
| Offer live chat support | Solo dev can't sustain it. Email with 24-48h SLA |
| Build mobile scanning app | Desktop kiosk is the product. Mobile is for viewing only |
| Target enterprise (>500 employees) | Enterprise sales cycles are 3-6 months. SMB pays in 1 day |
| Compete on features | Compete on simplicity, offline, and price |
| Raise funding | SaaS margins are 97%. We don't need investors |

---

## Summary: Why This Can Work

```
✅ Product is BUILT (not a slide deck)
✅ Market is GROWING ($4.5B, 12.5% CAGR)
✅ Gap EXISTS ($20-100/mo, offline, multi-site)
✅ Costs are NEAR-ZERO (free tiers everywhere)
✅ Moat is REAL (offline architecture, privacy-by-design)
✅ Path to passive is CLEAR (automate billing, onboarding, support)
✅ First sale is 7-10 DAYS away (not months)
```

The question isn't "can this work?" — it's "will you ship it?"

---

*Strategy document for brainstorming. Update as decisions are made.*
*Created: 2026-03-14*
