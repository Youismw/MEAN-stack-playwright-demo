import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = '.auth/user.json';

setup('authenticate user 1 and initialize auth state', async ({ request }) => {
  // 1. Reset database to seeded baseline
  const resetRes = await request.post('/api/test/reset');
  if (!resetRes.ok()) {
    const text = await resetRes.text();
    throw new Error(`Auth setup failed during database reset (${resetRes.status()}): ${text}`);
  }

  // 2. Ensure .auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 3. Obtain authentication token for User 1
  const loginRes = await request.post('/api/auth/login', {
    data: {
      email: 'qa.user@quicktix.test',
      password: 'Passw0rd!test',
    },
  });

  if (!loginRes.ok()) {
    throw new Error(`Auth setup failed to log in User 1: ${loginRes.status()}`);
  }

  const { token } = await loginRes.json();

  // 4. Save storageState with JWT in localStorage under key 'token'
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'token',
            value: token,
          },
        ],
      },
    ],
  };

  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
});
