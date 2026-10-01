# QuickTix ⚡ - MEAN Stack Support Ticket Tracker & Playwright E2E Showcase

[![CI](https://github.com/your-username/quicktix/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/quicktix/actions/workflows/ci.yml)
[![Playwright Tests](https://img.shields.io/badge/Playwright-10%2F10%20Passed-brightgreen?logo=playwright)](https://playwright.dev)
[![Angular](https://img.shields.io/badge/Angular-Standalone-dd0031?logo=angular)](https://angular.dev)
[![Express](https://img.shields.io/badge/Express-5.0-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com)

QuickTix is a production-grade MEAN-stack support ticket tracking application specifically engineered to demonstrate modern, bulletproof end-to-end testing practices, test isolation, and CI/CD reporting with Playwright.

---

## 🏛️ System Architecture

QuickTix operates under a **Single-Process Production Model**:
- **Frontend**: Angular standalone components compiled to `client/dist/client/browser` with zero NgModule bloat and plain CSS design system.
- **Backend**: Express 5 REST API with Mongoose / MongoDB 7 models, JWT authentication, owner-scoped CRUD operations, and health checks.
- **Static Hosting**: In test and production modes, Express directly serves the compiled Angular application and provides an SPA fallback middleware (`Cache-Control: no-cache`). Playwright and CI runners only manage a single server process (`npm start --prefix server`).

```
quicktix/
├─ client/                       # Angular standalone client application
├─ server/                       # Express 5 + Node.js + Mongoose backend
├─ e2e/                          # Playwright test suite & auth fixtures
├─ .auth/                        # Stored storageState (user.json)
├─ .github/
│  ├─ workflows/ci.yml           # GitHub Actions workflow (E2E + Pages)
│  └─ dependabot.yml             # Automated dependency updates
├─ CONTRACT.md                   # Authoritative contract & testid specification
├─ playwright.config.ts          # Playwright runner configuration (workers: 1)
├─ package.json                  # Root runner & Playwright scripts
└─ tsconfig.json                 # Root TypeScript definitions
```

---

## 🎯 Test Isolation & State Reset

Testing anti-patterns often stem from leaky database state. QuickTix eliminates flakiness through deterministic resets:

1. **`/api/test/reset` Endpoint**:
   - Exposed **strictly** when `NODE_ENV === 'test'` (returns 404 in development/production).
   - Validates that the active database name ends in `_test` before allowing state wipes.
   - Wipes collections and seeds 2 users and 5 tickets with fixed MongoDB ObjectIds and timestamps.
   - Computes Bcrypt hash once at module load (cost factor 4), ensuring resets execute in **under 20ms**.
2. **Sequential Concurrency**:
   - `workers: 1` and `fullyParallel: false` guarantee tests never delete each other's data mid-flight.
3. **Persistent Auth State across Resets**:
   - Fixed User 1 ObjectId (`000000000000000000000001`) and constant `JWT_SECRET` ensure that tokens saved in `localStorage` (`.auth/user.json`) remain valid across database wipes without re-authenticating through the UI.

---

## 🧪 Playwright Test Suite Matrix (Setup + 9 Tests)

| # | Test Name | Tag | Auth State | Assertions & Behaviors |
| :---: | :--- | :---: | :---: | :--- |
| **setup** | Global UI Auth Setup | — | None (UI) | Resets DB, submits login form via UI, verifies dashboard navigation, persists storageState to `.auth/user.json`. |
| **1** | Bad credentials show login-error | — | Logged-out | Submits invalid password; asserts `[data-testid="login-error"]` is visible with `role="alert"`. |
| **2** | Create ticket and see in list | `@smoke` | User 1 | Submits create ticket modal; asserts new row appears in `[data-testid="ticket-list"]` with correct status. |
| **3** | Empty title shows inline error | — | User 1 | Clears title input and submits; asserts `[data-testid="ticket-title-error"]` alert appears and prevents submission. |
| **4** | Edit seeded Open ticket to Resolved | — | User 1 | Edits "Fix login button styling", updates status dropdown to "Resolved"; asserts row badge updates. |
| **5** | Filter by Open shows exactly 2 rows | — | User 1 | Selects "Open" in `status-filter`; asserts exactly 2 rows render (owner scoping verified). |
| **6** | Delete ticket via confirm modal | — | User 1 | Clicks delete on "Setup automated backups"; confirms in custom modal; asserts row removed from DOM. |
| **7** | `/tickets` redirects to `/login` | `@smoke` | Logged-out | Direct navigation to `/tickets` without token triggers route guard redirect to `/login`. |
| **8** | API returns 401 without token | `@smoke` | None (API) | `GET /api/tickets` without authorization header returns HTTP `401 Unauthorized`. |
| **9** | API validation 400 & owner 404 | — | User 1 (API) | Rejects payload `< 3 chars` with HTTP `400 ValidationError`; foreign ticket returns `404 NotFound`. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v22+ (tested on Node v24)
- **npm**: v10+
- **Docker**: Docker Desktop (or local MongoDB 7)
- **mongosh**: MongoDB Shell

### 1. Start MongoDB Containers
Launch the two separate MongoDB containers (Users on port `27017`, Tickets on port `27018`):
```powershell
docker compose up -d
```
Verify both containers are running in Docker Desktop:
```powershell
docker ps
```

### 2. Install Dependencies
```powershell
# Root dependencies (Playwright)
npm install

# Client dependencies (Angular)
npm install --prefix client

# Server dependencies (Express, Mongoose)
npm install --prefix server
```

### 3. Build & Run Application
```powershell
# Build Angular production bundle
npm run build --prefix client

# Launch backend (serves API & Angular UI)
npm start --prefix server
```
Navigate to **`http://localhost:3000`** in your browser.

**Demo Credentials**:
- Email: `qa.user@quicktix.test`
- Password: `Passw0rd!test`

---

## 🚦 Executing Playwright Tests

```powershell
# Run the complete E2E test suite (10 tests)
npm run test:e2e

# Run fast smoke tests only (4 tests)
npm run test:smoke

# Run Playwright in interactive UI mode
npm run test:ui

# Run tests in headed browser mode
npx playwright test --headed

# Open the latest HTML test report
npx playwright show-report
```

---

## ⚙️ CI/CD Pipeline & GitHub Pages

The project features a hardened GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Concurrency Control**:
   - `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}` immediately cancels obsolete runs on pull requests while protecting full runs on `main`.
2. **MongoDB Readiness Double-Gate**:
   - Service container checks readiness using `mongosh --eval 'db.runCommand({ping:1}).ok'`.
   - Playwright's `webServer` waits for HTTP 200 on `http://localhost:3000/api/health`.
3. **Cross-Package Dependency Caching**:
   - `actions/setup-node@v4` caches lockfiles for root, `client/`, and `server/`.
4. **Rich Step Summaries**:
   - `test-summary/action@v2` renders JUnit XML test outcomes into `$GITHUB_STEP_SUMMARY`.
5. **Artifacts & GitHub Pages**:
   - Playwright reports, traces, videos, and screenshots on failure are stored for 14 days.
   - Pushes to `main` trigger the `publish-report` job to deploy the HTML report directly to GitHub Pages.

---

## 📜 Contract Reference

Full architectural specifications, data dictionaries, and validation schemas are documented in [CONTRACT.md](file:///c:/Users/ROHIT%20CHAUHAN/Desktop/MEAN%20stack%20playwright%20demo/CONTRACT.md).
