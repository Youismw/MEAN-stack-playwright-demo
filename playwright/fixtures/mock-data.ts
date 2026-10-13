/**
 * ============================================================================
 * FOLDER: playwright/fixtures/
 * ============================================================================
 * Shared test fixtures, deterministic constants, and seeded entities.
 *
 * ============================================================================
 * MODULE: playwright/fixtures/mock-data.ts (Seeded Entity Constants)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Exports immutable deterministic data dictionaries conforming to CONTRACT.md:
 *   - Pre-seeded user accounts: Playwright Bot, QA/Developer, and Foreign User.
 *   - Pre-seeded tickets with known ObjectIds, statuses, priorities, and owners.
 *
 * COMMUNICATES WITH:
 *   - Matches the seed data created by `server/src/routes/playwright/test.routes.ts`.
 *   - Imported by specs in `00-setup/`, `01-functional/`, `03-integration-api/`,
 *     `04-e2e/`, and `05-security/`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. A test imports `TEST_USERS` or `SEEDED_TICKETS`.
 *   2. The test uses `TEST_USERS.bot.email` to fill inputs or send API calls.
 *   3. Assertions verify that seeded attributes match expected invariants.
 * ============================================================================
 */

// Deterministic test user credentials aligned with CONTRACT.md section 2
export const TEST_USERS = {
  // Automated Playwright runner identity
  bot: {
    id: '000000000000000000000099',
    email: 'playwright.bot@quicktix.test',
    password: 'Passw0rd!test',
  },
  // Primary Developer / QA persistent account
  dev: {
    id: '000000000000000000000001',
    email: 'qa.user@quicktix.test',
    password: 'Passw0rd!test',
  },
  // Secondary tenant account used for foreign owner scoping verification
  other: {
    id: '000000000000000000000002',
    email: 'other.user@quicktix.test',
    password: 'Passw0rd!test',
  },
};

// Seeded ticket items created during POST /api/test/reset
export const SEEDED_TICKETS = {
  ticket1: {
    id: '100000000000000000000001',
    title: 'Fix login button styling',
    status: 'Open',
    priority: 'High',
  },
  ticket2: {
    id: '100000000000000000000002',
    title: 'Update documentation footer',
    status: 'Open',
    priority: 'Low',
  },
  ticket3: {
    id: '100000000000000000000003',
    title: 'Investigate memory leak',
    status: 'In Progress',
    priority: 'Medium',
  },
  ticket4: {
    id: '100000000000000000000004',
    title: 'Setup automated backups',
    status: 'Resolved',
    priority: 'Low',
  },
  // Ticket belonging to User 2 (must never be visible to Playwright Bot)
  foreignTicket5: {
    id: '100000000000000000000005',
    title: 'Foreign user secret issue',
    status: 'Open',
    priority: 'Urgent',
  },
};
