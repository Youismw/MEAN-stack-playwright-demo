# CONTRACT.md: QuickTix Core Technical Contracts & Invariants

This document is the authoritative contract for the QuickTix application. All backend routes, frontend components, and Playwright tests must strictly adhere to these specifications.

---

## 1. System Architecture & Process Model

- **Backend**: Node.js + Express 5 + Mongoose / MongoDB.
- **Frontend**: Angular (standalone components, plain CSS).
- **Single Process Production Model**:
  In test and production environments, the Express server serves both `/api` endpoints and the compiled Angular frontend (`client/dist/browser`). Playwright's `webServer` only needs to start one process: `npm start --prefix server`.
- **Parallelism**: `workers: 1`, `fullyParallel: false` to ensure deterministic state wipes.

---

## 2. Seed Data Specification

The test reset endpoint (`POST /api/test/reset`) wipes the collections and inserts fixed entities with deterministic IDs and timestamps.

### Users
| Entity | Email | Password (Plain) | _id | Role |
| :--- | :--- | :--- | :--- | :--- |
| **User 1 (Primary QA)** | `qa.user@quicktix.test` | `Passw0rd!test` | `000000000000000000000001` | `user` |
| **User 2 (Foreign User)** | `other.user@quicktix.test` | `Passw0rd!test` | `000000000000000000000002` | `user` |

*Password Hashing Rule*: Bcrypt hash is computed **once** at module load with cost factor 4 (`bcrypt.hashSync('Passw0rd!test', 4)`), ensuring `/api/test/reset` executes in < 20ms.

### Tickets (Seeded)
| ID | Title | Status | Priority | Owner | CreatedAt |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `100000000000000000000001` | "Fix login button styling" | `Open` | `High` | User 1 | T - 3 days |
| `100000000000000000000002` | "Update documentation footer" | `Open` | `Low` | User 1 | T - 2 days |
| `100000000000000000000003` | "Investigate memory leak" | `In Progress` | `Medium` | User 1 | T - 1 day |
| `100000000000000000000004` | "Setup automated backups" | `Resolved` | `Low` | User 1 | T |
| `100000000000000000000005` | "Foreign user secret issue" | `Open` | `Urgent` | User 2 | T |

*Owner Scoping Rule*: User 1 must **never** see Ticket 5. Accessing Ticket 5 with User 1's token must return `404 Not Found`.

---

## 3. Authentication & Storage Contract

- **Token Type**: HMAC SHA-256 JWT signed with `JWT_SECRET`. Expiration: `24h`.
- **Payload**: `{ id: user._id, email: user.email }`.
- **Client Storage**: `localStorage.setItem('token', token)` (under key `token`).
  * `sessionStorage` must NOT be used because Playwright's `storageState` only persists cookies and `localStorage`.
- **Angular Interceptor**: Attaches `Authorization: Bearer <token>` to all HTTP requests targeting `/api`.
- **Auth Guard**: Unauthenticated access to `/tickets` immediately redirects to `/login`.
- **Logged-Out Test State**: Logged-out tests explicitly clear auth state using `test.use({ storageState: { cookies: [], origins: [] } })`.

---

## 4. REST API & Validation Contract

Base URL: `/api`

### Health & Reset Endpoints
- `GET /api/health`
  - Returns `200 { status: "ok", mongo: "connected" }` ONLY when `mongoose.connection.readyState === 1`.
  - Returns `503` if disconnected.
- `POST /api/test/reset`
  - Mounted **only** when `NODE_ENV === 'test'`. Returns `404` in production or development.
  - Refuses to run if active database name does not end in `_test`.
  - Returns `200` with seeded user and ticket IDs.

### Auth Endpoints
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Success: `200 { token: "..." }`
  - Failure: `401 { error: "Unauthorized", message: "Invalid email or password" }`

### Ticket CRUD Endpoints
- `GET /api/tickets?status=`
  - Returns only current user's tickets (`owner === req.user.id`).
  - Supports optional query param `status` (`Open`, `In Progress`, `Resolved`, `Closed`).
  - Sorted by `createdAt: -1` (descending). No pagination.
  - Success: `200 [ { _id, title, description, priority, status, owner, createdAt, updatedAt } ]`
- `POST /api/tickets`
  - Body: `{ title, description?, priority?, status? }`
  - Success: `201 { ...ticket }`
- `PUT /api/tickets/:id`
  - Updates specified fields.
  - Success: `200 { ...updatedTicket }`
  - Not found or foreign ticket: `404 { error: "NotFound", message: "Ticket not found" }`
- `DELETE /api/tickets/:id`
  - Deletes ticket.
  - Success: `204 No Content`
  - Not found or foreign ticket: `404 { error: "NotFound", message: "Ticket not found" }`

### Validation Rules
- **Title**: Required, trimmed string, 3 to 100 characters.
- **Description**: Optional string, maximum 500 characters.
- **Priority**: Enum `Low` | `Medium` | `High` | `Urgent` (Default: `Medium`).
- **Status**: Enum `Open` | `In Progress` | `Resolved` | `Closed` (Default: `Open`).

### Error Response Shapes
- `400 Bad Request`: `{ error: "ValidationError", message: "..." }`
- `401 Unauthorized`: `{ error: "Unauthorized", message: "Valid token required" }`
- `404 Not Found`: `{ error: "NotFound", message: "Ticket not found" }`

---

## 5. UI Component Contract & data-testid Dictionary

All selectors must follow flat kebab-case (`<area>-<element>`). No dynamic suffixes.

| Area | data-testid | Role / Element |
| :--- | :--- | :--- |
| **Login** | `login-email` | `<input type="email">` |
| | `login-password` | `<input type="password">` |
| | `login-submit` | `<button type="submit">` |
| | `login-error` | Container with `role="alert"` |
| **Ticket List** | `ticket-list` | Container wrapper |
| | `ticket-row` | Row element with attribute `data-ticket-id="<id>"` |
| | `ticket-title` | Ticket title text |
| | `ticket-status` | Ticket status badge |
| | `ticket-edit` | Edit button within row |
| | `ticket-delete` | Delete button within row |
| | `ticket-new` | "Create Ticket" action button |
| | `status-filter` | Native `<select>` filter |
| | `ticket-empty` | Empty state indicator |
| | `list-loading` | Loading spinner |
| **Ticket Form** | `ticket-form` | `<form>` wrapper |
| | `ticket-title-input` | Title `<input>` |
| | `ticket-description-input` | Description `<textarea>` |
| | `ticket-priority-select` | Native `<select>` for priority |
| | `ticket-status-select` | Native `<select>` for status |
| | `ticket-submit` | Submit button |
| | `ticket-title-error` | Inline error container with `role="alert"` |
| **Confirm Modal** | `confirm-dialog` | Modal container (custom modal, not `window.confirm`) |
| | `confirm-accept` | "Delete" confirm button |
| | `confirm-cancel` | "Cancel" button |

---

## 6. Express 5 Static Serving & SPA Fallback Contract

- Static files served from `CLIENT_DIST` (default: `path.resolve(__dirname, '../../client/dist/browser')`).
- Boot-time guard: Server exits immediately if `index.html` is not found at startup.
- Express 5 compatible middleware (never `app.get('*')`):
  ```typescript
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  ```
