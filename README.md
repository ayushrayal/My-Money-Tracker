# My Money Tracker

A secure, fast, mobile-first personal finance web application built to track salary, expenses, category budgets, savings goals, and informal loans.

> **Current Status: Phase 2 — Authentication & MongoDB Foundation Completed**  
> User registration, secure login, HttpOnly cookie sessions, CSRF double-submit protection, strict rate limiting, Mongoose user model, and protected frontend routing are implemented and verified. Placeholder financial figures on the dashboard remain marked as demo preview until transaction models and APIs are added in Phase 3.

---

## Architecture & Technology Stack

- **Monorepo Architecture**: Clean separation between `client/` and `server/`.
- **Frontend**: React 18, Vite 6, JavaScript (ES modules).
- **Routing**: React Router 6 with nested layouts and `<ProtectedRoute>` gatekeeper.
- **Styling**: Modular Sass/SCSS with variables, mixins, responsive breakpoints down to 320px mobile width.
- **Backend**: Node.js and Express (ES modules).
- **Database**: MongoDB Atlas with Mongoose 8 (unique indexes, safe serialization, password hashing).
- **Authentication**: JWT stored in `HttpOnly` cookie, CSRF double-submit verification, bcrypt password hashing (cost factor 12).
- **Security**: Helmet HTTP headers, explicit CORS allowlist, and tiered API rate-limiting (stricter limit for login/signup).
- **API Communication**: Lightweight Fetch API client with timeout handling, credentials support, and automatic CSRF header injection.

---

## Directory Structure

```text
my-money-tracker/
├── package.json               # Root scripts (dev, build, test, install:all)
├── .gitignore                 # Enforces ignoring node_modules, dist, .env, and logs
├── .env.example               # Reference environment variables
├── README.md                  # Project documentation & run guide
│
├── client/                    # Frontend React application
│   ├── package.json
│   ├── vite.config.js         # Configured with proxy to Express backend (/api)
│   ├── index.html             # Mobile viewport & web fonts
│   ├── .env.example
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── auth/          # ProtectedRoute (route guard & loading spinner)
│       │   ├── common/        # Badge, Button, Card, DemoBanner
│       │   ├── dashboard/     # BalanceSummary, SpendingOverview, CategoryBudgets, RecentTransactions, ServerStatusCard
│       │   └── navigation/    # Header (user initials & logout), Sidebar, MobileNav
│       ├── context/           # AuthContext (user state, login, signup, logout, session restore)
│       ├── layouts/           # AppLayout shell
│       ├── pages/             # DashboardPage, LoginPage, SignupPage, Transactions, Budgets, Savings, Loans, NotFound
│       ├── services/          # api.js (credentials & CSRF support), authService.js, healthService.js
│       ├── styles/            # _variables.scss, _mixins.scss, _reset.scss, _typography.scss, main.scss
│       ├── App.jsx            # React Router setup with public and protected routes
│       └── main.jsx           # App entrypoint
│
└── server/                    # Backend Express service
    ├── package.json
    ├── .env.example
    ├── test/
    │   └── auth.test.js       # 14 integration tests using node:test & supertest
    └── src/
        ├── config/            # Environment validation (env.js), MongoDB connection (database.js)
        ├── controllers/       # auth.controller.js, health.controller.js
        ├── middleware/        # auth.middleware.js, csrf.middleware.js, errorHandler.js, notFoundHandler.js, rateLimiter.js, validate.js
        ├── models/            # user.model.js (Mongoose schema with bcrypt & safe serialization)
        ├── routes/            # index.js, auth.routes.js (/api/auth/*), health.routes.js (/api/health)
        ├── services/          # token.service.js (JWT & CSRF tokens), health.service.js
        ├── validators/        # auth.validator.js (Zod schemas for signup and login)
        ├── app.js             # Express app setup (Helmet, CORS, cookies, rate limits, routes)
        └── server.js          # HTTP server bootstrap & graceful shutdown
```

---

## Authentication & Security Design

