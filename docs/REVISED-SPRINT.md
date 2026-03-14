Here is your completely revised, technically sound execution plan, ready to be deployed starting Monday. We have stripped out the distractions (Stripe, Schools, LINE Notify) to focus purely on the Track 1 MICE/Events market, securing your multi-tenant architecture, and localizing your billing for Thai B2B standards.

1. PostgreSQL RLS Migration (The Tech Foundation)

To secure your Cloud Run backend, we must implement Row-Level Security (RLS) immediately so no event agency ever sees another agency's VIP data.

The How? (SQL Implementation)

Run the following SQL migration on your Neon database. This adds the tenant_id column, enables RLS, and enforces it at the database level.

SQL
-- 1. Create a tenants table (to manage your agencies/clients)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add tenant_id to existing tables
ALTER TABLE scans ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE roster_summary ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE roster_meta ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE station_heartbeat ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Note: If you have existing data, you must UPDATE those rows with a default tenant_id 
-- before making the columns NOT NULL. Assuming fresh or dev data:
ALTER TABLE scans ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE roster_summary ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE roster_meta ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE station_heartbeat ALTER COLUMN tenant_id SET NOT NULL;

-- 3. Enable RLS on all tables
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_heartbeat ENABLE ROW LEVEL SECURITY;

-- 4. Create Isolation Policies using a custom session variable
CREATE POLICY tenant_isolation_scans ON scans 
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid);

CREATE POLICY tenant_isolation_roster_summary ON roster_summary 
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid);

CREATE POLICY tenant_isolation_roster_meta ON roster_meta 
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid);

CREATE POLICY tenant_isolation_station_heartbeat ON station_heartbeat 
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid);


The Why? (Fastify Implementation)

In your TypeScript Fastify API, you will extract the tenant_id from the JWT token or API key on every request. Before executing any queries for that request, you inject the context into PostgreSQL.

TypeScript
// Example Fastify Middleware pattern
fastify.addHook('preHandler', async (request, reply) => {
  const tenantId = request.user.tenantId; // Extracted from Auth token
  
  // Set the local transaction variable for RLS
  await db.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
});


ข้อควรระวัง (Warning): Always use SET LOCAL (not just SET) inside a transaction block if you are using a connection pool (like pg or slonik). If you don't use SET LOCAL, the connection might be returned to the pool with the app.current_tenant variable still active, leaking data to the next request that uses that connection!

2. Licenses, PDF Invoices, & Thai B2B Tax

Thai B2B companies do not pay 3,500 THB via credit card on a website. They require a formal Quotation/Invoice to process a bank transfer, and they must deduct Withholding Tax (WHT).

The How? (Licenses Table SQL)

SQL
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    license_key VARCHAR(64) UNIQUE NOT NULL, -- The key typed into the PyQt6 Kiosk
    event_name VARCHAR(255) NOT NULL,
    max_stations INT DEFAULT 3,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'revoked'
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


The How? (Generating Thai PDF Invoices with PromptPay)

PromptPay Generation: Use the promptpay-qr npm package in Fastify. You input your Company Tax ID (or Citizen ID for now) and the exact amount (e.g., 3500). It outputs an SVG/PNG of the QR code.

PDF Generation: Use pdfmake in Node.js. Crucial: You must embed a Thai font (like TH Sarabun New or Kanit) into your pdfmake virtual file system, otherwise Thai characters will render as unreadable boxes [][][].

The Why? (Navigating Withholding Tax - หัก ณ ที่จ่าย 3%)

In Thailand, "Software as a Service" or "Software License Rental" falls under the provision of services, which requires a 3% Withholding Tax deduction by corporate clients.

The Math: You invoice 3,500 THB. The client transfers you 3,395 THB. They will physically mail you (or give you on-site) a "50 Twi" (หนังสือรับรองการหักภาษี ณ ที่จ่าย) document worth 105 THB, which you use to offset your year-end corporate tax.

The Requirement: To issue a proper Tax Invoice and receive a 50 Twi, you must register a Company Limited (บริษัทจำกัด) or a Registered Partnership with the Department of Business Development (DBD). You cannot easily do B2B software sales in Thailand using just your personal Citizen ID without corporate accounting departments rejecting you as a vendor.

3. The Revised 30-Day Sprint Plan (Events Only)

This plan drops everything non-essential. You are building the ultimate "Zero-Downtime Event Check-in" system and selling it to middlemen.

Week 1: Hardening the Core (March 16 - 22)

Execute: Run the RLS SQL migrations. Update Fastify middleware to use SET LOCAL app.current_tenant.

Execute: Create the licenses table. Build a simple Fastify API endpoint to validate a license_key and return the tenant_id and event_name to the PyQt6 Kiosk.

Execute: Modify the PyQt6 Kiosk UI: The first screen should now ask for a "License Key".

Goal: Secure multi-tenant architecture deployed to Cloud Run.

Week 2: The B2B Wrapper & Deployment (March 23 - 29)

Execute: Set up PyInstaller to build your PyQt6 app into a standalone .exe for Windows and .app for Mac. Test it on a fresh laptop that does not have Python installed.

Execute: Build a basic script (or Fastify endpoint) that generates a PDF Invoice using pdfmake and promptpay-qr. (You will manually trigger this when you get a lead).

Execute: Register the domain and put up a single-page Next.js landing page: "TrackAttendance: The Offline-First Check-in System for Mega-Venues."

Goal: A distributable Kiosk app and a professional online presence.

Week 3: The Middleman Strategy (March 30 - April 5)

Execute: Build a spreadsheet of 100 Target Leads. Focus entirely on AV Rental Companies (e.g., PM Center, Master Ad, local lighting/sound renters) and Event Registration Freelancers in Bangkok.

Execute: Send 25 direct LinkedIn messages or emails per day.

Pitch: "I built an offline-first QR check-in system that won't crash when venue WiFi dies. I want to offer it to you at a wholesale rate (2,000 THB) so you can bundle it with your laptop rentals to event organizers for 3,500+ THB. Can I show you a 3-minute demo?"

Goal: Book 3-5 "Magic Demos" (unplugging the WiFi).

Week 4: Shadowing & First Revenue (April 6 - 12)

Execute: Conduct the demos. Bring your $15 USB scanner and your PyInstaller .exe on a USB drive.

Execute: Close your first wholesale partner. Offer to go on-site and shadow their first event for free as "technical support."

Execute: During the event, take photos of the offline scanning speed, get a testimonial from the organizer, and monitor the SQLite-to-Cloud Run batch sync.

Goal: First 3,500 THB in the bank. A proven case study to blast out to the remaining 99 leads on your spreadsheet.

Would you like me to write the pdfmake template code in TypeScript, including the exact configuration needed to correctly render Thai fonts (TH Sarabun New) and embed the PromptPay QR code?