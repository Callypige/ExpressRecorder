import crypto from 'crypto';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from '../database';

/*
    Express session configuration.
    Uses PostgreSQL to store sessions (persistent across restarts).
    Uses a secure secret in production, falling back to a random secret in development.
*/

const PgSession = connectPgSimple(session);

// Validate session secret in production
const getSessionSecret = (): string => {
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.error('ERREUR: La variable SESSION_SECRET est requise en production');
    process.exit(1);
  }
  return process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
};

// Express session configuration with PostgreSQL store
export const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
