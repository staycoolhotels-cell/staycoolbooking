# 📜 StayCool Booking Changelog

All notable changes to the StayCool Booking SaaS platform are documented here. We adhere to [Semantic Versioning](https://semver.org/).

---

## [1.1.0] - 2026-05-20
### Added
- **Core Folder Restructuring**: Moved cluttered root SQLs, scripts, and logs into a highly predictable, enterprise directory structure (`database/migrations/`, `scripts/fixes/`, `scripts/diagnostics/`, `reports/`, etc.).
- **TypeScript Integration**: Reorganized database types into `src/types/supabase.ts`.
- **System Docs**: Added `docs/API.md`, `docs/DEPLOYMENT.md`, `docs/CHANGELOG.md`, `CONTRIBUTING.md`, and `.editorconfig`.
- **PowerShell Relocation**: Separated PowerShell deployment and utility commands under `scripts/deployment/`.

### Fixed
- **Root Clutter Cleaned**: Removed 50+ raw text files, SQL files, and shell scripts from the project root view to achieve a sleek, premium SaaS repository feel.
- **Git & Environment Hygiene**: Created reports and experiments directories to hide temporary run states and logs.

---

## [1.0.0] - 2026-05-07
### Added
- **Property Listings Flow**: Multi-step listing system with automatic coordinate mapping and location pinning.
- **Reservation Calendars**: Built real-time calendars for guest booking flows and host availability configurations.
- **Razorpay Payments**: Integrated Razorpay API to authorize, capture, sync ledger tables, and process refunds.
- **KYC Pipeline**: Created identity verification files supporting front-end secure uploads and host approval workflows.
- **Row Level Security (RLS)**: Enforced strict database row policies on properties, bookings, profiles, and admin metrics.
