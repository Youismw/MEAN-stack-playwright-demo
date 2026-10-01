import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { app, clientDist } from './app.js';
import {
  connectDatabases,
  closeDatabases,
  resolveDatabaseUris,
  userDbConnection,
  ticketDbConnection,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (from project root .env or server .env)
const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const parsedPort = Number(process.env.PORT);
const PORT = !isNaN(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const NODE_ENV = (process.env.NODE_ENV || 'development').trim().toLowerCase();

// Production safety validations
if (NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-only-secret-do-not-use-in-production') {
    console.error('FATAL: Insecure or default JWT_SECRET is prohibited in production mode.');
    process.exit(1);
  }

  const indexPath = path.join(clientDist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`FATAL: Frontend build index.html not found at '${indexPath}'. Run client build first.`);
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  try {
    const { usersUri, ticketsUri } = resolveDatabaseUris();
    console.log(`Connecting to MongoDB Users DB at '${usersUri}'...`);
    console.log(`Connecting to MongoDB Tickets DB at '${ticketsUri}'...`);
    await connectDatabases();
    console.log(`MongoDB connected successfully [Users: '${userDbConnection.name}', Tickets: '${ticketDbConnection.name}']`);

    const server = app.listen(PORT, () => {
      console.log(`QuickTix Server is running on http://localhost:${PORT} [NODE_ENV=${NODE_ENV}]`);
      console.log(`Serving static files from: '${clientDist}'`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closeDatabases();
        console.log('MongoDB connections closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error('FATAL: Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
