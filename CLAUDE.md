# Prompt: Waste Management App & Website with Community/Individual Payment Tracking

Use this prompt with an AI coding assistant, development team, or as a project brief / RFP document.

---

## Prompt

Design and build a **waste management platform** (web application + mobile-friendly interface) for a waste collection company that serves multiple **communities/estates**, each containing many **individual households/customers**. The platform must manage customer records, track waste collection service, and record subscription payments on flexible billing cycles.

### 1. Core Purpose
A system that lets a waste management company:
- Organize customers by **community** (estate, neighborhood, or zone).
- Track each **individual resident/household** within a community.
- Record and monitor **payments** for waste collection services on multiple billing frequencies: **monthly, bi-monthly, quarterly, half-yearly, and yearly**.
- Give admins visibility into who has paid, who is overdue, and upcoming renewal dates.

### 2. User Roles
- **Super Admin** — manages all communities, staff, billing plans, and system settings.
- **Community/Estate Manager** — manages residents within their assigned community.
- **Field Agent/Collector** — logs collections, records cash/manual payments, updates resident status.
- **Resident/Customer** — views their account, payment history, due dates, and can make payments online.
- **Accountant/Finance Officer** — reconciles payments, generates financial reports.

### 3. Key Data Entities
- **Community**: name, address/zone, number of registered residents, assigned collector(s), collection schedule (e.g., days of week), default billing plan.
- **Resident/Individual**: full name, contact info, house/unit number, community affiliation, subscription plan, billing cycle, join date, status (active/inactive/suspended).
- **Billing Plan**: cycle type (monthly, bi-monthly, quarterly, half-yearly, yearly), amount, currency, grace period, discount rules for longer cycles.
- **Payment Record**: resident ID, amount paid, payment date, billing period covered (start–end), payment method (cash, card, bank transfer, mobile money), status (paid, pending, overdue, partial), receipt/reference number, recorded by (agent/self-service).
- **Collection Log**: date, community, collector, status (completed/missed/rescheduled), notes.

### 4. Core Features
**Community & Resident Management**
- Add/edit/remove communities and residents.
- Bulk import residents via CSV/Excel.
- Search and filter residents by community, status, payment status, or billing cycle.

**Payment & Billing**
- Support multiple billing cycles per resident (monthly, bi-monthly, quarterly, half-yearly, yearly), each with correct due-date calculation.
- Auto-generate invoices/reminders before due dates.
- Record manual payments (cash/field collection) and online payments (card, bank transfer, mobile money).
- Track partial payments and outstanding balances.
- Flag overdue accounts automatically and support late-fee rules.
- Generate receipts (PDF/email/SMS).

**Dashboards & Reporting**
- Admin dashboard: total residents, total communities, revenue by period, payment compliance rate, overdue accounts.
- Community-level dashboard: collection schedule adherence, resident payment status breakdown.
- Exportable reports (CSV/PDF) by community, date range, or billing cycle.
- Visual charts: revenue trends, payment cycle distribution, community comparison.

**Notifications**
- Automated reminders (SMS/email/push) before due dates and on overdue status.
- Collection day reminders for residents.
- Alerts to admins for communities with low payment compliance.

**Resident Self-Service Portal**
- View subscription plan, payment history, and next due date.
- Make online payments and download receipts.
- Update contact/profile information.
- Submit complaints or missed-collection reports.

**Field Operations**
- Mobile-friendly interface for collectors to mark collections complete/missed and log on-the-spot payments, even with offline support and later sync.

### 5. Nigeria-Specific Payment Integration
- **Primary payment gateway**: **Paystack** (cards, bank transfer, USSD, mobile money) — best NDPR-aligned, well-documented API, widely trusted by Nigerian users.
- **Secondary/backup gateway**: **Flutterwave** — for redundancy, virtual accounts, and broader mobile money coverage across West Africa.
- Support **recurring/subscription billing** where the gateway allows (Paystack Subscriptions API for monthly/quarterly plans), and fall back to manual invoice + payment link generation for bi-monthly/half-yearly/yearly cycles not natively supported as "plans."
- Support **bank transfer with dedicated/virtual account numbers** per resident (Paystack Dedicated Virtual Accounts or Flutterwave Virtual Account) so residents can pay via transfer and have it auto-reconciled by account number.
- Support **USSD payments** for residents without smartphones/bank apps — common in many Nigerian estates.
- Handle payments in **NGN (₦)**, with correct kobo-based amount handling to avoid rounding errors.
- Webhook listeners (Paystack/Flutterwave webhooks) to auto-update payment status in real time rather than relying only on polling.
- Cash payments collected in the field must still be logged manually by agents and reconciled against the same Payment Record table for a unified ledger.

