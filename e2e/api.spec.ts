import { test, expect } from './fixtures.js';

test.describe('API Contract & Security Verification', () => {
  test('Test 8: API returns 401 without a token @smoke', async ({ request }) => {
    const response = await request.get('/api/tickets');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toEqual({
      error: 'Unauthorized',
      message: 'Valid token required',
    });
  });

  test("Test 9: API returns 400 on invalid payload and User 2's ticket returns 404 for User 1", async ({
    request,
  }) => {
    // 1. Authenticate User 1
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: 'qa.user@quicktix.test',
        password: 'Passw0rd!test',
      },
    });
    expect(loginRes.status()).toBe(200);
    const { token } = await loginRes.json();
    expect(token).toBeTruthy();

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Validate rejection of invalid payload (< 3 chars title)
    const invalidRes = await request.post('/api/tickets', {
      headers: authHeaders,
      data: {
        title: 'ab',
        priority: 'High',
      },
    });
    expect(invalidRes.status()).toBe(400);
    const invalidBody = await invalidRes.json();
    expect(invalidBody.error).toBe('ValidationError');
    expect(invalidBody.message).toContain('Title must be between 3 and 100 characters');

    // 3. Validate owner isolation: User 1 requesting User 2's ticket returns 404
    const foreignTicketRes = await request.get('/api/tickets/100000000000000000000005', {
      headers: authHeaders,
    });
    expect(foreignTicketRes.status()).toBe(404);
    const foreignBody = await foreignTicketRes.json();
    expect(foreignBody.error).toBe('NotFound');
    expect(foreignBody.message).toBe('Ticket not found');
  });
});
