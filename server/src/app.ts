import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.routes.js';
import { ticketRouter } from './routes/ticket.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { testRouter } from './routes/test.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Secure CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:4200',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4200',
    ];

const isTestEnv = (process.env.NODE_ENV || '').trim().toLowerCase() === 'test';

// Standard Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like same-origin, curl, or in automated tests)
      if (!origin || allowedOrigins.includes(origin) || isTestEnv) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api', healthRouter);

// Test Reset endpoint: strictly registered only when NODE_ENV === 'test'
if (isTestEnv) {
  app.use('/api/test', testRouter);
}

// Client distribution directory resolution
const candidateDistPaths = [
  path.resolve(__dirname, '../../client/dist/client/browser'),
  path.resolve(__dirname, '../../client/dist/browser'),
];

export const clientDist = process.env.CLIENT_DIST
  ? path.resolve(process.env.CLIENT_DIST)
  : candidateDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) || candidateDistPaths[0];

// Serve static assets if client build exists
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Express 5 compatible SPA Catch-all middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(indexPath);
    }
    next();
  });
}

// 404 for unmatched /api routes
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'NotFound', message: 'API endpoint not found' });
});

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed' || err.status === 400 || err.statusCode === 400) {
    res.status(400).json({ error: 'BadRequest', message: 'Malformed JSON payload' });
    return;
  }
  console.error('Unhandled Server Error:', err);
  const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const safeMessage = isProduction ? 'An unexpected error occurred' : (err.message || 'An unexpected error occurred');
  res.status(500).json({ error: 'InternalServerError', message: safeMessage });
});