### 6. Non-Functional Requirements
- Role-based access control and secure authentication.
- Data encryption for payment and personal information; compliance with the **Nigeria Data Protection Act (NDPA 2023)/NDPR**.
- Scalable database structure to support many communities and thousands of residents.
- Audit trail/logging for all payment record changes.
- Responsive design (works on desktop, tablet, and mobile browsers) plus a React Native mobile app for field agents and residents.
- Should remain usable on lower-bandwidth connections (common in many parts of Nigeria) — optimize payloads, add offline queuing for field agents.

### 7. Confirmed Tech Stack
- **Frontend (web)**: React + TypeScript (Vite or Next.js — Next.js recommended if SEO/marketing pages on the public website matter).
- **Mobile app**: React Native + TypeScript (for field agents and resident self-service), sharing types/utilities with the web codebase via a monorepo (e.g., Turborepo or Nx).
- **Backend**: Node.js + TypeScript (Express or NestJS — NestJS recommended for the role-based, multi-module structure this system needs).
- **Database & Backend-as-a-Service**: **Supabase** (PostgreSQL) — use Supabase for the database, authentication (with role-based policies via Row Level Security), file storage (receipts, resident documents), and real-time subscriptions (e.g., live payment status updates on dashboards).
- **ORM**: Prisma or Supabase's generated TypeScript client for type-safe database access.
- **Auth**: Supabase Auth (email/password, magic link, and phone/OTP login — useful for residents who prefer phone-based login) with RLS policies enforcing role-based access at the database level.
- **Payments**: Paystack SDK (primary), Flutterwave SDK (secondary), both integrated through backend API routes — never expose secret keys client-side.
- **Notifications**: Termii or Africa's Talking (Nigeria-focused SMS provider, often more reliable/cheaper than Twilio locally) for SMS; Resend or SendGrid for email; Firebase Cloud Messaging for push notifications in the React Native app.
- **Hosting/Deployment**:
  - **Vercel** — hosts the Next.js/React web frontend and backend API routes (or a separate Node/NestJS service if not using Next.js API routes).
  - **Hostinger** — used for the marketing/public-facing website (or as a secondary host for static assets/domain & email hosting), and can host the custom domain's DNS pointing to Vercel and Supabase.
  - **Supabase Cloud** — hosts the PostgreSQL database, auth, and storage.
  - React Native app distributed via Google Play Store and Apple App Store (or Expo EAS for build/distribution).
- **CI/CD**: GitHub Actions for linting, testing, and auto-deploying to Vercel on merge to main.
- **Monitoring**: Sentry for error tracking (web + mobile), Supabase's built-in logs/metrics for database and auth monitoring.

### 8. Deliverables Expected
- Database schema (ERD) covering Communities, Residents, Billing Plans, Payments, Collections — implemented as Supabase/Postgres migrations.
- Wireframes/UI mockups for admin dashboard, resident portal, and collector mobile view.
- API documentation (OpenAPI/Swagger) for core endpoints (residents, communities, payments, notifications, webhooks).
- A working MVP with: community/resident CRUD, flexible billing-cycle payment recording via Paystack/Flutterwave, basic dashboard, and payment reminders via SMS/email.
- Domain and hosting setup: DNS configured on Hostinger, frontend deployed on Vercel, database/auth on Supabase.

---

**Instruction to the AI/developer receiving this prompt:** Propose the Supabase/Postgres schema first (as SQL migrations) before writing application code. Confirm Paystack vs Flutterwave as primary gateway based on the client's existing merchant account, then scaffold the monorepo (web + mobile + shared types) before building features.
