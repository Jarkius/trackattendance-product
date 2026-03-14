1. Product Roadmap (12 Months)

The focus here is moving from a single-tenant deployed prototype to a multi-tenant SaaS, pacing features to unlock specific revenue gates.

Q1 (Months 1-3): Foundation & Track 1 Launch

Month 1: Multi-Tenant & Landing Page

How?: Implement Row-Level Security (RLS) in Neon PostgreSQL using tenant_id. Build a high-converting landing page (Next.js/Vercel) focused exclusively on Track 1: "Bulletproof Event Check-in."

Why?: You cannot onboard multiple event organizers without data isolation. The landing page is your 24/7 sales rep to catch MICE search traffic.

Month 2: Web Dashboard MVP & Manual Billing

How?: Build a basic React/Next.js web dashboard for event organizers to upload Excel guest lists and view live scan counts. Handle billing manually via PromptPay/Invoices.

Why?: Organizers need self-service list management. Manual billing saves 2 weeks of Stripe integration time, allowing you to close your first ฿3,500 event immediately.

Month 3: Self-Service & Track 2 Prep (LINE Notify)

How?: Integrate Stripe Checkout for the ฿1,500/mo HR subscription. Begin backend integration with the LINE Messaging API.

Why?: Unlocks passive HR/Town Hall subscriptions. LINE Notify is the critical prerequisite before pitching to any Thai school.

Q2 (Months 4-6): School Pilot & Automation

Month 4: LINE Notify Launch & School Pitching

How?: Complete LINE integration. Release the Track 2 (School) landing page ("PDPA-Compliant QR Attendance"). Begin live demos at 3-5 mid-tier private schools.

Why?: Academic terms start in May. You must pitch in Month 4 to secure pilot programs for the new term.

Month 5: Advanced Reporting & Analytics

How?: Build 1-click summary reports (PDF/Excel) showing peak arrival times, late students, and session breakouts.

Why?: Event organizers and school admins need tangible data to justify renewing their contracts.

Month 6: API Webhooks

How?: Allow customers to send scan data to their own endpoints (e.g., Zapier, HubSpot).

Why?: Enterprise event organizers demand CRM integration for lead capture. This justifies upselling the ฿3,500 per-event fee to a ฿5,000 "Pro" tier.

Q3 & Q4 (Months 7-12): Scale & Refinement

Months 7-9: Reseller Portal & Hardware Bundling

How?: Build a white-label portal for AV rental companies to manage their own clients. Buy $15 scanners in bulk, brand them, and ship them as a "Kiosk in a Box" kit.

Why?: AV companies (like PM Center) can become your primary distribution channel, selling your software as an add-on to their hardware rentals.

Months 10-12: Hiring & Ecosystem

How?: Hire 1 Customer Success/Sales rep once you cross ฿200,000 MRR. Stay solo for engineering.

Why?: B2B school sales require relationship building and hand-holding. You cannot code and conduct 10 school board demos a week simultaneously.

Warning (Scale Trap): Do not build a custom native iOS/Android app. Push the Web Dashboard and Kiosk desktop app. App Store reviews and updates will crush your solo-developer velocity.

2. Sales & Marketing Plan
Track 1: Events & HR (Short Cycle)

Direct Outreach Targets: CMO Group, Index Creative Village, Rightman, Hubba (co-working), and internal HR teams at large corporates (e.g., banks, consultancies).

Partnership Pipeline: AV equipment rental companies (PM Center, Master Ad), mega-venues (BITEC, IMPACT, Samyan Mitrtown). Offer them a 20% revenue share to bundle your software with their laptop rentals.

Cold Email / LinkedIn Template for Event Organizers:

Plaintext
Subject: Surviving the BITEC WiFi crash (Offline check-in)

Hi [Name],

I saw [Agency Name] is handling [Upcoming Event]. At massive venues like BITEC, morning rush check-ins usually crash when the venue WiFi goes down, leading to massive queues.

We built TrackAttendance specifically for this. It’s an offline-first QR scanning system. Scans process locally in sub-seconds and batch-sync to the cloud whenever the network returns. Zero downtime.

It runs ฿3,500/event. Can I give you a 3-minute live demo next week? I'll turn off my laptop's WiFi and show you how it still works perfectly.

Best,
[Your Name]

Track 2: Schools (Long Cycle)

Direct Outreach Targets: Mid-tier private schools (500-1,500 students) outside the immediate Bangkok CBD (e.g., Nonthaburi, Pathum Thani). Avoid massive Tier 1 schools initially; they are heavily locked into School Bright contracts.

