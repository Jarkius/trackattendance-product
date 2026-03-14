Track 1: Events, Seminars, and HR (MICE Market)

Market Size & Potential
The Asia-Pacific MICE (Meetings, Incentives, Conferences, and Exhibitions) market is booming, projected to reach $231.49 Billion in 2026. Thailand, Singapore, and Malaysia are the primary hubs. Corporate town halls and HR seminars are also shifting toward data-driven attendance tracking.

Competitors & Pricing

EventMobi: Enterprise-heavy. Charges ~$3,500 USD per event or an annual subscription starting at $7,900 USD.

OneTap: Subscription-based. Ranges from $19.99/month (100 profiles) to $59.99/month (500 profiles).

Cvent: Massive enterprise platform; pricing often exceeds $10,000 USD per year.

Features Event Organizers Need
Beyond scanning, organizers look for: Instant badge printing, lead capture for exhibitors (scanning attendee badges to collect emails), session-level attendance (tracking who attended breakout room A vs B), and post-event Excel/CRM exports.

Positioning the Offline-First Killer Feature

The How? Market the local SQLite buffer and SHA256 idempotency keys as a "Zero-Downtime Guarantee." The $15 USB scanner reads the QR, the local database logs it instantly with voice TTS feedback, and the system seamlessly batch-syncs to your Google Cloud Run instance once the network stabilizes.

The Why? Mega-venues (like BITEC or IMPACT in Thailand) and outdoor festivals are notorious for overloaded, failing WiFi. Cloud-only competitors crash during the morning rush. Your offline-first architecture completely eliminates the check-in bottleneck, which is an event organizer's biggest nightmare.

Revenue Potential & Pricing Strategy
A hybrid model works best here:

Per-Event (Agencies/One-offs): 3,500 THB (~$100 USD) per event for up to 3 stations.

Monthly Subscription (HR/Town Halls): 1,500 THB (~$45 USD) per month for unlimited internal events.

Track 2: Schools and Education

Market Size & Potential
Thailand has approximately 3,760 formal private schools and over 160 international schools. These schools have budgets for digital transformation but are highly price-sensitive compared to corporate enterprises.

Competitors & Weaknesses

Key Players: School Bright, Student Care, ZchoolMate.

Pricing: They typically charge 100 - 300 THB per student annually.

Weaknesses: They force vendor lock-in through cashless canteen ecosystems and require massive hardware investments (up to 120,000 THB for AI face-scanning gates). They are entirely internet-dependent.

The PDPA & QR Barcode Advantage

The How? Issue student ID cards or uniform tags with standard QR codes. Use your $15 USB scanners at the school gates. Ensure the cloud Neon PostgreSQL database only receives the hashed badge IDs, while PII (student names) remains on the local school machine.

The Why? Face-scan competitors force schools into a legal minefield. Under the Thai PDPA, collecting biometric data from minors requires explicit, granular parental consent. By using QR codes and keeping names local, you bypass biometric risks entirely, eliminate the need for complex legal consent forms, and drop the hardware barrier to entry from 120,000 THB to under 1,000 THB.

Partnership Channels & Must-Have Features

LINE Notify: This is absolute table stakes for Thailand. Parents must receive a real-time LINE message when their child's QR is scanned.

Partnerships: Partner with school uniform manufacturers to print durable QR codes on shirt collars or bags, and pitch directly to PTA (Parent-Teacher Association) networks.

Revenue Potential & Pricing Strategy
Do not charge per student; use your per-station model to drastically undercut competitors.

Annual Contract: 15,000 THB (~$420 USD) per station/year. A mid-sized school needing 4 gates pays 60,000 THB annually. This is highly disruptive compared to a competitor charging 150,000 THB for 1,000 students plus hardware costs.

Comparison and Strategy

Which Track Should We Pursue FIRST?
Pursue Track 1 (Events & HR) first.

The Why? The B2B sales cycle for events is incredibly short (2-4 weeks). Event organizers feel the pain of bad WiFi acutely and are willing to pay per event immediately. In contrast, the school market (Track 2) has a grueling 6-12 month sales cycle dictated by academic terms (May and October) and requires extensive bureaucratic approvals from school boards. Track 1 offers a much faster payback period and lower risk to bootstrap your cash flow.

Core Product Strategy
You can absolutely serve both markets with the same core product. Keep the robust backend (Cloud Run, Neon PG, SQLite offline buffer) identical. Simply create two separate frontend landing pages and UI toggles (e.g., flipping the label from "Attendee" to "Student").

Minimum Viable Features (MVF)

Track 1 (Events): Custom Excel import for guest lists, robust local Admin PIN protection, multi-station duplicate detection, and post-event Excel export.

Track 2 (Schools): LINE Notify API integration (critical), "Late Arrival" time threshold logic, and local-only name mapping for PDPA compliance.

Year 1 Realistic Projections

Track 1 (Events): Target 40 events/month by Q4.

Calculation: 40 events * 3,500 THB = 140,000 THB/month. (Year 1 Total: ~1.2M THB, ramping up quickly).

Track 2 (Schools): Target 15 schools closed by the end of Year 1.

Calculation: 15 schools * 60,000 THB average contract = 900,000 THB. (Mostly realized in Q3/Q4 due to long sales cycles).

ข้อควรระวัง (Warning): Do not attempt to build a custom "Cashless Canteen" payment gateway to compete with School Bright in Year 1. Holding e-wallet funds requires stringent Bank of Thailand (BOT) licenses. Stick purely to the high-margin, low-liability attendance tracking software.

90-Day Go-To-Market Action Plan

Track 1: Events & HR (Days 1 - 45)

Plaintext
[ ] Day 1-7:   Clone the UI. Change terminology from "Users" to "Attendees/VIPs".
[ ] Day 8-14:  Build a simple landing page highlighting "Offline-First Check-In for Bad WiFi Venues".
[ ] Day 15-21: Map out top 50 event management agencies and AV rental companies in Bangkok.
[ ] Day 22-30: Cold outreach via LinkedIn/Email offering a "Free First Event" pilot.
[ ] Day 31-45: Shadow your first 3 live events. Monitor the SQLite to Cloud Run batch sync under heavy load. Collect testimonials.


Track 2: Schools & Education (Days 46 - 90)

Plaintext
[ ] Day 46-55: Integrate the LINE Messaging API. Ensure the trigger fires reliably upon the cloud sync.
[ ] Day 56-65: Audit your data flow. Document exactly how the local machine maps the hashed ID to the student name to prove PDPA compliance.
[ ] Day 66-75: Create a "Cost Comparison" one-pager: $15 QR Scanner vs $500 Face Scanner.
[ ] Day 76-85: Reach out to 20 private mid-tier schools (avoid the massive Tier 1 schools initially; they are locked into long contracts).
[ ] Day 86-90: Secure 2-3 pilot schools for a free 30-day trial at a single gate to prove the LINE Notify speed to parents.


Next Step: Would you like me to draft the cold-email pitch template specifically targeting Event Organizers, emphasizing the "Zero-Downtime Offline-First" feature?