1. **Password Hashing**: Passwords are encrypted using `bcryptjs` with salt rounds = 12. Plaintext passwords are never stored or logged.
2. **HttpOnly Cookie Sessions**: Session tokens (`mmt_auth`) are signed JWTs stored in `HttpOnly` cookies. They cannot be accessed by client-side JavaScript, mitigating XSS token theft.
3. **Double-Submit CSRF Protection**: For state-changing requests (`POST`, `PUT`, `DELETE`), client JavaScript reads the `mmt_csrf` cookie and sends it as the `X-CSRF-Token` header. The server verifies both match before processing.
4. **Account Enumeration Defense**: The login endpoint returns a generic `"Invalid email or password."` message regardless of whether the email exists.
5. **Safe Serialization**: The Mongoose `User` model automatically strips `passwordHash` and `__v` from all JSON responses via schema transforms.
6. **Strict Rate Limiting**: Authentication endpoints (`/api/auth/login`, `/api/auth/signup`) allow a maximum of 10 requests per 15-minute window per IP to prevent brute-force attacks.

---

## Getting Started

### 1. Install Dependencies

Install all dependencies across root, server, and client with one command:

```bash
npm run install:all
```

### 2. Configure Environment Variables

Create local environment files:

**Server**:
```bash
cp server/.env.example server/.env
```

Key server environment variables:
| Variable | Description |
|---|---|
| `PORT` | Port for Express server (`5001`) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ character signing key for JWT session cookies |
| `COOKIE_SECURE` | Set to `true` in production (requires HTTPS) |
| `COOKIE_SAME_SITE` | `lax` for same-domain/proxy; `none` for cross-site on Render |
| `CLIENT_URL` | Allowed frontend origin (`http://localhost:5173`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (never `*` with credentials) |

**Client**:
```bash
cp client/.env.example client/.env
```
Leave `VITE_API_URL` empty in local development to route through the Vite proxy.

---

## Setting Up MongoDB Atlas (Manual Setup)

1. Sign up or log in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (the free M0 tier works well).
3. Under **Security > Database Access**:
   - Create a database user with read/write privileges (choose Username/Password authentication).
4. Under **Security > Network Access**:
   - Add your IP address (or `0.0.0.0/0` with secure credentials if deploying to Render).
5. Under **Deployment > Databases**:
   - Click **Connect** > **Drivers** (Node.js).
   - Copy the connection string (format: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/mymoneytracker?retryWrites=true&w=majority`).
6. Paste the connection string into `server/.env` as `MONGODB_URI`.

---

## Running Locally

Start both client and server concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## Running Verification Tests

Run the integration test suite covering signup, login, password hashing, cookies, CSRF, and rate limiting:

```bash
npm test
```

Sample test output:
```text
✔ GET /api/health should return 200 and healthy status
✔ POST /api/auth/signup with valid input creates account and sets HttpOnly cookies
✔ POST /api/auth/signup rejects duplicate email with 409 Conflict
✔ POST /api/auth/signup rejects invalid passwords (<8 chars or no numbers/uppercase)
✔ POST /api/auth/signup rejects invalid emails
✔ POST /api/auth/login succeeds with correct credentials and returns safe user
✔ POST /api/auth/login returns generic 401 for incorrect password
✔ POST /api/auth/login returns generic 401 for non-existent email
✔ GET /api/auth/me rejects unauthenticated requests with 401 Unauthorized
✔ GET /api/auth/me returns user profile when valid auth cookie is presented
✔ POST /api/auth/logout rejects state-changing request if CSRF token header is missing
✔ POST /api/auth/logout succeeds with matching CSRF header and clears cookies
✔ GET /api/auth/me fails with 401 after logging out
✔ Authentication rate limiter triggers 429 when max login attempts are exceeded
```

---

## Next Steps for Phase 3

- Implement Transaction Mongoose model (`income`, `expense`, `transfer`).
- Implement Category & Budget limit models.
- Build transaction CRUD API endpoints (`GET /api/transactions`, `POST /api/transactions`, etc.).
- Connect real user transactions to the dashboard.