Partnership Pipeline: School uniform suppliers (e.g., Nomittra, Tra Samor). Pitch them to print QR codes directly on uniform labels or student ID lanyards as a value-add to the school.

3. Financial Projections (Year 1)

Assumptions:

Track 1: ฿3,500 / event (average 3 stations).

Track 2: ฿60,000 / year (average 4 gates per school, paid upfront).

Infrastructure Cost: ฿1,500/mo (Cloud Run, Neon PG, Domain) scaling to ฿5,000/mo by Q4.

Month	Track 1 (Events)	Track 2 (Schools)	Total Revenue (THB)	Net Profit (THB)
1	2 events	0	7,000	5,500
2	5 events	0	17,500	16,000
3	10 events	0	35,000	33,500
4	15 events	0	52,500	50,000
5	20 events	1 pilot school	130,000	125,000
6	25 events	1 school	147,500	142,500
7	25 events	2 schools	207,500	202,500
8	30 events	2 schools	225,000	220,000
9	35 events	3 schools	302,500	295,000
10	35 events	3 schools	302,500	295,000
11	40 events	4 schools	380,000	370,000
12	40 events	5 schools	440,000	380,000*
💾
🔊
✓

*Net profit drops slightly in Month 12 assuming ฿50k/mo salary for a new Sales/CS hire.

Milestones:

฿100K/month: Hit in Month 5 when the first school annual contract closes.

฿500K/month: Projected just outside Year 1 (Month 13/14) as school adoption accelerates for the new academic year.

4. Risk Mitigation Plan

Risk 1: Track 1 Event Organizers ignore cold outreach.

Mitigation: Pivot immediately to B2B Corporate HR. Pitch "Town Hall Attendance" on a ฿1,500/mo SaaS subscription to internal HR managers who are easier to reach on LinkedIn than busy event agencies.

Risk 2: The $15 USB Scanners break on-site during an event.

Mitigation: Mandate hardware redundancy. Because the scanners are so cheap, your protocol must be to ship 2x scanners for every 1 station deployed.

Risk 3: Schools demand a "Cashless Canteen" feature to switch.

Mitigation: Do not build a wallet. Partner with a white-label gateway like GB Prime Pay or use standard Thai QR PromptPay. Pitch the school: "We focus 100% on security and speed. For payments, we integrate directly with your bank, meaning you don't pay us a transaction fee."

Risk 4: Competitors copy the "Offline-First" feature.

Mitigation: True offline-first multi-station sync with idempotency keys is architecturally difficult to bolt onto a legacy cloud-dependent codebase. Use this 12-18 month technical moat to lock in annual contracts.

Risk 5: PDPA laws change requiring consent even for anonymous QR tracking.

Mitigation: Because names stay local, you only sync hashed IDs (e.g., a7x9...). This is pseudonymous data. Ensure your privacy policy explicitly states the cloud server cannot reverse-engineer student identities.

5. 90-Day Sprint Plan
Weeks 1-4: The Track 1 Launch Pad

Week 1: Implement Neon PostgreSQL Row-Level Security (tenant_id). Clean up PyQt6 UI (remove debug buttons).

Week 2: Build and deploy the Track 1 Landing Page. Set up domain email.

Week 3: Compile a lead list of 50 Bangkok event agencies. Build the Web Dashboard MVP (read-only stats).

Week 4: Send first 25 cold emails. Manually test the multi-station sync under heavy load (simulate 1,000 scans/minute).

Goal: 1 live demo booked.

Weeks 5-8: First Revenue & Track 2 Prep

Week 5: Shadow your first live event (offer it for free if necessary). Monitor Cloud Run logs.

Week 6: Integrate manual billing workflow. Send out 50 more cold emails to corporate HR.

Week 7: Close first paying Track 1 customer (฿3,500). Begin LINE Messaging API integration.

Week 8: Build the Track 2 Landing Page (Schools). Document the PDPA data flow.

Goal: ฿7,000 in revenue. LINE Notify functional in dev environment.

Weeks 9-12: The Dual-Track Engine

Week 9: Deploy LINE Notify to production. Integrate Stripe Checkout for HR subscriptions.

Week 10: Compile a list of 30 mid-tier private schools in Greater Bangkok. Find PTA heads or IT Directors on LinkedIn/Facebook.

Week 11: Begin cold calling/emailing schools. Offer a "Free 1-Gate Pilot" for the remainder of their term.

Week 12: Close 5 paid events this week. Secure 1 school pilot.

Goal: ฿17,500 total MRR run rate. 1 School pilot active.

Would you like me to draft the specific PostgreSQL Row-Level Security (RLS) policies needed to safely isolate your tenant data for Month 1?