# 🏔️ StayCool Booking (Enterprise SaaS Platform)

[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Gateway-blue?style=for-the-badge)](https://razorpay.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

StayCool Booking is a professional, high-performance, and feature-rich rental booking SaaS designed to deliver a seamless property listing, reservation management, and verification experience. Built on modern React/Next.js frameworks and powered by a highly robust Supabase database architecture, StayCool Booking incorporates premium design systems, state-of-the-art security, and flexible payment workflows.

---

## ✨ Primary Features

- **🔑 Secure Authentication & RBAC**: Advanced Row-Level Security (RLS) policies in Supabase, supporting Host, Guest, and Administrator roles.
- **🏡 Live Property Listing & Management**: Complete multi-step listing flow with maps integration, photo uploads, category tagging, and automatic map auto-pinning.
- **📅 Advanced Availability & Reservation Calendars**: Real-time calendar syncing, avoiding double bookings and bulk booking management.
- **🛡️ KYC & Verification Pipeline**: Automated and manual verification workflows for property hosts and guests, complete with KYC document upload support.
- **💳 Razorpay & Payment Gateway Sync**: End-to-end payment capture, refund automation, and transactional ledger syncs.
- **📊 Admin and Host Dashboards**: Rich statistics, interactive analytics, cleaning and maintenance signal alerts, and financials.
- **💬 Real-time Messaging System**: Built-in chat channel for hosts and guests with instant state sync.

---

## 🏗️ Architecture & Folder Structure

The repository follows a clean, highly structured, and enterprise-grade layout that prevents clutter and separates concerns:

```text
staycool-booking/
│
├── src/                        # Primary React/Next.js Application
│   ├── app/                    # Next.js App Router (pages, layouts, API endpoints)
│   ├── components/             # Reusable UI Components
│   ├── lib/                    # Configuration clients (Supabase, Razorpay)
│   ├── hooks/                  # Custom React Hooks
│   ├── services/               # Modular API & Business Logic Services
│   ├── utils/                  # Utility functions (formatting, dates, math)
│   └── types/                  # Global TypeScript Interfaces (including supabase.ts)
│
├── database/                   # Database Assets
│   ├── migrations/             # SQL Migrations (standardized: YYYY_MM_DD_NN_slug.sql)
│   ├── seeds/                  # Seed JSON assets (users, profiles)
│   └── backups/                # Local database snapshot backups
│
├── scripts/                    # Command-line utility scripts
│   ├── fixes/                  # Bugfixes and hotfix runners
│   ├── migrations/             # Scripted migration runners
│   ├── deployment/             # PowerShell deployment and infrastructure scripts
│   ├── diagnostics/            # Healthcheck, RLS testers, and debugging tools
│   └── tools/                  # Codebase builders and fixture generators
│
├── docs/                       # Developer Documentation
│   ├── API.md                  # API Endpoint references
│   ├── DEPLOYMENT.md           # Production Deployment Guide
│   ├── CHANGELOG.md            # Version History & Releases
│   └── *.md                    # Architectural notes & guides
│
├── public/                     # Static assets (images, fonts, icons)
├── reports/                    # Test-results and diagnostic reports
├── experiments/                # Research scratchpads and playgrounds
├── cypress/ & e2e/             # Automated integration and end-to-end test suites
│
├── .env.example                # Example environment variables template
├── .editorconfig               # Universal editor formatting standards
├── .nvmrc                      # Node.js version lock (v18)
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
└── next.config.mjs             # Next.js bundler configuration
```

---

## 🛠️ Tech Stack & Requirements

- **Node.js**: `v18.x` or later (refer to `.nvmrc`)
- **Framework**: `Next.js 14` (App Router)
- **Language**: `TypeScript` (Strict mode)
- **Database / Backend-as-a-Service**: `Supabase` (PostgreSQL)
- **Styling**: `Tailwind CSS` & `Vanilla CSS`
- **Testing**: `Cypress` & `Playwright`

---

## 🚀 Getting Started & Local Setup

### 1. Clone & Install Dependencies
Ensure you are using the correct Node.js version:
```bash
nvm use
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory by duplicating `.env.example`:
```bash
cp .env.example .env
```
Fill in your Supabase, Razorpay, and other third-party credentials inside `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Database Migrations
All SQL schema modifications are stored sequentially under `database/migrations/`. 
To apply migrations or run SQL queries directly on your Supabase instance, utilize scripts from `scripts/migrations/` or run the queries via the Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Running Automated Tests

To ensure code stability and protect against regressions, run the following test commands:

### End-to-End Tests (Cypress)
```bash
npm run cypress:open
```

### Integration Tests (Playwright)
```bash
npx playwright test
```

All test outcomes and visual logs are stored inside the `reports/` folder.

---

## 📝 Contribution & Standards

We enforce high-quality coding practices across this codebase:
- **Spacing & Formatting**: Handled automatically by Prettier. Configurations are locked via `.prettierrc` and `.editorconfig`.
- **Naming Conventions**: Keep scripts, documents, and directories clean, lowercase, and snake/kebab-case. No uppercase prefixes or versions in file names.
- **Git Protocol**: Write descriptive commits and follow branching rules. Refer to `CONTRIBUTING.md` for our full development pipeline.

---

## 📄 License & Contact

StayCool Booking is a commercial proprietary platform. For security issues, support, or custom integrations, please consult the core development team or refer to the `docs/` folder.
