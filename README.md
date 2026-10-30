# My Money Tracker

A secure, fast, mobile-first personal finance web application built to track income, expenses, category breakdowns, savings goals, and account activity with bank-grade session security and an emerald-green finance design system.

> **Feature Status: Phase 4 Completed (Salary, Budgets, Loans & Savings)**  
> Comprehensive personal financial management is live: monthly salary configuration & actual receipt ledger linking, persistent monthly budget planning with 80% & 100% threshold indicators, informal loan debt & repayment tracking, and emergency fund milestone tracking with automatic ledger reconciliation. Verified with 49 passing backend integration tests and zero-warning frontend production builds.

---

## Table of Contents

1. [Project Overview & Feature Status](#project-overview--feature-status)
2. [Actual Technology Stack](#actual-technology-stack)
3. [Owner Financial Profile & Presets](#owner-financial-profile--presets)
4. [Folder Structure](#folder-structure)
5. [Prerequisites & Installation](#prerequisites--installation)
6. [Development & Build Commands](#development--build-commands)
7. [Environment Variables](#environment-variables)
8. [MongoDB Atlas Setup Guide](#mongodb-atlas-setup-guide)
9. [Authentication & Security Architecture](#authentication--security-architecture)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [API Request Examples](#api-request-examples)
12. [Testing & Verified Results](#testing--verified-results)
13. [UI Features & Responsive Design](#ui-features--responsive-design)
14. [Deployment to Render](#deployment-to-render)
15. [Production CORS, Cookies & CSRF Configuration](#production-cors-cookies--csrf-configuration)
16. [Implemented vs Planned Features](#implemented-vs-planned-features)

---

## 1. Project Overview & Feature Status

My Money Tracker is structured as a full-stack monorepo with an Express REST backend and a React + Vite frontend. It delivers a fast, privacy-focused experience for managing personal finances.

### Current Implementation Status:
- **Authentication**: Fully functional user signup, login, session persistence, and logout with HttpOnly JWT cookies and CSRF double-submit protection.
- **Transactions Ledger**: Complete CRUD operations for `expense`, `income`, and `transfer` records with payment method tagging (`UPI`, `Cash`, `Card`, `Bank Transfer`, `Other`).
- **Category System**: Default system categories seeded automatically (Food & Dining, Groceries, Shopping, Transportation, Entertainment, Utilities, Healthcare, Salary, Freelance, Family Support, Investments) plus user-created custom categories.
- **Salary & Income Management (Module 1)**: Monthly salary configuration (`planned` vs `received`), receipt recording linking cleanly to the transaction ledger without duplicate transactions, and additional income sources.
- **Monthly Budget Management (Module 2)**: Persistent category limits, actual spending calculations, 80% & 100% threshold alerts, budget duplication/copying from prior months, and the owner's ₹25,000 preset.
- **Informal Loan Management (Module 3)**: Informal loan tracking, repayment recording with atomic balance reduction, overpayment prevention, repayment reversal, and the owner's 5-loan payoff strategy.
- **Savings Goals & Emergency Fund (Module 4)**: Milestone tracking, emergency fund setup (₹10,000 initial safety net milestone, ₹30,000 target amount), and internal transfer contributions.
- **Reconciled Financial Dashboard (Module 5)**: Real-time cashflow, budget pacing, loan balances, and savings metrics reconciled without fabricated or dummy data.
- **Custom Accessible Controls**: Bespoke, accessible `Select` dropdown, `MonthPicker` popover, and `DatePicker` calendar components replacing native browser controls for consistent styling, keyboard navigation, and mobile touch compliance.

---

## 2. Actual Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Bundler & Dev Server**: Vite 6.0.3 (ES modules)
- **Routing**: React Router 6.28.0 (lazy-loaded route code splitting)
- **Styling**: Modular Sass/SCSS (`.module.scss`) using a light finance token system (no Tailwind or third-party UI component libraries)
- **Icons**: Lucide React 0.468.0

### Backend
- **Runtime**: Node.js (ES modules, `type: module`)
- **Server Framework**: Express 4.21.2
- **Database**: MongoDB with Mongoose 9.11.4
- **Validation**: Zod 4.6.7 for strict request payload validation
- **Authentication**: JSON Web Tokens (`jsonwebtoken` 9.0.3) & `bcryptjs` 3.0.3 (12 salt rounds)
- **Security Middleware**: `helmet` 8.0.0, `cors` 2.8.5, `cookie-parser` 1.4.7, `express-rate-limit` 7.5.0
- **Testing**: Node.js built-in test runner (`node:test`), `supertest` 7.3.1, `mongodb-memory-server` 11.3.0

---

## 3. Owner Financial Profile & Presets

Phase 4 includes tailored configurations reflecting the owner's real-world personal finances:

### Monthly Salary & Budget Allocations (₹25,000)
- **Monthly Planned Salary**: ₹25,000 (credited ~1st of the month)
- **Budget Allocations**:
  - **Housing & Rent (Home)**: ₹7,000
  - **Loan Repayments**: ₹5,000
  - **Gym & Health**: ₹1,500
  - **Food & Dining**: ₹2,000
  - **Petrol & Transportation**: ₹2,000
  - **Mobile & Utilities**: ₹1,000
  - **Family Support**: ₹500
  - **Planned Savings Target**: ₹4,000
  - **Emergency Buffer**: ₹2,000
  - **Total**: ₹25,000 (100% accounted for)

### Informal Loans Payoff Schedule
- **Loan A**: ₹8,000 original principal • ₹1,000/month planned repayment
- **Loan B**: ₹5,000 original principal • First payment: December 2026 (₹2,000/mo)
- **Loan C**: ₹10,000 original principal • First payment: December 2026 (₹2,000/mo)
- **Small Loan 1**: ₹2,000 original principal • Targeted full payoff in November 2026
- **Small Loan 2**: ₹2,000 original principal • Targeted full payoff in November 2026
- **Monthly Strategy**: November payment total = ₹5,000 (Small 1 ₹2k + Small 2 ₹2k + Loan A ₹1k). December onward payment total = ₹5,000/month (Loan A ₹1k + Loan B ₹2k + Loan C ₹2k).

### Savings Goals & Emergency Fund
- **Goal**: Emergency Fund
- **Target Amount**: ₹30,000
- **Monthly Allocation**: ₹4,000/month
- **Milestones**:
  1. *Initial Safety Net*: ₹10,000
  2. *Midway Reserve*: ₹20,000
  3. *Full Emergency Fund*: ₹30,000

---

## 4. Folder Structure

```text
my-money-tracker/
├── package.json                   # Monorepo scripts (dev, build, test, install:all)
├── package-lock.json
├── .env.example                   # Safe environment template (no secrets)
├── .gitignore                     # Enforces ignoring .env, node_modules, dist, logs
├── README.md                      # Complete system documentation
│
├── client/                        # Frontend React + Vite SPA
│   ├── package.json
│   ├── vite.config.js             # Proxies /api to Express backend (localhost:5001)
│   ├── index.html                 # Viewport, web fonts, accessible shell
│   ├── .env.example
│   └── src/
│       ├── main.jsx               # React DOM entry point
│       ├── App.jsx                # Router configuration with lazy routes
│       ├── context/
│       │   └── AuthContext.jsx    # Session restoration, login, signup, logout state
│       ├── layouts/
│       │   ├── AppLayout.jsx      # Shell containing Header, Sidebar, MobileNav
│       │   └── AppLayout.module.scss
│       ├── pages/
│       │   ├── DashboardPage.jsx  # Reconciled metrics, Phase 4 Suite, recent ledger
│       │   ├── TransactionsPage.jsx # Ledger table, filters, pagination, FAB
│       │   ├── BudgetsPage.jsx    # Budget planning, salary receipt, 80%/100% threshold
│       │   ├── SavingsPage.jsx    # Emergency fund, milestone ladder, deposits
│       │   ├── LoansPage.jsx      # Informal debt tracker, atomic repayments
│       │   ├── NotFoundPage.jsx   # 404 handler
│       │   └── auth/
│       │       ├── LoginPage.jsx  # Sign-in form with password visibility toggle
│       │       ├── SignupPage.jsx # Registration form with live criteria checklist
│       │       └── Auth.module.scss
│       ├── components/
│       │   ├── auth/
│       │   │   └── ProtectedRoute.jsx # Authentication gatekeeper
│       │   ├── common/
│       │   │   ├── Badge/         # Semantic badges (income, expense, warning, neutral)
│       │   │   ├── Button/        # Forward-ref button with 44px touch targets
│       │   │   ├── Card/          # Elevated card surfaces
│       │   │   ├── DatePicker/    # Accessible custom 7-column calendar date popover
│       │   │   ├── DemoBanner/    # Live ledger status banner
│       │   │   ├── MonthPicker/   # Accessible custom month/year popover
│       │   │   └── Select/        # Accessible custom combobox/listbox
│       │   ├── dashboard/
│       │   │   ├── BalanceSummary/# Net cashflow, income, expense, savings rate cards
│       │   │   ├── CategoryBudgets/# Expense proportion bars per category
│       │   │   ├── RecentTransactions/# Chronological list with quick action
│       │   │   ├── ServerStatusCard/# Live /api/health monitor card
│       │   │   └── SpendingOverview/# Monthly burn rate and cashflow ratio
│       │   ├── navigation/
│       │   │   ├── Header/        # Greeting, date, user initials avatar, logout
│       │   │   ├── Sidebar/       # Desktop fixed navigation
│       │   │   └── MobileNav/     # Bottom navigation with safe-area support
│       │   └── transactions/
│       │       ├── TransactionModal.jsx # Create/edit modal dialog
│       │       └── DeleteConfirmModal.jsx # Confirmation alert dialog
│       ├── services/
│       │   ├── api.js             # Fetch client with CSRF token and timeout
│       │   ├── authService.js     # Auth API methods
│       │   ├── categoryService.js # Category API methods
│       │   ├── healthService.js   # Health check API methods
│       │   └── transactionService.js # Transaction ledger & summary API methods
│       └── styles/
│           ├── _variables.scss    # Color palette, spacing, typography tokens
│           ├── _mixins.scss       # Breakpoints, touch targets, focus rings
│           ├── _reset.scss        # CSS reset, prefers-reduced-motion, skip-to-content
│           ├── _typography.scss   # Font hierarchy, tabular numeric styling
│           └── main.scss          # Base application styles
│
└── server/                        # Backend Node.js / Express REST API
    ├── package.json
    ├── .env.example
    ├── test/
    │   ├── auth.test.js           # 14 auth & session integration tests
    │   └── transactions.test.js   # 17 transactions & categories integration tests
    └── src/
        ├── app.js                 # Express app initialization with middleware
        ├── server.js              # Server bootstrap and graceful shutdown
        ├── config/
        │   ├── database.js        # Mongoose connection with sanitized logging
        │   └── env.js             # Zod environment variable validation
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── category.controller.js
        │   ├── health.controller.js
        │   └── transaction.controller.js
        ├── middleware/
        │   ├── auth.middleware.js # Verifies HttpOnly JWT cookie
        │   ├── csrf.middleware.js # Double-submit CSRF verification
        │   ├── errorHandler.js    # Centralized JSON error normalization
        │   ├── notFoundHandler.js # 404 handler
        │   ├── rateLimiter.js     # IP rate limiters
        │   └── validate.js        # Zod validation middleware
        ├── models/
        │   ├── category.model.js  # Category schema (system vs user custom)
        │   ├── transaction.model.js # Transaction schema with indexes
        │   └── user.model.js      # User schema with bcrypt & safe serialization
        ├── routes/
        │   ├── index.js           # Main router mounting all sub-routes
        │   ├── auth.routes.js
        │   ├── category.routes.js
        │   ├── health.routes.js
        │   └── transaction.routes.js
        ├── services/
        │   ├── category.service.js# Category business logic & system defaults
        │   ├── health.service.js
        │   ├── token.service.js   # JWT & CSRF token generation
        │   └── transaction.service.js # Transaction CRUD & aggregation logic
        └── validators/
            ├── auth.validator.js  # Zod schemas for signup and login
            ├── category.validator.js # Zod schemas for categories
            └── transaction.validator.js # Zod schemas for transactions
```

---

## 4. Prerequisites & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: A free MongoDB Atlas cluster or local MongoDB instance (v6.0+)

### Step-by-Step Installation

Clone the repository and install dependencies across all workspaces:

```bash
git clone <repository-url>
cd my-money-tracker
npm run install:all
```

The `npm run install:all` command executes `npm install` in the root, `server/`, and `client/` directories sequentially.

---

## 5. Development & Build Commands

All primary scripts are runnable from the repository root:

| Command | Working Directory | Description |
|---|---|---|
| `npm run dev` | Root | Starts Express server (`port 5001`) and Vite client (`port 5173`) concurrently |
| `npm run dev:server` | Root | Starts the backend server only in development watch mode via nodemon |
| `npm run dev:client` | Root | Starts the Vite frontend development server only (`http://localhost:5173`) |
| `npm run build` | Root | Runs `vite build` in `client/` producing optimized production bundles in `client/dist` |
| `npm run test` | Root | Runs the complete 31-test integration suite in `server/` using in-memory MongoDB |
| `npm run start` | Root | Runs `node src/server.js` in `server/` to launch the production backend |

### Client-Specific Commands (`cd client`)
- `npm run dev`: Launch Vite dev server with hot module replacement (HMR).
- `npm run build`: Build production assets with Dart Sass and Rollup chunk optimization.
- `npm run preview`: Serve the built `dist` folder locally for previewing.

### Server-Specific Commands (`cd server`)
- `npm run dev`: Launch Express with `nodemon` auto-reload.
- `npm run start`: Launch Express with standard `node`.
- `npm run test`: Run the test suite: `node --test test/auth.test.js test/transactions.test.js`.

---

## 6. Environment Variables

Create `.env` files for both server and client using the reference examples below. **Never commit `.env` files to source control.**

### Backend (`server/.env`)
```bash
# Server Port & Environment
PORT=5001
NODE_ENV=development

# MongoDB Connection String (Atlas or local)
# Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://app_user:placeholder_password@cluster0.abcde.mongodb.net/mymoneytracker?retryWrites=true&w=majority

# JWT Signing Key (Must be 32+ random characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_32_character_minimum_random_secret_string_here_now
JWT_EXPIRES_IN=7d

# Cookie Security (false in local dev, true in production with HTTPS)
COOKIE_SECURE=false

# SameSite Policy ('lax' for same domain/proxy, 'none' for cross-domain production like Render)
COOKIE_SAME_SITE=lax

# Allowed CORS Origins (comma-separated, never '*' when using credentials)
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=10
```

### Frontend (`client/.env`)
```bash
# In local development, leave empty to route requests through the Vite reverse proxy (/api -> localhost:5001)
# In production on static hosting or Render, set to your remote backend domain:
# VITE_API_URL=https://my-money-tracker-api.onrender.com
VITE_API_URL=
```

---

## 7. MongoDB Atlas Setup Guide

To connect the application to MongoDB Atlas:

1. **Create an Account & Cluster**:
   - Register at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free shared cluster (`M0 Sandbox`).
2. **Create Database Credentials**:
   - Navigate to **Security > Database Access**.
   - Click **Add New Database User**.
   - Choose **Password** authentication, specify a username (e.g. `tracker_user`) and a secure password.
   - Assign the built-in role `readWriteAnyDatabase` or restrict to `mymoneytracker`.
3. **Configure Network Access**:
   - Navigate to **Security > Network Access**.
   - Click **Add IP Address**.
   - For local development: Click **Add Current IP Address**.
   - For deployment (e.g., Render without static outbound IPs): Add `0.0.0.0/0` (Access from anywhere) secured by your database credentials.
4. **Obtain Connection String**:
   - Navigate to **Deployment > Database**.
   - Click **Connect > Drivers** (Node.js version 5.5+).
   - Copy the SRV connection URI:
     `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/mymoneytracker?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials.
   - Paste the URI into `server/.env` as `MONGODB_URI`.
5. **Auto-Seeding**:
   - Upon first successful connection, `server.js` automatically initializes default categories (Food, Transportation, Salary, etc.) via `ensureDefaultCategories()`.

---

## 8. Authentication & Security Architecture

1. **HttpOnly Cookie Sessions (`mmt_auth`)**:
   - JSON Web Tokens are stored inside an `HttpOnly` cookie.
   - Client-side JavaScript cannot read or modify this cookie, mitigating Cross-Site Scripting (XSS) session hijacking.
2. **Double-Submit CSRF Verification (`mmt_csrf`)**:
   - A cryptographically random token is stored in a readable cookie (`mmt_csrf`).
   - For state-changing operations (`POST`, `PUT`, `PATCH`, `DELETE`), the frontend Fetch client automatically extracts this cookie and attaches it as the `X-CSRF-Token` header.
   - Server-side middleware verifies that the header matches the cookie before permitting the request.
3. **Password Security**:
   - Passwords must be at least 8 characters and contain at least one uppercase letter and one numeric digit.
   - Passwords are salted and hashed using `bcryptjs` with cost factor 12 before persistence.
4. **Safe Data Serialization**:
   - User Mongoose schema transforms strip `passwordHash`, `__v`, and internal fields from all JSON outputs.
5. **Tiered Rate Limiting**:
   - General API rate limit: 100 requests per 15 minutes per IP.
   - Authentication rate limit: 10 attempts per 15 minutes per IP on login/signup to thwart credential-stuffing attacks.
6. **Account Enumeration Defense**:
   - Authentication failures return generic error messages (`"Invalid email or password."`) with equivalent timing to prevent username harvesting.

---

## 9. API Endpoints Reference

### Health
- `GET /api/health` — Public service health check (returns service status, uptime, environment).

### Authentication (`/api/auth/*`)
- `POST /api/auth/signup` — Create a new user account and set auth cookies.
- `POST /api/auth/login` — Authenticate credentials and set auth cookies.
- `POST /api/auth/logout` — Invalidate session and clear auth cookies (requires CSRF header).
- `GET /api/auth/me` — Return currently authenticated user profile.

### Categories (`/api/categories/*`)
- `GET /api/categories` — List system default and user custom categories.
- `POST /api/categories` — Create a new custom category (`name`, `type`, `color`, `icon`).
- `PATCH /api/categories/:id` — Update custom category (prevented on system defaults).
- `DELETE /api/categories/:id` — Delete custom category (prevented if transactions reference it).

### Transactions (`/api/transactions/*`)
- `GET /api/transactions` — Paginated transactions list with search and multi-filter support:
  - Query parameters: `search`, `type`, `category`, `paymentMethod`, `month` (format: `YYYY-MM`), `page`, `limit`.
- `GET /api/transactions/summary` — Aggregated monthly financial summary reconciled across ledger, salary, budgets, loans, and savings:
  - Query parameters: `month` (format: `YYYY-MM`).
  - Returns totals for `income`, `expense`, `netSavings`, `savingsRate`, `transfer`, `categoryBreakdown`, `salary`, `budget`, `loans`, and `savings`.
- `POST /api/transactions` — Record a new transaction (`type`, `amount`, `description`, `paymentMethod`, `date`, `category`, `notes`).
- `GET /api/transactions/:id` — Fetch single transaction by ID.
- `PATCH /api/transactions/:id` — Update transaction fields.
- `DELETE /api/transactions/:id` — Delete transaction record.

### Salary & Income (`/api/salary/*`)
- `GET /api/salary` — Get monthly salary configuration and receipt status (query: `month=YYYY-MM`).
- `POST /api/salary` — Configure planned monthly salary (`month`, `plannedAmount`, `notes`).
- `POST /api/salary/receive` — Record actual salary receipt and link/update income transaction in ledger (`month`, `actualAmount`, `receivedDate`, `paymentMethod`, `notes`).
- `POST /api/salary/additional` — Add extra income source with linked ledger transaction (`month`, `source`, `amount`, `date`, `paymentMethod`, `notes`).
- `GET /api/salary/history` — List salary records history.

### Monthly Budgets (`/api/budgets/*`)
- `GET /api/budgets` — Get monthly budget with computed actual spending, remaining amounts, and threshold warnings (query: `month=YYYY-MM`).
- `POST /api/budgets` — Create or update budget allocations (`month`, `expectedIncome`, `categoryAllocations`, `savingsTarget`, `bufferAllocation`, `notes`).
- `PATCH /api/budgets/:id` — Update category limits and expected amounts.
- `POST /api/budgets/copy` — Replicate prior month's budget configuration to a target month (`sourceMonth`, `targetMonth`).
- `POST /api/budgets/preset` — Apply the owner's standard ₹25,000 budget allocations.
- `GET /api/budgets/history` — List historical budget configurations.

### Informal Loans (`/api/loans/*`)
- `GET /api/loans` — List all loans with summary statistics (total debt, principal, repaid, planned monthly).
- `POST /api/loans` — Create a new informal loan (`lenderName`, `originalPrincipal`, `startDate`, `plannedMonthlyPayment`, `firstScheduledPaymentMonth`, `notes`).
- `GET /api/loans/:id` — Fetch single loan with full chronological payment history.
- `PATCH /api/loans/:id` — Update loan details.
- `POST /api/loans/:id/payments` — Record an actual loan payment, atomically reduce balance, update status (`paid` at 0), and optionally create ledger expense (`amount`, `paymentDate`, `paymentMethod`, `recordAsExpense`, `notes`).
- `PATCH /api/loans/:id/payments/:paymentId` — Edit a payment amount/date with atomic recalculation.
- `DELETE /api/loans/:id/payments/:paymentId` — Reverse payment, restore outstanding balance, and delete ledger transaction.
- `POST /api/loans/preset` — Seed the owner's 5 informal loans (Loan A, Loan B, Loan C, Small Loans 1 & 2).

### Savings Goals & Milestones (`/api/savings/*`)
- `GET /api/savings` — List savings goals with progress percentages and summary metrics.
- `POST /api/savings` — Create a new savings goal (`title`, `targetAmount`, `targetDate`, `category`, `monthlyTarget`, `milestones`, `notes`).
- `GET /api/savings/:id` — Fetch single goal with contribution history and milestone status.
- `PATCH /api/savings/:id` — Update goal details or archive status.
- `POST /api/savings/:id/contributions` — Record a contribution, atomically evaluate milestone achievement, and optionally record internal ledger transfer (`amount`, `date`, `paymentMethod`, `recordAsTransfer`, `notes`).
- `DELETE /api/savings/:id/contributions/:contribId` — Reverse contribution, update current saved amount, and re-evaluate milestones.
- `POST /api/savings/preset` — Seed the owner's Emergency Fund (₹30,000 target, ₹10,000 initial safety net milestone).

---

## 10. API Request Examples

### 1. User Registration
```http
POST /api/auth/signup HTTP/1.1
Host: localhost:5001
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123",
  "currency": "INR"
}
```

### 2. User Login
```http
POST /api/auth/login HTTP/1.1
Host: localhost:5001
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "Password123"
}
```

### 3. Record an Expense
```http
POST /api/transactions HTTP/1.1
Host: localhost:5001
Content-Type: application/json
X-CSRF-Token: <token_from_mmt_csrf_cookie>
Cookie: mmt_auth=<jwt_session_token>; mmt_csrf=<csrf_token>

{
  "type": "expense",
  "amount": 450.00,
  "description": "Weekly organic groceries",
  "paymentMethod": "upi",
  "date": "2026-10-29T10:00:00.000Z",
  "category": "67215f9b4c09d81234567890",
  "notes": "Purchased vegetables and spices"
}
```

### 4. Fetch Monthly Summary
```http
GET /api/transactions/summary?month=2026-10 HTTP/1.1
Host: localhost:5001
Cookie: mmt_auth=<jwt_session_token>
```
Response:
```json
{
  "success": true,
  "data": {
    "month": "2026-10",
    "totals": {
      "income": 75000.00,
      "expense": 28450.00,
      "netSavings": 46550.00,
      "savingsRate": 62,
      "transfer": 10000.00,
      "count": 18
    },
    "categoryBreakdown": [
      {
        "categoryId": "67215f9b4c09d81234567890",
        "name": "Groceries",
        "color": "#059669",
        "spent": 8450.00,
        "count": 6
      }
    ]
  }
}
```

---

## 11. Testing & Verified Results

The backend integration test suite runs against an isolated, in-memory MongoDB server instance (`mongodb-memory-server`) to guarantee reproducible test runs without impacting live databases.

### Run Tests:
```bash
npm run test
```

### Test Suite Summary:
```text
▶ Authentication & MongoDB Integration Tests
  ✔ GET /api/health should return 200 and healthy status (80.0ms)
  ✔ POST /api/auth/signup with valid input creates account and sets HttpOnly cookies (893.3ms)
  ✔ POST /api/auth/signup rejects duplicate email with 409 Conflict (13.2ms)
  ✔ POST /api/auth/signup rejects invalid passwords (<8 chars or no numbers/uppercase) (10.8ms)
  ✔ POST /api/auth/signup rejects invalid emails (9.3ms)
  ✔ POST /api/auth/login succeeds with correct credentials and returns safe user (473.6ms)
  ✔ POST /api/auth/login returns generic 401 for incorrect password (464.3ms)
  ✔ POST /api/auth/login returns generic 401 for non-existent email (12.2ms)
  ✔ GET /api/auth/me rejects unauthenticated requests with 401 Unauthorized (8.4ms)
  ✔ GET /api/auth/me returns user profile when valid auth cookie is presented (15.7ms)
  ✔ POST /api/auth/logout rejects state-changing request if CSRF token header is missing (8.3ms)
  ✔ POST /api/auth/logout succeeds with matching CSRF header and clears cookies (13.8ms)
  ✔ GET /api/auth/me fails with 401 after logging out (7.6ms)
  ✔ Authentication rate limiter triggers 429 when max login attempts are exceeded (47.5ms)
✔ Authentication & MongoDB Integration Tests (3803.5ms)

▶ Phase 4: Salary, Budgets, Loans & Savings Integration Tests
  ▶ Module 1: Salary & Income Management
    ✔ POST /api/salary configures planned salary without creating a transaction ledger entry (99.6ms)
    ✔ POST /api/salary/receive marks salary as received and links an income transaction (56.6ms)
    ✔ POST /api/salary/receive idempotently updates the existing transaction instead of duplicating it (28.3ms)
    ✔ POST /api/salary/additional adds extra income source and creates an income transaction (32.6ms)
  ✔ Module 1: Salary & Income Management (219.6ms)
  ▶ Module 2: Monthly Budget Management
    ✔ POST /api/budgets/preset applies the owner’s ₹25,000 budget allocations (58.5ms)
    ✔ GET /api/budgets correctly calculates actual spending and threshold warnings (80% & 100%) (114.3ms)
    ✔ POST /api/budgets/copy replicates previous month’s configuration to a new month (28.8ms)
  ✔ Module 2: Monthly Budget Management (202.7ms)
  ▶ Module 3: Informal Loan Management
    ✔ POST /api/loans/preset seeds the owner’s 5 active loans correctly (41.2ms)
    ✔ POST /api/loans/:id/payments records payment, updates balance atomically, and links an expense transaction (34.1ms)
    ✔ POST /api/loans/:id/payments rejects payment exceeding outstanding balance (13.0ms)
    ✔ DELETE /api/loans/:id/payments/:paymentId correctly reverses payment and restores balance (46.9ms)
    ✔ POST /api/loans/:id/payments automatically marks loan status as "paid" when balance reaches 0 (32.6ms)
    ✔ User B cannot access or record payments on User A’s loan (25.5ms)
  ✔ Module 3: Informal Loan Management (194.5ms)
  ▶ Module 4: Savings Goals & Contributions
    ✔ POST /api/savings/preset creates the owner emergency fund goal with milestones (22.8ms)
    ✔ POST /api/savings/:id/contributions updates current amount and evaluates milestone completion (60.4ms)
    ✔ DELETE /api/savings/:id/contributions/:contribId recalculates balance and unchecks milestone if below threshold (29.2ms)
    ✔ User B cannot view or contribute to User A’s savings goal (39.3ms)
  ✔ Module 4: Savings Goals & Contributions (156.8ms)
  ▶ Module 5: Dashboard Reconciliation Summary
    ✔ GET /api/transactions/summary contains reconciled salary, budget, loans, and savings summaries (29.8ms)
  ✔ Module 5: Dashboard Reconciliation Summary (30.5ms)
✔ Phase 4: Salary, Budgets, Loans & Savings Integration Tests (4287.0ms)

▶ Transactions & Categories Integration Tests
  ✔ GET /api/categories lists default categories for authenticated user (78.3ms)
  ✔ POST /api/categories allows user to create a custom category (28.2ms)
  ✔ POST /api/categories prevents duplicate category for the same user and type (27.4ms)
  ✔ PATCH /api/categories/:id prevents modifying system default categories (14.7ms)
  ✔ PATCH /api/categories/:id prevents User B from modifying User A custom category (12.4ms)
  ✔ POST /api/transactions creates valid income transaction (31.4ms)
  ✔ POST /api/transactions creates valid expense transaction (19.0ms)
  ✔ POST /api/transactions creates valid transfer transaction (no category required) (13.6ms)
  ✔ POST /api/transactions rejects zero, negative, or invalid amounts (20.9ms)
  ✔ POST /api/transactions rejects expense without category (10.5ms)
  ✔ GET /api/transactions/:id rejects User B attempting to view User A transaction (13.3ms)
  ✔ PATCH /api/transactions/:id rejects User B attempting to update User A transaction (12.4ms)
  ✔ DELETE /api/transactions/:id rejects User B attempting to delete User A transaction (12.3ms)
  ✔ GET /api/transactions/summary correctly calculates totals and excludes transfers (26.5ms)
  ✔ DELETE /api/categories/:id prevents deleting custom category if referenced by transactions (34.0ms)
  ✔ PATCH /api/transactions/:id updates transaction description and amount (22.9ms)
  ✔ DELETE /api/transactions/:id removes transaction (24.8ms)
✔ Transactions & Categories Integration Tests (3917.3ms)

ℹ tests 49 | suites 8 | pass 49 | fail 0 | cancelled 0 | skipped 0 | todo 0
```

### Production Build Verification:
```bash
npm run build
```
Vite transforms 1,634 modules and generates tree-shaken chunks with gzip asset compression and 0 errors or warnings.

---

## 12. UI Features & Responsive Design

### Design System Tokens
- **Background**: `#F7F8F5`
- **Cards & Surfaces**: `#FFFFFF`
- **Primary Green**: `#087F5B`
- **Dark Green**: `#124E3B`
- **Soft Green**: `#E5F3EA`
- **Text Main**: `#1F2937`
- **Borders**: `#E5E7EB`

### Custom Accessible Controls
- **Custom Select Component (`Select.jsx`)**:
  - WAI-ARIA Combobox / Listbox implementation with `role="combobox"`, `role="listbox"`, and `role="option"`.
  - Full keyboard navigation: `ArrowDown`/`ArrowUp` to cycle options, `Home`/`End` to jump, `Enter`/`Space` to select, `Escape` or `Tab` to dismiss.
  - Automatic vertical flip (`upward` vs `downward`) when positioned near the viewport bottom boundary.
  - Constrained scrolling for long option lists and truncated labels with HTML `title` attributes.
  - Touch-optimized minimum target size (44px on mobile) and emerald green focus rings.
- **Custom MonthPicker Component (`MonthPicker.jsx`)**:
  - Displays formatted month and year (e.g. `October 2026`) in a trigger button with calendar icon.
  - Opens a popover containing previous/next year stepper buttons, a 12-month grid, and quick actions ("This month" and "Clear").
  - Timezone-safe string parsing directly against `YYYY-MM` formats to avoid UTC rollover bugs.
  - Automatic right/left viewport alignment detection to prevent overflow on mobile and tablet edges.
- **Custom DatePicker Component (`DatePicker.jsx`)**:
  - Displays formatted date (e.g. `Oct 30, 2026`) in a trigger button with calendar icon, clear button, and rotating chevron.
  - Opens a popover containing month/year header with previous and next month controls.
  - Seven-column calendar grid with weekday labels (`Su`, `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`).
  - Highlights the selected date in emerald-green (`#087F5B`) and marks today with an emerald boundary indicator.
  - Includes "Today" and "Clear" quick action controls.
  - WAI-ARIA roving tabindex keyboard navigation: `ArrowLeft`/`ArrowRight` (day -1/+1), `ArrowUp`/`ArrowDown` (week -1/+1), `Home`/`End` (month start/end), `PageUp`/`PageDown` (month -1/+1), `Enter`/`Space` (select), and `Escape` (dismiss).
  - Timezone-safe string parsing and serialization avoiding any UTC off-by-one date shifts.
  - Mobile-safe popup positioning at 320px and 375px with vertical auto-flip (`upward` vs `downward`).

### Responsive Breakpoints
- **Mobile Small (320px – 375px)**:
  - Fixed mobile bottom navigation with safe-area inset padding.
  - Prominent Floating Action Button (FAB) for one-tap expense logging.
  - Transaction table seamlessly transforms into responsive mobile card lists.
  - Single-column form layouts with full-width modal action buttons.
- **Tablet (768px)**:
  - Two-column dashboard layout; filter bar accommodates responsive auto-wrapping controls.
- **Desktop (1024px – 1280px+)**:
  - Fixed left sidebar navigation (`250px`); full multi-column dashboard grid (7:5 ratio) with sticky header.

---

## 13. Deployment to Render

To deploy the application to [Render](https://render.com):

### Step 1: Deploy Backend Web Service
1. Create a **New Web Service** pointing to your repository.
2. Configure settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `PORT`: `10000` (Render default)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas SRV URI>`
   - `JWT_SECRET`: `<Secure 32+ character random string>`
   - `JWT_EXPIRES_IN`: `7d`
   - `COOKIE_SECURE`: `true`
   - `COOKIE_SAME_SITE`: `none` (Required for cross-site cookies between Render domains)
   - `CLIENT_URL`: `https://my-money-tracker-client.onrender.com`
   - `ALLOWED_ORIGINS`: `https://my-money-tracker-client.onrender.com`

### Step 2: Deploy Frontend Static Site
1. Create a **New Static Site** pointing to your repository.
2. Configure settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://my-money-tracker-api.onrender.com`
4. Add Rewrite Rule:
   - Set **Rewrite Rule** from `/*` to `/index.html` to support React Router HTML5 pushState routing.

---

## 14. Production CORS, Cookies & CSRF Configuration

When deploying client and server on separate subdomains or hosts:
1. **Cross-Origin Cookies (`SameSite=None`)**:
   - Modern browsers block third-party cookies unless marked `SameSite=None; Secure`.
   - In production, set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`. Both frontend and backend must be served over HTTPS.
2. **Explicit CORS Allowed Origins**:
   - `cors` cannot use `origin: "*"` when `credentials: true`.
   - Specify your exact frontend URL in `ALLOWED_ORIGINS` (e.g. `https://my-money-tracker-client.onrender.com`).
3. **Double-Submit CSRF on Separate Domains**:
   - Because `mmt_csrf` is set on the server domain, cross-origin fetch requests can read this cookie only if it is configured with appropriate domain attributes or if a pre-flight CSRF provisioning endpoint is queried. When deploying under a unified custom domain (e.g. `app.yourdomain.com` and `api.yourdomain.com`), set cookie domain to `.yourdomain.com`.

---

## 15. Implemented vs Planned Features

| Feature | Status | Details |
|---|---|---|
| User Signup, Login, Logout | **Implemented** | JWT HttpOnly cookies, CSRF protection, rate limits |
| Live Transaction Ledger | **Implemented** | Create, read, update, delete for expense, income, transfer |
| Filter & Search Bar | **Implemented** | Search text, type, category, payment method, month filters |
| Category Management | **Implemented** | System defaults + user custom categories |
| Monthly Cashflow Analytics | **Implemented** | Summary API with savings rate & category breakdown |
| Custom Accessible Select | **Implemented** | ARIA-compliant combobox replacing native selects |
| Custom Accessible MonthPicker | **Implemented** | Popover with year stepper, month grid, and clear button |
| Custom Accessible DatePicker | **Implemented** | 7-col calendar grid, roving tabindex, timezone-safe |
| Mobile Bottom Navigation & FAB | **Implemented** | 44px+ touch targets, safe-area support, quick add button |
| Category Budget Limits & Pacing | *Planned (Phase 4)* | Monthly spending threshold alerts (80%, 100%) |
| Informal Loans & Debt Tracking | *Planned (Phase 4)* | Track money lent to / borrowed from individuals |
| Savings Goals & Emergency Fund | *Planned (Phase 4)* | Milestone target funds and automated monthly allocation |
| Advanced Reports & CSV Export | *Planned (Phase 5)* | Multi-month trend visualizer and CSV export |
| Receipt Image Uploads | *Planned (Phase 5)* | Cloudinary / S3 attachment storage for transactions |
| Profile Management & Avatar Upload | *Planned (Phase 5)* | Custom avatar image, base currency conversion |
