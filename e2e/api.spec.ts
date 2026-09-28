import { test, expect } from './fixtures.js';

test.describe('API Walking Skeleton Tests', () => {
  test('API returns 401 without a token @smoke', async ({ request }) => {
    const response = await request.get('/api/tickets');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toEqual({
      error: 'Unauthorized',
      message: 'Valid token required',
    });
  });
});
