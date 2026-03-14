# TrackAttendance

> Offline-first attendance kiosk with multi-station cloud sync. Badge scan → instant dashboard.

**TrackAttendance** turns any PC with a barcode scanner into a check-in station. Scans save locally, sync to cloud when online, and display on a real-time mobile dashboard — all for under $20/month per station.

## Why TrackAttendance?

| Problem | Our Solution |
|---------|-------------|
| Most systems need internet | **Offline-first** — scans save locally, sync later |
| Per-employee pricing ($4-12/user) | **Per-station pricing** — 5 stations = $95/mo regardless of headcount |
| Expensive kiosks ($119-359/location) | **$19/station/mo** — 6-18x cheaper |
| Complex setup (weeks of IT work) | **5-minute setup** — plug in scanner, run app, start scanning |
| No multi-site visibility | **Multi-station sync** with cross-station duplicate detection |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Kiosk App  │────▶│  Cloud API       │────▶│ Mobile Dashboard│
│  (PyQt6)    │     │  (Fastify/Neon)  │     │  (Public HTML)  │
│  SQLite     │     │  PostgreSQL      │     │  Auto-refresh   │
│  Offline ✓  │     │  Cloud Run       │     │  No auth needed │
└─────────────┘     └──────────────────┘     └─────────────────┘
     Badge scan          Batch sync              Real-time stats
     Local storage       Idempotent              BU breakdown
     Voice feedback      Rate-limited            Station status
```

### Privacy Model
- **Employee names stay local** (SQLite only) — never synced to cloud
- Cloud receives only: badge ID, station name, timestamp, business unit label
- Business unit names are organizational labels, not PII

## Quick Start

### API (Cloud)
```bash
cd api
npm install
cp .env.example .env    # Set DATABASE_URL and API_KEY
npm run dev             # http://localhost:5000
```

### Frontend (Kiosk)
```bash
cd frontend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py          # Opens kiosk window
```

### Build (Windows .exe)
```bash
cd frontend
pyinstaller --noconfirm TrackAttendance.spec
# Output: dist/TrackAttendance/TrackAttendance.exe
```

## Features

- **Badge scanning** — QR/barcode with instant visual + voice feedback
- **Employee lookup** — forgot badge? Type name or email to check in
- **Multi-station sync** — multiple kiosks sync to one cloud dashboard
- **Public mobile dashboard** — real-time attendance from any device (no login)
- **Business unit tracking** — see attendance by department
- **Excel export** — one-click reports with all scan data
- **Duplicate detection** — configurable: warn, block, or silent
- **Camera proximity greeting** — optional face detection with voice greeting
- **Admin control center** — PIN-protected settings with runtime sliders
- **Station heartbeat** — live online/offline status per station
- **338 tests** — comprehensive test suite with CI/CD

## Use Cases

Not just for events — any organization tracking people through physical spaces:

| Sector | Example |
|--------|---------|
| **Workforce** | Factory shifts, construction sites, warehouses |
| **Events** | Conferences, trade shows, corporate gatherings |
| **Education** | University lectures, training sessions, certifications |
| **Membership** | Coworking spaces, gyms, libraries, clubs |
| **Compliance** | Safety drills, government meetings, visitor management |
| **Religious** | Congregation tracking, leadership reports |

## Pricing

| Tier | Stations | Price | Key Features |
|------|----------|-------|-------------|
| **Free** | 1 | $0 | Local-only, Excel export |
| **Pro** | 1-5 | $19/station/mo | Cloud sync, dashboard, duplicate detection |
| **Business** | 6-20 | $15/station/mo | + Cross-station dup, priority support |
| **Enterprise** | 21+ | Custom | + SLA, custom branding, on-prem option |

Per-event packs also available ($99-299).

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — Component design and data flow
- [API Reference](docs/API.md) — Endpoint specs and auth
- [Sync & Duplicates](docs/SYNC.md) — Offline sync and duplicate modes
- [Configuration](docs/CONFIGURATION.md) — All settings with defaults
- [Mobile Dashboard](docs/MOBILE_DASHBOARD_PLAN.md) — Public dashboard design
- [Product Requirements](docs/PRD.md) — Feature requirements
- [Commercial Plan](docs/PLAN-commercialize.md) — Pricing, GTM, multi-tenant architecture

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Kiosk App** | Python 3.11+, PyQt6, SQLite |
| **Cloud API** | TypeScript, Fastify 5, PostgreSQL (Neon) |
| **Deployment** | Google Cloud Run (asia-southeast1) |
| **Dashboard** | Vanilla HTML/JS, auto-refresh |
| **CI/CD** | GitHub Actions |
| **Build** | PyInstaller (Windows .exe) |

## Project Structure

```
trackattendance-product/
├── api/                    # Cloud API (Fastify + Neon PostgreSQL)
│   ├── server.ts           # All routes and middleware
│   ├── Postgres-schema.sql # Database schema
│   └── public/index.html   # Mobile dashboard
├── frontend/               # Desktop kiosk app (PyQt6)
│   ├── main.py             # App entry point
│   ├── attendance.py       # Roster, scanning, export
│   ├── database.py         # SQLite schema and queries
│   ├── sync.py             # Cloud sync client
│   ├── dashboard.py        # Local dashboard
│   ├── config.py           # Configuration
│   ├── web/                # Kiosk UI (HTML/CSS/JS)
│   ├── plugins/camera/     # Proximity detection (opt-in)
│   └── tests/              # 338 tests
└── docs/                   # Documentation
```

## Contributing

Pull requests welcome. Please run the test suite before submitting:

```bash
cd frontend && python -m pytest tests/ -v
```

## License

ISC
